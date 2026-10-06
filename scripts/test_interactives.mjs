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
      ['--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--virtual-time-budget=8000', '--dump-dom', url],
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
  // 教研员契约：定位 / 环节 / 引导 / 小结（external 无产物不适用）
  const ped = r.pedagogy;
  if (ped) {
    if (ped.metaChars < 8) problems.push(`缺定位行 [data-hv-meta]（学科·年级 + 教材章节知识点，现 ${ped.metaChars} 字）`);
    if (ped.steps < 2) problems.push(`教学环节不足 [data-hv-step]（需 ≥2 个，如引入/探究/归纳，现 ${ped.steps} 个）`);
    if (ped.guideCount < ped.steps || ped.guideChars < 60) {
      problems.push(`引导语不足 [data-hv-guide]（每个环节需一句教师引导，合计 ≥60 字；现 ${ped.guideCount} 条 ${ped.guideChars} 字）`);
    }
    if (ped.summaryChars < 30) problems.push(`缺知识小结 [data-hv-summary]（≥30 字结论，现 ${ped.summaryChars} 字）`);
  }
  return { name, pass: problems.length === 0, problems };
}

const queue = [...names];
const results = [];
async function worker() {
  while (queue.length) {
    const n = queue.shift();
    const res = await testOne(n);
    results.push(res);
    console.log(`${res.pass ? 'PASS' : 'FAIL'} ${res.name}`);
    for (const p of res.problems) console.log(`      ${p}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const failed = results.filter((r) => !r.pass);
console.log(`\nharness: ${results.length - failed.length}/${results.length} 通过`);
if (failed.length) {
  console.log(`未过：${failed.map((f) => f.name).join('，')}`);
  process.exit(1);
}
