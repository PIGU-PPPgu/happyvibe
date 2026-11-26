// 打包 src/interactives/<subject>/<name>/index.mjs 为单文件 public/interactives/<name>.html
// Blender glTF 导出器会把顶点色发到 COLOR_1（COLOR_0 是全白占位层），three.js 只读 COLOR_0。
// 这里在 base64 之前交换两者的 accessor 引用（仅改 JSON 块，二进制原样搬移，无偏移风险）。
function promoteColor0(glb) {
  const jsonLen = glb.readUInt32LE(12);
  const binOffOld = 20 + jsonLen + 8;
  const json = JSON.parse(glb.slice(20, 20 + jsonLen).toString());
  let swapped = false;
  for (const m of json.meshes ?? [])
    for (const pr of m.primitives ?? [])
      if (pr.attributes.COLOR_0 != null && pr.attributes.COLOR_1 != null) {
        [pr.attributes.COLOR_0, pr.attributes.COLOR_1] = [pr.attributes.COLOR_1, pr.attributes.COLOR_0];
        swapped = true;
      }
  if (!swapped) return glb;
  let js = Buffer.from(JSON.stringify(json));
  const pad = (4 - (js.length % 4)) % 4;
  if (pad) js = Buffer.concat([js, Buffer.alloc(pad, 0x20)]);
  const bin = glb.subarray(binOffOld);  // binOffOld 已是 BIN 数据起点（28+jsonLen），别再跳 8
  const out = Buffer.alloc(12 + 8 + js.length + 8 + bin.length);
  glb.copy(out, 0, 0, 12); out.writeUInt32LE(out.length, 4);
  out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4e4f534a, 16); js.copy(out, 20);
  const bo = 20 + js.length;
  out.writeUInt32LE(bin.length, bo); out.writeUInt32LE(0x004e4942, bo + 4); bin.copy(out, bo + 8);
  return out;
}

// 资源目录内的 *.glb（Blender 资产）构建期转 base64 模块 <name>.glb.b64.mjs，index.mjs 直接 import 使用；
// 产物仍是零外链单文件（GLB 内嵌），断网投屏承诺不破。
//
// 另一种形态：独立网页课件。目录里没有 index.mjs、有 index.html（自带 css/ 与 js/，不经模板）。
// 把 <link rel="stylesheet"> 与 <script src> 指向的本地文件原样内联成单文件。
// 拼法沿用 2026-11-02 上线的那两节：样式去掉末尾空白后补一个换行，脚本原样保留再补一个换行。
// 这类资源的体积上限、哪些闸门适用，见 check_interactives.mjs。
import { build } from 'esbuild';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = 'src/interactives';
const OUT = 'public/interactives';
const template = await readFile(path.join(SRC, '_shared', 'template.html'), 'utf8');
// 可选：node scripts/build_interactives.mjs <slug>... 只构建指定资源，报告与既有条目合并
const only = process.argv.slice(2);

function inlineStandalone(dir, html) {
  const read = (rel) => readFileSync(path.join(dir, rel), 'utf8');
  const out = html
    .replace(/<link rel="stylesheet" href="(css\/[^"?]+)(?:\?[^"]*)?">/g, (_, f) => `<style>\n${read(f).replace(/\s+$/, '')}\n</style>`)
    .replace(/<script src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g, (_, f) => `<script>\n${read(f)}\n</script>`);
  // 内联完不许再留本地文件引用，否则单文件拿走后就是断链
  const left = [...out.matchAll(/\b(?:src|href)\s*=\s*["'](?!https?:|data:|#|mailto:)([^"']+)["']/g)].map((m) => m[1]);
  if (left.length) throw new Error(`${dir} 内联后仍有本地引用：${left.join('、')}`);
  return out;
}

let report = {};
try {
  report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
} catch (e) {}
let count = 0;
for (const s of await readdir(SRC, { withFileTypes: true })) {
  if (!s.isDirectory() || s.name === '_shared') continue;
  for (const e of await readdir(path.join(SRC, s.name), { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (only.length > 0 && !only.includes(e.name)) continue;
    const dir = path.join(SRC, s.name, e.name);
    const entry = path.join(dir, 'index.mjs');
    const page = path.join(dir, 'index.html');
    if (!existsSync(entry) && !existsSync(page)) continue;
    const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
    await mkdir(OUT, { recursive: true });
    const outFile = path.join(OUT, `${e.name}.html`);

    if (!existsSync(entry)) {
      const html = inlineStandalone(dir, await readFile(page, 'utf8'));
      // 内容没变就不重写：产物的修改时间一变，卡片预览图就会被判过期
      if (!existsSync(outFile) || (await readFile(outFile, 'utf8')) !== html) await writeFile(outFile, html);
      report[e.name] = { kind: meta.kind === 'interactive-3d' ? 'interactive-3d' : 'interactive-2d', form: 'standalone', bytes: Buffer.byteLength(html) };
      count++;
      console.log(`built ${e.name}.html  独立网页  ${(Buffer.byteLength(html) / 1024).toFixed(1)}KB`);
      continue;
    }
    // GLB 资产 → base64 模块（构建期生成，gitignore 掉生成物）
    for (const f of await readdir(dir)) {
      if (f.endsWith('.glb')) {
        const b64 = promoteColor0(await readFile(path.join(dir, f))).toString('base64');
        await writeFile(path.join(dir, f + '.b64.mjs'), `export default 'data:model/gltf-binary;base64,${b64}';\n`);
      }
    }
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      write: false,
      format: 'iife',
      target: ['es2019'],
      metafile: true,
      legalComments: 'none',
      drop: ['console', 'debugger'],
    });
    const js = result.outputFiles[0].text;
    const is3d = Object.keys(result.metafile.inputs).some((i) => i.includes(`node_modules${path.sep}three`));
    const html = template
      .replaceAll('__TITLE__', meta.title)
      .replaceAll('__HINT__', meta.hint || '')
      .replace('__BUNDLE__', () => js);
    await writeFile(outFile, html);
    report[e.name] = { kind: is3d ? 'interactive-3d' : 'interactive-2d', bytes: html.length };
    count++;
    console.log(`built ${e.name}.html  ${is3d ? '3d' : '2d'}  ${(html.length / 1024).toFixed(1)}KB`);
  }
}
await writeFile('scripts/.interactives-report.json', JSON.stringify(report, null, 2));
console.log(`interactives: ${count} built`);
