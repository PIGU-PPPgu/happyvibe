(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 位置 = 速度 × 时间（速度带方向，时间可倒放为负）
  M.pos = function (v, t) { return v * t; };
  // 符号法则：sign(a*b)
  M.signRule = function (a, b) { return (a > 0) === (b > 0) && a !== 0 && b !== 0 ? '+' : a === 0 || b === 0 ? '0' : '-'; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
