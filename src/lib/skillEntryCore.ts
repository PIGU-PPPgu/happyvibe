// 技能条目的证据换算：frontmatter 里记的事实 → 评分算法的输入。
// 纯模块：页面（src/lib/skillEntries.ts）与校验脚本（scripts/check_skills.mjs）共用，node 可直跑。
import { TASKS } from '../data/skill-standard.ts';
import type { SkillFrontmatter } from '../data/skill-schema.ts';
import { CHECKLISTS } from '../data/skill-standard.ts';
import { computeDims, tierOf, total } from './skillScore.ts';
import type { DimKey, Dims, Evidence } from './skillScore.ts';

type Scored = SkillFrontmatter & { score: NonNullable<SkillFrontmatter['score']> };

export function isScored(d: SkillFrontmatter): d is Scored {
  return d.status === 'tested' && Boolean(d.score);
}

/** 条目里记的证据 → 评分算法的输入。runs 只取主任务那几轮。 */
export function evidenceOf(d: Scored): Evidence {
  const s = d.score;
  const task = TASKS.find((t) => t.id === s.task);
  if (!task) throw new Error(`${d.name}：未知任务 ${s.task}`);
  return {
    category: d.category,
    frequency: task.frequency,
    runs: s.runs.filter((r) => r.task === s.task),
    baseline: s.baseline,
    checklist: s.checklist,
    textbookCheck: s.textbookCheck,
    installSteps: d.install?.workbuddy.length ?? 0,
    requires: d.requires,
    platformComplete: s.platformComplete,
    audit: s.audit,
  };
}

/** 页面显示的维度分：记录值经教研调整后的结果。 */
export function dimsOf(d: Scored): Dims {
  const dims: Dims = { ...d.score.dims };
  for (const o of d.score.overrides) dims[o.dim as DimKey] = o.value;
  return dims;
}

export interface ScoreSummary {
  dims: Dims;
  total: number;
  tier: string;
}

export function summaryOf(d: Scored): ScoreSummary {
  const dims = dimsOf(d);
  return { dims, total: total(dims), tier: tierOf(total(dims)) };
}

/** 重算未被教研调整的维度，返回与记录不一致的那些。空数组表示一致。 */
export function recomputeMismatches(d: Scored): { dim: DimKey; recorded: number; computed: number }[] {
  const computed = computeDims(evidenceOf(d));
  const overridden = new Set(d.score.overrides.map((o) => o.dim));
  return (Object.keys(computed) as DimKey[])
    .filter((dim) => !overridden.has(dim) && computed[dim] !== d.score.dims[dim])
    .map((dim) => ({ dim, recorded: d.score.dims[dim], computed: computed[dim] }));
}

/** 检查单结果与标准定义是否对得上：多出的编号、缺的编号。 */
export function checklistDiff(d: Scored): { extra: string[]; missing: string[] } {
  const defs = (CHECKLISTS[d.category] ?? []).map((c) => c.id);
  const got = d.score.checklist.map((c) => c.id);
  return {
    extra: got.filter((id) => !defs.includes(id)),
    missing: defs.filter((id) => !got.includes(id)),
  };
}
