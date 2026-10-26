(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 100) / 100); };
  // 度 → 度分秒
  M.toDMS = function (deg) {
    var d = Math.floor(deg), rem = (deg - d) * 60;
    var m = Math.floor(rem), s = Math.round((rem - m) * 60);
    if (s === 60) { s = 0; m++; }
    if (m === 60) { m = 0; d++; }
    return [d, m, s];
  };
  // 度分秒 → 度
  M.toDeg = function (d, m, s) { return d + m / 60 + s / 3600; };
  // 钟面夹角（时针按整点，分针按分钟）：每分钟 6°，时针每分钟 0.5°
  M.clockAngle = function (h, m) { var a = Math.abs(30 * (h % 12) + 0.5 * m - 6 * m); return a > 180 ? 360 - a : a; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
