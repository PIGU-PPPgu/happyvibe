// 视觉闸门：截图取证 + 机器像素规则 + 目检册新鲜度
// 三层防线：
//   L1 取证——每资源 × 深浅主题 × 首末环节帧，无头截图存 scripts/.visual-evidence/（gitignored）
//   L2 像素规则——截图非空白；浅色主题截图与深色截图确有显著差异（防浅色没生效）
//   L3 目检册——scripts/.visual-review.json 记录视觉模型/人眼逐张结论，buildHash 过期即 FAIL
// 用法：node scripts/visual_gate.mjs（取证+规则+册检查）；--sheets-only 只重出拼图供目检
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const names = process.argv.includes('--sheets-only') ? [] : Object.keys(report);
const EV_DIR = 'scripts/.visual-evidence';
const MANIFEST = 'scripts/.visual-review.json';

await mkdir(EV_DIR, { recursive: true });
const buildHash = createHash('md5').update(JSON.stringify(report)).digest('hex').slice(0, 12);

// ---------- L1 取证 ----------
const machineProblems = [];
const evidence = {};
for (const name of names) {
  evidence[name] = {};
  for (const theme of ['dark', 'light']) {
    for (const [tag, step] of [['s0', '0'], ['sN', '99']]) {
      const file = `${EV_DIR}/${name}-${theme}-${tag}.png`;
      try {
        await run(CHROME, [
          '--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--hide-scrollbars',
          '--window-size=1280,800', '--virtual-time-budget=9000',
          `--screenshot=${path.resolve(file)}`,
          `file://${process.cwd()}/public/interactives/${name}.html?pv=1&step=${step}${theme === 'light' ? '&theme=light' : ''}`,
        ], { timeout: 60000 });
        evidence[name][`${theme}-${tag}`] = file;
      } catch (e) {
        machineProblems.push(`${name} ${theme}-${tag} 截图失败: ${String(e.message).slice(0, 80)}`);
      }
      // 空白/超小截图重拍一次（无头 WebGL 并行偶发空帧）
      try {
        const st = await stat(file);
        if (st.size < 8000) {
          await run(CHROME, [
            '--headless=new', '--disable-gpu-sandbox', '--no-sandbox', '--hide-scrollbars',
            '--window-size=1280,800', '--virtual-time-budget=9000',
            `--screenshot=${path.resolve(file)}`,
            `file://${process.cwd()}/public/interactives/${name}.html?pv=1&step=${step}${theme === 'light' ? '&theme=light' : ''}`,
          ], { timeout: 60000 });
        }
      } catch (e) {}
    }
  }
}

// ---------- L2 像素规则（PIL 批量算） ----------
if (names.length) {
  const files = Object.values(evidence).flatMap((o) => Object.values(o));
  const res = await new Promise((resolve) => {
    const py = spawn('python3', ['-']);
    let out = '';
    py.stdout.on('data', (d) => (out += d));
    // stderr 只入控制台不入 JSON（Pillow 弃用告警曾混入 stdout 导致解析失败）
    py.stderr.on('data', (d) => process.stderr.write(d));
    py.on('close', () => { try { resolve(JSON.parse(out)); } catch { resolve(null); } });
    py.stdin.write(`
from PIL import Image
import sys, json
import warnings; warnings.filterwarnings('ignore')
files = ${JSON.stringify(files)}
ev = ${JSON.stringify(evidence)}
def stats(p):
    im = Image.open(p).convert('L')
    px = list(im.resize((160,100)).getdata())
    mean = sum(px)/len(px)
    var = sum((v-mean)**2 for v in px)/len(px)
    return mean, var
out = {}
for name, shots in ev.items():
    for key, p in shots.items():
        try:
            mean, var = stats(p)
            out[name + '|' + key] = {'mean': round(mean,1), 'var': round(var,1)}
        except Exception as ex:
            out[name + '|' + key] = {'err': str(ex)[:60]}
# 双主题差异：只量 UI 框架带（顶栏+教学条，上部 112px）——画面主体（如水墨长卷）两主题本就同色，不能计入
def ui_mean(p):
    im = Image.open(p).convert('L')
    w, h = im.size
    px = im.load()
    band = h * 112 // 800
    vals = [px[x, y] for y in range(0, band, 2) for x in range(0, w, 4)]
    return sum(vals)/len(vals)
diffs = {}
for name, shots in ev.items():
    try:
        diffs[name] = round(abs(ui_mean(shots['dark-s0']) - ui_mean(shots['light-s0'])), 1)
    except Exception:
        diffs[name] = None
print(json.dumps({'stats': out, 'themeDiff': diffs}))
`);
    py.stdin.end();
  });
  if (!res) machineProblems.push('像素规则脚本解析失败');
  else {
    for (const [key, st] of Object.entries(res.stats)) {
      if (st.err) machineProblems.push(`${key}: ${st.err}`);
      else if (st.var < 8) machineProblems.push(`${key}: 近乎空白/单色（方差 ${st.var}）`);
    }
    for (const [name, diff] of Object.entries(res.themeDiff)) {
      if (diff === null) machineProblems.push(`${name}: 双主题截图缺失`);
      else if (diff < 40) machineProblems.push(`${name}: 深浅截图差异仅 ${diff}（浅色主题疑似未生效）`);
    }
  }
}

