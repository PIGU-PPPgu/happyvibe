// 把候选里判定为镜像的开源技能拷进站内。
//   技能目录原样拷到 <dest>/<slug>/；技能目录里没有许可证文本时，从上游仓库取一份放到 <dest>/_meta/<slug>/LICENSE。
//   已经在站内的不动。拷完逐文件比对，不一样的报出来。
// 只拷文件，不执行技能里的任何东西。许可证在不在镜像清单里，由 review-merge 判定并写进候选表的 distribution。
// 用法：node scripts/skilllab/mirror.mjs <批次> [--only a,b] [--dest src/skills]
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { MIRROR_LICENSES } from '../../src/data/skill-standard.ts';

const LICENSE_NAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'license.txt'];
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const [batch, ...rest] = process.argv.slice(2);
if (!batch) {
  console.error('用法：node scripts/skilllab/mirror.mjs <批次> [--only a,b] [--dest src/skills]');
  process.exit(2);
}
const at = rest.indexOf('--only');
const only = at >= 0 ? new Set(rest[at + 1].split(',')) : null;
const destAt = rest.indexOf('--dest');
const dest = destAt >= 0 ? rest[destAt + 1] : 'src/skills';
const candidates = JSON.parse(readFileSync(`docs/skill-evals/${batch}/candidates.json`, 'utf8')).filter(
  (c) => c.distribution === 'mirror' && (!only || only.has(c.slug))
);

/** 目录里的普通文件，跳过版本库目录、依赖目录和符号链接（链接可能指向技能目录之外）。 */
const listFiles = (dir) => {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (lstatSync(p).isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(p);
      } else if (e.isFile()) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
};

/** 上游仓库的许可证文本。先问 GitHub 的许可证接口，再按常见文件名逐个试。 */
const fetchLicense = (c) => {
  const [owner, repo] = String(c.source?.repo ?? '').split('/');
  if (!owner || !repo) return null;
  const tryGet = (path) => {
    const r = spawnSync('gh', ['api', `repos/${owner}/${repo}/contents/${path}`, '--jq', '.content'], { encoding: 'utf8' });
    return r.status === 0 && r.stdout.trim() ? Buffer.from(r.stdout.trim(), 'base64').toString('utf8') : null;
  };
  const detected = spawnSync('gh', ['api', `repos/${owner}/${repo}/license`, '--jq', '.content'], { encoding: 'utf8' });
  if (detected.status === 0 && detected.stdout.trim()) return Buffer.from(detected.stdout.trim(), 'base64').toString('utf8');
  for (const name of LICENSE_NAMES) {
    const text = tryGet(name);
    if (text) return text;
  }
  return null;
};

let copied = 0;
let kept = 0;
let failed = 0;
for (const c of candidates) {
  const slug = c.slug;
  if (!MIRROR_LICENSES.includes(c.source?.license)) {
    failed++;
    console.log(`  x ${slug}：许可证 ${c.source?.license ?? '未标注'} 不在镜像清单里`);
    continue;
  }
  const target = join(dest, slug);
  if (existsSync(join(target, 'SKILL.md'))) {
    kept++;
    continue;
  }
  if (!existsSync(join(c.dir, 'SKILL.md'))) {
    failed++;
    console.log(`  x ${slug}：取回目录里没有 SKILL.md（${c.dir}）`);
    continue;
  }
  const files = listFiles(c.dir);
  for (const f of files) {
    const to = join(target, relative(c.dir, f));
    mkdirSync(join(to, '..'), { recursive: true });
    cpSync(f, to);
  }
  // 逐文件比对
  const bad = files.filter((f) => !readFileSync(join(target, relative(c.dir, f))).equals(readFileSync(f)));
  const hasLicense = files.some((f) => LICENSE_NAMES.includes(basename(f)) && relative(c.dir, f) === basename(f));
  let licenseNote = '技能目录里带许可证';
  if (!hasLicense) {
    const meta = join(dest, '_meta', slug, 'LICENSE');
    const text = existsSync(meta) ? readFileSync(meta, 'utf8') : fetchLicense(c);
    if (text) {
      mkdirSync(join(meta, '..'), { recursive: true });
      if (!existsSync(meta)) writeFileSync(meta, text);
      licenseNote = `许可证从上游仓库取到 _meta/${slug}/LICENSE`;
    } else {
      failed++;
      console.log(`  x ${slug}：${files.length} 个文件已拷到 ${target}，但上游仓库里没找到许可证文本，不能当镜像发布`);
      continue;
    }
  }
  copied++;
  console.log(`  ${bad.length ? 'x' : '✓'} ${slug}：${files.length} 个文件拷到 ${target}${bad.length ? `，其中 ${bad.length} 个与取回的不一致` : ''}；${licenseNote}`);
  if (bad.length) failed++;
}
console.log(`${batch}：要镜像 ${candidates.length} 个，新拷 ${copied} 个，已在站内 ${kept} 个，出问题 ${failed} 个`);
if (failed) process.exitCode = 1;
