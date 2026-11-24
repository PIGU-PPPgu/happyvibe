// 把一批运行记录与评审结果合成条目 score 里的证据字段，并把证据里的数字写成五个维度的依据。
// 纯函数，node 可直跑（scripts/test_skilllab.mjs）。设计见
// docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md §5、§6
import { CHECKLISTS } from '../../src/data/skill-standard.ts';
import { REQUIRES_LABEL } from '../../src/lib/skillLabels.ts';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
/** 保留一位小数 */
const r1 = (x) => Math.round(x * 10) / 10;
const NETWORK = { none: '不联网', declared: '有外联，说明书里写明了', undeclared: '有外联，说明书没写' };

/**
 * @param {object} p
 * @param {string} p.category
 * @param {string} p.mainTask
 * @param {Array<{ task: string, round: number, seconds: number, judgement: object, auto: object }>} p.runs 有效且评审过的轮次，含副任务
 * @param {Array<{ edits: number, severe: number, seconds: number }>} p.baseline 主任务的对照，各一轮一个元素
 * @param {(run) => { total: number, passed: number }} [p.textbookCheckOf] 从一轮的脚本事实里取教材核对结果
 */
export function assembleEvidence({ category, mainTask, runs, baseline, textbookCheckOf }) {
  const defs = CHECKLISTS[category];
  if (!defs) throw new Error(`品类 ${category} 还没有检查单`);
  const main = runs.filter((r) => r.task === mainTask);
  if (main.length !== 3) throw new Error(`主任务 ${mainTask} 需要 3 轮有效运行，现在 ${main.length} 轮`);
  if (baseline.length !== 3) throw new Error(`对照需要 3 轮，现在 ${baseline.length} 轮`);
  // 检查单按多数：3 轮里至少 2 轮过才算过
  const checklist = defs.map((c) => {
    const results = main.map((r) => r.judgement.checklist.find((x) => x.id === c.id) ?? { pass: false, note: '' });
    const fails = results.filter((x) => !x.pass);
    return {
      id: c.id,
      pass: fails.length <= 1,
      note: fails.length ? `${fails.length} 轮不过：${fails[0].note}` : '',
    };
  });
  // 只有带教材标识的任务才有这一项，学情分析、家校沟通没有
  const per = textbookCheckOf ? main.map(textbookCheckOf).filter(Boolean) : [];
  const textbookCheck = per.length ? { total: per.length, passed: per.filter((x) => x.passed === x.total).length } : undefined;
  return {
    runs: runs.map((r) => ({
      task: r.task,
      triggered: true,
      seconds: Math.round(r.seconds),
      edits: r.judgement.edits.length,
      severe: r.judgement.severe.length,
    })),
    baseline: {
      edits: r1(mean(baseline.map((b) => b.edits))),
      severe: Math.round(mean(baseline.map((b) => b.severe))),
      seconds: Math.round(mean(baseline.map((b) => b.seconds))),
    },
    checklist,
    ...(textbookCheck ? { textbookCheck } : {}),
  };
}

/** 五个维度的依据，从证据里的数字写成一句话。只陈述事实。 */
export function factNotes(e) {
  const edits = mean(e.runs.map((r) => r.edits));
  const gain = e.baseline.edits > 0 ? Math.max(0, Math.round((1 - edits / e.baseline.edits) * 100)) : 0;
  const severe = e.runs.reduce((s, r) => s + r.severe, 0);
  const defs = CHECKLISTS[e.category];
  const passed = new Set(e.checklist.filter((c) => c.pass).map((c) => c.id));
  const edu = defs.filter((c) => c.kind === 'E');
  const ruleFail = edu.some((c) => c.rule && !passed.has(c.id));
  const needs = e.requires.map((r) => REQUIRES_LABEL[r] ?? r);
  return {
    value: `3 轮平均要改 ${r1(edits)} 处，不装技能的对照是 ${e.baseline.edits} 处，${gain > 0 ? `少改 ${gain}%` : '没有少改'}。`,
    quality: `检查单 ${defs.length} 条过 ${passed.size} 条，3 轮共 ${severe} 处严重错误。`,
    ease: `${e.installSteps} 步装进 WorkBuddy${needs.length ? `，另需 ${needs.join('、')}` : ''}${e.loadedBy === 'named' ? '；后台点名加载，会不会自动触发没有测' : ''}${e.platformComplete ? '' : '；没有在 WorkBuddy 上核对功能'}。`,
    edu: `教育项 ${edu.length} 条过 ${edu.filter((c) => passed.has(c.id)).length} 条${e.textbookCheck ? `，教材标识 3 轮里齐 ${e.textbookCheck.passed} 轮` : ''}${ruleFail ? '，有一条规矩项没过' : ''}。`,
    safety: `${NETWORK[e.audit.network]}，${e.audit.credentials ? '要用到密钥或登录授权' : '不用密钥'}，${e.audit.studentData === 'local' ? '学生信息存在本机' : '不存学生信息'}${e.audit.overRead ? '，读取范围超过用途所需' : ''}。`,
  };
}
