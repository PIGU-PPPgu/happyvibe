(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 合并同类项：terms = [{c, e}]（e 为字母串键），同键系数相加
  M.combine = function (terms) {
    var map = {};
    terms.forEach(function (t) { var k = t.e || '_'; map[k] = (map[k] || 0) + t.c; });
    return Object.keys(map).map(function (k) { return { c: map[k], e: k === '_' ? '' : k }; });
  };
  // 去括号：sign = +1/-1 乘入每一项
  M.distribute = function (terms, sign) { return terms.map(function (t) { return { c: t.c * sign, e: t.e }; }); };
  M.termsStr = function (terms) {
    return terms.map(function (t, i) {
      if (t.c === 0) return '';
      var s = (i === 0 ? (t.c < 0 ? '-' : '') : (t.c < 0 ? ' - ' : ' + ')) + (Math.abs(t.c) === 1 && t.e ? (t.c < 0 ? '' : '') : '') + (Math.abs(t.c) === 1 ? '' : Math.abs(t.c)) + t.e;
      return s || String(t.c);
    }).filter(Boolean).join(' ').replace(/^\+ /, '');
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
