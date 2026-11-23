// 按条目里记录的证据算出五个维度的分：node scripts/score_skill.mjs <条目.md> [--write]
// 不带 --write：只打印算出的分，并标出与条目里记录的不一致之处（校验脚本也会拦，这里给评测员即时反馈）。
// 带 --write：把算出的分写回条目（被教研调整过的维度保持调整值），其余字段与正文原样保留。
import { readFileSync, writeFileSync } from 'node:fs';
import { computeDims, tierOf, total } from '../src/lib/skillScore.ts';
import { evidenceOf } from '../src/lib/skillEntryCore.ts';
import { DIMS } from '../src/data/skill-standard.ts';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const write = args.includes('--write');
if (!file) {
  console.error('用法：node scripts/score_skill.mjs <条目.md> [--write]');
  process.exit(2);
}

const text = readFileSync(file, 'utf8');
const { data, body } = parseFrontmatter(text);
if (data.status !== 'tested' || !data.score) {
  console.log(`${file}：不是已实测条目，没有可算的证据。`);
  process.exit(0);
}
const s = data.score;
const evidenceOnly = { ...data, score: { ...s, dims: { value: 1, quality: 1, ease: 1, edu: 1, safety: 1 } } };
const computed = computeDims(evidenceOf(evidenceOnly));
const overridden = new Map(s.overrides.map((o) => [o.dim, o]));
const final = { ...computed };
for (const [dim, o] of overridden) final[dim] = o.value;

let mismatch = 0;
for (const d of DIMS) {
  const tag = overridden.has(d.key) ? `教研调整为 ${overridden.get(d.key).value}` : `记录 ${s.dims[d.key]}`;
  const ok = overridden.has(d.key) || s.dims[d.key] === computed[d.key];
  if (!ok) mismatch++;
  console.log(`${ok ? ' ' : '!'} ${d.label}：按证据算是 ${computed[d.key]} 分｜${tag}${ok ? '' : ' ← 不一致'}`);
}
const sum = total(final);
console.log(`总分 ${sum.toFixed(1)}，档位「${tierOf(sum)}」。证据标记：${s.tested.by === 'ai' ? 'AI 代测' : '教师试用'}，${s.tested.date}。`);

if (!mismatch) {
  console.log('五个维度与证据一致，无需改动。');
  process.exit(0);
}
if (!write) {
  console.log(`有 ${mismatch} 个维度对不上。确认记录无误后加 --write 写回，或改证据后重算。`);
  process.exit(1);
}
s.dims = final;
writeFileSync(file, `---\n${(await import('js-yaml')).default.dump(data, { lineWidth: 200, noRefs: true })}---\n\n${body.replace(/^\n+/, '')}`);
console.log(`已把 ${mismatch} 个维度的分写回 ${file}。`);
