(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 10) / 10); };
  M.abs = Math.abs;
  // 两负数比较：|a| 大的反而小
  M.cmpNeg = function (a, b) { return Math.abs(a) > Math.abs(b) ? -1 : Math.abs(a) < Math.abs(b) ? 1 : 0; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
