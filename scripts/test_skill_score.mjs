// Skill 评分规则断言 —— node 直跑（Node 24 原生剥离类型），零依赖
// 跑法：node scripts/test_skill_score.mjs
// 规则出处：docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md §3.3
import assert from 'node:assert/strict';
import { CHECKLISTS, DIMS, TIERS, TASKS, CATEGORIES } from '../src/data/skill-standard.ts';
import { computeValue, computeQuality, computeEdu, computeEase, computeSafety, computeDims, total, tierOf } from '../src/lib/skillScore.ts';

const run = (edits, severe = 0, triggered = true) => [1, 2, 3].map(() => ({ task: 'LP-1', triggered, seconds: 90, edits, severe }));
// 用真实检查单填结果：failIds 里的条目不过，其余通过
const filled = (cat, failIds = []) => CHECKLISTS[cat].map((d) => ({ id: d.id, pass: !failIds.includes(d.id), note: '' }));
const idsOf = (cat, kind) => CHECKLISTS[cat].filter((d) => d.kind === kind).map((d) => d.id);
// 教案检查单：前 failQ 个「出活」项、前 failE 个「懂教育」项不过
const lp = (failQ = 0, failE = 0) => filled('lesson-plan', [...idsOf('lesson-plan', 'Q').slice(0, failQ), ...idsOf('lesson-plan', 'E').slice(0, failE)]);
const base = (o = {}) => ({
  category: 'lesson-plan', frequency: 'daily', runs: run(2),
  baseline: { edits: 8, severe: 1, seconds: 70 }, checklist: lp(), textbookCheck: { total: 3, passed: 3 },
  installSteps: 3, requires: [], platformComplete: true,
  audit: { network: 'none', credentials: false, studentData: 'none', overRead: false }, ...o,
});

// ———— 省时 ————
assert.equal(computeValue(base()), 5);
assert.equal(computeValue(base({ frequency: 'weekly' })), 5);
assert.equal(computeValue(base({ runs: run(6) })), 4); // gain 0.25
assert.equal(computeValue(base({ baseline: { edits: 1, severe: 0, seconds: 70 } })), 2); // 裸问已够好
assert.equal(computeValue(base({ runs: run(9) })), 1); // 不比裸问好
assert.equal(computeValue(base({ frequency: 'monthly' })), 4);
assert.equal(computeValue(base({ frequency: 'monthly', runs: run(6) })), 3);
assert.equal(computeValue(base({ frequency: 'termly' })), 2);

// ———— 出活（教案检查单 4 个出活项、8 个教育项）————
assert.equal(idsOf('lesson-plan', 'Q').length, 4);
assert.equal(idsOf('lesson-plan', 'E').length, 8);
assert.equal(computeQuality(base()), 5);
assert.equal(computeQuality(base({ runs: run(5) })), 3); // 全过但改 5 处
assert.equal(computeQuality(base({ checklist: lp(1) })), 5); // 11/12
assert.equal(computeQuality(base({ checklist: lp(2) })), 4); // 10/12
assert.equal(computeQuality(base({ checklist: lp(2, 1) })), 3); // 9/12
assert.equal(computeQuality(base({ checklist: lp(2), runs: run(5) })), 3); // 0.833 但改 5 处
assert.equal(computeQuality(base({ runs: [{ ...run(2)[0], severe: 1 }, ...run(2).slice(1)] })), 2); // 严重错误合计 1
assert.equal(computeQuality(base({ runs: [{ ...run(2)[0], severe: 1 }, { ...run(2)[1], severe: 1 }, ...run(2).slice(2)] })), 1);
assert.equal(computeQuality(base({ checklist: lp(4, 4) })), 1); // 4/12 = 0.333，不足四成
assert.equal(computeQuality(base({ checklist: lp(2, 4) })), 2); // 6/12 = 0.5，不足六成

