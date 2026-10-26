(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 性质1：两边同加减 c；性质2：两边同乘除 c（c≠0）
  M.apply1 = function (eq, c) { return { l: eq.l + c, r: eq.r + c }; };
  M.apply2 = function (eq, c) { if (c === 0) return null; return { l: eq.l * c, r: eq.r * c }; };
  M.balanced = function (eq) { return Math.abs(eq.l - eq.r) < 1e-9; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
