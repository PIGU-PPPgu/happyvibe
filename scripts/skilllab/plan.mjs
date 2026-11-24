// 运行计划：每个技能主任务 3 轮，备课教案加副任务 1 轮；对照每个主任务 3 轮、副任务 1 轮，同一层级内共用。
// 纯函数，node 可直跑（scripts/test_skilllab.mjs）。设计见
// docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md §4.4
import { TASKS } from '../../src/data/skill-standard.ts';

export const ROUNDS = 3;
export const BASELINE_ROUNDS = 3;

/** 每个层级用的模型，原样传给会话工具的 model 参数 */
export const LAYER_MODELS = {
  'free-tier': 'account:bigmodel-individual-coding-plan/GLM-5.3-Flash',
  'same-model': 'magpie/workbuddy/deepseek-v4.1-flash',
};

/** 写进条目 tested.model 的短名 */
export const modelShort = (model) => model.split('/').pop();

export const tasksFor = (category) => TASKS.filter((t) => t.category === category);

/**
 * @param {{ slug: string, category: string }[]} skills
 * @param {'free-tier' | 'same-model'} layer
 */
export function buildPlan(skills, layer) {
  if (!LAYER_MODELS[layer]) throw new Error(`未知层级 ${layer}`);
  const runs = [];
  const need = new Set();
  for (const s of skills) {
    const main = tasksFor(s.category).find((t) => t.role === 'main');
    const second = tasksFor(s.category).find((t) => t.role === 'second');
    if (!main) throw new Error(`品类 ${s.category} 没有主任务`);
    need.add(main.id);
    for (let round = 1; round <= ROUNDS; round++) {
      runs.push({ id: `${layer}-${s.slug}-${main.id}-${round}`, kind: 'skill', slug: s.slug, category: s.category, task: main.id, round });
    }
    if (second) {
      need.add(second.id);
      runs.push({ id: `${layer}-${s.slug}-${second.id}-1`, kind: 'skill', slug: s.slug, category: s.category, task: second.id, round: 1 });
    }
  }
  for (const taskId of [...need].sort()) {
    const t = TASKS.find((x) => x.id === taskId);
    const rounds = t.role === 'second' ? 1 : BASELINE_ROUNDS;
    for (let round = 1; round <= rounds; round++) {
      runs.push({ id: `${layer}-baseline-${taskId}-${round}`, kind: 'baseline', slug: null, category: t.category, task: taskId, round });
    }
  }
  return runs.map((r) => ({ ...r, layer, model: LAYER_MODELS[layer] }));
}
