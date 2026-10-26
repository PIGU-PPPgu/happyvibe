(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(x); };
  // 相遇：t = D/(v1+v2)；追及：t = D/(v1-v2)
  M.meetT = function (D, v1, v2) { return D / (v1 + v2); };
  M.catchT = function (D, vFast, vSlow) { return D / (vFast - vSlow); };
  M.pos = function (v, t) { return v * t; };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
