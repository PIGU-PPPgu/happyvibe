// 单测：11 种展开图必须全部能折叠成完美立方体（中心互异、方位合法）
// 用法：node scripts/test_cube_nets.mjs
import { NETS, validateNet } from '../src/interactives/math/math-cube-nets/nets.mjs';

let bad = 0;
NETS.forEach((net, i) => {
  const ok = validateNet(net.cells);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${i + 1}. ${net.name}  ${JSON.stringify(net.cells)}`);
  if (!ok) bad++;
});
// 去重检查（同构网不算数）：直接比较格子集合的字符串
const sigs = new Set(NETS.map((n) => JSON.stringify([...n.cells].sort((a, b) => a[1] - b[1] || a[0] - b[0]))));
console.log(`distinct: ${sigs.size}/${NETS.length}`);
if (bad || sigs.size !== NETS.length) process.exit(1);
console.log('all nets valid');
