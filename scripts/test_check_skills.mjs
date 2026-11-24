// Skill 条目校验器的断言 —— node 直跑
// 跑法：node scripts/test_check_skills.mjs
// 用一条证据与分数一致的合法条目做底，逐项把它改坏，确认每类错误都抓得到、合法情况不误报。
import assert from 'node:assert/strict';
import { CHECKLISTS, LAYERS, STANDARD } from '../src/data/skill-standard.ts';
import { skillSchema } from '../src/data/skill-schema.ts';
import { computeDims } from '../src/lib/skillScore.ts';
import { evidenceOf } from '../src/lib/skillEntryCore.ts';
import { checkEntry } from './lib/check_skills_core.mjs';

const filled = (cat, fail = []) => CHECKLISTS[cat].map((c) => ({ id: c.id, pass: !fail.includes(c.id), note: '' }));
const today = new Date().toISOString().slice(0, 10);

const base = () => ({
  name: 'demo-skill', title: '演示技能', category: 'lesson-plan',
  does: '把一节课设计成教案', summary: '适合初中数学老师，产出一份教案',
  source: { kind: 'github', author: '甲', repo: 'a/b', url: 'https://github.com/a/b/tree/main/skills/demo', license: 'MIT', version: '1.0.0' },
  distribution: 'link', platforms: ['workbuddy'], composition: 'prompt', requires: [],
  install: { workbuddy: ['下载技能包', '打开 WorkBuddy 点添加技能', '选上传技能并选中压缩包'] },
  trigger: '帮我写教案', examples: ['帮我写一节数轴的教案'], cautions: [], relatedLessons: [], status: 'tested',
  score: {
    task: 'LP-1', dims: { value: 5, quality: 5, ease: 5, edu: 5, safety: 5 },
    notes: { value: '依据', quality: '依据', ease: '依据', edu: '依据', safety: '依据' },
    verdict: '一句话理由', weakness: '短板一句话',
    tested: { date: today, agent: 'WorkBuddy 桌面版 5.9.3', model: 'auto', by: 'ai', skillVersion: '1.0.0' },
    platformComplete: true,
    runs: [1, 2, 3].map(() => ({ task: 'LP-1', triggered: true, seconds: 90, edits: 2, severe: 0 })),
    baseline: { edits: 8, severe: 1, seconds: 70 },
    checklist: filled('lesson-plan'), textbookCheck: { total: 3, passed: 3 },
    audit: { network: 'none', credentials: false, studentData: 'none', overRead: false }, overrides: [],
  },
});

const ctxOk = { exists: () => true, mtime: () => 2, newestMtime: () => 1 };
/** 过 schema 再跑交叉规则，返回 errors */
const run = (d, ctx = ctxOk, body = '') => {
  const parsed = skillSchema.parse(d);
  return checkEntry('demo-skill', parsed, body, ctx).errors;
};
const mutate = (fn) => {
  const d = base();
  fn(d);
  return d;
};
const schemaOk = (d) => skillSchema.safeParse(d).success;

// 标准版本与实测层级
assert.equal(STANDARD.version, '1.1', '标准要升到 1.1');
assert.deepEqual(LAYERS.map((l) => l.key), ['workbuddy', 'same-model', 'free-tier'], '三个实测层级，从高到低');
assert.ok(STANDARD.changes[0].startsWith('1.1（'), '变更记录最新的写在最前');

// 合法条目：证据算出来的五维恰好是记录的 5/5/5/5/5，且零错误
assert.deepEqual(computeDims(evidenceOf(base())), { value: 5, quality: 5, ease: 5, edu: 5, safety: 5 });
assert.deepEqual(run(base()), []);

// 分数重算
assert.ok(run(mutate((d) => { d.score.dims.value = 1; })).some((e) => e.includes('维度 value') && e.includes('重算是 5')));
const overridden = mutate((d) => {
  d.score.dims.value = 1;
  d.score.overrides = [{ dim: 'value', value: 1, reason: '教研终审：这项活每学期才做一次' }];
});
assert.deepEqual(run(overridden), []);
assert.equal(schemaOk(mutate((d) => {
  d.score.overrides = [{ dim: 'value', value: 1, reason: '甲' }, { dim: 'value', value: 2, reason: '乙' }];
})), false, '同一维度调整两次应被 schema 拒绝');

