(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 线性方程 ax + b = c 检验
  M.check = function (a, b, c, x) { return a * x + b === c; };
  // 天平读数：左盘总重
  M.left = function (boxes, balls) { return boxes * balls; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
