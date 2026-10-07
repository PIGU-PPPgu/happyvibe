// 资源卡片预览图生成：无头 Chrome 逐个截图自研交互资源（默认深色、首环节预设态），
// sips 缩到 720 宽 JPEG 存 public/previews/。资源内容改动后必须重跑（卡片用实际效果图）。
// 用法：node scripts/build_resource_previews.mjs [name...]（不带参数跑全部）
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, rm } from 'node:fs/promises';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(report);

await mkdir('public/previews', { recursive: true });
let fail = 0;
for (const name of names) {
  const tmp = `/tmp/hv-preview-${name}.png`;
  try {
    await run(CHROME, [
      '--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--hide-scrollbars',
      '--window-size=1280,800', '--virtual-time-budget=9000',
      `--screenshot=${tmp}`,
      `file://${process.cwd()}/public/interactives/${name}.html?pv=1`,
    ], { timeout: 60000 });
    await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '720', tmp, '--out', `public/previews/${name}.jpg`], { timeout: 30000 });
    console.log(`preview ${name}.jpg`);
  } catch (e) {
    fail++;
    console.error(`FAIL ${name}: ${String(e.message).slice(0, 120)}`);
  } finally {
    await rm(tmp, { force: true });
  }
}
console.log(`previews: ${names.length - fail}/${names.length}`);
if (fail) process.exit(1);
