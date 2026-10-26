(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // n 点两两连线：线段数 = n(n-1)/2
  M.segments = function (n) { return n * (n - 1) / 2; };
  // 平面 n 条直线两两相交的最大交点数 = n(n-1)/2
  M.maxIntersections = M.segments;
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
