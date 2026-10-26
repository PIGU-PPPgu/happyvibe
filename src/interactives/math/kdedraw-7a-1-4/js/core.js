/* 舞台通用部件：元素构造、数轴（汤姆/杰瑞/线段/奶酪）、时钟、距离折线图。
   舞台坐标固定为 1280×720，与课件页面同比例。 */
(function () {
  "use strict";
  var L = window.LESSON, M = window.MathEngine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var K = (window.K = {});

  K.L = L;
  K.M = M;
  K.fmt = function (x) { return M.fmt(x); };
  K.pos = function (round, who, t) { var a = L.rounds[round][who]; return a.start + a.dir * a.speed * t; };
  K.spike = function (t) { var s = L.spike; return s.start + s.dir * s.speed * t; };
  K.gap = function (round, t) { return Math.abs(K.pos(round, "p", t) - K.pos(round, "q", t)); };

  /** 元素构造：K.h("div", {cls, style, s, text, html, on}, [children]) ；s 为分步出现的步号 */
  K.h = function (tag, o, kids) {
    var el = document.createElement(tag);
    o = o || {};
    if (o.cls) el.className = o.cls;
    if (o.style) el.style.cssText = o.style;
    if (o.s != null) el.setAttribute("data-s", o.s);
    if (o.wipe) el.classList.add("wipe");
    if (o.text != null) el.textContent = o.text;
    if (o.html != null) el.innerHTML = o.html;
    if (o.attrs) Object.keys(o.attrs).forEach(function (k) { el.setAttribute(k, o.attrs[k]); });
    if (o.on) Object.keys(o.on).forEach(function (k) { el.addEventListener(k, o.on[k]); });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  };
  /** 绝对定位块 */
  K.box = function (parent, x, y, w, h, o, kids) {
    o = o || {};
    var el = K.h(o.tag || "div", o, kids);
    el.classList.add("abs");
    el.style.left = x + "px"; el.style.top = y + "px";
    if (w != null) el.style.width = w + "px";
    if (h != null) el.style.height = h + "px";
    parent.appendChild(el);
    return el;
  };
  K.card = function (parent, x, y, w, h, o, kids) {
    var el = K.box(parent, x, y, w, h, o, kids);
    el.classList.add("card");
    return el;
  };
  K.svg = function (tag, attrs, parent) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(el);
    return el;
  };
  K.table = function (parent, x, y, rows, widths, o) {
    o = o || {};
    var t = K.h("table", { cls: "tbl" });
    t.style.left = x + "px"; t.style.top = y + "px";
    rows.forEach(function (r, i) {
      var tr = K.h("tr");
      r.forEach(function (v, j) {
        var c = K.h(i === 0 ? "th" : "td");
        if (widths) c.style.width = widths[j] + "px";
        if (v instanceof Node) c.appendChild(v); else c.textContent = v;
        if (j === 0 && i > 0) c.classList.add("k");
        if (o.hl && o.hl[0] === i && o.hl[1] === j) c.classList.add("hl");
        tr.appendChild(c);
      });
      t.appendChild(tr);
    });
    parent.appendChild(t);
    return t;
  };
  /** 小结卡 */
  K.summary = function (parent, x, y, w, h, title, lines, s) {
    var c = K.card(parent, x, y, w, h, { cls: "sum", s: s });
    c.appendChild(K.h("div", { cls: "h", text: title }));
    c.appendChild(K.h("ul", {}, lines.map(function (l) { return K.h("li", { html: l }); })));
    return c;
  };

  // ---------------- 数轴（2.5D 跑道 ⇄ 中考平面图） ----------------
  // depth k：1＝立体跑道（顶面＋正面＋投影，三人分三条跑道站在立体标记上）；0＝中考卷面上的平面数轴（字母点 P、Q、R）。
  // X(v) 始终是水平映射，页面布局不受 k 影响。K.setDepth 在两者之间做动画。
  var TOM_H = 82, TOM_W = TOM_H * 404 / 644, JER_H = 60, JER_W = JER_H * 404 / 528, DOG_H = 72, DOG_W = DOG_H * 404 / 528;
  var TW = 42, FH = 17, SK = 30, LANE = { r: -13, p: 0, q: 13 }, INK = "#2B2326", SHADOW = "rgba(72,78,170,.26)", uid = 0;
  var COLOR = { p: "#6C2166", q: "#DEAA18", r: "#1E7F4F" }, LETTER = { p: "P", q: "Q", r: "R" }, LETTER_DX = { p: -9, q: 0, r: 9 };
  K.depth = 1;
  K.lines = [];
  try { var saved = localStorage.getItem("dongdian:depth"); if (saved != null) K.depth = Number(saved); } catch (e) { /* 存储不可用时用默认 */ }

  K.NumberLine = function (parent, o) {
    var h = o.h || 230, ay = o.axisY || 120, pad = 18, id = "nl" + (++uid);
    var svg = K.svg("svg", { width: o.w, height: h, viewBox: "0 0 " + o.w + " " + h, "class": "nl" });
    svg.style.left = o.x + "px"; svg.style.top = o.y + "px";
    parent.appendChild(svg);
    var unit = (o.w - 2 * pad - 24) / (o.hi - o.lo);
    this.svg = svg; this.ay = ay; this.unit = unit; this.o = o; this.k = K.depth;
    this.X = function (v) { return pad + (v - o.lo) * unit; };
    var defs = K.svg("defs", {}, svg);
    var gr = K.svg("linearGradient", { id: id + "g", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    K.svg("stop", { offset: "0", "stop-color": "#FFF8E6" }, gr);
    K.svg("stop", { offset: "1", "stop-color": "#F6E7C4" }, gr);
    this.gid = id;
    this.base = K.svg("g", {}, svg);
    this.segLayer = K.svg("g", {}, svg);
    this.fxLayer = K.svg("g", {}, svg);
    this.agentLayer = K.svg("g", {}, svg);
    this.lanes = { r: K.svg("g", {}, this.agentLayer), p: K.svg("g", {}, this.agentLayer), q: K.svg("g", {}, this.agentLayer) };
    this.agents = []; this.segs = [];
    this.drawBase();
    K.lines.push(this);
  };
  var NL = K.NumberLine.prototype;
  NL.xAt = function (x, y) { return x - SK * (y - this.ay) / TW; };   // 顶面上沿斜向“深度”的横向偏移
  NL.laneY = function (who) { return this.ay + (LANE[who] || 0) * this.k; };

  NL.drawBase = function () {
    var g = this.base, o = this.o, ay = this.ay, k = this.k, nl = this;
    while (g.firstChild) g.removeChild(g.firstChild);
    var tw = TW * k, fh = FH * k, fy = ay + tw / 2, by = ay - tw / 2, x0 = 4 + SK / 2, x1 = o.w - 30;
    var xa = function (x, y) { return nl.xAt(x, y); };
    var P = function (pts) { return pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "); };
    var tip = [x1 + 14 + 14 * k, ay];
    if (k > 0.02) {
      K.svg("polygon", { points: P([[xa(x0, fy) + 6, fy + fh], [xa(x1, fy) + 6, fy + fh], [xa(x1, fy) + 30, fy + fh + 14 * k], [xa(x0, fy) + 30, fy + fh + 14 * k]]), fill: SHADOW, opacity: k }, g);
      K.svg("polygon", { points: P([[xa(x0, fy), fy], [xa(x1, fy), fy], [xa(x1, fy), fy + fh], [xa(x0, fy), fy + fh]]), fill: "#E2B456", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      K.svg("polygon", { points: P([[xa(x0, fy), fy], [xa(x1, fy), fy], [xa(x1, by), by], [xa(x0, by), by]]), fill: "url(#" + this.gid + "g)", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      K.svg("polygon", { points: P([[xa(x1, fy), fy], tip, [xa(x1, by), by]]), fill: "#FFF8E6", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      K.svg("polygon", { points: P([[xa(x1, fy), fy], tip, [tip[0], tip[1] + fh], [xa(x1, fy), fy + fh]]), fill: "#C8963A", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      [-6.5, 6.5].forEach(function (dy) {
        K.svg("line", { x1: xa(x0, ay + dy * k), y1: ay + dy * k, x2: xa(x1, ay + dy * k), y2: ay + dy * k, stroke: "rgba(43,35,38,.10)", "stroke-dasharray": "2 4", opacity: k }, g);
      });
    }
    if (k < 0.98) {   // 平面数轴：一条线＋箭头（中考卷面样式）
      K.svg("line", { x1: x0, y1: ay, x2: x1 + 8, y2: ay, stroke: INK, "stroke-width": 2.2, opacity: 1 - k, "class": "axis" }, g);
      K.svg("path", { d: "M" + (x1 + 22) + " " + ay + " l-15 -7 v14 z", fill: INK, opacity: 1 - k }, g);
    }
    var every = o.labelEvery || 1;
    for (var v = o.lo; v <= o.hi; v++) {
      var x = this.X(v);
      if (k > 0.02) {
        K.svg("line", { x1: xa(x, by + 1), y1: by + 1, x2: xa(x, fy), y2: fy, stroke: "rgba(43,35,38,.12)", "stroke-width": 1 }, g);
        K.svg("line", { x1: xa(x, ay + 5 * k), y1: ay + 5 * k, x2: xa(x, fy), y2: fy, "class": "tick", "stroke-width": v === 0 ? 2.6 : 1.4 }, g);
      }
      var tl = 6 + 1 * k;
      K.svg("line", { x1: xa(x, fy), y1: fy - tl * (1 - k), x2: xa(x, fy), y2: fy + tl * (0.7 + 0.3 * k), "class": "tick", "stroke-width": v === 0 ? 2.4 : 1.4 }, g);
      if ((v - o.lo) % every === 0) {
        var t = K.svg("text", { x: xa(x, fy), y: fy + fh + 19 + 4 * (1 - k), "class": "lab" }, g);
        t.textContent = String(v).replace("-", "−");
        if (v === 0) t.setAttribute("font-weight", "700");
      }
    }
  };
  NL.setK = function (k) {
    this.k = k;
    this.drawBase();
    this.agents.forEach(function (a) { a.render(); });
    this.segs.forEach(function (s) { s.redraw(); });
  };

  function shade(c, f) {   // 颜色加深（f<1）或提亮（f>1）
    var n = parseInt(c.slice(1), 16), g = function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); };
    return "rgb(" + g(n >> 16) + "," + g((n >> 8) & 255) + "," + g(n & 255) + ")";
  }
  /** 立体标记：p 圆柱、q 方块、r 圆锥；ghost 为虚线轮廓。返回脚底高度 */
  function marker(g, who, y, ghost) {
    var dash = ghost ? { "stroke-dasharray": "3 3", fill: "none" } : {};
    var A = function (o) { var r = {}, k; for (k in o) r[k] = o[k]; for (k in dash) r[k] = dash[k]; return r; };
    if (who === "p") {
      var c = COLOR.p;
      K.svg("path", A({ d: "M-10 " + y + " v-7 a10 4.5 0 0 0 20 0 v7 a10 4.5 0 0 1 -20 0 z", fill: shade(c, .75), stroke: INK, "stroke-width": 1.3 }), g);
      K.svg("ellipse", A({ cx: 0, cy: y - 7, rx: 10, ry: 4.5, fill: shade(c, 1.35), stroke: INK, "stroke-width": 1.3 }), g);
      return y - 9;
    }
    if (who === "q") {
      var gc = COLOR.q, s = 7;
      K.svg("path", A({ d: "M0 " + (y - 2 * s + 2) + " l" + s + " " + (s / 2) + " l-" + s + " " + (s / 2) + " l-" + s + " -" + (s / 2) + " z", fill: shade(gc, 1.2), stroke: INK, "stroke-width": 1.2 }), g);
      K.svg("path", A({ d: "M-" + s + " " + (y - 1.5 * s + 2) + " l" + s + " " + (s / 2) + " v" + s + " l-" + s + " -" + (s / 2) + " z", fill: gc, stroke: INK, "stroke-width": 1.2 }), g);
      K.svg("path", A({ d: "M0 " + (y - s + 2) + " l" + s + " -" + (s / 2) + " v" + s + " l-" + s + " " + (s / 2) + " z", fill: shade(gc, .78), stroke: INK, "stroke-width": 1.2 }), g);
      return y - 2 * s + 3;
    }
    var gn = COLOR.r;
    K.svg("ellipse", A({ cx: 0, cy: y, rx: 9, ry: 3.5, fill: shade(gn, .7), stroke: INK, "stroke-width": 1.2 }), g);
    K.svg("path", A({ d: "M-9 " + y + " L0 " + (y - 17) + " L9 " + y + " A9 3.5 0 0 1 -9 " + y + " Z", fill: gn, stroke: INK, "stroke-width": 1.2 }), g);
    return y - 15;
  }
  /** 角色：立体时站在自己跑道的立体标记上；平面时变成数轴上的点和字母 P/Q/R */
  NL.agent = function (who, v, opt) {
    opt = opt || {};
    var nl = this, g = K.svg("g", { "class": "agent" + (opt.ghost ? " ghost" : "") }, this.lanes[who] || this.agentLayer);
    var a = {
      g: g, v: v, who: who,
      render: function () {
        while (g.firstChild) g.removeChild(g.firstChild);
        var k = nl.k, y = nl.laneY(who);
        var solid = K.svg("g", { opacity: opt.ghost ? 1 : Math.min(1, k * 1.4) }, g);
        if (k > 0.02 || opt.ghost) {
          if (!opt.ghost) K.svg("ellipse", { cx: 9, cy: y + 2, rx: who === "p" ? 17 : 14, ry: 4.5, fill: SHADOW }, solid);
          var foot = marker(solid, who, y, opt.ghost);
          if (!opt.ghost && opt.figure !== false) {
            var spr = who === "p" ? [L.sprites.cat, TOM_W, TOM_H] : who === "q" ? [L.sprites.mouse, JER_W, JER_H] : [L.sprites.dog, DOG_W, DOG_H];
            K.svg("image", { href: spr[0], x: -spr[1] / 2, y: foot - spr[2] + 2, width: spr[1], height: spr[2] }, solid);
          }
        }
        if (!opt.ghost && k < 0.98) {
          var flat = K.svg("g", { opacity: 1 - k }, g);
          K.svg("circle", { cx: 0, cy: y, r: 6, fill: COLOR[who] || INK, stroke: INK, "stroke-width": 1.5 }, flat);
          var t = K.svg("text", { x: LETTER_DX[who] || 0, y: y - 14, "class": "lab letter", fill: COLOR[who] === "#DEAA18" ? "#A87C06" : COLOR[who], "font-size": 20, "font-weight": 700 }, flat);
          t.textContent = LETTER[who] || "";
        }
        a.set(a.v);
      },
      set: function (val) { a.v = val; g.setAttribute("transform", "translate(" + nl.xAt(nl.X(val), nl.laneY(who)) + ",0)"); return a; },
      show: function (on) { g.style.display = on === false ? "none" : ""; return a; },
      lit: function (on) { g.classList.toggle("lit", !!on); return a; }
    };
    this.agents.push(a);
    a.render();
    return a;
  };
  /** 两点之间的一段：立体时是跑道顶面上的色条，平面时是数轴上的粗线段 */
  NL.seg = function (color, opt) {
    opt = opt || {};
    var nl = this, c = color || "#DEAA18";
    var g = K.svg("g", { "class": "seg" }, this.segLayer);
    var side = K.svg("polygon", { fill: c.charAt(0) === "#" ? shade(c, .68) : c, stroke: INK, "stroke-width": .8 }, g);
    var top = K.svg("polygon", { fill: c, stroke: INK, "stroke-width": 1 }, g);
    var lab = opt.label ? K.svg("text", { "class": "lab", y: this.ay + (opt.labelDy || -24), "font-weight": "700", fill: opt.labelColor || "#A87C06" }, this.segLayer) : null;
    var last = null;
    var s = {
      redraw: function () { if (last) s.set(last[0], last[1], last[2]); },
      set: function (a, b, text) {
        last = [a, b, text];
        var k = nl.k, hgt = (opt.h || 10) * (0.55 + 0.45 * k), y1 = nl.ay - hgt / 2 + (opt.dy || 0) * k, y2 = y1 + hgt;
        var xa = nl.X(Math.min(a, b)), xb = nl.X(Math.max(a, b));
        var q = function (x, y) { return nl.xAt(x, y).toFixed(1) + "," + y.toFixed(1); };
        top.setAttribute("points", [q(xa, y2), q(xb, y2), q(xb, y1), q(xa, y1)].join(" "));
        side.setAttribute("points", [q(xa, y2), q(xb, y2), nl.xAt(xb, y2).toFixed(1) + "," + (y2 + 3 * k), nl.xAt(xa, y2).toFixed(1) + "," + (y2 + 3 * k)].join(" "));
        g.style.display = xb - xa < 0.5 ? "none" : "";
        if (lab) { lab.setAttribute("x", (xa + xb) / 2); lab.textContent = text != null ? text : ""; }
        return s;
      },
      show: function (on) { g.style.opacity = on === false ? 0 : 1; if (lab) lab.style.opacity = on === false ? 0 : 1; return s; }
    };
    this.segs.push(s);
    return s;
  };

  /** 当前页所有数轴在 2.5D 与平面之间切换（带动画） */
  K.setDepth = function (target, animate) {
    try { localStorage.setItem("dongdian:depth", String(target)); } catch (e) { /* 忽略 */ }
    var from = K.depth, lines = K.lines.slice();
    K.depth = target;
    if (!animate || window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lines.forEach(function (l) { l.setK(target); });
      return;
    }
    var t0 = null, dur = 700;
    var step = function (ts) {
      if (t0 == null) t0 = ts;
      var u = Math.min(1, (ts - t0) / dur), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      var k = from + (target - from) * e;
      lines.forEach(function (l) { l.setK(k); });
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /** 带括线的路程（虚线＋两端竖线＋标签） */
  NL.span = function (a, b, dy, color, text) {
    var g = K.svg("g", {}, this.fxLayer), y = this.ay + dy, x1 = this.X(a), x2 = this.X(b);
    K.svg("line", { x1: x1, y1: y, x2: x2, y2: y, stroke: color, "stroke-width": 3, "stroke-dasharray": "7 5" }, g);
    K.svg("line", { x1: x1, y1: y - 7, x2: x1, y2: y + 7, stroke: color, "stroke-width": 2 }, g);
    K.svg("line", { x1: x2, y1: y - 7, x2: x2, y2: y + 7, stroke: color, "stroke-width": 2 }, g);
    if (text) { var t = K.svg("text", { x: (x1 + x2) / 2, y: y - 10, "class": "lab", fill: color, "font-weight": "700" }, g); t.textContent = text; }
    return g;
  };
  /** 方向箭头（带描边的立体箭头） */
  NL.arrow = function (v, dir, color, dy) {
    var x = this.X(v), y = this.ay + (dy || -58), len = 46 * dir;
    var g = K.svg("g", {}, this.fxLayer);
    var d = "M" + x + " " + (y - 4) + " h" + (len - 12 * dir) + " v-6 l" + (12 * dir) + " 10 l" + (-12 * dir) + " 10 v-6 h" + (-(len - 12 * dir)) + " z";
    K.svg("path", { d: d, fill: color, stroke: INK, "stroke-width": 1.3, transform: "translate(2,3)", opacity: ".25" }, g);
    K.svg("path", { d: d, fill: color, stroke: INK, "stroke-width": 1.3 }, g);
    return g;
  };
  /** 奶酪C */
  NL.cheese = function (v) {
    var g = K.svg("g", {}, this.fxLayer), x = this.X(v), y = this.ay - 4;
    K.svg("ellipse", { cx: x + 2, cy: y + 4, rx: 16, ry: 3.5, fill: "rgba(43,35,38,.2)" }, g);
    K.svg("image", { href: L.sprites.cheese, x: x - 18, y: y - 30, width: 36, height: 30 }, g);
    var t = K.svg("text", { x: x + 26, y: y - 20, "class": "lab", fill: "#A87C06", "font-weight": "700" }, g);
    t.textContent = "C";
    return g;
  };
  /** 在某个值上方的文字 */
  NL.note = function (v, dy, text, color, size) {
    var t = K.svg("text", { x: this.X(v), y: this.ay + dy, "class": "lab", fill: color || "#2B2326", "font-weight": "700", "font-size": size || 18 }, this.fxLayer);
    t.textContent = text;
    return t;
  };

  // ---------------- 时钟：驱动 t 的连续变化 ----------------
  K.Clock = function (tmax) {
    this.t = 0; this.tmax = tmax == null ? L.T : tmax; this.fns = []; this.raf = null; this.speed = 1; this.playing = false;
  };
  var CK = K.Clock.prototype;
  CK.on = function (fn) { this.fns.push(fn); return this; };
  CK.set = function (t) {
    this.t = Math.max(0, Math.min(this.tmax, t));
    var self = this;
    this.fns.forEach(function (f) { f(self.t); });
    return this;
  };
  CK.stop = function () { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; this.playing = false; if (this.onstate) this.onstate(false); };
  /** 以题设速度（1秒＝1秒）播放到 target，结束后调用 done */
  CK.to = function (target, done) {
    this.stop();
    var self = this, from = this.t, dir = target >= from ? 1 : -1, last = null;
    if (Math.abs(target - from) < 1e-9) { this.set(target); if (done) done(); return; }
    this.playing = true; if (this.onstate) this.onstate(true);
    var step = function (ts) {
      if (last == null) last = ts;
      var nt = self.t + dir * (ts - last) / 1000 * self.speed;
      last = ts;
      if ((dir > 0 && nt >= target) || (dir < 0 && nt <= target)) {
        self.set(target); self.raf = null; self.playing = false; if (self.onstate) self.onstate(false);
        if (done) done();
        return;
      }
      self.set(nt);
      self.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  };

  // ---------------- 距离随时间变化的折线图 ----------------
  /** fn(t) 为距离；opt = {tmax, ymax, level, levelText, color} */
  K.Chart = function (parent, x, y, w, h, fn, opt) {
    opt = opt || {};
    var tmax = opt.tmax || 10, ymax = opt.ymax || 7, pl = 34, pb = 26;
    var svg = K.svg("svg", { width: w, height: h, "class": "nl" });
    svg.style.left = x + "px"; svg.style.top = y + "px";
    parent.appendChild(svg);
    var X = function (t) { return pl + t / tmax * (w - pl - 14); }, Y = function (d) { return h - pb - d / ymax * (h - pb - 12); };
    this.X = X; this.Y = Y; this.svg = svg;
    K.svg("rect", { x: pl, y: 6, width: w - pl - 14, height: Y(0) - 6, fill: "#FFFDF7", stroke: "rgba(43,35,38,.25)", rx: 4 }, svg);
    for (var gx = 2; gx < tmax; gx += 2) K.svg("line", { x1: X(gx), y1: 8, x2: X(gx), y2: Y(0), stroke: "rgba(43,35,38,.08)" }, svg);
    for (var gy = 2; gy < ymax; gy += 2) K.svg("line", { x1: pl, y1: Y(gy), x2: w - 14, y2: Y(gy), stroke: "rgba(43,35,38,.08)" }, svg);
    K.svg("line", { x1: pl, y1: Y(0), x2: w - 4, y2: Y(0), "class": "axis", "stroke-width": 1.5 }, svg);
    K.svg("line", { x1: pl, y1: Y(0), x2: pl, y2: 4, "class": "axis", "stroke-width": 1.5 }, svg);
    for (var t = 0; t <= tmax; t += 2) { var a = K.svg("text", { x: X(t), y: Y(0) + 20, "class": "lab", "font-size": 13 }, svg); a.textContent = t; }
    for (var d = 2; d <= ymax; d += 2) { var b = K.svg("text", { x: pl - 14, y: Y(d) + 5, "class": "lab", "font-size": 13 }, svg); b.textContent = d; }
    var lt = K.svg("text", { x: pl + 6, y: 14, "class": "lab", "font-size": 13, "text-anchor": "start" }, svg); lt.textContent = opt.ylabel || "距离（米）";
    var tt = K.svg("text", { x: w - 8, y: Y(0) - 6, "class": "lab", "font-size": 14 }, svg); tt.textContent = "t";
    if (opt.level != null) {
      K.svg("line", { x1: pl, y1: Y(opt.level), x2: w - 14, y2: Y(opt.level), stroke: "#C0392B", "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
    }
    var pts = [];
    for (var i = 0; i <= 200; i++) { var tt2 = tmax * i / 200; pts.push(X(tt2) + "," + Y(fn(tt2))); }
    this.path = K.svg("polyline", { points: pts.join(" "), fill: "none", stroke: opt.color || "#6C2166", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    this.dot = K.svg("circle", { r: 7, fill: "#DEAA18", stroke: "#2E122B", "stroke-width": 2 }, svg);
    this.fn = fn;
    this.set(0);
  };
  K.Chart.prototype.set = function (t) {
    this.dot.setAttribute("cx", this.X(t)); this.dot.setAttribute("cy", this.Y(this.fn(t)));
    return this;
  };
  K.Chart.prototype.mark = function (t, d, color) {
    return K.svg("circle", { cx: this.X(t), cy: this.Y(d), r: 6, fill: color || "#C0392B" }, this.svg);
  };

  /** 公式字符串：数字中的减号统一为“−”，运算符为全角 */
  K.f = function (s) { return String(s).replace(/-/g, "−"); };
})();
