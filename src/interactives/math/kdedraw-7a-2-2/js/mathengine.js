/* mathengine.js — 2.2 数轴旗舰版（node 可测，不碰 DOM，自包含） */
(function (global) {
  "use strict";
  var M = {};
  M.fmt = function (x) {
    if (typeof x !== "number") return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    return String(Math.round(x * 10) / 10);
  };
  // 动点：位置 = 起点 + 速度 × 时间
  M.pos = function (start, speed, t) { return start + speed * t; };
  // 距原点（绝对值的雏形）
  M.dist = function (v) { return Math.abs(v); };
  // 数值 → 跑道屏幕坐标：W 宽画布，range 半程（像素边距 pad）
  M.toX = function (v, range, W, pad) {
    pad = pad || 70;
    return pad + (v + range) / (2 * range) * (W - 2 * pad);
  };
  M.fromX = function (sx, range, W, pad) {
    pad = pad || 70;
    var v = (sx - pad) / (W - 2 * pad) * 2 * range - range;
    return Math.round(v * 2) / 2;   // 半格吸附
  };
  // 输入判定：允许 +4 / 4；-3,-2 三种分隔
  M.checkInput = function (input, ans, alt) {
    var norm = String(input).trim().replace(/\s+/g, "").replace(/[＋＋]/g, "+").replace(/[、，,]/g, ",").replace(/^\+/, "");
    var want = [ans].concat(alt || []).map(function (a) { return String(a).replace(/\s+/g, "").replace(/[、，,]/g, ",").replace(/^\+/, ""); });
    return want.indexOf(norm) >= 0;
  };
  // 大小比较
  M.cmp = function (a, b) { return a > b ? ">" : a < b ? "<" : "="; };
  global.MathEngine = M;
})(typeof window !== "undefined" ? window : globalThis);
