/* engine.js — 地图的阅读学科引擎（node 可测，不碰 DOM，自包含）
   换算铁律：实地距离(厘米) = 图上距离(厘米) × 比例尺分母；换米除以 100。
   归一化与输入判定按库规范实现：删空白 → 全角逐对转半角 → 删前导 +。 */
(function (global) {
  "use strict";
  var M = {};
  M.fmt = function (x) {
    if (typeof x !== "number") return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    return String(Math.round(x * 10) / 10);
  };

  /* ---- 输入归一化（封闭映射表，逐对列出） ---- */
  var HALF = {
    "０": "0", "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
    "＋": "+", "－": "-", "−": "-", "，": ",", "、": ",", "：": ":",
  };
  M.normalize = function (s) {
    var out = String(s == null ? "" : s).replace(/\s+/g, "");
    for (var k in HALF) if (HALF.hasOwnProperty(k)) out = out.split(k).join(HALF[k]);
    if (out.charAt(0) === "+") out = out.slice(1);   // 删前导 + 在转半角之后
    return out;
  };
  /* 输入判定：与 accepts 任一项（同样归一化后）全等 */
  M.checkInput = function (input, accepts) {
    var norm = M.normalize(input);
    return (accepts || []).some(function (a) { return M.normalize(a) === norm; }) && norm !== "";
  };

  /* ---- 比例尺换算（单位：图上厘米 → 实地） ---- */
  M.groundCm = function (mapCm, denom) { return mapCm * denom; };          // 实地厘米
  M.groundM = function (mapCm, denom) { return mapCm * denom / 100; };     // 实地米
  M.mapCm = function (groundM, denom) { return groundM * 100 / denom; };   // 实地米 → 图上厘米（逆推）

  /* ---- 格网：主图 700×520，5 列(A–E)×4 行(1–4)，先列字母后行数字 ---- */
  var COLS = "ABCDE";
  M.toCell = function (px, py, grid) {
    grid = grid || { cols: 5, rows: 4, w: 700, h: 520 };
    var cw = grid.w / grid.cols, ch = grid.h / grid.rows;
    var col = Math.max(0, Math.min(grid.cols - 1, Math.floor(px / cw)));
    var row = Math.max(0, Math.min(grid.rows - 1, Math.floor(py / ch)));
    return { col: col, row: row, name: COLS[col] + (row + 1) };
  };
  M.fromCell = function (name, grid) {   // 格名 → 格中心像素
    grid = grid || { cols: 5, rows: 4, w: 700, h: 520 };
    var cw = grid.w / grid.cols, ch = grid.h / grid.rows;
    var col = COLS.indexOf(String(name).charAt(0).toUpperCase());
    var row = parseInt(String(name).charAt(1), 10) - 1;
    if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
    return { x: col * cw + cw / 2, y: row * ch + ch / 2, name: COLS[col] + (row + 1) };
  };
  M.cellRect = function (name, grid) {   // 格名 → 左上角与宽高（高亮框用）
    grid = grid || { cols: 5, rows: 4, w: 700, h: 520 };
    var c = M.fromCell(name, grid);
    if (!c) return null;
    var cw = grid.w / grid.cols, ch = grid.h / grid.rows;
    return { x: c.x - cw / 2, y: c.y - ch / 2, w: cw, h: ch };
  };

  /* ---- 方位：北＝0°，顺时针（东＝90°） ---- */
  M.bearing = function (x1, y1, x2, y2) {   // 屏幕坐标（y 向下）→ 地理方位角
    var deg = Math.atan2(x2 - x1, y1 - y2) * 180 / Math.PI;
    return (deg + 360) % 360;
  };
  var AZ = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  M.azWord = function (deg) {               // 八方位词（22.5° 分界，四舍五入归档）
    var d = ((deg % 360) + 360) % 360;
    return AZ[Math.round(d / 45) % 8];
  };
  M.relAz = function (bearingDeg, headingDeg) {   // 指向标转 heading 后的读数方位
    return ((bearingDeg - headingDeg) % 360 + 360) % 360;
  };

  global.MapEngine = M;
})(typeof window !== "undefined" ? window : globalThis);
