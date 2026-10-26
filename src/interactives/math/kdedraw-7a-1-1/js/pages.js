/* pages.js — 1.1 生活中的立体图形：4 页（封面 / 认识立体 / 柱锥对比 / 连线检测） */
(function () {
  "use strict";
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});

  // ———— 参数化 2.5D 立体图形绘制（SVG，手绘印刷风：描边 + 平涂 + 硬投影）————
  function drawSolid(parent, kind, cx, cy, s, label) {
    s = s || 1;
    // HTML 容器需先有 <svg> 根，内部 <g> 才会被渲染
    var root = parent.classList && parent.classList.contains("svg-host") ? parent
      : svg("svg", { viewBox: "0 0 260 240", style: "width:100%;height:100%;overflow:visible" }, parent);
    parent.classList && parent.classList.add("svg-host");
    var g = svg("g", { transform: "translate(" + cx + "," + cy + ") scale(" + s + ")" }, root);
    var ink = "#2B2326", purple = "#6C2166", gold = "#DEAA18", paper = "#FFFDF8";
    function poly(pts, fill, stroke) {
      var el = svg("polygon", { points: pts.map(function (p) { return p.join(","); }).join(" "),
        fill: fill, stroke: stroke || ink, "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
      return el;
    }
    if (kind === "prism4") { // 长方体
      var w = 92, d = 46, hgt = 72;
      poly([[-w, hgt], [0, hgt + d * 0.5], [w, hgt], [w * 0.0, hgt - d * 0.5]], "#E8DCEA");           // 底阴影面
      poly([[-w, 0], [w, 0], [w, hgt], [-w, hgt]], paper);                                             // 正面
      poly([[w, 0], [w + d, -d * 0.5], [w + d, hgt - d * 0.5], [w, hgt]], "#EAD9C8");                  // 右面
      poly([[-w, 0], [0, -d * 0.5], [w + d, -d * 0.5], [w, 0]], gold);                                 // 顶面
    } else if (kind === "cylinder") { // 圆柱
      var rw = 58, hh = 86, ry = 18;
      svg("path", { d: "M " + (-rw) + " 0 A " + rw + " " + ry + " 0 0 0 " + rw + " 0 L " + rw + " " + (-hh) + " A " + rw + " " + ry + " 0 0 1 " + (-rw) + " " + (-hh) + " Z", fill: paper, stroke: ink, "stroke-width": 2.5 }, g);
      svg("ellipse", { cx: 0, cy: -hh, rx: rw, ry: ry, fill: gold, stroke: ink, "stroke-width": 2.5 }, g);
      svg("path", { d: "M " + (-rw) + " 0 A " + rw + " " + ry + " 0 0 0 " + rw + " 0", fill: "none", stroke: ink, "stroke-width": 2.5 }, g);
    } else if (kind === "cone") { // 圆锥
      var rw2 = 56, h2 = 96, ry2 = 17;
      svg("path", { d: "M 0 " + (-h2) + " L " + rw2 + " 0 A " + rw2 + " " + ry2 + " 0 0 1 " + (-rw2) + " 0 Z", fill: paper, stroke: ink, "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
      svg("ellipse", { cx: 0, cy: 0, rx: rw2, ry: ry2, fill: gold, stroke: ink, "stroke-width": 2.5 }, g);
      svg("line", { x1: 0, y1: -h2, x2: -rw2, y2: 0, stroke: ink, "stroke-width": 2.5 }, g);
    } else if (kind === "pyramid") { // 四棱锥
      var a = 78, h3 = 100, dx = 34, dy = 17;
      poly([[0, -h3], [-a, 0], [a, 0]], "#EAD9C8");                                                    // 前面
      poly([[0, -h3], [a, 0], [a + dx, -dy]], gold);                                                   // 右面
      poly([[-a, 0], [a, 0], [a + dx, -dy], [-a + dx, -dy]], paper);                                   // 底（可见部分）
      svg("line", { x1: 0, y1: -h3, x2: -a + dx, y2: -dy, stroke: ink, "stroke-width": 2, "stroke-dasharray": "5 4" }, g);
    } else if (kind === "prism3") { // 三棱柱
      var w4 = 84, h4 = 80, dx4 = 30, dy4 = 15;
      poly([[-w4, 0], [w4, 0], [w4, h4], [-w4, h4]], paper);
      poly([[w4, 0], [w4 + dx4, -dy4], [w4 + dx4, h4 - dy4], [w4, h4]], "#EAD9C8");
      poly([[-w4, 0], [0, -dy4 * 2], [w4 + dx4, -dy4]], gold);
      poly([[-w4, 0], [-w4, h4], [0, h4 - dy4 * 2], [0, -dy4 * 2]], "#E8DCEA");
    } else if (kind === "sphere") { // 球
      svg("circle", { cx: 0, cy: -46, r: 52, fill: paper, stroke: ink, "stroke-width": 2.5 }, g);
      svg("ellipse", { cx: 0, cy: -46, rx: 52, ry: 16, fill: "none", stroke: ink, "stroke-width": 1.6 }, g);
      svg("path", { d: "M -52 -46 A 52 52 0 0 1 52 -46", fill: "none", stroke: purple, "stroke-width": 2 }, g);
      poly([[0, 8], [-46, 8], [46, 8]], "rgba(43,35,38,.12)", "none"); // 投影
    }
    if (label) {
      svg("text", { x: 0, y: 38, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: ink,
        "font-family": "var(--serif)" }, g).textContent = label;
    }
    return g;
  }

  // ============ 第 1 页 封面 ============
  P[1] = { full: true, build: function (ctx) {
    var root = ctx.root;
    var cover = box(root, 0, 0, 1280, 720, { cls: "cover" });
    cover.appendChild(h("h1", { text: "生活中的立体图形" }));
    cover.appendChild(h("p", { cls: "lead", text: "棱柱 · 圆柱 · 棱锥 · 圆锥 · 球 —— 从身边的物体认出立体图形" }));
    var row = box(cover, 220, 300, 840, 220, { cls: "row-c" });
    L.solids.forEach(function (sd, i) {
      var cell = box(row, i * 140, 30, 140, 190, { s: i + 1 });
      drawSolid(cell, sd.kind, 70, 120, 0.72, sd.name);
    });
    cover.appendChild(h("p", { cls: "fig-foot", html: "北师大版七年级上册 · 1.1　<span class='mono'>FIG · 情境引入</span>" }));
    return { steps: 6, step: function () {}, leave: function () {} };
  }};

  // ============ 第 2 页 认识六类立体 ============
  P[2] = { build: function (ctx) {
    var root = ctx.root;
    var steps = 1;
    box(root, 20, 12, 1240, 46, { cls: "strip", html: "任务一：把身边的物体分类——<b>哪些是一家人？</b>拖一拖下面的图形，说出名字" });
    var grid = box(root, 40, 90, 1200, 300);
    L.solids.forEach(function (sd, i) {
      var cell = card(grid, 30 + i * 196, 20, 186, 268, { s: 0 });
      var holder = box(cell, 20, 18, 146, 170);
      drawSolid(holder, sd.kind, 73, 128, 0.86);
      var nm = box(cell, 10, 196, 166, 30, { cls: "c-name", text: sd.cn });
      var lv = box(cell, 10, 228, 166, 34, { cls: "c-live", text: sd.lives[0] + " · " + sd.lives[1] });
      // 点击翻面：显示面数与表面构成
      cell.style.cursor = "pointer";
      var flipped = false;
      cell.addEventListener("click", function () {
        flipped = !flipped;
        nm.textContent = flipped ? "面数 " + sd.faces : sd.cn;
        lv.textContent = flipped ? sd.surface : sd.lives[0] + " · " + sd.lives[1];
        cell.classList.toggle("flip-on", flipped);
      });
    });
    box(root, 20, 430, 1240, 120, { cls: "note-card", s: 0, html:
      "<b>想一想：</b>圆柱和棱柱都是「上下一样粗」，差别在哪？圆锥和棱锥都是「上尖」，差别在哪？<br>" +
      "<span class='mut'>点击卡片翻面看面数——柱有两个底面，锥只有一个；有的侧面是平的（有棱），有的是曲面（无棱）。</span>" });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};

  // ============ 第 3 页 柱与锥对比（欧拉公式） ============
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: "strip", html: "任务二：<b>数一数</b>——顶点 V、棱数 E、面数 F，再算 V−E+F" });
    var rows = [
      ["立方体", 8, 12, 6],
      ["三棱柱", 6, 9, 5],
      ["四棱锥", 5, 8, 5],
    ];
    var tb = box(root, 60, 92, 640, 250, { s: 0 });
    var tbl = K.table(tb, 0, 0, [["图形", "顶点 V", "棱数 E", "面数 F"]].concat(
      rows.map(function (r) { return [r[0], r[1], r[2], r[3]]; })), [180, 150, 150, 150]);
    var res = box(tb, 0, 210, 620, 40, { cls: "strip", html: "V−E+F = 8−12+6 = <b class='c-g'>2</b>，6−9+5 = <b class='c-g'>2</b>，5−8+5 = <b class='c-g'>2</b>" });
    var viewer = box(root, 760, 92, 460, 260, { s: 0, cls: "mini-stage" });
    drawSolid(viewer, "prism4", 200, 190, 1.0, "立方体");
    box(root, 20, 420, 1240, 130, { cls: "note-card", s: 1, html:
      "<b>欧拉公式：</b>简单多面体都满足 <span class='mono big'>V − E + F = 2</span><br>" +
      "<span class='mut'>这是拓扑学的起点——不管怎么捏（不破不粘），这个数不变。试试在计算器里换一个多面体验证。</span>" });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};

  // ============ 第 4 页 连线检测 ============
  P[4] = { build: function (ctx) {
    var root = ctx.root;
    var score = { ok: 0, done: 0 };
    box(root, 20, 12, 1240, 46, { cls: "strip", html: "当堂检测：<b>把物体和它的立体图形连起来</b>（点击左边物体，再点击右边图形）" });
    var pick = null;
    var scoreEl = box(root, 520, 470, 240, 44, { cls: "pill big-score", text: "答对 0 / 6" });
    L.classify.forEach(function (item, i) {
      var obj = card(root, 90, 92 + i * 62, 220, 50, { cls: "c-obj", text: item.obj });
      var tgt = card(root, 900, 92 + i * 62, 260, 50, { cls: "c-tgt", text: L.solids.find(function (s) { return s.name === item.ans; }).cn });
      obj.style.cursor = tgt.style.cursor = "pointer";
      obj.addEventListener("click", function () {
        if (obj.classList.contains("ok")) return;
        document.querySelectorAll(".c-obj.pick").forEach(function (e) { e.classList.remove("pick"); });
        obj.classList.add("pick"); pick = { obj: obj, item: item };
      });
      tgt.addEventListener("click", function () {
        if (!pick || tgt.classList.contains("ok")) return;
        pick.obj.classList.remove("pick");
        score.done++;
        if (pick.item.ans === tgt.textContent) {
          obj.classList.add("ok"); tgt.classList.add("ok"); score.ok++;
        } else {
          obj.classList.add("bad"); tgt.classList.add("bad");
          setTimeout(function () { obj.classList.remove("bad"); tgt.classList.remove("bad"); }, 650);
        }
        pick = null;
        scoreEl.textContent = "答对 " + score.ok + " / " + L.classify.length;
        if (score.done === L.classify.length) {
          scoreEl.textContent = score.ok === L.classify.length ? "全对！立体图形认识了" : "答对 " + score.ok + " / 6，错的重连一下";
        }
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};

  // ============ 第 5 页 演示台（自由拖动浏览六类） ============
  P[5] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: "strip", html: "演示台：<b>点击图形翻面</b>，看面数与表面构成；V 键切换印刷/素面" });
    var grid = box(root, 40, 90, 1200, 470);
    L.solids.forEach(function (sd, i) {
      var col = i % 3, rowI = (i / 3) | 0;
      var cell = card(grid, 60 + col * 390, 30 + rowI * 230, 360, 210, { s: 1 });
      var holder = box(cell, 60, 14, 240, 160);
      drawSolid(holder, sd.kind, 120, 122, 0.94);
      box(cell, 16, 178, 328, 26, { cls: "c-name", text: sd.cn + " · " + sd.faces + " 个面" });
      box(cell, 16, 204, 328, 0);
      cell.style.cursor = "pointer";
      var fl = false;
      cell.addEventListener("click", function () {
        fl = !fl;
        cell.querySelector(".c-name").textContent = fl ? sd.cn + " · " + sd.surface : sd.cn + " · " + sd.faces + " 个面";
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
