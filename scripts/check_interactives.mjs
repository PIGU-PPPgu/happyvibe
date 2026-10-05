// 质量闸门：体积上限、零外部请求、无 emoji、title、全屏按钮、双主题变量
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const EXT_URL = /https?:\/\//;
let failed = 0;
const names = Object.keys(report);
if (names.length === 0) { console.log('check: no interactives built'); process.exit(0); }

for (const name of names) {
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
