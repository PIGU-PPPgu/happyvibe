(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 划记串：每 5 个一个正字
  M.tally = function (n) { return '正'.repeat(Math.floor(n / 5)) + (n % 5 ? ['一','二','三','四'][n % 5 - 1] : ''); };
  M.freq = function (cnt, total) { return Math.round(cnt / total * 100) / 100; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
