(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 10) / 10); };
  // 事件序列逐水位
  M.waterLevels = function (start, events) {
    var out = [start], cur = start;
    for (var i = 0; i < events.length; i++) { cur += events[i][0]; out.push(cur); }
    return out;
  };
  // 加减混合 → 统一加法串（['+', 8], ['-', 12] → ['+', 8], ['+', -12]）
  M.unify = function (terms) {
    return terms.map(function (t, i) { return i === 0 ? ['+', t[1]] : [t[0] === '-' ? '+' : t[0], t[0] === '-' ? -t[1] : t[1]]; });
  };
  M.evalTerms = function (unified) { return unified.reduce(function (s, t) { return s + t[1]; }, 0); };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