// ---------- L3 目检册新鲜度 ----------
let manifest = null;
if (existsSync(MANIFEST)) {
  try { manifest = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch { manifest = null; }
}
const sheetInfo = { buildHash, dark: `${EV_DIR}/sheet-dark.png`, light: `${EV_DIR}/sheet-light.png` };
const fresh = manifest && manifest.buildHash === buildHash;
const covered = fresh && names.every((n) => manifest.results?.[n]?.verdict === 'pass');
const reviewed = fresh && Object.values(manifest.results || {}).every((r) => r.verdict === 'pass');

// 拼图（供目检）：python PIL 网格
if (names.length || process.argv.includes('--sheets-only')) {
  await new Promise((resolve) => {
    const py = spawn('python3', ['-']);
    py.on('close', resolve);
    py.stdin.write(`
from PIL import Image, ImageDraw
import os, math
EV = ${JSON.stringify(EV_DIR)}
names = ${JSON.stringify(process.argv.includes('--sheets-only') && !names.length ? Object.keys(report) : names)}
for theme in ['dark','light']:
    cells = []
    for n in names:
        p = os.path.join(EV, n + '-' + theme + '-s0.png')
        if os.path.exists(p):
            im = Image.open(p).convert('RGB').resize((320,200))
            d = ImageDraw.Draw(im)
            d.rectangle([0,0,319,199], outline=(160,60,180))
            d.text((8,6), n, fill=(255,220,120))
            cells.append((n, im))
    if not cells: continue
    cols = 4
    rows = math.ceil(len(cells)/cols)
    sheet = Image.new('RGB', (cols*320, rows*200), (10,8,16))
    for i,(n,im) in enumerate(cells):
        sheet.paste(im, ((i%cols)*320, (i//cols)*200))
    sheet.save(os.path.join(EV, 'sheet-' + theme + '.png'))
print('sheets ok')
`);
    py.stdin.end();
  });
}

console.log(`视觉闸门 · build ${buildHash} · 取证 ${names.length} 资源 × 双主题 × 首末帧`);
if (machineProblems.length) {
  for (const p of machineProblems) console.log('FAIL ' + p);
}
if (!names.length) {
  console.log('仅重出拼图。');
  process.exit(machineProblems.length ? 1 : 0);
}
if (!manifest) {
  console.log(`FAIL 目检册缺失：看拼图 ${sheetInfo.dark} 与 ${sheetInfo.light}，逐张目检后将结论写入 ${MANIFEST}（格式见 SKILL），buildHash=${buildHash}`);
  process.exit(1);
}
if (!fresh) {
  console.log(`FAIL 目检册过期（册 ${manifest.buildHash} ≠ 当前 ${buildHash}）：重新目检拼图并更新 ${MANIFEST}`);
  process.exit(1);
}
const strict = process.argv.includes('--strict');
const prov = names.filter((n) => manifest.results?.[n]?.verdict === 'provisional');
const missing = names.filter((n) => !manifest.results?.[n]);
if (missing.length) {
  console.log(`FAIL 目检册缺条目：${missing.join('、')}`);
  process.exit(1);
}
if (prov.length && strict) {
  console.log(`FAIL 目检存在 provisional（--strict）：${prov.join('、')}`);
  process.exit(1);
}
if (prov.length) console.log(`WARN ${prov.length} 个资源为 provisional（像素规则过、视觉模型待补检）：${prov.join('、')}`);
const passN = names.length - prov.length - missing.length;
console.log(`视觉闸门${machineProblems.length ? '未过' : '通过'}：像素规则 ${machineProblems.length} 违例，目检 ${passN} pass / ${prov.length} provisional。`);
process.exit(machineProblems.length ? 1 : 0);
