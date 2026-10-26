(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 解 ax + b = c（移项合并系数化一）
  M.solveLinear = function (a, b, c) { return (c - b) / a; };
  // 分步：[{label, expr}]
  M.steps = function (a, b, c) {
    var f = M.fmt;
    return [
      { label: '移项（过等号变号）', expr: f(a) + 'x = ' + f(c) + (b >= 0 ? ' - ' : ' + ') + f(Math.abs(b)) },
      { label: '合并', expr: f(a) + 'x = ' + f(c - b) },
      { label: '系数化 1（两边除以 ' + f(a) + '）', expr: 'x = ' + f((c - b) / a) },
    ];
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
