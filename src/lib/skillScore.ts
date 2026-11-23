// Skill 评分算法：从实测记录算出五个维度的分。
// 评测员只记事实，分数由这里的规则算出。校验脚本会重算并要求与条目里写的一致。
// 规则出处：docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md §3.3
// 纯函数、不碰 Astro，node 可直跑（scripts/test_skill_score.mjs）。
import { CHECKLISTS, DIMS, TIERS } from '../data/skill-standard.ts';
import type { CategoryKey, DimKey, Frequency } from '../data/skill-standard.ts';

export type Audit = {
  network: 'none' | 'declared' | 'undeclared';
  credentials: boolean;
  studentData: 'none' | 'local';
  overRead: boolean;
};

export type Run = {
  task: string;
  triggered: boolean;
  seconds: number;
  edits: number;
  severe: number;
  shot?: string;
};

export type Evidence = {
  category: CategoryKey;
  frequency: Frequency;
  /** 主任务的 3 轮实测 */
  runs: Run[];
  baseline: { edits: number; severe: number; seconds: number };
  checklist: { id: string; pass: boolean; note: string }[];
  textbookCheck?: { total: number; passed: number };
  installSteps: number;
  requires: readonly string[];
  platformComplete: boolean;
  audit: Audit;
};

export type Dims = Record<DimKey, number>;

const EPS = 1e-9;
const atLeast = (x: number, limit: number) => x + EPS >= limit;

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** 按标准里的检查单定义逐条找结果；缺结果的条目记为不过。 */
function checklistStats(e: Evidence) {
  const defs = CHECKLISTS[e.category];
  if (!defs || defs.length === 0) throw new Error(`品类 ${e.category} 还没有检查单，不能评分`);
  const byId = new Map(e.checklist.map((c) => [c.id, c.pass]));
  let pass = 0;
  let eduPass = 0;
  let eduTotal = 0;
  let ruleFail = false;
  for (const d of defs) {
    const ok = byId.get(d.id) === true;
    if (ok) pass++;
    if (d.kind === 'E') {
      eduTotal++;
      if (ok) eduPass++;
      if (d.rule && !ok) ruleFail = true;
    }
  }
  return { q: pass / defs.length, qe: eduTotal ? eduPass / eduTotal : 1, ruleFail };
}

/** 省时：看任务多频繁，以及比不装技能少改多少。 */
export function computeValue(e: Evidence): number {
  if (e.baseline.edits <= 1) return 2;
  const edits = mean(e.runs.map((r) => r.edits));
  if (edits >= e.baseline.edits) return 1;
  const gain = 1 - edits / Math.max(e.baseline.edits, 1);
  const freq = e.frequency === 'daily' || e.frequency === 'weekly' ? 3 : e.frequency === 'monthly' ? 2 : 1;
  if (freq === 3) return gain >= 0.5 ? 5 : 4;
  if (freq === 2) return gain >= 0.5 ? 4 : 3;
  return 2;
}

/** 出活：检查单通过率、修改处数、严重错误。 */
export function computeQuality(e: Evidence): number {
  const { q } = checklistStats(e);
  const edits = mean(e.runs.map((r) => r.edits));
  const severe = e.runs.reduce((s, r) => s + r.severe, 0);
  if (severe >= 2 || !atLeast(q, 0.4)) return 1;
  if (severe === 1) return 2;
  if (atLeast(q, 0.9) && edits <= 2) return 5;
  if (atLeast(q, 0.8) && edits <= 4) return 4;
  if (atLeast(q, 0.6)) return 3;
  return 2;
}

/** 懂教育：教育项通过率、教材抽检、规矩项。 */
export function computeEdu(e: Evidence): number {
  const { qe, ruleFail } = checklistStats(e);
  if (ruleFail) return 1;
  const tc = e.textbookCheck && e.textbookCheck.total > 0 ? e.textbookCheck.passed / e.textbookCheck.total : 1;
  if (atLeast(qe, 0.9) && atLeast(tc, 1)) return 5;
  if (atLeast(qe, 0.75) && atLeast(tc, 2 / 3)) return 4;
  if (atLeast(qe, 0.5)) return 3;
  if (atLeast(qe, 0.3)) return 2;
  return 1;
}

const EXTRA_SETUP = ['network', 'python', 'node', 'platform-tool'];

/** 好上手：安装步数、额外配置、触发率、WorkBuddy 上功能是否完整。 */
export function computeEase(e: Evidence): number {
  if (e.requires.includes('paid')) return 1;
  const missing = e.runs.length - e.runs.filter((r) => r.triggered).length;
  let p = 0;
  if (e.installSteps > 3) p++;
  if (e.requires.some((r) => EXTRA_SETUP.includes(r))) p++;
  if (missing === 1) p += 1;
  else if (missing === 2) p += 2;
  else if (missing >= 3) p += 3;
  if (!e.platformComplete) p++;
  const score = Math.max(1, 5 - p);
  return e.requires.includes('api-key') ? Math.min(score, 2) : score;
}

/** 放心用：事实来自静态审查，每条规则是一个上限。 */
export function computeSafety(e: Evidence): number {
  let s = 5;
  if (e.audit.network === 'declared') s = Math.min(s, 4);
  if (e.audit.network === 'undeclared') s = Math.min(s, 2);
  if (e.audit.credentials) s = Math.min(s, 3);
  if (e.audit.studentData === 'local') s = Math.min(s, 3);
  if (e.audit.overRead) s = Math.min(s, 2);
  return s;
}

export function computeDims(e: Evidence): Dims {
  return {
    value: computeValue(e),
    quality: computeQuality(e),
    ease: computeEase(e),
    edu: computeEdu(e),
    safety: computeSafety(e),
  };
}

/** 总分：各维 ÷ 5 × 权重相加得百分制（满分 100），再折成十分制，保留一位小数。 */
export function total(dims: Dims): number {
  const percent = DIMS.reduce((s, d) => s + (dims[d.key] / 5) * d.weight, 0);
  return Math.round(percent) / 10;
}

export function tierOf(t: number): string {
  return (TIERS.find((x) => t >= x.min) ?? TIERS[TIERS.length - 1]).label;
}
