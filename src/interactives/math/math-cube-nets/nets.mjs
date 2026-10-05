// 立方体展开图数据与折叠几何（纯整数运算；供 index.mjs 与 scripts/test_cube_nets.mjs 共用）
// 格子坐标 [gx, gz]，z 向下；坐标统一 ×2，格子中心在 (2gx, 0, 2gz)，格宽 2
// 折叠 = 沿「底面→该面」路径，先绕最靠叶子的折痕（平面原位置）旋转，逐层向底面施加

export const NETS = [
  { name: '十字形', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
  { name: 'T 形', cells: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]] },
  { name: '1-4-1 变体一', cells: [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
  { name: '1-4-1 变体二', cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
  { name: '1-4-1 变体三', cells: [[3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
  { name: '1-4-1 变体四', cells: [[3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]] },
  { name: '2-3-1 变体一', cells: [[2, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]] },
  { name: '2-3-1 变体二', cells: [[2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
  { name: '2-3-1 变体三', cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 2]] },
  { name: '2-2-2 楼梯', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]] },
  { name: '3-3 双排', cells: [[2, 0], [3, 0], [1, 1], [2, 1], [0, 2], [1, 2]] },
];

// ---------- 90 度旋转（整数矩阵 + 平移），p' = R·p + t ----------
// 绕「平行 z 轴、过点 (x0, 0, 0)」转 sign*90°
function hingeZ(x0, sign) {
  const R = [
    [0, -sign, 0],
    [sign, 0, 0],
    [0, 0, 1],
  ];
  const q = [x0, 0, 0];
  const Rq = [0 * x0 - sign * 0, sign * x0 + 0 * 0, 0];
  return { R, t: [q[0] - Rq[0], q[1] - Rq[1], q[2] - Rq[2]], axis: 'z', sign, line: x0 };
}
// 绕「平行 x 轴、过点 (0, 0, z0)」转 sign*90°
function hingeX(z0, sign) {
  const R = [
    [1, 0, 0],
    [0, 0, -sign],
    [0, sign, 0],
  ];
  const Rq = [0, -sign * z0, 0];
  const q = [0, 0, z0];
  return { R, t: [q[0] - Rq[0], q[1] - Rq[1], q[2] - Rq[2]], axis: 'x', sign, line: z0 };
}
function applyHinge(h, p) {
  return [
    h.R[0][0] * p[0] + h.R[0][1] * p[1] + h.R[0][2] * p[2] + h.t[0],
    h.R[1][0] * p[0] + h.R[1][1] * p[1] + h.R[1][2] * p[2] + h.t[1],
    h.R[2][0] * p[0] + h.R[2][1] * p[1] + h.R[2][2] * p[2] + h.t[2],
  ];
}
function applyR(h, v) {
  return [
    h.R[0][0] * v[0] + h.R[0][1] * v[1] + h.R[0][2] * v[2],
    h.R[1][0] * v[0] + h.R[1][1] * v[1] + h.R[1][2] * v[2],
    h.R[2][0] * v[0] + h.R[2][1] * v[1] + h.R[2][2] * v[2],
  ];
}

const DIRS = [
  { d: [1, 0], axis: 'z', sign: +1 },  // child 在 parent +x：绕 z +90
  { d: [-1, 0], axis: 'z', sign: -1 },
  { d: [0, 1], axis: 'x', sign: -1 },  // child 在 parent +z：绕 x -90
  { d: [0, -1], axis: 'x', sign: +1 },
];

/**
 * 折叠几何：BFS 建铰链树（cells[0] 为底面），
 * 每面最终 center/normal = 沿路径叶→底逐个施加 90° 铰链。
 */
export function foldGeometry(cells) {
  const n = cells.length;
  const key = (c) => c[0] + ',' + c[1];
  const idx = new Map(cells.map((c, i) => [key(c), i]));
  const parent = new Array(n).fill(-1);
  const hinge = new Array(n).fill(null);
  const seen = new Array(n).fill(false);
  const queue = [0];
  seen[0] = true;
  let visited = 1;
  while (queue.length) {
    const i = queue.shift();
    for (const { d, axis, sign } of DIRS) {
      const j = idx.get(key([cells[i][0] + d[0], cells[i][1] + d[1]]));
      if (j === undefined || seen[j]) continue;
      seen[j] = true;
      visited++;
      parent[j] = i;
      hinge[j] =
        axis === 'z'
          ? hingeZ(2 * cells[i][0] + (d[0] > 0 ? 1 : -1), sign)
          : hingeX(2 * cells[i][1] + (d[1] > 0 ? 1 : -1), sign);
      queue.push(j);
    }
  }
  if (visited !== n) return { ok: false, centers: null, normals: null, parent, hinge };

  const centers = [];
  const normals = [];
  for (let i = 0; i < n; i++) {
    // 路径：底面 → ... → i；施加顺序叶→底（path 反向）
    const path = [];
    for (let j = i; j !== 0; j = parent[j]) path.push(j);
    let p = [2 * cells[i][0], 0, 2 * cells[i][1]];
    let v = [0, 1, 0];
    for (const j of path) {
      p = applyHinge(hinge[j], p);
      v = applyR(hinge[j], v);
    }
    centers.push(p);
    normals.push(v);
  }
  return { ok: true, centers, normals, parent, hinge };
}

// 校验：折完后 6 个中心恰为立方体六面中心（底面在 y=0、边长 2、×2 坐标）
const CUBE_CENTERS = [
  [0, 0, 0], [0, 2, 0],
  [1, 1, 0], [-1, 1, 0],
  [0, 1, 1], [0, 1, -1],
];

export function validateNet(cells) {
  if (cells.length !== 6) return false;
  const g = foldGeometry(cells);
  if (!g.ok) return false;
  const base = g.centers[0];
  const got = new Set();
  for (const c of g.centers) {
    const rel = [c[0] - base[0], c[1] - base[1], c[2] - base[2]];
    if (!CUBE_CENTERS.some((u) => u[0] === rel[0] && u[1] === rel[1] && u[2] === rel[2])) return false;
    const k = rel.join(',');
    if (got.has(k)) return false;
    got.add(k);
  }
  return true;
}
