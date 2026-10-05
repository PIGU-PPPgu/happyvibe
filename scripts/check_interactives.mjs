// 质量闸门：体积上限、零外部请求、无 emoji、title、全屏按钮、双主题变量
// 可选：node scripts/check_interactives.mjs <slug>... 只校验指定资源
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const only = process.argv.slice(2);
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
  const { kind, bytes } = report[name];
  const file = `public/interactives/${name}.html`;
  const problems = [];
  if (!existsSync(file)) problems.push('产物缺失');
  else {
    const html = await readFile(file, 'utf8');
    const limit = kind === 'interactive-3d' ? 1024 * 1024 : 100 * 1024;
    if (bytes > limit) problems.push(`体积 ${(bytes / 1024).toFixed(0)}KB 超限 ${limit / 1024}KB`);
    const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
    if (EXT_URL.test(noComments)) problems.push('存在外部 URL 引用');
    const m = noComments.match(EMOJI);
    if (m) problems.push(`含 emoji: ${m.map((c) => c.codePointAt(0).toString(16)).join(',')}`);
    if (!/<title>[^<]+<\/title>/.test(html) || html.includes('<title>__')) problems.push('title 缺失');
    if (!html.includes('id="fs"')) problems.push('缺全屏按钮');
    if (!html.includes('data-theme') || !html.includes(':root[data-theme=light]')) problems.push('缺双主题');
  }
  if (problems.length) { failed++; console.log(`FAIL ${name}: ${problems.join('；')}`); }
  else console.log(`PASS ${name}`);
}
if (failed) { console.error(`${failed} 个资源未过闸门`); process.exit(1); }
console.log(`check: ${names.length} 个资源全部通过`);
