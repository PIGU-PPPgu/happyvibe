(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 单项式次数：字母指数和（教学数据自洽检验：给定 c,d 与表达式存在性一致由 data 保证）
  M.termDeg = function (e) {
    var m = e.replace(/π/g, '').replace(/[\d+\-\.]/g, '').length;
    var expSum = 0;
    var re = /([a-z])\^(\d)/gi;
    var found = false, mm;
    while ((mm = re.exec(e))) { expSum += +mm[2]; found = true; }
    var letters = e.replace(/[^a-z]/gi, '').replace(/π/g, '').length;
    return expSum + (found ? 0 : letters);
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
