// 等一批已登记的会话跑完：隔一会儿 collect 一次，直到没有还在跑的，或者等满了给定的分钟数。
// 最后一行是 collect 的汇总行（已收、还在跑、没跑成各多少个），还在跑的列在它上面。
// 用法：node scripts/skilllab/wait.mjs <批次> <层级> [--judge] [--minutes 9]
// 只读会话库，只碰登记过的会话。
import { spawnSync } from 'node:child_process';

const [batch, layer, ...rest] = process.argv.slice(2);
if (!batch || !layer) {
  console.error('用法：node scripts/skilllab/wait.mjs <批次> <层级> [--judge] [--minutes 9]');
  process.exit(2);
}
const judge = rest.includes('--judge');
const at = rest.indexOf('--minutes');
const minutes = at >= 0 ? Number(rest[at + 1]) : 9;
if (!(minutes > 0) || minutes > 30) {
  console.error('--minutes 要在 1 到 30 之间');
  process.exit(2);
}
const args = ['scripts/skilllab.mjs', 'collect', batch, layer, ...(judge ? ['--judge'] : [])];
const deadline = Date.now() + minutes * 60_000;
let last = '';
for (;;) {
  const out = spawnSync(process.execPath, args, { encoding: 'utf8' });
  last = `${(out.stdout ?? '').trim()}${out.stderr?.trim() ? `\n${out.stderr.trim()}` : ''}`;
  if (out.status !== 0 || /还在跑 0 个/.test(out.stdout ?? '') || Date.now() > deadline) break;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20_000);
}
console.log(last);
