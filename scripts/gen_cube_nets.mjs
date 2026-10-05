// 枚举自由六连方，输出能折叠成立方体的 11 种展开图（坐标归一化到 min=0，按行排序）
// 用法：node scripts/gen_cube_nets.mjs
import { validateNet } from '../src/interactives/math/math-cube-nets/nets.mjs';

const SYM = [
  ([x, z]) => [x, z], ([x, z]) => [-x, z], ([x, z]) => [x, -z], ([x, z]) => [-x, -z],
  ([x, z]) => [z, x], ([x, z]) => [-z, x], ([x, z]) => [z, -x], ([x, z]) => [-z, -x],
];
const key = (cells) => cells.map((c) => c.join(',')).sort().join(';');
const canon = (cells) => {
  const variants = SYM.map((s) => {
    const v = cells.map(s);
    const mx = Math.min(...v.map((c) => c[0]));
    const mz = Math.min(...v.map((c) => c[1]));
    return key(v.map(([x, z]) => [x - mx, z - mz]));
  });
  return variants.sort()[0];
};

const seen = new Set();
const results = [];

function grow(set) {
  if (set.size === 6) {
    const c = canon([...set].map((s) => s.split(',').map(Number)));
    if (!seen.has(c)) {
      seen.add(c);
      const cells = [...set].map((s) => s.split(',').map(Number));
      if (validateNet(cells)) results.push(normalize(cells));
    }
    return;
  }
  for (const s of [...set]) {
    const [x, z] = s.split(',').map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = `${x + dx},${z + dz}`;
      if (set.has(nk)) continue;
      set.add(nk);
      grow(set);
      set.delete(nk);
    }
  }
}

function normalize(cells) {
  const mx = Math.min(...cells.map((c) => c[0]));
  const mz = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([x, z]) => [x - mx, z - mz])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

grow(new Set(['0,0']));
console.log(`自由六连方 ${seen.size} 种，其中立方体展开图 ${results.length} 种`);
console.log(JSON.stringify(results));