// ———— 懂教育 ————
assert.equal(computeEdu(base()), 5);
assert.equal(computeEdu(base({ checklist: lp(0, 1) })), 4); // 7/8 = 0.875，不到九成
assert.equal(computeEdu(base({ checklist: lp(0, 2) })), 4); // 6/8
assert.equal(computeEdu(base({ checklist: lp(0, 4) })), 3); // 4/8
assert.equal(computeEdu(base({ checklist: lp(0, 5) })), 2); // 3/8
assert.equal(computeEdu(base({ checklist: lp(0, 6) })), 1); // 2/8
assert.equal(computeEdu(base({ textbookCheck: { total: 3, passed: 2 } })), 4);
assert.equal(computeEdu(base({ textbookCheck: { total: 3, passed: 1 } })), 3);
assert.equal(computeEdu(base({ category: 'home-school', checklist: filled('home-school', ['HS2']) })), 1); // 规矩项不过
assert.equal(computeEdu(base({ category: 'home-school', checklist: filled('home-school') })), 5); // 不抽检教材的品类

// ———— 好上手 ————
assert.equal(computeEase(base()), 5);
assert.equal(computeEase(base({ installSteps: 4 })), 4);
assert.equal(computeEase(base({ requires: ['python'] })), 4);
assert.equal(computeEase(base({ runs: run(2).map((r, i) => (i === 2 ? { ...r, triggered: false } : r)) })), 4); // 触发 2/3
assert.equal(computeEase(base({ runs: run(2).map((r, i) => (i === 0 ? r : { ...r, triggered: false })) })), 3); // 触发 1/3
assert.equal(computeEase(base({ runs: run(2, 0, false) })), 2); // 触发 0/3
assert.equal(computeEase(base({ platformComplete: false })), 4);
assert.equal(computeEase(base({ requires: ['api-key'] })), 2);
assert.equal(computeEase(base({ requires: ['paid'] })), 1);
assert.equal(computeEase(base({ installSteps: 4, requires: ['python'], runs: run(2).map((r, i) => (i === 2 ? { ...r, triggered: false } : r)) })), 2);

// ———— 放心用 ————
const audit = (o) => ({ audit: { ...base().audit, ...o } });
assert.equal(computeSafety(base()), 5);
assert.equal(computeSafety(base(audit({ network: 'declared' }))), 4);
assert.equal(computeSafety(base(audit({ network: 'undeclared' }))), 2);
assert.equal(computeSafety(base(audit({ credentials: true }))), 3);
assert.equal(computeSafety(base(audit({ studentData: 'local' }))), 3);
assert.equal(computeSafety(base(audit({ overRead: true }))), 2);
assert.equal(computeSafety(base(audit({ credentials: true, network: 'declared' }))), 3);

// ———— 合成 ————
assert.deepEqual(computeDims(base()), { value: 5, quality: 5, ease: 5, edu: 5, safety: 5 });
assert.equal(total({ value: 5, quality: 5, ease: 5, edu: 5, safety: 5 }), 10);
assert.equal(total({ value: 4, quality: 4, ease: 5, edu: 4, safety: 5 }), 8.7);
assert.equal(tierOf(9), '必装');
assert.equal(tierOf(8.99), '好用');
assert.equal(tierOf(7.5), '可用');
assert.equal(tierOf(6), '勉强');
assert.equal(tierOf(5.99), '不推荐');

// ———— 标准数据自洽 ————
assert.equal(DIMS.reduce((s, d) => s + d.weight, 0), 100);
assert.ok(DIMS.every((d) => [1, 2, 3, 4, 5].every((n) => d.anchors[String(n)]?.length > 0)));
assert.deepEqual(TIERS.map((t) => t.min), [...TIERS.map((t) => t.min)].sort((a, b) => b - a));
for (const [cat, list] of Object.entries(CHECKLISTS)) {
  assert.ok(CATEGORIES.some((c) => c.key === cat), `检查单 ${cat} 不在品类表里`);
  assert.equal(new Set(list.map((x) => x.id)).size, list.length, `${cat} 编号重复`);
  assert.ok(list.some((x) => x.kind === 'Q') && list.some((x) => x.kind === 'E'), `${cat} 缺 Q 或 E`);
}
assert.ok(TASKS.every((t) => CATEGORIES.some((c) => c.key === t.category)));
console.log('skillScore tests: PASS');
