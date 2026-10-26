(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 一排 n 个正方形（共用边）火柴数，三种列式法同源
  M.matches = function (n) { return 3 * n + 1; };
  M.matchesB = function (n) { return 4 * n - (n - 1); };
  M.matchesC = function (n) { return n + n + (n + 1); };
  M.maxSquares = function (sticks) { return Math.floor((sticks - 1) / 3); };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
