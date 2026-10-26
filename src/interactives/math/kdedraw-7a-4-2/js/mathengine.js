(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  M.mid = function (a, b) { return (a + b) / 2; };
  M.cmp = function (a, b) { return a > b ? 'AB > CD' : a < b ? 'AB < CD' : 'AB = CD'; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
