// Skill 实测台：排计划、出提示、收产出、出评审提示、收评审、合成条目、出报告。
// 会话的开、等、导出不在脚本里，由主会话用子代理做，步骤见 skills/skill-evaluation/SKILL.md。
// 设计见 docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import yaml from 'js-yaml';
import { CHECKLISTS, MIRROR_LICENSES } from '../src/data/skill-standard.ts';
import { computeDims, tierOf, total } from '../src/lib/skillScore.ts';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { assembleEvidence, factNotes } from './skilllab/assemble_core.mjs';
import { autoChecks } from './skilllab/auto_checks.mjs';
import { judgePrompt, parseJudgement, quoteFound } from './skilllab/judge_prompt.mjs';
import { LAYER_MODELS, buildPlan, modelShort, tasksFor } from './skilllab/plan.mjs';
import { buildPrompt, leakCheck, parseOutput, readSkillDir } from './skilllab/prompt.mjs';
import { bootstrapText, summarizeRollout } from './skilllab/rollout.mjs';
import { readSession } from './skilllab/sessiondb.mjs';

const AGENT = 'ZCode 后台会话';
const JUDGE_MODEL = 'GLM-5.3';
const JUDGE_MODEL_ID = 'account:bigmodel-individual-coding-plan/GLM-5.3';
/** ZCode 的会话库。只读打开，只按登记过的会话号取行，不查别的会话。自测时用环境变量指到临时库。 */
const SESSION_DB = process.env.SKILLLAB_DB ?? `${process.env.HOME}/.zcode/cli/db/db.sqlite`;
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
/** 层级高低。条目已经停在更高的层级时，不用低层级的分数去覆盖。 */
const LAYER_RANK = { 'free-tier': 1, 'same-model': 2, workbuddy: 3 };
/** 复核记录没写安装步骤时的缺省值，按转载方式分。安装步骤没有在 WorkBuddy 上核对过，所以条目里 platformComplete 记 false。 */
const DEFAULT_INSTALL = {
  mirror: { workbuddy: ['下载技能包', '打开 WorkBuddy，进入技能页', '点添加技能，选上传技能，选中刚下载的压缩包'] },
  link: { workbuddy: ['打开来源页，按页面说明取得技能包', '打开 WorkBuddy，进入技能页', '点添加技能，选上传技能，选中技能包'] },
};
const USAGE = `用法：node scripts/skilllab.mjs <子命令> …
  plan <批次> <层级> [--only a,b]       读 candidates.json，写运行计划与提示文件；--only 只排这几个技能
  rerun <批次> <层级> <轮次号>          给作废的轮次追加一次重跑
  ingest <批次> <层级>                  核查交回的产出，写运行记录
  judge-prompts <批次> <层级>           给每轮有效运行出一份评审提示
  ingest-judgements <批次> <层级>       核查交回的评审，并入运行记录
  judge-agree <批次> <层级> <目录>      另一批评审与已并入的逐轮比对（抽检、换评审模型的实验）；--out 存结果
  score <批次> <slug> <层级> [--write]  把一个技能的证据合成 score；--write 写进条目
                                        条目已在更高层级时拒绝覆盖，确要覆盖加 --force-layer
  report <批次> [--out <文件>]          汇总成报告数据
  todo <批次> <层级> [数量] [--judge]   列出待开或待评审的轮次，给开会话的子代理用
  review-merge <批次>                   汇总人工复核记录，写初筛名单与候选表
  quotes <批次> <slug>                  核对条目正文里的引文都能在原始产出里找到
  trust <批次> <层级> <轮次号>          引文可疑的评审，主会话看过产出后标记为可以采用
  rejudge <批次> <层级> [轮次号…]       撤掉评审、重新排进待评审（评审提示或检查单改了之后用；不写轮次号就撤全部）
  digest <批次> <slug> <层级>           写条目前看的证据摘要：各轮评审指出了什么、对照怎样
  ledger <批次> <层级> <轮次号>=<会话号>…  登记开会话得到的会话号（评审加 --judge）
  collect <批次> <层级> [--judge]      从会话记录里取出结果，写成 raw 或 judge-raw 文件
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
  const only = flag('--only');
  const wanted = only ? new Set(only.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  // --only 只给这几个技能排计划，候选表原样保留，海选那一份的证据链不断
  const candidates = readJson(`${EVAL(batch)}/candidates.json`).filter((c) => !wanted || wanted.has(c.slug));
  must(candidates.length > 0, wanted ? `--only 里的技能在 candidates.json 里找不到：${only}` : 'candidates.json 是空的');
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
  const candidates = readJson(`${EVAL(batch)}/candidates.json`);
  const dirOf = new Map(candidates.map((c) => [c.slug, c.dir]));
  const mirrored = new Set(candidates.filter((c) => c.distribution === 'mirror').map((c) => c.slug));
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
    // 只允许一次工具调用：读指定的提示文件。读提示文件之外每一次都算，没报次数的也算
    const extra = raw.extraToolUses ?? raw.toolUses;
    if (extra !== 0) reasons.push(`读提示文件之外还出现了 ${extra ?? '未知次数'} 工具调用`);
    if (raw.promptMatches !== true) reasons.push('会话里的提示与计划不一致');
    if (!out.ok) reasons.push(out.reason);
    // 镜像的技能原文本来就在站内，不查照搬；只评不转的才查
    if (reasons.length === 0 && r.kind === 'skill' && !mirrored.has(r.slug) && leakCheck(out.body, readSkillDir(dirOf.get(r.slug)))) {
      reasons.push('产出大段照搬技能原文');
    }
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
      if (!unchanged) {
        writeText(outPath, text);
        // 产出变了，旧产出的评审与交回的评审文件都不再作数
        rmSync(`${LAB(batch)}/judge-raw/${r.id}.json`, { force: true });
      }
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
    // 评审会话只允许读提示文件那一次工具调用；没报次数的也算动过工具
    if ((raw.extraToolUses ?? raw.toolUses) !== 0) {
      failed++;
      renameSync(rawPath, `${rawPath}.rejected`);
      console.log(`  x ${r.id}：评审会话动过工具或没报工具调用次数，不算`);
      continue;
    }
    const output = readFileSync(`${EVAL(batch)}/${r.output}`, 'utf8').replace(/\s+/g, ' ');
    let j;
    try {
      j = parseJudgement(raw.finalText);
    } catch (err) {
      failed++;
      renameSync(rawPath, `${rawPath}.rejected`);
      console.log(`  x ${r.id}：${err.message}`);
      continue;
    }
    const wanted = CHECKLISTS[r.category].map((c) => c.id).sort().join(',');
    if (j.checklist.map((c) => c.id).sort().join(',') !== wanted) {
      failed++;
      renameSync(rawPath, `${rawPath}.rejected`);
      console.log(`  x ${r.id}：检查单编号与标准对不上`);
      continue;
    }
    // 每一条都要有引文。空引文算找不到；一条引文都没有的评审整份算可疑
    const quotes = [...j.checklist, ...j.edits, ...j.severe].map((x) => x.quote);
    const miss = quotes.filter((q) => !quoteFound(q, output)).length;
    r.judgement = { ...j, quotes: quotes.length, quoteMiss: miss, suspect: quotes.length === 0 || miss / quotes.length > 0.3 };
    if (r.judgement.suspect) {
      suspect++;
      console.log(`  ! ${r.id}：${miss}/${quotes.length} 条引文在产出里找不到，需要主会话看`);
    }
    writeJson(`${runsDir(batch, layer)}/${r.id}.json`, r);
    ok++;
  }
  console.log(`${batch} / ${layer}：评审并入 ${ok} 轮，引文可疑 ${suspect} 轮，解析失败 ${failed} 轮`);
}

/**
 * 另一批评审与已并入的评审逐轮比对：检查单逐项过没过是否一致、修改处数差多少、严重错误数是否一致。
 * 抽检（另一个会话重判两成）和换评审模型的实验都用它。口径是评价标准里的「抽检」。
 * @param {string} otherDir 另一批评审所在的目录，里面有 judge-raw/<轮次号>.json
 */
function cmdJudgeAgree(batch, layer, otherDir, { out } = {}) {
  const reference = listRuns(batch, layer).filter((r) => r.valid && r.judgement);
  must(reference.length, `${batch} / ${layer} 还没有并入评审`);
  must(existsSync(`${otherDir}/judge-raw`), `没有 ${otherDir}/judge-raw`);
  const rows = [];
  for (const r of reference) {
    const rawPath = `${otherDir}/judge-raw/${r.id}.json`;
    if (!existsSync(rawPath)) continue;
    const raw = readJson(rawPath);
    let other;
    try {
      // 与并入时同样的两道关：评审会话没动过工具，检查单编号与标准对得上
      must((raw.extraToolUses ?? raw.toolUses) === 0, '另一次评审动过工具或没报工具调用次数');
      other = parseJudgement(raw.finalText);
      must(other.checklist.map((c) => c.id).sort().join(',') === CHECKLISTS[r.category].map((c) => c.id).sort().join(','), '检查单编号与标准对不上');
    } catch (err) {
      rows.push({ id: r.id, unusable: err.message });
      continue;
    }
    const base = r.judgement;
    const items = base.checklist.map((c) => ({ id: c.id, same: c.pass === other.checklist.find((x) => x.id === c.id).pass }));
    const edits = [base.edits.length, other.edits.length];
    const severe = [base.severe.length, other.severe.length];
    rows.push({
      id: r.id,
      items: items.length,
      itemSame: items.filter((x) => x.same).length,
      itemDiff: items.filter((x) => !x.same).map((x) => x.id),
      edits,
      editsOff: Math.abs(edits[0] - edits[1]) / Math.max(edits[0], edits[1], 1) > 0.3,
      severe,
    });
  }
  const used = rows.filter((x) => !x.unusable);
  const sum = {
    compared: used.length,
    unusable: rows.length - used.length,
    items: used.reduce((s, x) => s + x.items, 0),
    itemSame: used.reduce((s, x) => s + x.itemSame, 0),
    editsOff: used.filter((x) => x.editsOff).length,
    severeDiff: used.filter((x) => x.severe[0] !== x.severe[1]).length,
  };
  // 抽检口径：严重错误数不一致超过 1 份，或修改处数偏差超过三成的超过五分之一，就算对不上
  const pass = used.length > 0 && sum.severeDiff <= 1 && sum.editsOff <= used.length / 5;
  for (const x of rows) {
    if (x.unusable) console.log(`  x ${x.id}：${x.unusable}`);
    else console.log(`  ${x.id}：检查单 ${x.itemSame}/${x.items} 一致${x.itemDiff.length ? `（${x.itemDiff.join(' ')} 不同）` : ''}；修改处 ${x.edits[0]} 对 ${x.edits[1]}${x.editsOff ? '，偏差超过三成' : ''}；严重错误 ${x.severe[0]} 对 ${x.severe[1]}`);
  }
  console.log(`比对 ${sum.compared} 轮，另有 ${sum.unusable} 轮用不了：检查单逐项一致 ${sum.itemSame}/${sum.items}；修改处数偏差超过三成 ${sum.editsOff} 轮；严重错误数不一致 ${sum.severeDiff} 轮。按抽检口径${pass ? '对得上' : '对不上'}`);
  // 存成报告读的 spotcheck.json。整批重判有没有做，这个命令不知道，redone 留给重判后的人改
  if (out) {
    writeJson(out, {
      spotChecked: sum.compared,
      matches: pass,
      redone: false,
      note: `抽了 ${sum.compared} 份，检查单逐项一致 ${sum.itemSame}/${sum.items}，严重错误数不一致 ${sum.severeDiff} 份，修改处数偏差超过三成的 ${sum.editsOff} 份`,
      ...sum,
      itemAgreement: sum.items ? sum.itemSame / sum.items : 0,
      pass,
      rows,
    });
  }
}

const clip = (s) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
};

/**
 * 写条目前看的一份证据摘要：这个技能各轮评审指出了什么，对照怎样。只有评审的结论和引文，
 * 产出原文要另外逐字读。
 */
function cmdDigest(batch, slug, layer) {
  const c = readJson(`${EVAL(batch)}/candidates.json`).find((x) => x.slug === slug);
  must(c, `candidates.json 里没有 ${slug}`);
  const main = tasksFor(c.category).find((t) => t.role === 'main');
  const runs = pickRuns(batch, layer, (r) => r.slug === slug || (r.kind === 'baseline' && r.task === main.id));
  console.log(`${c.title}（${slug}）｜${c.category}｜${c.distribution === 'mirror' ? '镜像' : '只评不转'}｜${c.does}`);
  console.log(`条目${existsSync(`src/content/skills/${slug}.md`) ? '已存在' : '还没有'}｜触发句${c.trigger ? '有' : '缺'}｜示例${c.examples?.length ? '有' : '缺'}｜注意 ${c.cautions?.length ?? 0} 条`);
  const planFile = planPath(batch, layer);
  const planRun = existsSync(planFile) ? readJson(planFile).runs.find((r) => r.kind === 'skill' && r.slug === slug) : null;
  console.log(`技能说明：${c.summary}`);
  console.log(`带进会话${planRun?.skillTruncated ? `前 ${planRun.skillChars} 字，后面的没带` : '全文'}｜依赖 ${c.requires?.length ? c.requires.join('、') : '无'}｜${c.textOnly ? '价值主要靠脚本，只评了文字指引' : '文字指引为主'}`);
  for (const x of c.cautions ?? []) console.log(`注意：${x}`);
  const one = (r) => {
    const j = r.judgement;
    const state = !r.valid ? `作废：${(r.voidReasons ?? []).join('；')}` : !j ? '还没评审' : j.suspect ? '引文可疑，等人看' : '';
    console.log(`\n■ ${r.id}｜${r.seconds} 秒｜正文 ${r.auto?.bodyChars ?? '?'} 字${state ? `｜${state}` : ''}${r.output ? `｜${r.output}` : ''}`);
    if (!j) return;
    for (const x of j.checklist) if (!x.pass) console.log(`  不过 ${x.id}：${x.note || '（没写原因）'}`);
    j.edits.forEach((e, i) => console.log(`  改${i + 1}「${clip(e.quote)}」：${e.problem}`));
    j.severe.forEach((e, i) => console.log(`  严重${i + 1}「${clip(e.quote)}」：${e.problem}`));
  };
  const byOrder = (a, b) => Number(a.kind === 'baseline') - Number(b.kind === 'baseline') || a.task.localeCompare(b.task) || a.round - b.round;
  for (const r of [...runs].sort(byOrder)) if (r.kind === 'skill') one(r);
  console.log('\n对照（不装技能）');
  for (const r of [...runs].sort(byOrder)) if (r.kind === 'baseline') one(r);
}

function cmdScore(batch, slug, layer, { write = false, forceLayer = false, entriesDir = 'src/content/skills' } = {}) {
  must(LAYER_MODELS[layer], `层级只能是 free-tier 或 same-model，收到 ${layer}`);
  const c = readJson(`${EVAL(batch)}/candidates.json`).find((x) => x.slug === slug);
  must(c, `candidates.json 里没有 ${slug}`);
  const main = tasksFor(c.category).find((t) => t.role === 'main');
  const tasks = tasksFor(c.category).map((t) => t.id);
  const picked = pickRuns(batch, layer, (r) => r.slug === slug || (r.kind === 'baseline' && tasks.includes(r.task)));
  const usable = (r) => r.valid && r.judgement && !r.judgement.suspect;
  for (const r of picked.filter((x) => !usable(x))) {
    console.log(`  ! ${r.id} 不能用：${r.voidReasons?.length ? r.voidReasons.join('；') : r.judgement?.suspect ? '引文可疑，等主会话看' : '还没有评审'}`);
  }
  const runs = picked
    .filter((r) => r.slug === slug && usable(r))
    .sort(byTaskRound(tasks))
    .map((r) => ({ task: r.task, round: r.round, seconds: r.seconds, runId: r.id, judgement: r.judgement, auto: r.auto }));
  const baseline = picked
    .filter((r) => r.kind === 'baseline' && r.task === main.id && usable(r))
    .map((r) => ({ edits: r.judgement.edits.length, severe: r.judgement.severe.length, seconds: r.seconds }));
  const evidence = assembleEvidence({ category: c.category, mainTask: main.id, runs, baseline, textbookCheckOf: (r) => r.auto?.textbook });
  // 条目已经存在时，安装步骤、额外依赖和审查结论以条目为准，和校验脚本用的口径一致
  const entryFile = `${entriesDir}/${slug}.md`;
  const entry = existsSync(entryFile) ? parseFrontmatter(readFileSync(entryFile, 'utf8')).data : {};
  const audit = entry.score?.audit ?? c.audit;
  // 副任务那一轮只作补充证据，不进算分，和校验脚本一样只用主任务三轮
  const mainRuns = evidence.runs.filter((_, i) => runs[i].task === main.id);
  const inputs = {
    category: c.category,
    frequency: main.frequency,
    runs: mainRuns,
    baseline: evidence.baseline,
    checklist: evidence.checklist,
    textbookCheck: evidence.textbookCheck,
    installSteps: entry.install?.workbuddy.length ?? c.install?.workbuddy.length ?? 0,
    requires: entry.requires ?? c.requires ?? [],
    platformComplete: false,
    loadedBy: 'named',
    audit,
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
      skillVersion: c.source?.version || (c.source?.commit ? c.source.commit.slice(0, 7) : '未标注'),
      layer,
      loadedBy: 'named',
    },
    platformComplete: false,
    runs: runs.map((r, i) => ({ ...evidence.runs[i], output: `/skill-reports/${slug}/${layer}/${r.runId}.md` })),
    baseline: evidence.baseline,
    checklist: evidence.checklist,
    ...(evidence.textbookCheck ? { textbookCheck: evidence.textbookCheck } : {}),
    audit,
    overrides: [],
  };
  console.log(`${slug} / ${layer}：总分 ${sum.toFixed(1)}，档位「${tierOf(sum)}」`);
  for (const k of Object.keys(dims)) console.log(`  ${k} ${dims[k]}：${score.notes[k]}`);
  runs.forEach((r, i) => console.log(`  ${r.task} 第 ${r.round} 轮：修改处 ${evidence.runs[i].edits}，严重错误 ${evidence.runs[i].severe}，${r.seconds} 秒`));
  console.log(`  对照：修改处 ${score.baseline.edits}，严重错误 ${score.baseline.severe}，${score.baseline.seconds} 秒`);
  const passedIds = score.checklist.filter((x) => x.pass).map((x) => x.id);
  console.log(`  检查单：${passedIds.length ? passedIds.join(' ') : '无'} 通过`);
  if (write) writeEntry({ batch, layer, slug, candidate: c, score, entriesDir, forceLayer });
}

/** 把 score 写进条目。条目已存在就只动 status 与 score，正文原样保留；不存在就按候选表新建，正文放骨架。 */
function writeEntry({ batch, layer, slug, candidate: c, score, entriesDir, forceLayer = false }) {
  const file = `${entriesDir}/${slug}.md`;
  let data;
  let body = BODY_SKELETON;
  if (existsSync(file)) {
    const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
    data = parsed.data;
    if (parsed.body.trim()) body = parsed.body.trim();
    const prev = data.score;
    // 条目已经停在更高的层级时，不用低层级的分数覆盖主分
    if (!forceLayer && prev?.tested?.layer && (LAYER_RANK[score.tested.layer] ?? 0) < (LAYER_RANK[prev.tested.layer] ?? 0)) {
      throw new Error(`${slug} 的条目已经是「${prev.tested.layer}」层的结果，不用「${layer}」层覆盖；确要覆盖加 --force-layer`);
    }
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

/** 待开清单里的一项：带着开会话时原样传入的那句话，和提示文件的绝对路径。 */
function openItem(batch, runId, kind, model) {
  const promptAbs = resolve(`${LAB(batch)}/${kind}/${runId}.txt`);
  return { id: runId, model, prompt: `${LAB(batch)}/${kind}/${runId}.txt`, promptAbs, bootstrap: bootstrapText(promptAbs) };
}

/** 列出待开（或待评审）的轮次。清单走标准输出，提示走标准错误。 */
function cmdTodo(batch, layer, limit = 8, { judge = false } = {}) {
  let todo;
  if (judge) {
    todo = listRuns(batch, layer)
      .filter((r) => r.valid && !r.judgement && !existsSync(`${LAB(batch)}/judge-raw/${r.id}.json`))
      .map((r) => openItem(batch, r.id, 'judge', JUDGE_MODEL_ID));
  } else {
    const plan = readJson(planPath(batch, layer));
    todo = plan.runs
      .filter((r) => !existsSync(`${LAB(batch)}/raw-${layer}/${r.id}.json`) && !existsSync(`${runsDir(batch, layer)}/${r.id}.json`))
      .map((r) => openItem(batch, r.id, 'prompts', r.model));
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
  // 只有开源仓库的技能才镜像。SkillHub 的协议不许转载，那里的技能一律只评不转，说明书里写了开源许可也一样
  const mirror = kind !== 'skillhub' && Boolean(r.license && MIRROR_LICENSES.includes(r.license));
  const c = {
    slug: r.slug,
    title: r.title,
    category: r.category,
    does: r.does,
    summary: r.summary,
    // 已经镜像进站内的，以站内那份为准：实测用的就是将来发布的内容
    dir: existsSync(`src/skills/${r.slug}/SKILL.md`) ? `src/skills/${r.slug}` : r.dir,
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
    distribution: mirror ? 'mirror' : 'link',
    platforms: r.platforms ?? ['workbuddy', 'generic'],
    composition: r.composition ?? 'prompt',
    requires: r.requires ?? [],
    install: r.install ?? DEFAULT_INSTALL[mirror ? 'mirror' : 'link'],
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

/** 汇总人工复核记录：写初筛名单与候选表。候选表按品类上限截取：同品类里评分高的先进，同分时站内已有条目的先进，再按名称顺序。
 *  技能说明逐字相同的几份只测一份：已有条目的优先，其次自带许可证文本的（多半是原版），再次名称靠前的。
 *  这一步不看评分：同文的两份评分不同，只是复核的人不同。 */
function cmdReviewMerge(batch, { entriesDir = 'src/content/skills' } = {}) {
  const dir = `${LAB(batch)}/review`;
  must(existsSync(dir), `没有复核记录目录 ${dir}`);
  // 同目录里还有静态审查的输出（<slug>.audit.json），那不是复核记录
  const records = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.audit.json')).map((f) => readJson(join(dir, f)));
  const scanned = {};
  for (const s of ['skillhub', 'github', 'other']) {
    const p = `${LAB(batch)}/scan/${s}.json`;
    scanned[s] = existsSync(p) ? (readJson(p).unique ?? readJson(p).length ?? 0) : 0;
  }
  const hasEntry = (r) => Number(existsSync(`${entriesDir}/${r.slug}.md`));
  const hasLicense = (r) => Number(['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some((n) => existsSync(`${r.dir}/${n}`)));
  const sameText = new Map();
  {
    const groups = new Map();
    for (const r of records) {
      if (r.verdict !== 'ran' || !r.dir || !existsSync(`${r.dir}/SKILL.md`)) continue;
      const key = createHash('sha1').update(readFileSync(`${r.dir}/SKILL.md`, 'utf8').replace(/\s+/g, ' ').trim()).digest('hex');
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      list.sort((a, b) => hasEntry(b) - hasEntry(a) || hasLicense(b) - hasLicense(a) || String(a.slug).localeCompare(String(b.slug)));
      for (const r of list.slice(1)) sameText.set(r, list[0]);
    }
  }
  const kept = {};
  const candidates = [];
  const items = records
    // 同分时站内已有条目的先进：它们已经挂在工坊里，该先测
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || hasEntry(b) - hasEntry(a) || String(a.slug ?? a.name).localeCompare(String(b.slug ?? b.name)))
    .map((r) => {
      let verdict = r.verdict;
      let reason = r.why ?? '';
      if (sameText.has(r)) {
        verdict = 'out';
        reason = `与 ${sameText.get(r).slug} 的技能说明逐字相同，只测一份：${reason}`;
      } else if (verdict === 'ran') {
        const n = kept[r.category] ?? 0;
        if (n >= (CAPS[r.category] ?? 0)) {
          verdict = 'out';
          reason = `候选已满：${reason}`;
        } else {
          kept[r.category] = n + 1;
          candidates.push(toCandidate(r, entriesDir));
        }
      }
      return { name: r.name ?? r.slug ?? '', url: r.url ?? '', source: r.source ?? 'other', category: r.category ?? null, verdict, reason };
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

const ledgerFile = (batch, layer, judge) => `${LAB(batch)}/${judge ? 'sessions-judge.json' : `sessions-${layer}.json`}`;

/** 登记会话号：开会话的人每开一个就记一笔，<轮次号>=<会话号>。 */
function cmdLedger(batch, layer, pairs, { judge = false } = {}) {
  const file = ledgerFile(batch, layer, judge);
  const all = existsSync(file) ? readJson(file) : {};
  for (const p of pairs) {
    const i = p.indexOf('=');
    must(i > 0, `登记项要写成 <轮次号>=<会话号>：${p}`);
    all[p.slice(0, i)] = p.slice(i + 1);
  }
  writeJson(file, all);
  console.log(`已登记 ${pairs.length} 个会话，${file} 里共 ${Object.keys(all).length} 个`);
}

/**
 * 从会话库里取出每一轮的结果，写成与手写交回文件同形的 raw 文件。只读登记过的会话。
 * 会话还在跑的先不收。ZCode 另有一个只留最近几个会话的滚动日志，不可靠，所以不用它。
 */
function cmdCollect(batch, layer, { judge = false } = {}) {
  const file = ledgerFile(batch, layer, judge);
  must(existsSync(file), `没有会话登记表 ${file}`);
  const ledger = readJson(file);
  const plan = judge ? { runs: [] } : readJson(planPath(batch, layer));
  const outDir = judge ? `${LAB(batch)}/judge-raw` : `${LAB(batch)}/raw-${layer}`;
  const tally = { done: 0, running: 0, failed: 0, missing: 0 };
  for (const [runId, sessionId] of Object.entries(ledger)) {
    const session = readSession(SESSION_DB, sessionId);
    if (!session.found) {
      tally.missing++;
      continue;
    }
    const lines = session.lines;
    const finish = lines.at(-1)?.response?.finishReason;
    // 没收尾的分两种：还在跑的等它；出错或被取消的不会再有结果，这一轮仍算待开，下次会重开
    if (finish !== 'stop') {
      if (finish === 'running') tally.running++;
      else {
        tally.failed++;
        console.log(`  x ${runId}：会话${finish ?? '没有对话轮'}`);
      }
      continue;
    }
    const promptAbs = resolve(`${LAB(batch)}/${judge ? 'judge' : 'prompts'}/${runId}.txt`);
    const promptText = readFileSync(promptAbs, 'utf8');
    const promptHash = judge ? undefined : plan.runs.find((r) => r.id === runId)?.promptHash;
    writeJson(`${outDir}/${runId}.json`, { sessionId, ...summarizeRollout(lines, { promptAbs, promptHash, promptText }) });
    tally.done++;
  }
  console.log(`${batch}：${judge ? '评审会话' : `${layer} 会话`} ${Object.keys(ledger).length} 个，已收 ${tally.done} 个，还在跑 ${tally.running} 个，没跑成 ${tally.failed} 个，没有记录 ${tally.missing} 个`);
}

/**
 * 把已并入的评审撤掉，这些轮次重新排进待评审。评审提示或检查单改了之后，整批要按同一版重新评。
 * 不写轮次号就撤全部。旧的评审交回文件改名留档，不删。
 */
function cmdRejudge(batch, layer, runIds = []) {
  const targets = listRuns(batch, layer).filter((r) => r.valid && r.judgement && (runIds.length === 0 || runIds.includes(r.id)));
  must(targets.length, `${batch} / ${layer} 没有可撤的评审`);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
  for (const r of targets) {
    delete r.judgement;
    writeJson(`${runsDir(batch, layer)}/${r.id}.json`, r);
    const rawPath = `${LAB(batch)}/judge-raw/${r.id}.json`;
    if (existsSync(rawPath)) renameSync(rawPath, `${rawPath}.prev-${stamp}`);
  }
  // 评审登记表里对应的旧会话也要去掉：留着的话，下一波「等完」会把旧会话的结果重新收回来
  const ledgerPath = ledgerFile(batch, layer, true);
  if (existsSync(ledgerPath)) {
    const ledger = readJson(ledgerPath);
    let dropped = 0;
    for (const r of targets) {
      if (ledger[r.id]) {
        delete ledger[r.id];
        dropped++;
      }
    }
    if (dropped) writeJson(ledgerPath, ledger);
  }
  console.log(`${batch} / ${layer}：撤掉 ${targets.length} 轮的评审，重新排进待评审；旧交回文件改名为 .prev-${stamp}`);
}

/** 引文可疑的评审，主会话逐字看过产出后标记为可以采用。 */
function cmdTrust(batch, layer, runId) {
  const file = `${runsDir(batch, layer)}/${runId}.json`;
  must(existsSync(file), `没有这一轮的运行记录：${runId}`);
  const r = readJson(file);
  must(r.valid && r.judgement?.suspect, `${runId} 不是引文可疑的有效轮次`);
  r.judgement = { ...r.judgement, suspect: false, reviewed: true };
  writeJson(file, r);
  console.log(`已把 ${runId} 的评审标记为主会话看过、可以采用`);
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
  else if (cmd === 'judge-agree') cmdJudgeAgree(rest[0], rest[1], rest[2], { out: flag('--out') });
  else if (cmd === 'rejudge') cmdRejudge(rest[0], rest[1], rest.slice(2));
  else if (cmd === 'digest') cmdDigest(rest[0], rest[1], rest[2]);
  else if (cmd === 'score') {
    const write = rest.includes('--write');
    const forceLayer = rest.includes('--force-layer');
    cmdScore(rest[0], rest[1], rest[2], { write, forceLayer, entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  } else if (cmd === 'report') cmdReport(rest[0], { out: flag('--out') ?? 'src/data/skill-eval-report.json' });
  else if (cmd === 'todo') cmdTodo(rest[0], rest[1], Number(rest.slice(0, 3).find((x) => /^\d+$/.test(x)) ?? 8), { judge: rest.includes('--judge') });
  else if (cmd === 'review-merge') cmdReviewMerge(rest[0], { entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  else if (cmd === 'quotes') cmdQuotes(rest[0], rest[1], { entriesDir: flag('--entries-dir') ?? 'src/content/skills' });
  else if (cmd === 'trust') cmdTrust(rest[0], rest[1], rest[2]);
  else if (cmd === 'collect') cmdCollect(rest[0], rest[1], { judge: rest.includes('--judge') });
  else if (cmd === 'ledger') {
    const judge = rest.includes('--judge');
    cmdLedger(rest[0], rest[1], rest.slice(2).filter((x) => !x.startsWith('--')), { judge });
  }
  else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
