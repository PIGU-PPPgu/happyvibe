/* mathengine.js — 1.1 纯数学/几何函数（node 可测，不碰 DOM） */
(function (global) {
  "use strict";
  var M = {};
  M.fmt = function (x) {
    if (typeof x !== "number") return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    return String(Math.round(x * 100) / 100);
  };
  // 立体图形顶面/正面的 2.5D 投影点（等距斜二测：dx=cos30, dy=sin30 比例简化为 0.5/0.28）
  M.iso = function (x, y, z) {
    // (x, y) 水平面，z 高度；返回屏幕坐标（以原点为基准，x 向右，y 屏幕向下）
    var dx = 0.86, dy = 0.5; // 等距比
    return {
      x: (x - y) * dx,
      y: (x + y) * dy - z,
    };
  };
  // 欧拉公式：顶点数 V − 边数 E + 面数 F = 2（多面体检验）
  M.euler = function (V, E, F) { return V - E + F; };
  // 已知棱柱底面边数 n：面数 = n + 2，顶点数 = 2n，边数 = 3n
  M.prismF = function (n) { return n + 2; };
  M.prismV = function (n) { return 2 * n; };
  M.prismE = function (n) { return 3 * n; };
  // 棱锥：面数 = n + 1，顶点数 = n + 1，边数 = 2n
  M.pyramidF = function (n) { return n + 1; };
  M.pyramidV = function (n) { return n + 1; };
  M.pyramidE = function (n) { return 2 * n; };
  global.MathEngine = M;
})(typeof window !== "undefined" ? window : globalThis);
