// 站内链接巡检（构建后）：node scripts/check_links.mjs
// 爬 dist/ 下所有 HTML 的 href 与 src，站内链接逐个核对目标是否存在。列出 404，退出码 1。
// Pages 会把 .html 后缀 308 到无后缀地址，所以 /a/b 既可能对应 dist/a/b/index.html，也可能对应 dist/a/b.html。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';

const DIST = process.argv[2] || 'dist';
if (!existsSync(DIST)) {
  console.error(`找不到 ${DIST}/，先 npm run build`);
  process.exit(2);
}
// 站点带基路径时（GitHub Pages 镜像是 /happyvibe/，即构建时的 PUBLIC_BASE），站内链接都带这个前缀，核对前先去掉
const BASE = (process.env.PUBLIC_BASE ?? '/').replace(/\/?$/, '/');

const walk = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
};
const exists = (p) => {
  if (!existsSync(p)) return false;
  if (!statSync(p).isDirectory()) return true;
  return existsSync(join(p, 'index.html'));
};

const pages = walk(DIST);
const missing = [];
let checked = 0;
for (const page of pages) {
  const text = readFileSync(page, 'utf8');
  for (const m of text.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const raw = m[1];
    if (/^(https?:)?\/\//.test(raw)) continue;
    if (/^(mailto:|tel:|data:|javascript:|ftp:|blob:)/i.test(raw)) continue;
    let url = raw.split('#')[0].split('?')[0];
    if (!url) continue;
    try {
      url = decodeURIComponent(url);
    } catch {}
    const target = url.startsWith('/') ? join(DIST, BASE !== '/' && url.startsWith(BASE) ? url.slice(BASE.length - 1) : url) : resolve(dirname(page), url);
    checked++;
    if (exists(target) || exists(`${target}/index.html`) || exists(`${target}.html`)) continue;
    missing.push({ from: relative(DIST, page), to: raw });
  }
}

if (missing.length) {
  console.error(`站内 404 共 ${missing.length} 处：`);
  for (const x of missing) console.error(`  ${x.from}  →  ${x.to}`);
}
console.log(`check_links：${pages.length} 个页面，核对站内链接 ${checked} 处，404 ${missing.length} 处`);
process.exit(missing.length ? 1 : 0);
