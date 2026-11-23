// Skill 工坊条目校验：node scripts/check_skills.mjs
// 逐条解析 src/content/skills/*.md：先过 schema（与 Astro 构建同一份），再查交叉规则（见 lib/check_skills_core.mjs）。
// 任一条出错退出码 1；「待复测」之类的提醒只打印，不算失败。
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { skillSchema } from '../src/data/skill-schema.ts';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { checkEntry } from './lib/check_skills_core.mjs';

const DIR = 'src/content/skills';

const walk = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
};
const mtime = (p) => (existsSync(p) ? statSync(p).mtimeMs : null);
const newestMtime = (dir) => {
  if (!existsSync(dir)) return null;
  let newest = 0;
  const visit = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) visit(p);
      else newest = Math.max(newest, statSync(p).mtimeMs);
    }
  };
  visit(dir);
  return newest;
};
const ctx = { exists: existsSync, mtime, newestMtime };

const files = walk(DIR);
let failed = 0;
let warned = 0;
for (const file of files) {
  const slug = file.slice(DIR.length + 1).replace(/\.md$/, '');
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const parsed = skillSchema.safeParse(data);
  if (!parsed.success) {
    failed++;
    console.error(`✗ ${slug}`);
    for (const issue of parsed.error.issues) console.error(`    ${issue.path.join('.') || '(根)'}：${issue.message}`);
    continue;
  }
  const { errors, warnings } = checkEntry(slug, parsed.data, body, ctx);
  if (errors.length) {
    failed++;
    console.error(`✗ ${slug}`);
    for (const e of errors) console.error(`    ${e}`);
  } else {
    console.log(`✓ ${slug}`);
  }
  for (const w of warnings) {
    warned++;
    console.log(`  ! ${slug}：${w}`);
  }
}

if (files.length === 0) console.log('没有 Skill 条目。');
console.log(`check_skills：${files.length} 条，${failed} 条出错${warned ? `，${warned} 条提醒` : ''}`);
process.exit(failed ? 1 : 0);
