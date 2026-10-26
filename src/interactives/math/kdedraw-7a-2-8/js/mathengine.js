(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) {
    if (typeof x !== 'number') return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for (var d = 2; d <= 64; d++) { var n = x * d; if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n) + '/' + d; }
    return String(x);
  };
  M.reciprocal = function (a) { if (a === 0) return null; return 1 / a; };
  M.div = function (a, b) { if (b === 0) return null; var r = a / b; return r === 0 ? 0 : r; };  // 归一 -0
  M.signRule = function (a, b) { return b === 0 ? null : (a === 0 ? '0' : (a > 0) === (b > 0) ? '+' : '-'); };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
