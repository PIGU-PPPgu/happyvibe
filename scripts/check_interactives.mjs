// 质量闸门：体积上限、零外部请求、无 emoji、title、全屏按钮、双主题变量、
// 教材锚点、操作提示、预览图新鲜度、可操作性（输入事件 ≥2 类）
// 可选：node scripts/check_interactives.mjs <slug>... 只校验指定资源
//
// 两种形态各有清单（构建报告里的 form 字段）：
//   模板壳（index.mjs）：上面的全项。
//   独立网页课件（index.html + css/ + js/，form=standalone）：体积、零外链、无 emoji、title、
//     教材锚点（含真伪核验）、卡片预览图、自带全屏、自带 tests/ 必须有。
//     不适用三项——双主题、#ops-tip 操作提示、首次上手引导层：这三样是模板壳自带的，
//     独立网页课件是纸面单主题、操作提示写在课件页里（见资源详情页的「课堂使用步骤」），
//     2026-11-07 上线时已定性为设计差异。写在这里是明示，不是漏查；功能检查在 test_interactives.mjs 里跑它的自带测试。
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { validateTextbookAnchor } from './textbook-index.mjs';

const only = process.argv.slice(2);

async function findSource(name) {
  for (const s of await readdir('src/interactives', { withFileTypes: true })) {
    if (!s.isDirectory()) continue;
    const p = `src/interactives/${s.name}/${name}/index.mjs`;
    if (existsSync(p)) return p;
  }
  return null;
}
async function findStandalone(name) {
  for (const s of await readdir('src/interactives', { withFileTypes: true })) {
    if (!s.isDirectory() || s.name === '_shared') continue;
    const p = `src/interactives/${s.name}/${name}`;
    if (existsSync(`${p}/index.html`)) return p;
  }
  return null;
}
const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));

