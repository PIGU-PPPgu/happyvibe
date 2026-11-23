// Skill 条目校验的规则部分（纯函数）：scripts/check_skills.mjs 与 scripts/test_check_skills.mjs 共用。
// schema 之外的交叉规则都在这里：分数重算一致、检查单对齐、任务归属、证据截图、技能包新鲜、文风红线。
// 规则出处：docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md §4.1
import { CHECKLISTS, TASKS } from '../../src/data/skill-standard.ts';
import { checklistDiff, evidenceOf, recomputeMismatches } from '../../src/lib/skillEntryCore.ts';

/** AGENTS.md 文风红线里的填充词，加上替读者下结论的说法。 */
export const FILLER_WORDS = [
  '扫码即得', '一键直达', '今天学今天用', '轻松搞定', '一看就会', '堪称完美', '满分答案', '值得注意的是',
];

/** emoji 与会被渲染成表情的字符。 */
export const EMOJI_RE = /\p{Extended_Pictographic}|\uFE0F|\u20E3|[\u{1F1E6}-\u{1F1FF}]/u;

/** 评测超过这个月数要标「待复测」。 */
export const STALE_MONTHS = 6;

/** 站内自己写的文本（不含上游技能原文）。 */
function authoredText(d, body) {
  const parts = [
    d.title, d.does, d.summary, d.trigger, d.rejectReason, body,
    ...(d.cautions ?? []), ...(d.examples ?? []), ...(d.customize ?? []),
    ...((d.install?.workbuddy) ?? []), ...((d.install?.generic) ?? []),
  ];
  if (d.score) {
    parts.push(d.score.verdict, d.score.weakness, ...Object.values(d.score.notes), ...d.score.overrides.map((o) => o.reason), ...d.score.checklist.map((c) => c.note));
  }
  return parts.filter(Boolean).join('\n');
}

function checkTested(slug, d, ctx, errors, warnings) {
  const s = d.score;
  if (!CHECKLISTS[d.category]) {
    errors.push(`品类 ${d.category} 还没有检查单，不能有已实测条目`);
    return;
  }
  const tasks = TASKS.filter((t) => t.category === d.category);
  const main = tasks.find((t) => t.id === s.task);
  if (!main || main.role !== 'main') errors.push(`主任务 ${s.task} 不是品类 ${d.category} 的主任务`);
  for (const r of s.runs) {
    const t = tasks.find((x) => x.id === r.task);
    if (!t) errors.push(`实测轮次的任务 ${r.task} 不属于品类 ${d.category}`);
    else if (t.id !== s.task && t.role !== 'second') errors.push(`任务 ${r.task} 既不是主任务 ${s.task} 也不是副任务`);
    if (r.shot && !ctx.exists(`public${r.shot}`)) errors.push(`证据截图不存在：${r.shot}`);
  }
  const diff = checklistDiff(d);
  if (diff.extra.length) errors.push(`检查单里多出标准没有的编号：${diff.extra.join('、')}`);
  if (diff.missing.length) errors.push(`检查单缺了这些条目：${diff.missing.join('、')}`);

  let mismatches;
  try {
    mismatches = recomputeMismatches(d);
  } catch (err) {
    errors.push(err.message);
    return;
  }
  for (const m of mismatches) {
    errors.push(`维度 ${m.dim} 记录 ${m.recorded} 分，按证据重算是 ${m.computed} 分；要改分请写进 overrides 并注明理由`);
  }

  const date = Date.parse(s.tested.date);
  if (Number.isNaN(date)) errors.push(`评测日期不是合法日期：${s.tested.date}`);
  else if (date > Date.now() + 86400000) errors.push(`评测日期 ${s.tested.date} 在未来`);
  else if ((Date.now() - date) / (30.44 * 86400000) > STALE_MONTHS) warnings.push(`评测已超过 ${STALE_MONTHS} 个月（${s.tested.date}），标「待复测」`);

  if (d.distribution === 'mirror') {
    if (!ctx.exists(`src/skills/${slug}/SKILL.md`)) errors.push(`镜像技能缺少源文件 src/skills/${slug}/SKILL.md`);
    const zipAt = ctx.mtime(`public/skills/${slug}.zip`);
    if (zipAt == null) errors.push(`缺少技能包 public/skills/${slug}.zip，先跑 npm run build:skills`);
    else if ((ctx.newestMtime(`src/skills/${slug}`) ?? 0) > zipAt) errors.push(`技能包比源文件旧，重跑 npm run build:skills`);
  }
}

/**
 * @param {string} slug 条目文件名（不含 .md）
 * @param {object} d frontmatter（已过 schema）
 * @param {string} body markdown 正文
 * @param {{ exists: (p: string) => boolean, mtime: (p: string) => number | null, newestMtime: (dir: string) => number | null }} ctx
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkEntry(slug, d, body, ctx) {
  const errors = [];
  const warnings = [];
  const text = authoredText(d, body);
  const emoji = text.match(EMOJI_RE);
  if (emoji) errors.push(`站内文本含 emoji：${[...new Set(emoji)].join(' ')}`);
  for (const f of FILLER_WORDS) if (text.includes(f)) errors.push(`站内文本含「${f}」，属于填充词或替读者下结论`);
  if (d.status === 'tested') checkTested(slug, d, ctx, errors, warnings);
  return { errors, warnings };
}
