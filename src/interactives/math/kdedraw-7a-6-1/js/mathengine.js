(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 简单随机抽样：从 [1..N] 抽 n 个（返回索引数组）
  M.sample = function (N, n, seed) {
    var s = seed || 42, rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
    var pool = [], out = [];
    for (var i = 0; i < N; i++) pool.push(i);
    for (var k = 0; k < n && pool.length; k++) {
      var idx = Math.floor(rnd() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
