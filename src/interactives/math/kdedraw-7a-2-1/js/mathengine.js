(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) {
    if (typeof x !== 'number') return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var fr = M.toFrac(x); return fr ? fr[0] + '/' + fr[1] : String(Math.round(x * 100) / 100);
  };
  M.toFrac = function (x, dmax) {
    dmax = dmax || 64;
    for (var d = 2; d <= dmax; d++) { var n = x * d; if (Math.abs(n - Math.round(n)) < 1e-9) return [Math.round(n), d]; }
    return null;
  };
  // 有理数分类：返回 ['int+','int-','frac+','frac-','zero'] 之一
  M.classify = function (x) {
    if (x === 0) return 'zero';
    var isInt = Math.abs(x - Math.round(x)) < 1e-9;
    if (x > 0) return isInt ? 'int+' : 'frac+';
    return isInt ? 'int-' : 'frac-';
  };
  M.classifyName = { 'int+': '正整数', 'int-': '负整数', 'frac+': '正分数', 'frac-': '负分数', zero: '零' };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
