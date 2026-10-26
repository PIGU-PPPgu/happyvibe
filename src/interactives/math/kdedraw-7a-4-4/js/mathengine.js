(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  M.half = function (a) { return a / 2; };
  M.isComplementary = function (a, b) { return Math.abs(a + b - 90) < 1e-9; };
  M.isSupplementary = function (a, b) { return Math.abs(a + b - 180) < 1e-9; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
