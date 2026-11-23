// 技能包构建：node scripts/build_skill_packages.mjs
// src/skills/<slug>/（上游技能目录，原样）→ public/skills/<slug>.zip
// 包内根目录是 <slug>/，与上游一致；另加两份文件：
//   LICENSE        技能目录里没有时，从 src/skills/_meta/<slug>/LICENSE 补入（开源许可要求随附许可文本）
//   ATTRIBUTION.md 作者、上游、提交号、许可证、评测日期
// 只发布压缩包，不发布散文件，避免技能里的 HTML 被站内搜索索引。
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const SRC = 'src/skills';
const META = 'src/skills/_meta';
const ENTRIES = 'src/content/skills';
const OUT = 'public/skills';
const SITE = 'https://happyvibe.intelliedu.cc';

const readEntry = (slug) => {
  const file = join(ENTRIES, `${slug}.md`);
  if (!existsSync(file)) return null;
  return parseFrontmatter(readFileSync(file, 'utf8')).data;
};

const ymd = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
};

const attribution = (slug, d) => {
  const lines = [
    '# 来源与许可',
    '',
    `- 技能：${d.name}`,
    `- 作者：${d.source.author}`,
    `- 上游：${d.source.url}`,
    `- 评测时的提交：${d.source.commit || '未记录'}`,
    `- 许可证：${d.source.license}`,
    `- 技能版本：${d.source.version || '未标注'}`,
    '',
    `本包由 HappyVibe 数智学园 Skill 工坊打包（${SITE}/skills/${slug}/），打包日期 ${ymd(d.score?.tested?.date) || '未评测'}。`,
    '包内技能文件与上游一致，未作修改。ATTRIBUTION.md 与打包时补入的 LICENSE 是附加文件。',
  ];
  return lines.join('\n') + '\n';
};

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const slugs = isDir(SRC)
  ? readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('_') && existsSync(join(SRC, e.name, 'SKILL.md')))
      .map((e) => e.name)
      .sort()
  : [];

if (slugs.length === 0) console.log('没有镜像技能。');
mkdirSync(OUT, { recursive: true });
const built = new Set();
let failed = 0;

for (const slug of slugs) {
  const d = readEntry(slug);
  const zipPath = join(OUT, `${slug}.zip`);
  if (!d) {
    console.error(`✗ ${slug}：缺少条目 ${ENTRIES}/${slug}.md`);
    failed++;
    continue;
  }
  if (d.distribution !== 'mirror') {
    console.log(`- ${slug}：只评不转，不出技能包`);
    rmSync(zipPath, { force: true });
    continue;
  }
  // 暂存：<stageRoot>/<slug>/…，zip 在 stageRoot 里以 slug 为根打包
  const stageRoot = join(tmpdir(), `hv-skill-pkg-${process.pid}`);
  const stage = join(stageRoot, slug);
  rmSync(stageRoot, { recursive: true, force: true });
  cpSync(join(SRC, slug), stage, { recursive: true, filter: (s) => basename(s) !== '.DS_Store' });

  let addedLicense = false;
  if (!readdirSync(stage).some((f) => /^(LICENSE|LICENCE)(\..+)?$/i.test(f))) {
    const metaLic = join(META, slug, 'LICENSE');
    if (!existsSync(metaLic)) {
      console.error(`✗ ${slug}：技能目录与 ${META}/${slug}/ 都没有 LICENSE，开源许可要求随附许可文本`);
      failed++;
      rmSync(stageRoot, { recursive: true, force: true });
      continue;
    }
    cpSync(metaLic, join(stage, 'LICENSE'));
    addedLicense = true;
  }
  writeFileSync(join(stage, 'ATTRIBUTION.md'), attribution(slug, d));

  rmSync(zipPath, { force: true });
  const r = spawnSync('zip', ['-r', '-X', '-q', resolve(zipPath), slug], { cwd: stageRoot, encoding: 'utf8' });
  rmSync(stageRoot, { recursive: true, force: true });
  if (r.status !== 0 || r.error) {
    console.error(`✗ ${slug}：zip 失败 ${r.error ?? ''} ${(r.stdout || '').trim()} ${(r.stderr || '').trim()}`);
    failed++;
    continue;
  }
  built.add(slug);
  console.log(`✓ ${slug}.zip  ${(statSync(zipPath).size / 1024).toFixed(1)} KB${addedLicense ? '（补入 LICENSE）' : ''}`);
}

// 清掉已下线技能的旧包
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.zip') && !built.has(f.replace(/\.zip$/, ''))) {
    rmSync(join(OUT, f), { force: true });
    console.log(`- 移除旧包 ${f}`);
  }
}
process.exit(failed ? 1 : 0);
