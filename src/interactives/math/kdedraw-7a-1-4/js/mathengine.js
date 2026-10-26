(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 主视图：每列最大高度；左视图：每行最大高度；俯视图：非零格
  M.frontView = function (g) { return g[0].map((_, x) => Math.max.apply(null, g.map(r => r[x]))); };
  M.leftView = function (g) { return g.map(r => Math.max.apply(null, r)); };
  M.topCount = function (g) { return g.reduce((s, r) => s + r.filter(v => v > 0).length, 0); };
  M.blockCount = function (g) { return g.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0); };
  // 最少块数：对每个非零格，高度 = min(该列主视高, 该行左视高) 中满足约束的最小放置
  M.minBlocks = function (g) {
    // 同视图最少块：每格压到 min(主视列高, 左视行高)（俯视格保持非零）
    const F = M.frontView(g), Lf = M.leftView(g);
    const g2 = g.map((row, y) => row.map((v, x) => (v > 0 ? Math.min(v, Math.max(1, Math.min(F[x], Lf[y]))) : 0)));
    return M.blockCount(g2);
  };
  M.sameViews = function (g1, g2) {
    return JSON.stringify(M.frontView(g1)) === JSON.stringify(M.frontView(g2))
        && JSON.stringify(M.leftView(g1)) === JSON.stringify(M.leftView(g2))
        && M.topCount(g1) === M.topCount(g2);
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
