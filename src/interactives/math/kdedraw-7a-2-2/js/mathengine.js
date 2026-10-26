(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 10) / 10); };
  // 数轴坐标换算：数值 → 屏幕 x（range 半宽）
  M.toX = function (v, range, W) { return W / 2 + v / range * (W / 2 - 70); };
  M.fromX = function (sx, range, W) { var t = (sx - W / 2) / (W / 2 - 70) * range; return Math.round(t * 2) / 2; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
