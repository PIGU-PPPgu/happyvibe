// 外链巡检：验证资源集合中 kind: external 条目的 URL 可达性
// 用法：node scripts/check_resource_links.mjs          全量巡检
//       node scripts/check_resource_links.mjs math      只查某学科
// 判定：HTTP 200（跟随跳转）为 OK；其余输出状态便于人工复核
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = 'src/content/resources';
const only = process.argv.slice(2);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const entries = [];
for (const f of await walk(ROOT)) {
  const txt = await readFile(f, 'utf8');
  if (!/^kind:\s*external\s*$/m.test(txt)) continue;
  const subject = f.split(path.sep).at(-2);
  if (only.length && !only.includes(subject)) continue;
  const url = txt.match(/^url:\s*(\S+)\s*$/m)?.[1];
  const title = txt.match(/^title:\s*(.+?)\s*$/m)?.[1];
  entries.push({ file: f, subject, title, url });
}

async function check(entry) {
  try {
    const { stdout } = await run('curl', [
      '-s', '-o', '/dev/null', '-L', '-m', '20',
      '-A', UA, '--compressed',
      '-w', '%{http_code}', entry.url,
    ]);
    return { ...entry, code: stdout.trim() };
  } catch (e) {
    return { ...entry, code: 'ERR ' + String(e.message).slice(0, 60) };
  }
}

const queue = [...entries];
const results = [];
async function worker() {
  while (queue.length) results.push(await check(queue.shift()));
}
await Promise.all(Array.from({ length: 8 }, worker));

const bad = results.filter((r) => r.code !== '200');
for (const r of results.sort((a, b) => a.subject.localeCompare(b.subject) || a.file.localeCompare(b.file))) {
  console.log(`${r.code.padEnd(5)} [${r.subject}] ${r.title} ${r.url ? '' : '(缺 url)'}`);
}
console.log(`\n共 ${results.length} 条，异常 ${bad.length} 条`);
if (!results.length) console.log('（无 external 条目）');
if (bad.length) {
  console.log('\n异常清单：');
  for (const r of bad) console.log(`${r.code}  ${r.url}  <- ${r.file}`);
  process.exitCode = 1;
}
