// 打包 src/interactives/<subject>/<name>/index.mjs 为单文件 public/interactives/<name>.html
// 资源目录内的 *.glb（Blender 资产）构建期转 base64 模块 <name>.glb.b64.mjs，index.mjs 直接 import 使用；
// 产物仍是零外链单文件（GLB 内嵌），断网投屏承诺不破。
import { build } from 'esbuild';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'src/interactives';
const OUT = 'public/interactives';
const template = await readFile(path.join(SRC, '_shared', 'template.html'), 'utf8');
// 可选：node scripts/build_interactives.mjs <slug>... 只构建指定资源，报告与既有条目合并
const only = process.argv.slice(2);

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
    if (!existsSync(entry)) continue;
    // GLB 资产 → base64 模块（构建期生成，gitignore 掉生成物）
    for (const f of await readdir(dir)) {
      if (f.endsWith('.glb')) {
        const b64 = (await readFile(path.join(dir, f))).toString('base64');
        await writeFile(path.join(dir, f + '.b64.mjs'), `export default 'data:model/gltf-binary;base64,${b64}';\n`);
      }
    }
    const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
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
    await mkdir(OUT, { recursive: true });
    await writeFile(path.join(OUT, `${e.name}.html`), html);
    report[e.name] = { kind: is3d ? 'interactive-3d' : 'interactive-2d', bytes: html.length };
    count++;
    console.log(`built ${e.name}.html  ${is3d ? '3d' : '2d'}  ${(html.length / 1024).toFixed(1)}KB`);
  }
}
await writeFile('scripts/.interactives-report.json', JSON.stringify(report, null, 2));
console.log(`interactives: ${count} built`);
