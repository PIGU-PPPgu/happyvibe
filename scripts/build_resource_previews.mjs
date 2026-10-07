// 资源卡片预览图生成：无头 Chrome 逐个截图自研交互资源（默认深色、首环节预设态），
// sips 缩到 720 宽 JPEG 存 public/previews/。资源内容改动后必须重跑（卡片用实际效果图）。
// 截图后做像素级空白检测（中心区色彩桶数 / 标准差），空白即重试，最多 4 次——
// WebGL 资源无头截图常拍出"命令成功但画面全空"的帧，退出码检测不到。
// 用法：node scripts/build_resource_previews.mjs [name...]（不带参数跑全部）
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, rm } from 'node:fs/promises';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(report);

async function shot(name, tmp) {
  await run(CHROME, [
    '--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1280,800', '--virtual-time-budget=9000',
    `--screenshot=${tmp}`,
    `file://${process.cwd()}/public/interactives/${name}.html?pv=1&embed=1`,
  ], { timeout: 60000 });
  await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '720', tmp, '--out', `public/previews/${name}.jpg`], { timeout: 30000 });
}
// 空白检测：中心 60% 区域色彩桶数（40 级量化）与亮度标准差
async function blankMetric(name) {
  const py = 'from PIL import Image,ImageStat\n'
    + 'from collections import Counter\n'
    + 'im=Image.open("public/previews/' + name + '.jpg").convert("L")\n'
    + 'w,h=im.size\n'
    + 'im=im.crop((int(w*.2),int(h*.2),int(w*.8),int(h*.8)))\n'
    + 'st=ImageStat.Stat(im)\n'
    + 'rgb=Image.open("public/previews/' + name + '.jpg").convert("RGB").crop((int(w*.2),int(h*.2),int(w*.8),int(h*.8)))\n'
    + 'c=Counter()\n'
    + 'for p in list(rgb.getdata())[::7]: c[(p[0]//40,p[1]//40,p[2]//40)]+=1\n'
    + 'print(min(len(c),999),round(st.stddev[0],1))';
  const { stdout } = await run('python3', ['-c', py], { timeout: 30000 });
  const [buckets, std] = stdout.trim().split(/\s+/).map(Number);
  return { buckets, std };
}

await mkdir('public/previews', { recursive: true });
let fail = 0;
for (const name of names) {
  const tmp = `/tmp/hv-preview-${name}.png`;
  try {
    let ok = false, last = '';
    for (let i = 0; i < 4 && !ok; i++) {
      await shot(name, tmp);
      const { buckets, std } = await blankMetric(name);
      last = `buckets=${buckets} std=${std}`;
      ok = buckets >= 8 || std >= 8;
      if (!ok) console.log(`blank ${name} (${last})，重试 ${i + 1}/4`);
    }
    if (!ok) throw new Error(`连续空白: ${last}`);
    console.log(`preview ${name}.jpg (${last})`);
  } catch (e) {
    fail++;
    console.error(`FAIL ${name}: ${String(e.message).slice(0, 120)}`);
  } finally {
    await rm(tmp, { force: true });
  }
}
console.log(`previews: ${names.length - fail}/${names.length}`);
if (fail) process.exit(1);
