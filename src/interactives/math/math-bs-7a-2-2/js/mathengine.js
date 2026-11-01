/* mathengine.js — 2.2 数轴 v2（node 可测，不碰 DOM，自包含）
   归一化 normalize() 是全件唯一实现（library-v2-spec §3.3 封闭映射表），
   checkInput = 归一化后与 accepts 数组任一项全等。 */
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
  // 归一化：删空白 → 全角逐对转半角（封闭映射表）→ 删前导 +（在转半角之后）
  var HALF = { "０": "0", "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9", "＋": "+", "－": "-", "−": "-", "，": ",", "、": ",", "：": ":" };
  M.normalize = function (s) {
    return String(s)
      .replace(/\s+/g, "")
      .replace(/[０-９＋－−，、：]/g, function (c) { return HALF[c]; })
      .replace(/^\+/, "");
  };
  // 输入判定：accepts 数组（或单个串）逐项归一化后全等比较
  M.checkInput = function (input, accepts) {
    if (accepts != null && !Array.isArray(accepts)) accepts = [accepts];
    var norm = M.normalize(input);
    return (accepts || []).some(function (a) { return M.normalize(a) === norm; });
  };
  // 大小比较
  M.cmp = function (a, b) { return a > b ? ">" : a < b ? "<" : "="; };
  global.MathEngine = M;
})(typeof window !== "undefined" ? window : globalThis);
