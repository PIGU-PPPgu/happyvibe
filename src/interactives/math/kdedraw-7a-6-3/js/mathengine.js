(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 扇形角度：占比 × 360
  M.arc = function (part, total) { return part / total * 360; };
  M.pct = function (part, total) { return Math.round(part / total * 1000) / 10; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
