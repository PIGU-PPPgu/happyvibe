// Skill 实测台：排计划、出提示、收产出、出评审提示、收评审、合成条目、出报告。
// 会话的开、等、导出不在脚本里，由主会话用子代理做，步骤见 skills/skill-evaluation/SKILL.md。
// 设计见 docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import yaml from 'js-yaml';
import { CHECKLISTS, MIRROR_LICENSES } from '../src/data/skill-standard.ts';
import { computeDims, tierOf, total } from '../src/lib/skillScore.ts';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { assembleEvidence, factNotes } from './skilllab/assemble_core.mjs';
import { autoChecks } from './skilllab/auto_checks.mjs';
import { judgePrompt, parseJudgement } from './skilllab/judge_prompt.mjs';
import { LAYER_MODELS, buildPlan, modelShort, tasksFor } from './skilllab/plan.mjs';
import { buildPrompt, leakCheck, parseOutput, readSkillDir } from './skilllab/prompt.mjs';

const AGENT = 'ZCode 后台会话';
const JUDGE_MODEL = 'GLM-5.3';
const JUDGE_MODEL_ID = 'account:bigmodel-individual-coding-plan/GLM-5.3';
const CSV = 'public/skill-tasks/grade-sample.csv';
const EVAL = (batch) => `docs/skill-evals/${batch}`;
const LAB = (batch) => `.skilllab/${batch}`;
const planPath = (batch, layer) => `${EVAL(batch)}/plan-${layer}.json`;
const runsDir = (batch, layer) => `${EVAL(batch)}/runs/${layer}`;
const today = () => new Date().toISOString().slice(0, 10);
/** 条目正文骨架。三节先放「待写」，校验脚本会拦，读过产出后才能提交。 */
const BODY_SKELETON = ['#### 输出样例', '', '待写', '', '#### 修改处清单', '', '待写', '', '#### 我看到的', '', '待写'].join('\n');
/** 品类上限，起步值。超出的留在名单里，结论改记 out。 */
const CAPS = { 'lesson-plan': 15, assignment: 8, analysis: 6, 'home-school': 6 };
const DEFAULT_INSTALL = { workbuddy: ['下载技能包', '打开 WorkBuddy，进入技能页', '点添加技能，选上传技能，选中刚下载的压缩包'] };
const USAGE = `用法：node scripts/skilllab.mjs <子命令> …
  plan <批次> <层级>                    读 candidates.json，写运行计划与提示文件
  rerun <批次> <层级> <轮次号>          给作废的轮次追加一次重跑
  ingest <批次> <层级>                  核查交回的产出，写运行记录
  judge-prompts <批次> <层级>           给每轮有效运行出一份评审提示
  ingest-judgements <批次> <层级>       核查交回的评审，并入运行记录
  score <批次> <slug> <层级> [--write]  把一个技能的证据合成 score；--write 写进条目
  report <批次> [--out <文件>]          汇总成报告数据
  todo <批次> <层级> [数量] [--judge]   列出待开或待评审的轮次，给开会话的子代理用
  review-merge <批次>                   汇总人工复核记录，写初筛名单与候选表
  quotes <批次> <slug>                  核对条目正文里的引文都能在原始产出里找到
  trust <批次> <层级> <轮次号>          引文可疑的评审，人看过后标记为可以采用
层级取 free-tier 或 same-model。`;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeText = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s);
};
const writeJson = (p, v) => writeText(p, `${JSON.stringify(v, null, 1)}\n`);
const must = (ok, message) => {
  if (!ok) throw new Error(message);
};

