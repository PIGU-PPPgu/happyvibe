/* pages.js — 地图的阅读 · 校园寻宝：10 页一个问题世界
   核心资产：campus——手绘校园平面图引擎（航拍照 / 描边 / 符号三态 + 格网 + 三要素层 +
   藏宝点 + 小人 + 可拖指向标），同一套几何数据驱动所有页。 */
(function () {
  "use strict";
  var L = window.LESSON, M = window.MapEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  var INK = "#2B2326", PAPER = "#FFFDF8", PURPLE = "#6C2166", GOLD = "#DEAA18", GREEN = "#1E7F4F", RED = "#C0392B", MUT = "#7C7068";
  var COLS = "ABCDE";

  /* ═════════ 校园地图引擎 ═════════
     o: { x, y, w, h, phase: photo|outline|symbol, grid, scaleBar, compass, legend,
          treasure: ?闪烁问号, treasureLit: 点亮星标, clubLabel, you: 格名, cross: 格名,
          heading: 指向标角度, link: [格名,格名] 量测线, onHeading, onTreasure, onMapClick }
     返回 { el, setHeading, setYou, hit } */
  function campus(root, o) {
    o = o || {};
    var G = L.map.geo, GR = L.map.grid, CP = L.map.compass;
    var W = o.w || 700, H = o.h || 520, sc = W / 700;
    var holder = box(root, o.x != null ? o.x : 40, o.y != null ? o.y : 150, W, H, { cls: "campus" });
    var el = svg("svg", { viewBox: "0 0 700 520", width: W, height: H }, holder);
    var base = svg("g", {}, el), blocks = svg("g", {}, el), roadL = svg("g", {}, el),
        gridL = svg("g", {}, el), feats = svg("g", {}, el), actors = svg("g", {}, el), fx = svg("g", {}, el);
    var phase = o.phase || "symbol";
    var photo = phase === "photo", outline = phase === "outline";
    var stroke = outline || !photo;

    /* --- 地面 --- */
    svg("rect", { x: 0, y: 0, width: 700, height: 520, rx: 10,
      fill: photo ? "#B6CE9E" : outline ? "#CFE0BC" : "#FFFDF8",
      stroke: stroke ? INK : "none", "stroke-width": 2 }, base);
    if (photo || outline) {   // 航拍态的树木点缀（固定位置，手绘感）
      [[92, 180], [330, 96], [378, 470], [70, 300], [540, 480], [350, 210], [120, 130], [620, 150]].forEach(function (p) {
        svg("circle", { cx: p[0], cy: p[1], r: 17, fill: "#96BC7C", stroke: outline ? INK : "none", "stroke-width": 1.4, opacity: photo ? 1 : .5 }, base);
      });
    }

    /* --- 道路（校门 → 楼前） --- */
    var roadPath = "M150 505 L150 448 L540 448 L540 206";
    svg("path", { d: roadPath, fill: "none", stroke: photo ? "#CBBFA5" : "#EAE3D2", "stroke-width": 20, "stroke-linecap": "round", "stroke-linejoin": "round" }, roadL);
    if (stroke) svg("path", { d: roadPath, fill: "none", stroke: INK, "stroke-width": 1.4, "stroke-dasharray": "1 0", opacity: .55 }, roadL);

    /* --- 地物 --- */
    function drawBlocks() {
      while (blocks.firstChild) blocks.removeChild(blocks.firstChild);
      var op = photo ? 1 : outline ? .42 : 1;
      // 操场
      svg("ellipse", { cx: G.field.cx, cy: G.field.cy, rx: G.field.rx, ry: G.field.ry,
        fill: photo ? "#CE8F79" : outline ? "#F0DCCF" : "#F3ECDD", stroke: stroke ? INK : "none", "stroke-width": 2.4, opacity: op }, blocks);
      if (photo) svg("ellipse", { cx: G.field.cx, cy: G.field.cy, rx: G.field.rx - 26, ry: G.field.ry - 22, fill: "#A9C98F" }, blocks);
      else svg("ellipse", { cx: G.field.cx, cy: G.field.cy, rx: G.field.rx - 26, ry: G.field.ry - 22, fill: "none", stroke: INK, "stroke-width": 1, "stroke-dasharray": "4 5", opacity: .7 }, blocks);
      // 教学楼 / 实验楼
      [["teach", "教学楼"], ["lab", "实验楼"]].forEach(function (bd) {
        var b = G[bd[0]];
        svg("rect", { x: b.x, y: b.y, width: b.w, height: b.h,
          fill: photo ? "#9B95A3" : outline ? "#E4E0E8" : "#FFFFFF", stroke: stroke ? INK : "none", "stroke-width": 2.2, opacity: op }, blocks);
        if (!photo) {   // 窗格线
          var nx = bd[0] === "teach" ? 4 : 3;
          for (var i = 1; i < nx; i++) svg("line", { x1: b.x + b.w / nx * i, y1: b.y + 4, x2: b.x + b.w / nx * i, y2: b.y + b.h - 4, stroke: INK, "stroke-width": .8, opacity: .35 }, blocks);
          for (var j = 1; j < 2; j++) svg("line", { x1: b.x + 4, y1: b.y + b.h / 2 * j, x2: b.x + b.w - 4, y2: b.y + b.h / 2 * j, stroke: INK, "stroke-width": .8, opacity: .35 }, blocks);
        }
        if (phase === "symbol") {
          var t = svg("text", { x: b.x + b.w / 2, y: b.y + b.h / 2 + 6, "class": "lab", "font-size": 19, "font-weight": 700, fill: INK }, blocks);
          t.textContent = bd[1];
        }
      });
      // 花园
      svg("circle", { cx: G.garden.cx, cy: G.garden.cy, r: G.garden.r,
        fill: photo ? "#8FB778" : outline ? "#DDE8D0" : "#FFFFFF", stroke: stroke ? INK : "none", "stroke-width": 2, opacity: op }, blocks);
      [[-16, -8], [12, -14], [2, 12]].forEach(function (d) {
        svg("circle", { cx: G.garden.cx + d[0], cy: G.garden.cy + d[1], r: 5, fill: photo ? "#E7B9C4" : GOLD, stroke: photo ? "none" : INK, "stroke-width": 1 }, blocks);
      });
      // 社团活动室（小屋）
      var c = G.club, roofY = c.y - 14;
      svg("path", { d: "M" + (c.x - 6) + " " + c.y + " L" + (c.x - 6) + " " + roofY + " L" + (c.x + c.w / 2) + " " + (roofY - 22) + " L" + (c.x + c.w + 6) + " " + roofY + " L" + (c.x + c.w + 6) + " " + (c.y + c.h) + " L" + (c.x - 6) + " " + (c.y + c.h) + " Z",
        fill: photo ? "#B3A08E" : outline ? "#EFE6D9" : "#FFFFFF", stroke: stroke ? INK : "none", "stroke-width": 2, "stroke-linejoin": "round", opacity: op }, blocks);
      if (phase === "symbol" && o.clubLabel) {
        var tc = svg("text", { x: c.x + c.w / 2, y: c.y + c.h + 20, "class": "lab", "font-size": 15, "font-weight": 700, fill: PURPLE }, blocks);
        tc.textContent = o.clubLabel;
      }
      // 校门
      svg("rect", { x: G.gate.x - 16, y: G.gate.y - 10, width: 8, height: 22, fill: photo ? "#7C7068" : INK }, blocks);
      svg("rect", { x: G.gate.x + 8, y: G.gate.y - 10, width: 8, height: 22, fill: photo ? "#7C7068" : INK }, blocks);
      if (!photo) {
        svg("path", { d: "M" + (G.gate.x - 18) + " " + (G.gate.y - 12) + " Q" + G.gate.x + " " + (G.gate.y - 34) + " " + (G.gate.x + 18) + " " + (G.gate.y - 12), fill: "none", stroke: INK, "stroke-width": 1.6 }, blocks);
        var tg = svg("text", { x: G.gate.x, y: G.gate.y + 24, "class": "lab", "font-size": 14 }, blocks);
        tg.textContent = "校门";
      }
    }
    drawBlocks();

    /* --- 格网 --- */
    function drawGrid() {
      while (gridL.firstChild) gridL.removeChild(gridL.firstChild);
      if (!o.grid) return;
      var cw = GR.w / GR.cols, ch = GR.h / GR.rows;
      for (var i = 1; i < GR.cols; i++) svg("line", { x1: cw * i, y1: 0, x2: cw * i, y2: 520, stroke: PURPLE, "stroke-width": 1, "stroke-dasharray": "3 6", opacity: .5 }, gridL);
      for (var j = 1; j < GR.rows; j++) svg("line", { x1: 0, y1: ch * j, x2: 700, y2: ch * j, stroke: PURPLE, "stroke-dasharray": "3 6", "stroke-width": 1, opacity: .5 }, gridL);
      for (var ci = 0; ci < GR.cols; ci++) {
        var t = svg("text", { x: cw * ci + cw / 2, y: 14, "class": "lab", "font-size": 13, fill: PURPLE, "font-weight": 700 }, gridL);
        t.textContent = COLS[ci];
      }
      for (var rj = 0; rj < GR.rows; rj++) {
        var t2 = svg("text", { x: 8, y: ch * rj + ch / 2 + 5, "class": "lab", "font-size": 13, fill: PURPLE, "font-weight": 700, "text-anchor": "start" }, gridL);
        t2.textContent = String(rj + 1);
      }
      if (o.cross) {
        var rc = M.cellRect(o.cross, GR);
        if (rc) svg("rect", { x: rc.x, y: rc.y, width: rc.w, height: rc.h, fill: "rgba(222,170,24,.22)", stroke: GOLD, "stroke-width": 2.4, rx: 6 }, gridL);
      }
    }
    drawGrid();

    /* --- 三要素层 --- */
    var heading = o.heading || 0, compassG = null, northG = null;
    function drawFeats() {
      while (feats.firstChild) feats.removeChild(feats.firstChild);
      if (o.scaleBar) {   // 比例尺条：图上 2 厘米 ＝ 实地 100 米
        var bx = L.map.bar.x, by = L.map.bar.y, seg = 50;   // 50px ＝ 1 厘米
        svg("rect", { x: bx, y: by - 5, width: seg, height: 10, fill: INK }, feats);
        svg("rect", { x: bx + seg, y: by - 5, width: seg, height: 10, fill: "#FFFFFF", stroke: INK, "stroke-width": 1.6 }, feats);
        [0, 1, 2].forEach(function (k) {
          var t = svg("text", { x: bx + seg * k, y: by + 22, "class": "lab", "font-size": 13 }, feats);
          t.textContent = k === 2 ? "100 米" : String(k * 50);
          if (k === 2) t.setAttribute("x", bx + seg * 2 - 4);
        });
        var cap = svg("text", { x: bx + seg, y: by - 16, "class": "lab", "font-size": 15, "font-weight": 700, fill: PURPLE }, feats);
        cap.textContent = "比例尺 " + L.map.scale.label;
      }
      if (o.legend) {
        var lg = L.map.legend, items = [["操场", "field"], ["教学楼", "teach"], ["花园", "garden"], ["活动室", "club"]];
        svg("rect", { x: lg.x, y: lg.y, width: lg.w, height: lg.h, rx: 10, fill: "#FFFFFF", stroke: INK, "stroke-width": 2, opacity: .96 }, feats);
        var lt = svg("text", { x: lg.x + 12, y: lg.y + 26, "class": "lab", "font-size": 15, "font-weight": 700, "text-anchor": "start", fill: PURPLE }, feats);
        lt.textContent = "图例";
        items.forEach(function (it, i) {
          var yy = lg.y + 50 + i * 22;
          if (it[1] === "field") svg("ellipse", { cx: lg.x + 24, cy: yy - 4, rx: 14, ry: 7, fill: "#F3ECDD", stroke: INK, "stroke-width": 1.6 }, feats);
          if (it[1] === "teach") svg("rect", { x: lg.x + 14, y: yy - 11, width: 20, height: 14, fill: "#FFFFFF", stroke: INK, "stroke-width": 1.6 }, feats);
          if (it[1] === "garden") svg("circle", { cx: lg.x + 24, cy: yy - 4, r: 8, fill: "#FFFFFF", stroke: INK, "stroke-width": 1.6 }, feats);
          if (it[1] === "club") svg("path", { d: "M" + (lg.x + 15) + " " + yy + " L" + (lg.x + 15) + " " + (yy - 6) + " L" + (lg.x + 24) + " " + (yy - 14) + " L" + (lg.x + 33) + " " + (yy - 6) + " L" + (lg.x + 33) + " " + yy + " Z", fill: "#FFFFFF", stroke: INK, "stroke-width": 1.6 }, feats);
          var t = svg("text", { x: lg.x + 48, y: yy, "class": "lab", "font-size": 14, "text-anchor": "start" }, feats);
          t.textContent = it[0];
        });
      }
      if (o.compass) {
        compassG = svg("g", { "class": "compass" }, feats);
        svg("circle", { cx: CP.cx, cy: CP.cy, r: CP.r, fill: "#FFFFFF", stroke: INK, "stroke-width": 2 }, compassG);
        svg("circle", { cx: CP.cx, cy: CP.cy, r: CP.r - 7, fill: "none", stroke: INK, "stroke-width": .8, opacity: .4, "stroke-dasharray": "3 4" }, compassG);
        northG = svg("g", {}, compassG);
        svg("path", { d: "M" + CP.cx + " " + (CP.cy - CP.r + 12) + " L" + (CP.cx - 7) + " " + (CP.cy + 6) + " L" + CP.cx + " " + (CP.cy + 1) + " L" + (CP.cx + 7) + " " + (CP.cy + 6) + " Z", fill: RED, stroke: INK, "stroke-width": 1.4 }, northG);
        var nt = svg("text", { x: CP.cx, y: CP.cy - CP.r - 6, "class": "lab", "font-size": 15, "font-weight": 700, fill: RED }, northG);
        nt.textContent = "北";
        northG.setAttribute("transform", "rotate(" + heading + " " + CP.cx + " " + CP.cy + ")");
      }
      if (phase !== "symbol" && !o.noPhotoTag) {   // 航拍照片角标
        var tag = svg("text", { x: 16, y: 508, "class": "lab", "font-size": 15, fill: "#FFFFFF", "font-weight": 700, "text-anchor": "start" }, feats);
        tag.textContent = photo ? "航拍照片（从正上方看）" : outline ? "描边：只留轮廓" : "";
      }
    }
    drawFeats();

    /* --- 角色：藏宝点 / 小人 --- */
    var treasureG = null;
    function drawActors() {
      while (actors.firstChild) actors.removeChild(actors.firstChild);
      var cc = G.club, cx0 = cc.x + cc.w / 2, cy0 = cc.y + cc.h / 2;
      if (o.treasure || o.treasureLit) {
        treasureG = svg("g", { "class": o.treasure ? "pulse" : "pop" }, actors);
        if (o.treasure) {
          var q = svg("text", { x: cx0, y: cy0 + 14, "font-size": 40, "font-weight": 700, fill: RED, "text-anchor": "middle", "class": "lab" }, treasureG);
          q.textContent = "?";
        } else {
          svg("circle", { cx: cx0, cy: cy0, r: 30, fill: "none", stroke: GOLD, "stroke-width": 3, opacity: .8 }, treasureG);
          svg("path", { d: star(cx0, cy0 - 2, 15, 6.5), fill: GOLD, stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, treasureG);
          var lb = svg("text", { x: cx0, y: cy0 + 40, "class": "lab", "font-size": 15, "font-weight": 700, fill: PURPLE }, treasureG);
          lb.textContent = "社团活动室";
        }
        if (o.onTreasure) {
          var hitC = svg("circle", { cx: cx0, cy: cy0, r: 34, fill: "transparent", "class": "tappable" }, treasureG);
          hitC.addEventListener("pointerdown", function (e) { e.stopPropagation(); o.onTreasure(); });
        }
      }
      if (o.you) {
        var yc = M.fromCell(o.you, GR);
        if (yc) {
          svg("ellipse", { cx: yc.x + 2, cy: yc.y + 16, rx: 12, ry: 4, fill: "rgba(43,35,38,.22)" }, actors);
          svg("circle", { cx: yc.x, cy: yc.y - 8, r: 8, fill: "#F2C9A0", stroke: INK, "stroke-width": 1.8 }, actors);   // 头
          svg("path", { d: "M" + yc.x + " " + (yc.y) + " L" + yc.x + " " + (yc.y + 10), stroke: INK, "stroke-width": 3, "stroke-linecap": "round", fill: "none" }, actors);   // 身
          svg("path", { d: "M" + (yc.x - 8) + " " + (yc.y + 4) + " L" + yc.x + " " + (yc.y + 1) + " L" + (yc.x + 8) + " " + (yc.y + 4), stroke: INK, "stroke-width": 2.6, "stroke-linecap": "round", fill: "none" }, actors);   // 臂
          var yt = svg("text", { x: yc.x, y: yc.y - 22, "class": "lab", "font-size": 15, "font-weight": 700, fill: GREEN }, actors);
          yt.textContent = "你 · " + o.you;
        }
      }
    }
    drawActors();

    /* --- 量测线（方位探究） --- */
    if (o.link) {
      var a = M.fromCell(o.link[0], GR) || cellCenterOf(o.link[0]), b = cellCenterOf(o.link[1]);
      svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: RED, "stroke-width": 3, "stroke-dasharray": "8 6" }, fx);
      svg("circle", { cx: a.x, cy: a.y, r: 6, fill: RED, stroke: INK, "stroke-width": 1.6 }, fx);
      svg("circle", { cx: b.x, cy: b.y, r: 6, fill: RED, stroke: INK, "stroke-width": 1.6 }, fx);
    }

    function cellCenterOf(key) {   // 地标名 → 中心（操场/教学楼等，比格心更准）
      var map = { 操场: [G.field.cx, G.field.cy], 教学楼: [G.teach.x + G.teach.w / 2, G.teach.y + G.teach.h / 2], 活动室: [G.club.x + G.club.w / 2, G.club.y + G.club.h / 2], 校门: [G.gate.x, G.gate.y], 实验楼: [G.lab.x + G.lab.w / 2, G.lab.y + G.lab.h / 2], 花园: [G.garden.cx, G.garden.cy] };
      var p = map[key]; return p ? { x: p[0], y: p[1] } : { x: 350, y: 260 };
    }

    /* --- 指向标拖拽 --- */
    function setHeading(deg) {
      heading = ((deg % 360) + 360) % 360;
      if (northG) northG.setAttribute("transform", "rotate(" + heading + " " + CP.cx + " " + CP.cy + ")");
      return heading;
    }
    if (o.compass && o.onHeading) {
      var dragging = false;
      var ang = function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width * 700, py = (e.clientY - r.top) / r.height * 520;
        return M.bearing(CP.cx, CP.cy, px, py);
      };
      compassG.addEventListener("pointerdown", function (e) { dragging = true; compassG.setPointerCapture(e.pointerId); o.onHeading(ang(e)); e.stopPropagation(); });
      compassG.addEventListener("pointermove", function (e) { if (dragging) o.onHeading(ang(e)); });
      compassG.addEventListener("pointerup", function () { dragging = false; });
    }

    var api = {
      el: el, holder: holder,
      setHeading: setHeading,
      setYou: function (name) { o.you = name; o.cross = name; drawGrid(); drawActors(); },
      setTreasure: function (litOn) { o.treasure = !litOn; o.treasureLit = !!litOn; drawActors(); },
      hit: function (e) {
        var r = el.getBoundingClientRect();
        return { px: (e.clientX - r.left) / r.width * 700, py: (e.clientY - r.top) / r.height * 520 };
      },
    };
    if (o.onMapClick) holder.addEventListener("click", function (e) {
      var p = api.hit(e); o.onMapClick(M.toCell(p.px, p.py, GR));
    });
    return api;
  }
  function star(cx, cy, R, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rad = (i * 36 - 90) * Math.PI / 180, rr = i % 2 === 0 ? R : r;
      pts.push((cx + rr * Math.cos(rad)).toFixed(1) + "," + (cy + rr * Math.sin(rad)).toFixed(1));
    }
    return "M" + pts.join(" L") + " Z";
  }

  function strip(root, text) { box(root, 20, 12, 1240, 46, { cls: "strip", html: text }); }
  function sidecard(root, html, y, hh) { return box(root, 810, y != null ? y : 150, 430, hh != null ? hh : 500, { cls: "note-card", html: html }); }
  function nextBtn(root, text, cb, y) {
    var b = box(root, 810, y != null ? y : 600, 200, 54, { cls: "tool", text: text });
    b.addEventListener("click", cb);
    return b;
  }

  /* ═════════ 第1页 封面：校园寻宝（小满在路上，点亮藏宝点，纸片可拖） ═════════ */
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: "cover" });
    cover.appendChild(h("h1", { text: "地图的阅读" }));
    cover.appendChild(h("div", { cls: "gold-line" }));
    cover.appendChild(h("p", { cls: "sub", text: "校园寻宝 · 一个问题世界" }));
    cover.appendChild(h("p", { cls: "lead", html: L.hero.name + "转来的第一周，在教学楼后的<br>车棚上捡到一张纸——学长留下的<br><b>校园寻宝图</b>，图上标着社团活动室。<br><br>她照着图在校园里转了十分钟，<br>还是没找到。<br><br><b>图在手，为什么还是找不到？</b>" }));
    // 寻宝图纸片（大图占右侧，可拖微旋）
    var scrap = box(cover, 520, 96, 720, 540, { cls: "scrap" });
    scrap.appendChild(h("div", { cls: "scrap-h", text: "校园寻宝图 · 学长手绘" }));
    var lit = false, cm = null;
    function reveal() {
      if (lit) return;
      lit = true;
      cm.setTreasure(true);   // 切换星标，不重建地图（走路与拖动不受影响）
      box(cover, 90, 612, 1120, 62, { cls: "cover-tip", s: 1, html: "藏宝点亮了：社团活动室在东南角。可它离校门多远？朝哪个方向走？图上一个字都没写。" });
    }
    cm = campus(scrap, { x: 32, y: 40, w: 650, h: 483, phase: "symbol", treasure: true, noPhotoTag: true, onTreasure: reveal });
    // —— 小满沿校门主路往返走（首屏即见主角运动） ——
    var WAY = [[150, 505], [150, 448], [540, 448], [540, 230]];   // 校门 → 路口 → 教学楼门口
    var SEGS = [], LEN = 0;
    for (var i = 0; i < WAY.length - 1; i++) {
      var dx = WAY[i + 1][0] - WAY[i][0], dy = WAY[i + 1][1] - WAY[i][1], l = Math.sqrt(dx * dx + dy * dy);
      SEGS.push({ a: WAY[i], dx: dx / l, dy: dy / l, l: l, s0: LEN }); LEN += l;
    }
    var hero = svg("g", {}, cm.el);
    var nameT = svg("text", { y: -46, "text-anchor": "middle", "class": "lab", "font-size": 15, "font-weight": 700, fill: "#F3D27A" }, hero);
    nameT.textContent = "小满";
    var legs = [svg("line", { y1: -16, y2: 0, stroke: INK, "stroke-width": 3.4, "stroke-linecap": "round" }, hero),
                svg("line", { y1: -16, y2: 0, stroke: INK, "stroke-width": 3.4, "stroke-linecap": "round" }, hero)];
    var body = svg("ellipse", { cy: -26, rx: 10, ry: 13, fill: "#C98BB8", stroke: INK, "stroke-width": 2 }, hero);
    var head = svg("circle", { cy: -45, r: 8.5, fill: "#F2C9A0", stroke: INK, "stroke-width": 2 }, hero);
    var bag = svg("rect", { x: 8, y: -34, width: 11, height: 14, rx: 3, fill: GOLD, stroke: INK, "stroke-width": 1.6 }, hero);
    var shadow = svg("ellipse", { cy: 2, rx: 13, ry: 4, fill: "rgba(43,35,38,.24)" }, hero);
    var t0 = null;
    function placeHero(ms) {
      if (t0 == null) t0 = ms;
      var t = (ms - t0) / 1000;                       // 秒
      var dist = LEN * (0.5 - 0.5 * Math.cos(t * Math.PI / 11));   // 往返周期 22 秒
      var seg = SEGS[0];
      for (var j = 0; j < SEGS.length; j++) if (dist >= SEGS[j].s0) seg = SEGS[j];
      var d = dist - seg.s0;
      hero.setAttribute("transform", "translate(" + (seg.a[0] + seg.dx * d) + "," + (seg.a[1] + seg.dy * d) + ")");
      var sw = Math.sin(t * 7) * 5;                   // 摆腿
      legs[0].setAttribute("x1", -4 + sw); legs[0].setAttribute("x2", -4 - sw * .4);
      legs[1].setAttribute("x1", 4 - sw); legs[1].setAttribute("x2", 4 + sw * .4);
      body.setAttribute("cy", -26 + Math.abs(Math.sin(t * 7)) * -1.2);
      head.setAttribute("cy", -45 + Math.abs(Math.sin(t * 7)) * -1.2);
      void bag; void shadow;
    }
    var iv = setInterval(function () {
      if (!document.body.contains(cm.el)) { clearInterval(iv); return; }
      placeHero(performance.now());
    }, 50);
    // —— 纸片拖动微旋（手持感） ——
    var rot = -2, dragR = null;
    scrap.addEventListener("pointerdown", function (e) { dragR = { x: e.clientX, r: rot }; scrap.setPointerCapture(e.pointerId); });
    scrap.addEventListener("pointermove", function (e) {
      if (!dragR) return;
      rot = Math.max(-7, Math.min(4, dragR.r + (e.clientX - dragR.x) * 0.045));
      scrap.style.transform = "rotate(" + rot.toFixed(1) + "deg)";
    });
    scrap.addEventListener("pointerup", function () { dragR = null; });
    cover.appendChild(h("p", { cls: "fig-foot", html: "人教版七年级上册 · 1.3　<span class='mono'>FIG · 情境 · 校园寻宝</span>" }));
    return { steps: 2, step: function () {}, leave: function () { clearInterval(iv); } };
  }};

  /* ═════════ 第2页 航拍照片变身地图（4 步） ═════════ */
  P[2] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "任务一：<b>航拍照片变身地图</b>——照片信息太多，地图要做减法。每点一下走一步");
    var stage = box(root, 40, 150, 700, 520, {});
    var rb = sidecard(root, "");
    var PH = [
      { phase: "photo",   note: "<b>航拍照片：</b>从正上方看，什么都在——树、路、屋顶，还有操场上的人。", tag: "航拍照片（从正上方看）" },
      { phase: "outline", note: "<b>描边：</b>把要用的地物勾出轮廓，其余先放一边。", tag: "描边：只留轮廓" },
      { phase: "photo",   note: "<b>换符号：</b>操场画成椭圆环、楼画成矩形格——地图用的是<b>符号</b>，不是照片。", tag: "" },
      { phase: "symbol",  note: "<b>成图：</b>加上图名，这就是一张校园平面图。<br><br><span class='mut'>不过它还干不了寻宝的活——缺的三样，下一页你来补。</span>", tag: "" },
    ];
    var cmApi = null;
    function render() {
      stage.innerHTML = "";
      var p = PH[step];
      var useSymbolStep = step === 2;
      cmApi = campus(stage, { x: 0, y: 0, w: 700, h: 520, phase: p.phase, noPhotoTag: true });
      if (useSymbolStep) {   // 描边与符号的中间步：轮廓上叠符号
        var sym = campus(stage, { x: 0, y: 0, w: 700, h: 520, phase: "symbol" });
        sym.el.style.opacity = ".92";
        cmApi.el.parentNode && cmApi.el.parentNode.insertBefore(sym.el, cmApi.el.nextSibling);
        // 半透明描边底渐隐
        cmApi.el.style.transition = "opacity 1s"; cmApi.el.style.opacity = ".18";
      }
      if (step === 3) {
        var el2 = stage.querySelector("svg");
        var t = svg("text", { x: 350, y: 36, "class": "lab", "font-size": 26, "font-weight": 700, fill: PURPLE }, el2);
        t.textContent = "校园平面图";
      }
      if (p.tag && step < 2) {
        var el3 = stage.querySelector("svg");
        var t3 = svg("text", { x: 16, y: 508, "font-size": 15, fill: step === 0 ? "#FFFFFF" : MUT, "font-weight": 700, "text-anchor": "start", "class": "lab" }, el3);
        t3.textContent = p.tag;
      }
      rb.innerHTML = "<div class='phase-list'>" +
        ["航拍照片", "描边", "符号化", "成图"].map(function (n, i) { return "<div class='phase-i" + (i === step ? " on" : "") + "'><span>" + (i + 1) + "</span>" + n + "</div>"; }).join("") +
        "</div><p style='margin:14px 2px 0'>" + PH[step].note + "</p>";
    }
    render();
    nextBtn(root, "变一步 →", function () { step = (step + 1) % 4; render(); });
    return { steps: 4, step: function (k) { step = Math.min(k, 3); render(); }, leave: function () {} };
  }};

  /* ═════════ 第3页 现场投票（条形实时生长，本机保存） ═════════ */
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "现场投票：<b>" + L.vote.q + "</b>　<span class='mut'>（点选项投票，数据只存在本机）</span>");
    var KEY = "hv-geography-rj-7a-1-3-vote";
    var counts = [0, 0, 0];
    try { counts = JSON.parse(localStorage.getItem(KEY)) || counts; } catch (e) { /* 存储不可用时从零开始 */ }
    var stage = box(root, 40, 150, 740, 430, {});
    var rb = box(root, 810, 520, 430, 170, { cls: "note-card" });
    function render() {
      stage.innerHTML = "";
      var total = counts[0] + counts[1] + counts[2];
      var el = svg("svg", { viewBox: "0 0 740 430", width: 740, height: 430 }, stage);
      L.vote.opts.forEach(function (opt, i) {
        var y = 30 + i * 132;
        var w2 = total ? counts[i] / total * 480 : 0;
        svg("rect", { x: 210, y: y, width: Math.max(w2, 8), height: 84, rx: 12, fill: "rgba(108,33,102,.14)", stroke: INK, "stroke-width": 2.4 }, el);
        svg("text", { x: 196, y: y + 38, "text-anchor": "end", "font-size": 22, "font-weight": 700, fill: INK, "class": "lab" }, el).textContent = String.fromCharCode(65 + i);
        svg("text", { x: 196, y: y + 64, "text-anchor": "end", "font-size": 15, fill: MUT, "class": "lab" }, el).textContent = ["远近", "方向", "符号"][i];
        svg("text", { x: 226 + Math.max(w2, 8), y: y + 54, "font-size": 26, "font-weight": 700, fill: PURPLE, "class": "lab", "text-anchor": "start" }, el).textContent = counts[i];
      });
      rb.innerHTML = total
        ? "<b>三样都缺。</b><br>这张寻宝图上：没有比例尺——1 厘米代表多远不知道；没有指向标——哪边是北不知道；没有图例——哪个符号是活动室只能猜。<br><span class='mut'>接下来逐个补上，看它们各自管什么。</span>"
        : "<b>先投再讨论。</b><br><span class='mut'>让人数最多的选项说说：怎么被难住的？</span>";
    }
    render();
    var col = box(root, 810, 150, 430, 350);
    L.vote.opts.forEach(function (opt, i) {
      var b = box(col, 0, i * 116, 430, 96, { cls: "tool", style: "text-align:left;padding:10px 16px;font-size:17px" });
      b.innerHTML = "<b style='font-family:var(--mono)'>" + String.fromCharCode(65 + i) + "</b>　" + opt;
      b.addEventListener("click", function () {
        counts[i]++; try { localStorage.setItem(KEY, JSON.stringify(counts)); } catch (e) { /* 本机存储不可用 */ }
        render();
      });
    });
    var clr = box(root, 810, 462, 430, 46, { cls: "tool", text: "清空本机投票" });
    clr.addEventListener("click", function () { counts = [0, 0, 0]; try { localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ } render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第4页 三要素拼装（逐步点亮，缺件提示具体） ═════════ */
  P[4] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "任务二：<b>三要素拼装</b>——每点一下补一件，缺一件地图就干不了一件活");
    var stage = box(root, 40, 150, 700, 520, {});
    var rb = sidecard(root, "");
    var GAPS = [
      { gap: "还差：比例尺——图上 1 厘米代表多远，没人知道", lit: "拿这张图走不到：不知道活动室离校门多远" },
      { gap: "还差：指向标——哪边是北，没人知道", lit: "走哪个方向出校门，只能猜" },
      { gap: "还差：图例——符号的意思，没人知道", lit: "哪个符号是活动室，只能猜" },
    ];
    var WHAT = [
      "<b>比例尺：</b>图上 1 厘米 ＝ 实地 50 米。<br><span class='mut'>管<b>远近</b>：把几千米装进一张纸。</span>",
      "<b>指向标：</b>箭头指北。<br><span class='mut'>管<b>方向</b>：图上方向照它来读。</span>",
      "<b>图例：</b>符号一览表。<br><span class='mut'>管<b>认图</b>：符号是地图的语言。</span>",
    ];
    function render() {
      stage.innerHTML = "";
      campus(stage, { x: 0, y: 0, w: 700, h: 520, phase: "symbol",
        scaleBar: step >= 1, compass: step >= 2, legend: step >= 3, heading: 0 });
      if (step < 3) {
        var el2 = stage.querySelector("svg");
        var tip = svg("text", { x: 350, y: 34, "text-anchor": "middle", "font-size": 19, "font-weight": 700, fill: RED, "class": "lab" }, el2);
        tip.textContent = GAPS[step].gap;
      }
      rb.innerHTML = step === 0
        ? "<b>这是张画完了的校园图。</b><br><span class='mut'>地物都在，但它还告诉不了小满两件事：多远、朝哪。</span><br><br>" + GAPS[0].lit
        : step < 4 ? WHAT[step - 1] + "<br><br><b style='color:var(--red)'>" + GAPS[Math.min(step, 2)].gap.split("——")[0].replace("还差：", "下一件：") + "</b>"
        : "";
      if (step === 3) rb.innerHTML = "<b class='c-ok'>三件到齐，地图能用了。</b><br>比例尺管远近、指向标管方向、图例管认图——<br>地图三要素：<b>比例尺 · 方向 · 图例</b>。<br><br><span class='mut'>接下来两页，把它们一个个用起来。</span>";
    }
    render();
    nextBtn(root, "补一件 →", function () { step = (step + 1) % 4; render(); });
    return { steps: 4, step: function (k) { step = Math.min(k, 3); render(); }, leave: function () {} };
  }};

  /* ═════════ 第5页 格网点放定位（点地图 + 方向键微调） ═════════ */
  P[5] = { build: function (ctx) {
    var root = ctx.root, you = "C2";
    strip(root, "任务三：<b>格网点放</b>——点地图把自己放进去，方向键微调一格；先说列字母，再说行数字");
    var stage = box(root, 40, 150, 700, 520, {});
    var rb = sidecard(root, "");
    var cm = null;
    function render() {
      stage.innerHTML = "";
      cm = campus(stage, { x: 0, y: 0, w: 700, h: 520, phase: "symbol", grid: true, you: you, cross: you,
        compass: true, heading: 0, scaleBar: true,
        onMapClick: function (cell) { you = cell.name; render(); } });
      var clubCell = M.toCell(L.map.geo.club.x + L.map.geo.club.w / 2, L.map.geo.club.y + L.map.geo.club.h / 2, L.map.grid).name;
      rb.innerHTML = "<b>你在 " + you + " 格。</b><br><span class='mut'>第 " + you.charAt(0) + " 列，第 " + you.charAt(1) + " 行——先列字母，后行数字。</span><br><br>" +
        "社团活动室在 <b>" + clubCell + "</b> 格。<br>从你这里过去：先看差几列，再看差几行。<br><br>" +
        "<span class='mut'>方向键上下左右，一格一格挪；挪到活动室隔壁看看。</span>";
    }
    render();
    stage.style.cursor = "pointer";
    var keyH = function (e) {
      if (K.app.page !== 5) return;
      var c = M.fromCell(you, L.map.grid);
      if (!c) return;
      if (e.key === "ArrowRight") you = M.toCell(c.x + 141, c.y, L.map.grid).name;
      if (e.key === "ArrowLeft") you = M.toCell(c.x - 141, c.y, L.map.grid).name;
      if (e.key === "ArrowUp") you = M.toCell(c.x, c.y - 131, L.map.grid).name;
      if (e.key === "ArrowDown") you = M.toCell(c.x, c.y + 131, L.map.grid).name;
      render();
    };
    window.addEventListener("keydown", keyH);
    return { steps: 2, step: function () {}, leave: function () { window.removeEventListener("keydown", keyH); } };
  }};

  /* ═════════ 第6页 图上距离换算（距离条驱动，实地＝图上×分母） ═════════ */
  P[6] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "任务四：<b>图上距离换算</b>——拖距离条或按播放，看图上几厘米变成实地多少米");
    var stage = box(root, 40, 150, 740, 500, {});
    var rb = sidecard(root, "");
    var D = L.map.scale;
    function render(t) {
      stage.innerHTML = "";
      var el = svg("svg", { viewBox: "0 0 740 500", width: 740, height: 500 }, stage);
      var x0 = 70, cmPx = 100, yR = 200;
      // 直尺
      svg("rect", { x: x0 - 14, y: yR, width: 6 * cmPx + 28, height: 56, rx: 8, fill: "#F6E7C4", stroke: INK, "stroke-width": 2.4 }, el);
      for (var i = 0; i <= 12; i++) {
        var x = x0 + i * cmPx / 2, long = i % 2 === 0;
        svg("line", { x1: x, y1: yR, x2: x, y2: yR + (long ? 26 : 14), stroke: INK, "stroke-width": long ? 2 : 1.2 }, el);
        if (long) svg("text", { x: x, y: yR + 46, "class": "lab", "font-size": 16, "font-weight": 700 }, el).textContent = i / 2;
      }
      svg("text", { x: x0 + 6 * cmPx + 42, y: yR + 46, "class": "lab", "font-size": 15, fill: MUT }, el).textContent = "厘米";
      // 红色测量段
      svg("rect", { x: x0, y: yR - 64, width: t * cmPx, height: 34, rx: 8, fill: "rgba(192,57,43,.16)", stroke: RED, "stroke-width": 2.4 }, el);
      svg("text", { x: x0 + Math.max(t * cmPx / 2, 30), y: yR - 40, "text-anchor": "middle", "class": "lab", "font-size": 19, "font-weight": 700, fill: RED }, el).textContent = "图上 " + f(t) + " 厘米";
      // 换算链：图上 → ×分母 → 实地厘米 → ÷100 → 实地米
      var cy2 = 360, gc = M.groundCm(t, D.denom), gm = M.groundM(t, D.denom);
      var chain = [
        ["图上", f(t) + " 厘米", "#FFFFFF"],
        ["× " + D.denom, f(gc) + " 厘米", "#FCEFC2"],
        ["÷ 100", f(gm) + " 米", "#EEF8F2"],
      ];
      chain.forEach(function (c, i) {
        var bx = 60 + i * 230;
        svg("rect", { x: bx, y: cy2, width: 200, height: 88, rx: 12, fill: c[2], stroke: INK, "stroke-width": 2.2 }, el);
        svg("text", { x: bx + 100, y: cy2 + 34, "text-anchor": "middle", "class": "lab", "font-size": 16, fill: MUT }, el).textContent = i === 0 ? "图上距离" : i === 1 ? "× 分母 " + D.denom : "÷ 100 换成米";
        svg("text", { x: bx + 100, y: cy2 + 68, "text-anchor": "middle", "class": "lab", "font-size": 24, "font-weight": 700, fill: i === 2 ? GREEN : INK }, el).textContent = c[1];
        if (i < 2) svg("path", { d: "M" + (bx + 204) + " " + (cy2 + 44) + " L" + (bx + 224) + " " + (cy2 + 44) + " m-7 -7 l7 7 l-7 7", fill: "none", stroke: INK, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, el);
      });
      rb.innerHTML = "<b class='mono' style='font-size:20px'>实地距离 ＝ 图上距离 × 比例尺分母</b><br>" +
        "<span class='mono' style='font-size:18px'>＝ " + f(t) + " × " + D.denom + "</span><br>" +
        "<span class='mono' style='font-size:18px'>＝ " + f(gc) + " 厘米 ＝ <b class='c-ok' style='font-size:30px'>" + f(gm) + " 米</b></span><br><br>" +
        "<span class='mut'>比例尺 " + D.label + "：图上 1 厘米 ＝ 实地 50 米。<br>乘完分母别停在厘米——考卷要的是米。</span>";
    }
    var ck = new K.Clock(6);
    ck.on(render);
    render(0);
    return { steps: 1, step: function () {}, clock: ck, leave: function () {} };
  }};

  /* ═════════ 第7页 转动指向标（拖拽 + 步进，方位随读随变） ═════════ */
  P[7] = { build: function (ctx) {
    var root = ctx.root, heading = 0, step = 0;
    strip(root, "任务五：<b>转动指向标</b>——箭头不一定朝上。拖圆盘转一转，「教学楼在操场的什么方向」跟着变");
    var stage = box(root, 40, 150, 700, 520, {});
    var rb = sidecard(root, "");
    var cm = null;
    var G = L.map.geo;
    var bdeg = M.bearing(G.field.cx, G.field.cy, G.teach.x + G.teach.w / 2, G.teach.y + G.teach.h / 2);
    function render() {
      stage.innerHTML = "";
      var rel = M.relAz(bdeg, heading);
      cm = campus(stage, { x: 0, y: 0, w: 700, h: 520, phase: "symbol", compass: true, heading: heading,
        scaleBar: true, legend: false, link: ["操场", "教学楼"],
        onHeading: function (deg) { heading = Math.round(deg); render(); } });
      var el2 = stage.querySelector("svg");
      // 方位注释
      svg("text", { x: G.field.cx + 120, y: G.field.cy - 60, "class": "lab", "font-size": 16, fill: RED, "font-weight": 700 }, el2).textContent = "教学楼在操场的";
      svg("text", { x: G.field.cx + 120, y: G.field.cy - 30, "class": "lab", "font-size": 30, "font-weight": 700, fill: PURPLE }, el2).textContent = azName(rel);
      function azName(d) { return M.azWord(d) + "方向"; }
      rb.innerHTML = step >= 2
        ? "<b>读法：</b>指向标转到 " + heading + "°，读数 ＝ 原方位 − 转角<br><span class='mono'>" + f(bdeg) + "° − " + heading + "° ＝ " + f(rel) + "°（" + M.azWord(rel) + "）</span><br><br>" +
          "<b style='font-size:26px;color:var(--purple)'>教学楼在操场的 " + M.azWord(rel) + "方向</b><br><br>" +
          "<span class='mut'>地图没有「上就是北」的规定——上北下南只在指向标朝上时成立。</span>"
        : "<b>图不动，读数会动。</b><br>操场和教学楼的位置从未改变，<br>变的是<b>拿什么当北</b>。<br><br><span class='mut'>拖指向标圆盘转转看；或按「转 45°」一步步转。</span>";
    }
    render();
    var b1 = box(root, 810, 600, 200, 54, { cls: "tool", text: "转 45°" });
    b1.addEventListener("click", function () { heading = (heading + 45) % 360; render(); });
    var b2 = box(root, 1030, 600, 200, 54, { cls: "tool", text: "回正（朝上）" });
    b2.addEventListener("click", function () { heading = 0; render(); });
    return { steps: 3, step: function (k) { step = Math.min(k, 2); render(); }, leave: function () {} };
  }};

  /* ═════════ 第8页 寻宝图上的换算（judge 输入判定） ═════════ */
  P[8] = { build: function (ctx) {
    var root = ctx.root, Q = L.check[0];
    strip(root, "任务六：<b>寻宝图上的换算</b>——你来算：小满从校门量到活动室，图上 3 厘米");
    var stage = box(root, 40, 150, 740, 500, {});
    var rb = sidecard(root, "");
    var D = L.map.scale;
    function drawRuler() {
      stage.innerHTML = "";
      var el = svg("svg", { viewBox: "0 0 740 500", width: 740, height: 500 }, stage);
      var x0 = 70, cmPx = 100, yR = 190;
      svg("rect", { x: x0 - 14, y: yR, width: 6 * cmPx + 28, height: 56, rx: 8, fill: "#F6E7C4", stroke: INK, "stroke-width": 2.4 }, el);
      for (var i = 0; i <= 12; i++) {
        var x = x0 + i * cmPx / 2, long = i % 2 === 0;
        svg("line", { x1: x, y1: yR, x2: x, y2: yR + (long ? 26 : 14), stroke: INK, "stroke-width": long ? 2 : 1.2 }, el);
        if (long) svg("text", { x: x, y: yR + 46, "class": "lab", "font-size": 16, "font-weight": 700 }, el).textContent = i / 2;
      }
      svg("text", { x: x0 + 6 * cmPx + 42, y: yR + 46, "class": "lab", "font-size": 15, fill: MUT }, el).textContent = "厘米";
      svg("rect", { x: x0, y: yR - 64, width: 3 * cmPx, height: 34, rx: 8, fill: "rgba(192,57,43,.16)", stroke: RED, "stroke-width": 2.4 }, el);
      svg("text", { x: x0 + 1.5 * cmPx, y: yR - 40, "text-anchor": "middle", "class": "lab", "font-size": 19, "font-weight": 700, fill: RED }, el).textContent = "图上 3 厘米";
      // 比例尺条件卡
      svg("rect", { x: 70, y: 330, width: 280, height: 92, rx: 12, fill: "#FFFFFF", stroke: INK, "stroke-width": 2.2 }, el);
      svg("text", { x: 210, y: 364, "text-anchor": "middle", "class": "lab", "font-size": 16, fill: MUT }, el).textContent = "比例尺";
      svg("text", { x: 210, y: 402, "text-anchor": "middle", "class": "lab", "font-size": 28, "font-weight": 700, fill: PURPLE }, el).textContent = D.label;
      svg("text", { x: 400, y: 380, "class": "lab", "font-size": 26, "font-weight": 700, fill: INK }, el).textContent = "→ 实地 ?";
      svg("text", { x: 430, y: 430, "text-anchor": "middle", "class": "lab", "font-size": 16, fill: MUT }, el).textContent = "多少米？";
    }
    drawRuler();
    function judge() {
      var ok = M.checkInput(inp.value, Q.accepts);
      fb.innerHTML = ok
        ? "<b class='c-ok'>√ 对了：" + Q.accepts[0] + " 米</b><br><span class='mut'>3 × 5000 ＝ 15000 厘米 ＝ 150 米</span>"
        : "<b style='color:var(--red)'>× " + Q.hint + "</b>";
      inp.classList.toggle("ok", ok);
      inp.classList.toggle("bad", !ok);
    }
    rb.innerHTML = "<b>" + Q.q + "</b><br><br>";
    var row = box(rb, 14, 96, 400, 0);
    row.innerHTML = "<input class='inp' style='width:190px;font-size:24px' inputmode='text' aria-label='实地距离'><button class='btn' style='margin-left:10px'>检查</button><div class='fb' style='margin-top:12px'></div>";
    var inp = row.querySelector("input"), fb = row.querySelector(".fb"), btn = row.querySelector(".btn");
    btn.addEventListener("click", judge);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") judge(); });
    var reveal = box(rb, 14, 320, 400, 60, { cls: "tool", text: "看解法" });
    reveal.addEventListener("click", function () {
      fb.innerHTML = "<b>解法：</b>" + Q.why;
    });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第9页 当堂检测（输入 ≥2 + 选择，实时得分） ═════════ */
  P[9] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "当堂检测：<b>前两题输入，后两题选择</b>　<span class='mut'>（答错先看第一步提示）</span>");
    var done = 0, score = 0, TOTAL = 4;
    var sc = box(root, 990, 66, 250, 44, { cls: "pill", text: "得分 0 / " + TOTAL });
    function mark() { done++; sc.textContent = "得分 " + score + " / " + TOTAL; }
    // 左列：两道输入题（check[1]、check[2]）
    [L.check[1], L.check[2]].forEach(function (c, i) {
      var row = card(root, 60, 150 + i * 250, 560, 224, { cls: "note-card" });
      row.innerHTML = "<b>第" + (i + 1) + "题</b>　" + c.q;
      var inp = box(row, 20, 128, 520, 0);
      inp.innerHTML = "<input class='inp' style='width:170px;font-size:20px' inputmode='text' aria-label='作答'><button class='btn' style='margin-left:10px'>检查</button><div class='fb' style='margin-top:10px'></div>";
      var input = inp.querySelector("input"), btn = inp.querySelector("button"), fb = inp.querySelector(".fb");
      function judge() {
        if (fb.dataset.locked) return;
        if (M.checkInput(input.value, c.accepts)) { fb.innerHTML = "<b class='c-ok'>√</b> " + c.why; fb.dataset.locked = "1"; score++; input.classList.add("ok"); }
        else { fb.innerHTML = "<b style='color:var(--red)'>× " + c.hint + "</b>"; input.classList.add("bad"); }
        mark();
      }
      btn.addEventListener("click", judge);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") judge(); });
    });
    // 右列：两道选择题（quiz）
    L.quiz.slice(0, 2).forEach(function (q, qi) {
      var col = card(root, 660, 150 + qi * 250, 580, 224, { cls: "note-card" });
      col.innerHTML = "<b>第" + (3 + qi) + "题</b>　" + q.q;
      var opts = box(col, 20, 66, 540, 0);
      q.opts.forEach(function (op, oi) {
        var b = box(opts, 0, oi * 34, 540, 30, { cls: "tool", style: "text-align:left;padding:4px 12px;font-size:14px", text: String.fromCharCode(65 + oi) + "．" + op });
        b.addEventListener("click", function () {
          if (b.classList.contains("ok") || b.classList.contains("bad") || col.dataset.locked) return;
          col.dataset.locked = "1";
          if (oi === q.a) { b.classList.add("ok"); score++; }
          else { b.classList.add("bad"); opts.children[q.a].classList.add("ok"); }
          var why = box(col, 20, 196 - 26, 540, 24, { cls: "why-line", html: "<span class='mut'>为什么：</span>" + q.why });
          void why;
          mark();
        });
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第10页 板书设计（逐条揭示，末条留白先说后看） ═════════ */
  P[10] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "板书设计：<b>地图的阅读</b>——一图三要素一换算，逐条揭示");
    var stage = box(root, 50, 150, 480, 360, {});
    campus(stage, { x: 0, y: 0, w: 480, h: 356, phase: "symbol", grid: true, scaleBar: true, compass: true, heading: 0, legend: true, treasureLit: true });
    var list = box(root, 570, 140, 670, 540);
    L.board.forEach(function (it, i) {
      var last = i === L.board.length - 1;
      var row = box(list, 0, i * 106, 670, 92, { cls: "board-row" + (last ? " blank" : ""), s: i + 1 });
      row.innerHTML = "<div class='tag'>" + it[0] + "</div><div class='bd'>" + it[1] + "</div>";
    });
    return { steps: 5, step: function () {}, leave: function () {} };
  }};
})();