// 单资源模式下报告可能缺该条目（并行构建竞态）：从源码 import 检测 kind 兜底
async function detectKind(name) {
  for (const s of await readdir('src/interactives', { withFileTypes: true })) {
    if (!s.isDirectory()) continue;
    const p = `src/interactives/${s.name}/${name}/index.mjs`;
    if (!existsSync(p)) continue;
    const src = await readFile(p, 'utf8');
    return /from\s+['"]three['"]/.test(src) ? 'interactive-3d' : 'interactive-2d';
  }
  return null;
}
if (only.length > 0) {
  for (const name of only) {
    if (!report[name]) {
      const kind = await detectKind(name);
      if (kind) report[name] = { kind, bytes: existsSync(`public/interactives/${name}.html`) ? (await readFile(`public/interactives/${name}.html`)).length : 0 };
    }
  }
}
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
// 零外部请求：只拦截真正的资源加载上下文（命名空间常量、代码内论文引用字符串不算）
const EXT_URL = /(src|href|action)\s*=\s*["']https?:\/\/|fetch\(\s*["'`]https?:\/\/|import\s*\(?\s*["']https?:\/\/|url\(\s*["']?\s*https?:\/\/|new\s+URL\(\s*["']https?:\/\/|\.open\(\s*["'`](GET|POST|PUT|DELETE)["'`]\s*,\s*["'`]https?:\/\//i;
let failed = 0;
const names = only.length > 0 ? only : Object.keys(report);
if (names.length === 0) { console.log('check: no interactives built'); process.exit(0); }

for (const name of names) {
  if (!report[name]) { failed++; console.log(`FAIL ${name}: 未构建（无报告条目）`); continue; }
  const { kind, bytes, form } = report[name];
  const standalone = form === 'standalone';
  const file = `public/interactives/${name}.html`;
  const problems = [];
  if (!existsSync(file)) problems.push('产物缺失');
  else {
    const html = await readFile(file, 'utf8');
    // 独立网页课件内联的是未压缩的页面脚本与样式，上限放到 256KB（现 109 到 116KB）
    const limit = kind === 'interactive-3d' ? 4 * 1024 * 1024 : standalone ? 256 * 1024 : 100 * 1024;
    if (bytes > limit) problems.push(`体积 ${(bytes / 1024).toFixed(0)}KB 超限 ${limit / 1024}KB`);
    const noComments = html
      .replace(/<!--[\s\S]*?-->/g, '')
      // esbuild 默认把非 ASCII 字符串转成 \uXXXX 转义，检查前先还原
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    if (EXT_URL.test(noComments)) problems.push('存在外部 URL 引用');
    const m = noComments.match(EMOJI);
    if (m) problems.push(`含 emoji: ${m.map((c) => c.codePointAt(0).toString(16)).join(',')}`);
    if (!/<title>[^<]+<\/title>/.test(html) || html.includes('<title>__')) problems.push('title 缺失');
    if (standalone) {
      // 全屏认它自己的实现：按钮文字与 requestFullscreen 调用都得在
      if (!/requestFullscreen\s*\(/.test(html) || !/全屏/.test(noComments)) problems.push('缺全屏（独立网页课件须自带全屏按钮与 requestFullscreen）');
    } else {
      if (!html.includes('id="fs"')) problems.push('缺全屏按钮');
      if (!html.includes('data-theme') || !html.includes(':root[data-theme=light]')) problems.push('缺双主题');
    }
    // G7 教材锚点：定位行必须落到具体教材版本 + 册次单元（教材联动不是口号）
    if (!/(人教版|人教A版|北师大版|统编版|苏科版|沪科版|浙教版|湘教版|华东师大版|外研版|译林版)/.test(noComments)) problems.push('缺教材版本锚点（人教版/北师大版/统编版等）');
    if (!/(第[一二三四五六七八九十]+[单章课]|《[^》]{2,24}》)/.test(noComments)) problems.push('缺单元/章节锚点（第X单元·章 或《课题》）');
    // G8 操作提示：每页必须告诉老师怎么用（≥6 字；2026-10 壳重构后位于 #ops-tip）
    if (!standalone) {
      const hint = noComments.match(/id="ops-tip"[^>]*>([^<]+)</);
      if (!hint || hint[1].trim().length < 6) problems.push('缺操作提示 #ops-tip（≥6 字）');
    }
    // G9 预览图新鲜度：资源库卡片用实拍图，图比产物旧即视为过期
    const pv = `public/previews/${name}.jpg`;
    if (!existsSync(pv)) problems.push('缺卡片预览图 public/previews/' + name + '.jpg');
    else {
      const [htmlStat, pvStat] = await Promise.all([stat(file), stat(pv)]);
      if (pvStat.mtimeMs < htmlStat.mtimeMs - 60_000) problems.push(`预览图过期（先于产物构建，重跑 npm run build:previews ${name}）`);
    }
    // G10 可操作性：≥2 类输入事件，或同一类（如纯点击型）≥5 处真实绑定
    const srcPath = await findSource(name);
    if (srcPath) {
      const src = await readFile(srcPath, 'utf8');
      // 场景原型的绑定在 _shared/scenes/*.mjs 中，一并计入（harness v2）
      const sceneImports = [...src.matchAll(/from\s+['"]\.\.\/\.\.\/_shared\/scenes\/([a-z0-9-]+)\.mjs['"]/g)].map((m) => m[1]);
      let srcAll = src;
      for (const sc of sceneImports) {
        const sp = `src/interactives/_shared/scenes/${sc}.mjs`;
        if (existsSync(sp)) srcAll += '\n' + await readFile(sp, 'utf8');
      }
      const kinds = new Set();
      let bindings = 0;
      for (const mm of srcAll.matchAll(/addEventListener\(\s*['"](click|pointerdown|pointermove|pointerup|input|wheel|keydown|touchstart|change)['"]/g)) {
        kinds.add(mm[1]);
        bindings++;
      }
      if (kinds.size < 2 && bindings < 5) problems.push(`交互绑定不足（${kinds.size} 类 / ${bindings} 处；需 ≥2 类或 ≥5 处）`);
      // G11 教材锚点真伪：meta 引用的版本/册/单元/课必须与教材目录索引吻合
      const metaSrc = src.match(/meta:\s*['"]([^'"]+)['"]/);
      if (metaSrc) {
        const subjDir = srcPath.split('/')[2];
        const SUBJ = { math: '数学', history: '历史', chinese: '语文' }[subjDir] || '';
        const r = validateTextbookAnchor(SUBJ, metaSrc[1]);
        if (!r.ok) problems.push(`教材锚点不实：${r.note}`);
      }
    } else if (standalone) {
      // 独立网页课件：锚点真伪按 meta.json 核；它没有 ?selftest 自测，功能检查全靠自带测试，所以 tests/ 必须有
      const dir = await findStandalone(name);
      if (!dir) problems.push('找不到源码目录（src/interactives/<学科>/<名>/index.html）');
      else {
        const meta = JSON.parse(await readFile(`${dir}/meta.json`, 'utf8'));
        const SUBJ = { math: '数学', geography: '地理', history: '历史', chinese: '语文' }[dir.split('/')[2]] || '';
        const r = validateTextbookAnchor(SUBJ, meta.anchor);
        if (!r.ok) problems.push(`教材锚点不实：${r.note}`);
        if (!existsSync(`${dir}/tests`)) problems.push('缺自带测试 tests/（独立网页课件的功能检查靠它）');
      }
    }
    // G12 上手引导：首次访问的 30 秒上手层必须随模板内置
    if (!standalone && (!html.includes('id="onboard"') || !html.includes('开始上课'))) problems.push('缺首次上手引导层');
  }
  if (problems.length) { failed++; console.log(`FAIL ${name}: ${problems.join('；')}`); }
  else console.log(`PASS ${name}${standalone ? '（独立网页课件；双主题、操作提示外壳、上手引导按设计不适用）' : ''}`);
}
if (failed) { console.error(`${failed} 个资源未过闸门`); process.exit(1); }
console.log(`check: ${names.length} 个资源全部通过`);
