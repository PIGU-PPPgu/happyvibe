// 一键发布（harness v2 L5）：verify 五阶段 → 站点构建 → 部署（自动带本地代理）→ 字节级线上验证 → commit → push → 双端确认
// 用法：node scripts/ship.mjs "commit 信息" [--skip-verify]
import { execFileSync, execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const msg = process.argv[2];
if (!msg) { console.error('用法: node scripts/ship.mjs "commit 信息" [--skip-verify]'); process.exit(1); }
const skipVerify = process.argv.includes('--skip-verify');
const PROXY = { HTTPS_PROXY: 'http://127.0.0.1:7897' };
const sh = (cmd, env = {}) => execFileSync(cmd, { shell: true, stdio: 'inherit', env: { ...process.env, ...env } });
const out = (cmd, env = {}) => execSync(cmd, { shell: true, encoding: 'utf8', env: { ...process.env, ...env } }).trim();
const md5Of = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

// 1) 验收（五阶段；一处不过即中止，不做带病发布）
if (!skipVerify) {
  console.log('── [1/5] verify 五阶段 ──');
  sh('node scripts/verify.mjs');
}

// 2) 站点构建
console.log('── [2/5] npm run build ──');
sh('rm -rf dist && npm run build');

// 3) 部署（wrangler 刷新 token 需走本地代理）
console.log('── [3/5] 部署 Cloudflare Pages ──');
sh('npx wrangler pages deploy dist --project-name=happyvibe', PROXY);

// 4) 字节级线上验证（interactives 走无后缀路径跟 308；previews 直接比对）
console.log('── [4/5] 线上字节验证 ──');
const BASE = 'https://happyvibe.intelliedu.cc';
// CDN 传播需要几秒：失败文件等 8s 再重试两轮，仍不一致才算败
const sleep = (ms) => execSync(`sleep ${ms / 1000}`);
let bad = 0, n = 0;
const pending = [];
const report = JSON.parse(readFileSync('scripts/.interactives-report.json', 'utf8'));
for (const name of Object.keys(report)) {
  const f = `${name}.html`;
  n++;
  let remote = 'ERR';
  try { remote = out(`curl -sL --compressed "${BASE}/interactives/${name}" | md5 -q`); } catch {}
  if (md5Of(`dist/interactives/${f}`) !== remote) pending.push(`interactives/${f}`);
  n++;
  let remoteJ = 'ERR';
  try { remoteJ = out(`curl -s "${BASE}/previews/${name}.jpg" | md5 -q`); } catch {}
  if (md5Of(`dist/previews/${name}.jpg`) !== remoteJ) pending.push(`previews/${name}.jpg`);
}
for (let round = 1; round <= 2 && pending.length; round++) {
  console.log(`  ${pending.length} 个待复验（CDN 传播等待 8s，第 ${round} 轮）`);
  sleep(8000);
  for (let i = pending.length - 1; i >= 0; i--) {
    const rel = pending[i];
    let remote = 'ERR';
    try { remote = rel.endsWith('.html') ? out(`curl -sL --compressed "${BASE}/${rel.replace(/\\.html$/, '')}" | md5 -q`) : out(`curl -s "${BASE}/${rel}" | md5 -q`); } catch {}
    if (md5Of(`dist/${rel}`) === remote) pending.splice(i, 1);
  }
}
bad = pending.length;
for (const rel of pending) console.log(`  不一致 ${rel}`);
console.log(`  比对 ${n} 个文件，${bad ? bad + ' 个不一致' : '全部字节一致'}`);
if (bad) process.exit(1);

// 5) 提交推送 + 双端确认
console.log('── [5/5] git commit & push ──');
sh('git add -A');
try { sh(`git commit -m "${msg.replace(/"/g, '\\"')}"`); } catch { console.log('（无变更可提交）'); }
sh('git push origin main', PROXY);
const local = out('git rev-parse HEAD');
const remote = out('git ls-remote origin main', PROXY).split('\\t')[0];
console.log(`本地 ${local.slice(0, 8)} / 远端 ${remote.slice(0, 8)} ${local === remote ? '· 双端一致' : '· 不一致！'}`);
if (local !== remote) process.exit(1);
console.log('发布完成。');