// 检查单对齐
assert.ok(run(mutate((d) => { d.score.checklist = filled('lesson-plan').slice(1); })).some((e) => e.includes('缺了这些条目：LP1')));
assert.ok(run(mutate((d) => { d.score.checklist.push({ id: 'LP99', pass: true, note: '' }); })).some((e) => e.includes('多出标准没有的编号：LP99')));
assert.ok(run(mutate((d) => { d.category = 'courseware'; })).some((e) => e.includes('还没有检查单')));

// 任务归属
assert.ok(run(mutate((d) => { d.score.runs.push({ task: 'HS-1', triggered: true, seconds: 60, edits: 1, severe: 0 }); })).some((e) => e.includes('不属于品类')));
assert.ok(run(mutate((d) => {
  d.score.task = 'LP-2';
  d.score.runs.forEach((r) => { r.task = 'LP-2'; });
})).some((e) => e.includes('不是品类 lesson-plan 的主任务')), '副任务不能当主任务');

// 证据与日期
const noShot = { ...ctxOk, exists: (p) => !p.endsWith('run-1.webp') };
assert.ok(run(mutate((d) => { d.score.runs[0].shot = '/images/skill-reports/demo-skill/run-1.webp'; }), noShot).some((e) => e.includes('证据截图不存在')));
assert.ok(run(mutate((d) => { d.score.tested.date = '2999-01-01'; })).some((e) => e.includes('在未来')));
{
  const parsed = skillSchema.parse(mutate((d) => { d.score.tested.date = '2020-01-01'; }));
  assert.ok(checkEntry('demo-skill', parsed, '', ctxOk).warnings.some((w) => w.includes('待复测')));
}

// 镜像技能的源文件与技能包
const mirror = () => mutate((d) => { d.distribution = 'mirror'; });
assert.ok(run(mirror(), { ...ctxOk, exists: (p) => !p.includes('src/skills/') }).some((e) => e.includes('缺少源文件')));
assert.ok(run(mirror(), { exists: () => true, mtime: (p) => (p.endsWith('.zip') ? 1 : 0), newestMtime: () => 2 }).some((e) => e.includes('比源文件旧')));
assert.ok(run(mirror(), { exists: () => false, mtime: () => null, newestMtime: () => null }).some((e) => e.includes('缺少技能包')));
assert.equal(schemaOk(mutate((d) => { d.distribution = 'mirror'; d.source.license = 'Custom'; })), false, '许可证不在清单内不得镜像');
assert.equal(schemaOk(mutate((d) => { d.distribution = 'mirror'; delete d.source.license; })), false, '没有许可证不得镜像');

// 状态约束
assert.equal(schemaOk(mutate((d) => { d.status = 'pending'; })), false, '待测条目不得带 score');
assert.equal(schemaOk(mutate((d) => { d.status = 'rejected'; delete d.rejectReason; })), false, '不收录条目必须写原因');
assert.equal(schemaOk(mutate((d) => { d.status = 'tested'; delete d.score; })), false, '已实测条目必须有 score');
assert.equal(schemaOk(mutate((d) => { delete d.install; })), false, '已实测条目必须有 install');
assert.ok(schemaOk(mutate((d) => { d.status = 'pending'; delete d.score; delete d.install; delete d.trigger; delete d.examples; })), '最小字段的待测条目应通过');

// 文风红线
assert.ok(run(mutate((d) => { d.cautions = ['很好用 📚']; })).some((e) => e.includes('emoji')));
assert.ok(run(base(), ctxOk, '正文里的 ✅ 也算').some((e) => e.includes('emoji')));
assert.ok(run(mutate((d) => { d.does = '轻松搞定教案'; })).some((e) => e.includes('轻松搞定')));
assert.ok(run(mutate((d) => { d.score.verdict = '这就是满分答案'; })).some((e) => e.includes('满分答案')));
console.log('check_skills tests: PASS');
