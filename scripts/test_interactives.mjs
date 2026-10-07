// 交互资源自测 harness：无头浏览器逐个加载 ?selftest=1，收集控制台报错、
// 画布分区内容统计、资源内置断言（__hvPushCheck），全部通过才 PASS
// 用法：node scripts/test_interactives.mjs [name...]（不带参数跑全部）
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const only = process.argv.slice(2);
const names = only.length ? only : Object.keys(report);

async function testOne(name) {
  const url = `file://${process.cwd()}/public/interactives/${name}.html?selftest=1`;
  let dom = '';
  try {
    const { stdout } = await run(
      CHROME,
      ['--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--window-size=1280,800', '--virtual-time-budget=8000', '--dump-dom', url],
      { maxBuffer: 16 * 1024 * 1024, timeout: 90000 }
    );
    dom = stdout;
  } catch (e) {
    return { name, pass: false, problems: ['chrome 运行失败: ' + String(e.message).slice(0, 120)] };
  }
  const m = dom.match(/__HV__(\{[\s\S]*?\})__HV__/);
  if (!m) return { name, pass: false, problems: ['无自测报告（页面未执行到 runtime 自测）'] };
  let r;
  try {
    r = JSON.parse(m[1]);
  } catch {
    return { name, pass: false, problems: ['自测报告解析失败'] };
  }
  const problems = [];
  if (r.errors && r.errors.length) problems.push('报错: ' + r.errors.join(' | ').slice(0, 200));
  for (const c of r.checks || []) {
    if (!c.pass) problems.push(`断言失败 ${c.name}: ${String(c.detail).slice(0, 120)}`);
  }
  if (r.canvas) {
    const b = r.canvas.bbox;
    if (!b) {
      problems.push('画布无内容（包围盒为空）');
    } else {
      const w = b[2] - b[0];
      const h = b[3] - b[1];
      if (w < 0.5 || h < 0.4) problems.push(`主体内容过小：占画布 ${Math.round(w * 100)}% 宽 × ${Math.round(h * 100)}% 高（需 ≥50%×40%）`);
    }
  } else {
    const stageText = dom
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ');
    if (stageText.replace(/\s+/g, '').length < 60) problems.push('DOM 内容过少（<60 字符）');
  }
  // 教研员契约 v2：定位 / 环节 / 引导 / 讲解 / 小结 / 检测，全部硬性（无过渡豁免）
  const ped = r.pedagogy;
  if (ped) {
    if (ped.metaChars < 8) problems.push(`缺定位行 [data-hv-meta]（学科·年级 + 教材章节知识点，现 ${ped.metaChars} 字）`);
    if (ped.steps < 3) problems.push(`教学环节不足（需 ≥3 个完整课堂环节，现 ${ped.steps} 个）`);
    if (ped.guideChars < 90) problems.push(`引导语合计不足（≥90 字，现 ${ped.guideChars} 字）`);
    const shortGuide = (ped.guideLens || []).findIndex((n) => n < 15);
    if (shortGuide >= 0) problems.push(`第 ${shortGuide + 1} 环节引导语仅 ${(ped.guideLens || [])[shortGuide]} 字（每环节 ≥15 字）`);
    if (ped.noteChars < 120) problems.push(`讲解词合计不足（≥120 字，现 ${ped.noteChars} 字）`);
    const shortNote = (ped.noteLens || []).findIndex((n) => n < 40);
    if (shortNote >= 0) problems.push(`第 ${shortNote + 1} 环节讲解词仅 ${(ped.noteLens || [])[shortNote]} 字（每环节 ≥40 字）`);
    if (ped.summaryChars < 30) problems.push(`缺知识小结 [data-hv-summary]（≥30 字结论，现 ${ped.summaryChars} 字）`);
    if (ped.quizCount < 4) problems.push(`随堂检测不足 [data-hv-quiz]（需 ≥4 题，现 ${ped.quizCount} 题）`);
    if (ped.quizCount > 0 && ped.quizChars < 120) problems.push(`检测题干与解析合计不足（≥120 字，现 ${ped.quizChars} 字）`);
  }
  return { name, pass: problems.length === 0, problems, quiz: ped ? ped.quizCount : 0 };
}

const queue = [...names];
const results = [];
async function worker() {
  while (queue.length) {
    const n = queue.shift();
    let res = await testOne(n);
    // 无头 WebGL 并行偶发空采样：失败重试一次，两次都失败才算失败
    if (!res.pass) {
      console.log(`RETRY ${res.name}`);
      res = await testOne(n);
    }
    results.push(res);
    console.log(`${res.pass ? 'PASS' : 'FAIL'} ${res.name}`);
    for (const p of res.problems) console.log(`      ${p}`);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));

const failed = results.filter((r) => !r.pass);
const withQuiz = results.filter((r) => r.quiz > 0);
console.log(`\nharness: ${results.length - failed.length}/${results.length} 通过；随堂检测覆盖 ${withQuiz.length}/${results.length}`);
if (failed.length) {
  console.log(`未过：${failed.map((f) => f.name).join('，')}`);
  process.exit(1);
}