/** 某个层级的全部运行记录，按轮次号排序。 */
function listRuns(batch, layer) {
  const dir = runsDir(batch, layer);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join(dir, f)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** 每个位置取最好的一轮：评审过的优先，其次有效，其次最新的。重跑的轮次覆盖原来那轮。 */
function pickRuns(batch, layer, filter) {
  const rank = (r) => (r.valid && r.judgement ? 3 : r.valid ? 2 : 1);
  const best = new Map();
  for (const r of listRuns(batch, layer).filter(filter)) {
    const key = `${r.kind}|${r.slug ?? ''}|${r.task}|${r.round}`;
    const prev = best.get(key);
    if (!prev || rank(r) >= rank(prev)) best.set(key, r);
  }
  return [...best.values()];
}

const byTaskRound = (tasks) => (a, b) => tasks.indexOf(a.task) - tasks.indexOf(b.task) || a.round - b.round;

function cmdPlan(batch, layer) {
  must(LAYER_MODELS[layer], `层级只能是 free-tier 或 same-model，收到 ${layer}`);
  const candidates = readJson(`${EVAL(batch)}/candidates.json`);
  must(candidates.length > 0, 'candidates.json 是空的');
  for (const c of candidates) must(c.dir && existsSync(c.dir), `${c.slug} 的技能目录不存在：${c.dir}`);
  const csv = readFileSync(CSV, 'utf8');
  const filesOf = new Map(candidates.map((c) => [c.slug, readSkillDir(c.dir)]));
  const runs = buildPlan(candidates.map((c) => ({ slug: c.slug, category: c.category })), layer).map((r) => {
    const p = buildPrompt(r.task, { files: r.kind === 'skill' ? filesOf.get(r.slug) : null, csvText: csv });
    writeText(`${LAB(batch)}/prompts/${r.id}.txt`, p.text);
    return { ...r, prompt: `prompts/${r.id}.txt`, promptHash: p.hash, skillTruncated: p.skillTruncated, skillChars: p.skillChars };
  });
  writeJson(planPath(batch, layer), { batch, layer, model: LAYER_MODELS[layer], createdAt: new Date().toISOString(), candidates: candidates.length, runs });
  const skills = runs.filter((r) => r.kind === 'skill').length;
  console.log(`${batch} / ${layer}：${candidates.length} 个技能，${runs.length} 轮运行（技能 ${skills}，对照 ${runs.length - skills}）`);
  for (const r of runs.filter((x) => x.skillTruncated)) console.log(`  ! ${r.slug} 的技能文字超过上限，已截断`);
}

function cmdRerun(batch, layer, runId) {
  const file = planPath(batch, layer);
  const plan = readJson(file);
  const orig = plan.runs.find((r) => r.id === runId);
  must(orig, `计划里没有轮次 ${runId}`);
  const id = `${runId}-retry${plan.runs.filter((r) => r.retryOf === runId).length + 1}`;
  writeText(`${LAB(batch)}/prompts/${id}.txt`, readFileSync(`${LAB(batch)}/prompts/${runId}.txt`, 'utf8'));
  plan.runs.push({ ...orig, id, retryOf: runId, prompt: `prompts/${id}.txt` });
  writeJson(file, plan);
  console.log(`已追加重跑 ${id}`);
}

function cmdIngest(batch, layer) {
  const plan = readJson(planPath(batch, layer));
  const dirOf = new Map(readJson(`${EVAL(batch)}/candidates.json`).map((c) => [c.slug, c.dir]));
  const csv = readFileSync(CSV, 'utf8');
  const tally = { valid: 0, void: 0, missing: 0 };
  for (const r of plan.runs) {
    const rawPath = `${LAB(batch)}/raw-${layer}/${r.id}.json`;
    if (!existsSync(rawPath)) {
      tally.missing++;
      continue;
    }
    const raw = readJson(rawPath);
    const out = parseOutput(raw.finalText);
    const reasons = [];
    if (raw.toolUses !== 0) reasons.push(`会话里出现了 ${raw.toolUses ?? '未知次数'} 次工具调用`);
    if (raw.promptMatches !== true) reasons.push('会话里的提示与计划不一致');
    if (!out.ok) reasons.push(out.reason);
    if (reasons.length === 0 && r.kind === 'skill' && leakCheck(out.body, readSkillDir(dirOf.get(r.slug)))) reasons.push('产出大段照搬技能原文');
    const seconds = Math.round((Date.parse(raw.endedAt) - Date.parse(raw.startedAt)) / 1000);
    const record = {
      id: r.id,
      retryOf: r.retryOf,
      kind: r.kind,
      slug: r.slug,
      category: r.category,
      task: r.task,
      round: r.round,
      layer: r.layer,
      model: modelShort(r.model),
      sessionId: raw.sessionId ?? '',
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
      valid: reasons.length === 0,
      voidReasons: reasons,
      output: reasons.length ? undefined : `outputs/${r.id}.md`,
      auto: undefined,
      judgement: undefined,
    };
    if (record.valid) {
      const text = `${out.body}\n`;
      const outPath = `${EVAL(batch)}/${record.output}`;
      // 产出没变就保留已有的评审结果，免得重复 ingest 把评审抹掉
      const prevPath = `${runsDir(batch, layer)}/${r.id}.json`;
      const prev = existsSync(prevPath) ? readJson(prevPath) : null;
      const unchanged = prev?.valid && existsSync(outPath) && readFileSync(outPath, 'utf8') === text;
      if (!unchanged) writeText(outPath, text);
      record.auto = autoChecks(r.task, out.body, { csvText: csv });
      if (unchanged) record.judgement = prev.judgement ?? undefined;
      tally.valid++;
    } else {
      tally.void++;
      console.log(`  x ${r.id}：${reasons.join('；')}`);
    }
    writeJson(`${runsDir(batch, layer)}/${r.id}.json`, record);
  }
  console.log(`${batch} / ${layer}：有效 ${tally.valid}，作废 ${tally.void}，还没交回 ${tally.missing}`);
}

function cmdJudgePrompts(batch, layer) {
  const pending = listRuns(batch, layer).filter((r) => r.valid && !r.judgement);
  for (const r of pending) {
    const output = readFileSync(`${EVAL(batch)}/${r.output}`, 'utf8');
    writeText(`${LAB(batch)}/judge/${r.id}.txt`, judgePrompt(r.task, output, r.auto));
  }
  console.log(`${batch} / ${layer}：出了 ${pending.length} 份评审提示，给还没评审的有效轮次`);
}

function cmdIngestJudgements(batch, layer) {
  let ok = 0;
  let suspect = 0;
  let failed = 0;
  for (const r of listRuns(batch, layer).filter((x) => x.valid && !x.judgement?.reviewed)) {
    const rawPath = `${LAB(batch)}/judge-raw/${r.id}.json`;
    if (!existsSync(rawPath)) continue;
    const raw = readJson(rawPath);
    if (raw.toolUses) {
      failed++;
      console.log(`  x ${r.id}：评审会话动过工具，不算`);
      continue;
    }
    const output = readFileSync(`${EVAL(batch)}/${r.output}`, 'utf8').replace(/\s+/g, ' ');
    let j;
    try {
      j = parseJudgement(raw.finalText);
    } catch (err) {
      failed++;
      console.log(`  x ${r.id}：${err.message}`);
      continue;
    }
    const wanted = CHECKLISTS[r.category].map((c) => c.id).sort().join(',');
    if (j.checklist.map((c) => c.id).sort().join(',') !== wanted) {
      failed++;
      console.log(`  x ${r.id}：检查单编号与标准对不上`);
      continue;
    }
    const quotes = [...j.checklist, ...j.edits, ...j.severe].map((x) => x.quote.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const miss = quotes.filter((q) => !output.includes(q)).length;
    r.judgement = { ...j, quotes: quotes.length, quoteMiss: miss, suspect: quotes.length > 0 && miss / quotes.length > 0.3 };
    if (r.judgement.suspect) {
      suspect++;
      console.log(`  ! ${r.id}：${miss}/${quotes.length} 条引文在产出里找不到，需要人看`);
    }
    writeJson(`${runsDir(batch, layer)}/${r.id}.json`, r);
    ok++;
  }
  console.log(`${batch} / ${layer}：评审并入 ${ok} 轮，引文可疑 ${suspect} 轮，解析失败 ${failed} 轮`);
}

function cmdScore(batch, slug, layer, { write = false, entriesDir = 'src/content/skills' } = {}) {
  must(LAYER_MODELS[layer], `层级只能是 free-tier 或 same-model，收到 ${layer}`);
  const c = readJson(`${EVAL(batch)}/candidates.json`).find((x) => x.slug === slug);
  must(c, `candidates.json 里没有 ${slug}`);
  const main = tasksFor(c.category).find((t) => t.role === 'main');
  const tasks = tasksFor(c.category).map((t) => t.id);
  const picked = pickRuns(batch, layer, (r) => r.slug === slug || (r.kind === 'baseline' && tasks.includes(r.task)));
  const usable = (r) => r.valid && r.judgement && !r.judgement.suspect;
  for (const r of picked.filter((x) => !usable(x))) {
    console.log(`  ! ${r.id} 不能用：${r.voidReasons?.length ? r.voidReasons.join('；') : r.judgement?.suspect ? '引文可疑，等人看' : '还没有评审'}`);
  }
  const runs = picked
    .filter((r) => r.slug === slug && usable(r))
    .sort(byTaskRound(tasks))
    .map((r) => ({ task: r.task, round: r.round, seconds: r.seconds, runId: r.id, judgement: r.judgement, auto: r.auto }));
  const baseline = picked
    .filter((r) => r.kind === 'baseline' && r.task === main.id && usable(r))
    .map((r) => ({ edits: r.judgement.edits.length, severe: r.judgement.severe.length, seconds: r.seconds }));
  const evidence = assembleEvidence({ category: c.category, mainTask: main.id, runs, baseline, textbookCheckOf: (r) => r.auto?.textbook });
  const inputs = {
    category: c.category,
    frequency: main.frequency,
    runs: evidence.runs,
    baseline: evidence.baseline,
    checklist: evidence.checklist,
    textbookCheck: evidence.textbookCheck,
    installSteps: c.install?.workbuddy.length ?? 0,
    requires: c.requires ?? [],
    platformComplete: false,
    loadedBy: 'named',
    audit: c.audit,
  };
  const dims = computeDims(inputs);
  const sum = total(dims);
  const score = {
    task: main.id,
    dims,
    notes: factNotes(inputs),
    verdict: '待写',
    weakness: '待写',
    tested: {
      date: today(),
      agent: AGENT,
      model: modelShort(LAYER_MODELS[layer]),
      by: 'ai',
      skillVersion: c.source?.version ?? '',
      layer,
      loadedBy: 'named',
    },
    platformComplete: false,
    runs: runs.map((r, i) => ({ ...evidence.runs[i], output: `/skill-reports/${slug}/${layer}/${r.runId}.md` })),
    baseline: evidence.baseline,
    checklist: evidence.checklist,
    ...(evidence.textbookCheck ? { textbookCheck: evidence.textbookCheck } : {}),
    audit: c.audit,
    overrides: [],
  };
  console.log(`${slug} / ${layer}：总分 ${sum.toFixed(1)}，档位「${tierOf(sum)}」`);
  for (const k of Object.keys(dims)) console.log(`  ${k} ${dims[k]}：${score.notes[k]}`);
  runs.forEach((r, i) => console.log(`  ${r.task} 第 ${r.round} 轮：修改处 ${evidence.runs[i].edits}，严重错误 ${evidence.runs[i].severe}，${r.seconds} 秒`));
  console.log(`  对照：修改处 ${score.baseline.edits}，严重错误 ${score.baseline.severe}，${score.baseline.seconds} 秒`);
  const passedIds = score.checklist.filter((x) => x.pass).map((x) => x.id);
  console.log(`  检查单：${passedIds.length ? passedIds.join(' ') : '无'} 通过`);
  if (write) writeEntry({ batch, layer, slug, candidate: c, score, entriesDir });
}

/** 把 score 写进条目。条目已存在就只动 status 与 score，正文原样保留；不存在就按候选表新建，正文放骨架。 */
function writeEntry({ batch, layer, slug, candidate: c, score, entriesDir }) {
  const file = `${entriesDir}/${slug}.md`;
  let data;
  let body = BODY_SKELETON;
  if (existsSync(file)) {
    const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
    data = parsed.data;
    if (parsed.body.trim()) body = parsed.body.trim();
    const prev = data.score;
    // 海选出过分的技能做同款复核时，海选结果留作并列显示
    if (prev?.tested?.layer === 'free-tier' && score.tested.layer === 'same-model') {
      const dims = { ...prev.dims };
      for (const o of prev.overrides ?? []) dims[o.dim] = o.value;
      score.prior = { layer: 'free-tier', model: prev.tested.model, total: total(dims), date: prev.tested.date };
    } else if (prev?.prior && score.tested.layer === 'same-model') {
      score.prior = prev.prior;
    }
    // 同一层级重算：人写的一句话理由、短板和教研调整保留
    if (prev?.tested?.layer === score.tested.layer) {
      for (const k of ['verdict', 'weakness']) {
        if (prev[k] && prev[k] !== '待写') score[k] = prev[k];
      }
      score.overrides = prev.overrides ?? [];
      for (const o of score.overrides) score.dims[o.dim] = o.value;
    }
  } else {
    data = {
      name: c.slug,
      title: c.title,
      category: c.category,
      does: c.does,
      summary: c.summary,
      source: c.source,
      distribution: c.distribution,
      platforms: c.platforms,
      composition: c.composition,
      requires: c.requires ?? [],
      install: c.install,
      trigger: c.trigger,
      examples: c.examples,
      cautions: c.cautions ?? [],
      ...(c.customize ? { customize: c.customize } : {}),
      relatedLessons: c.relatedLessons ?? [],
    };
  }
  for (const r of score.runs) {
    const to = `public${r.output}`;
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(`${EVAL(batch)}/outputs/${basename(r.output)}`, to);
  }
  writeText(file, `---\n${yaml.dump({ ...data, status: 'tested', score }, { lineWidth: 200, noRefs: true })}---\n\n${body}\n`);
  console.log(`  已写入 ${file}。一句话理由、短板和正文三节还是「待写」，读过产出后再补。`);
}

function cmdReport(batch, { out = 'src/data/skill-eval-report.json' } = {}) {
  const screening = existsSync(`${EVAL(batch)}/screening.json`) ? readJson(`${EVAL(batch)}/screening.json`) : { scanned: {}, items: [] };
  const spot = existsSync(`${EVAL(batch)}/spotcheck.json`) ? readJson(`${EVAL(batch)}/spotcheck.json`) : { spotChecked: 0, redone: false, note: '还没抽检' };
  const runs = { planned: 0, valid: 0, void: 0 };
  const ranSlugs = new Set();
  const confirmedSlugs = new Set();
  const categoryOf = new Map();
  let judged = 0;
  for (const layer of Object.keys(LAYER_MODELS)) {
    if (!existsSync(planPath(batch, layer))) continue;
    runs.planned += readJson(planPath(batch, layer)).runs.length;
    for (const r of listRuns(batch, layer)) {
      if (!r.valid) {
        runs.void++;
        continue;
      }
      runs.valid++;
      if (r.judgement) judged++;
      if (r.kind === 'skill' && r.judgement) {
        (layer === 'same-model' ? confirmedSlugs : ranSlugs).add(r.slug);
        categoryOf.set(r.slug, r.category);
      }
    }
  }
  const byCategory = {};
  for (const slug of new Set([...ranSlugs, ...confirmedSlugs])) {
    const cat = categoryOf.get(slug);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }
  const report = {
    batch,
    date: today(),
    models: {
      'free-tier': modelShort(LAYER_MODELS['free-tier']),
      judge: JUDGE_MODEL,
      'same-model': modelShort(LAYER_MODELS['same-model']),
    },
    funnel: {
      scanned: screening.scanned,
      reviewed: screening.items.length,
      ran: [...ranSlugs].filter((s) => !confirmedSlugs.has(s)).length,
      confirmed: confirmedSlugs.size,
    },
    byCategory,
    runs,
    judge: { judged, ...spot },
    shortlist: screening.items,
  };
  writeJson(out, report);
  console.log(`已写入 ${out}：海选出分 ${report.funnel.ran} 个，同款复核 ${report.funnel.confirmed} 个，运行 ${runs.valid}/${runs.planned} 轮有效`);
}

/** 列出待开（或待评审）的轮次。清单走标准输出，提示走标准错误。 */
function cmdTodo(batch, layer, limit = 8, { judge = false } = {}) {
  let todo;
  if (judge) {
    todo = listRuns(batch, layer)
      .filter((r) => r.valid && !r.judgement && !existsSync(`${LAB(batch)}/judge-raw/${r.id}.json`))
      .map((r) => ({ id: r.id, prompt: `${LAB(batch)}/judge/${r.id}.txt`, model: JUDGE_MODEL_ID }));
  } else {
    const plan = readJson(planPath(batch, layer));
    todo = plan.runs
      .filter((r) => !existsSync(`${LAB(batch)}/raw-${layer}/${r.id}.json`) && !existsSync(`${runsDir(batch, layer)}/${r.id}.json`))
      .map((r) => ({ id: r.id, prompt: `${LAB(batch)}/prompts/${r.id}.txt`, model: r.model }));
  }
  const shown = todo.slice(0, limit);
  console.log(JSON.stringify(shown));
  console.error(`${batch} / ${layer}：${judge ? '待评审' : '待开'} ${todo.length} 轮，这次列出 ${shown.length} 轮`);
}

/** 一条复核记录变成候选表里的一项。条目文件已存在时，描述性字段以条目为准。 */
function toCandidate(r, entriesDir) {
  const file = `${entriesDir}/${r.slug}.md`;
  const fromEntry = existsSync(file) ? parseFrontmatter(readFileSync(file, 'utf8')).data : {};
  const kind = r.source === 'other' ? 'own' : r.source;
  const c = {
    slug: r.slug,
    title: r.title,
    category: r.category,
    does: r.does,
    summary: r.summary,
    dir: r.dir,
    origin: kind,
    source: {
      kind,
      author: r.author ?? '',
      url: r.url,
      ...(r.repo ? { repo: r.repo } : {}),
      ...(r.path ? { path: r.path } : {}),
      ...(r.commit ? { commit: r.commit } : {}),
      ...(r.license ? { license: r.license } : {}),
      ...(r.version ? { version: r.version } : {}),
    },
    distribution: r.license && MIRROR_LICENSES.includes(r.license) ? 'mirror' : 'link',
    platforms: r.platforms ?? ['workbuddy', 'generic'],
    composition: r.composition ?? 'prompt',
    requires: r.requires ?? [],
    install: r.install ?? DEFAULT_INSTALL,
    trigger: r.trigger ?? '',
    examples: r.examples ?? [],
    cautions: r.cautions ?? [],
    audit: r.audit,
    textOnly: Boolean(r.textOnly),
  };
  if (fromEntry.name) {
    for (const k of ['title', 'category', 'does', 'summary', 'source', 'distribution', 'platforms', 'composition', 'requires', 'install']) {
      if (fromEntry[k] !== undefined) c[k] = fromEntry[k];
    }
  }
  return c;
}

/** 汇总人工复核记录：写初筛名单与候选表。候选表按品类上限截取，同品类里评分高的先进。 */
function cmdReviewMerge(batch, { entriesDir = 'src/content/skills' } = {}) {
  const dir = `${LAB(batch)}/review`;
  must(existsSync(dir), `没有复核记录目录 ${dir}`);
  const records = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJson(join(dir, f)));
  const scanned = {};
  for (const s of ['skillhub', 'github', 'other']) {
    const p = `${LAB(batch)}/scan/${s}.json`;
    scanned[s] = existsSync(p) ? (readJson(p).unique ?? readJson(p).length ?? 0) : 0;
  }
  const kept = {};
  const candidates = [];
  const items = records
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((r) => {
      let verdict = r.verdict;
      let reason = r.why ?? '';
      if (verdict === 'ran') {
        const n = kept[r.category] ?? 0;
        if (n >= (CAPS[r.category] ?? 0)) {
          verdict = 'out';
          reason = `候选已满：${reason}`;
        } else {
          kept[r.category] = n + 1;
          candidates.push(toCandidate(r, entriesDir));
        }
      }
      return { name: r.name, url: r.url ?? '', source: r.source ?? 'other', category: r.category ?? null, verdict, reason };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  candidates.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));
  writeJson(`${EVAL(batch)}/screening.json`, { scanned, reviewed: items.length, items });
  writeJson(`${EVAL(batch)}/candidates.json`, candidates);
  const byCat = {};
  for (const c of candidates) byCat[c.category] = (byCat[c.category] ?? 0) + 1;
  console.log(`复核 ${items.length} 个；候选 ${candidates.length} 个：${JSON.stringify(byCat)}；淘汰 ${items.length - candidates.length} 个`);
}

/** 条目正文里「」里的引文，必须能在该技能的原始产出（各轮与对照）里找到。 */
function cmdQuotes(batch, slug, { entriesDir = 'src/content/skills' } = {}) {
  const file = `${entriesDir}/${slug}.md`;
  must(existsSync(file), `没有条目 ${file}`);
  const { body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const outputs = readdirSync(`${EVAL(batch)}/outputs`).filter((f) => f.includes(`-${slug}-`) || f.includes('-baseline-'));
  const hay = outputs.map((f) => readFileSync(`${EVAL(batch)}/outputs/${f}`, 'utf8').replace(/\s+/g, ' ')).join('\n');
  const quotes = [...body.matchAll(/「([^「」]{6,})」/g)].map((m) => m[1].replace(/\s+/g, ' '));
  const miss = quotes.filter((q) => !hay.includes(q));
  for (const q of miss) console.log(`  x 找不到引文：${q}`);
  console.log(`${slug}：正文引文 ${quotes.length} 处，找不到 ${miss.length} 处`);
  if (miss.length) process.exitCode = 1;
}

/** 引文可疑的评审，人看过产出后标记为可以采用。 */
function cmdTrust(batch, layer, runId) {
  const file = `${runsDir(batch, layer)}/${runId}.json`;
  must(existsSync(file), `没有这一轮的运行记录：${runId}`);
  const r = readJson(file);
  must(r.valid && r.judgement?.suspect, `${runId} 不是引文可疑的有效轮次`);
  r.judgement = { ...r.judgement, suspect: false, reviewed: true };
  writeJson(file, r);
  console.log(`已把 ${runId} 的评审标记为人看过、可以采用`);
}

const [cmd, ...rest] = process.argv.slice(2);
/** 取出并移除 `--名 值` 形式的选项，返回值 */
const flag = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest.splice(i, 2)[1] : undefined;
};
try {
  if (cmd === 'plan') cmdPlan(rest[0], rest[1]);
  else if (cmd === 'rerun') cmdRerun(rest[0], rest[1], rest[2]);
  else if (cmd === 'ingest') cmdIngest(rest[0], rest[1]);
  else if (cmd === 'judge-prompts') cmdJudgePrompts(rest[0], rest[1]);
  else if (cmd === 'ingest-judgements') cmdIngestJudgements(rest[0], rest[1]);
  else if (cmd === 'score') {
    const write = rest.includes('--write');
    cmdScore(rest[0], rest[1], rest[2], { write, entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  } else if (cmd === 'report') cmdReport(rest[0], { out: flag('--out') ?? 'src/data/skill-eval-report.json' });
  else if (cmd === 'todo') cmdTodo(rest[0], rest[1], Number(rest[2] ?? 8), { judge: rest.includes('--judge') });
  else if (cmd === 'review-merge') cmdReviewMerge(rest[0], { entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  else if (cmd === 'quotes') cmdQuotes(rest[0], rest[1], { entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  else if (cmd === 'trust') cmdTrust(rest[0], rest[1], rest[2]);
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
