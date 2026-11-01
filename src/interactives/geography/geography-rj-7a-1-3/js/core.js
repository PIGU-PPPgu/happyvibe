/* 舞台通用部件：元素构造、时钟（驱动连续量）、双视图桩。
   舞台坐标固定为 1280×720，与课件页面同比例。 */
(function () {
  "use strict";
  var L = window.LESSON, M = window.MapEngine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var K = (window.K = {});

  K.L = L;
  K.M = M;
  K.fmt = function (x) { return M.fmt(x); };

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

  /* ---------------- 双视图桩：外壳 V 键与 depthBtn 依赖此接口 ----------------
     本件为平面手绘地图，无 2.5D 主图；K.lines 恒空，切换为空操作（700ms 契约保留）。 */
  K.depth = 1;
  K.lines = [];
  K.setDepth = function (target, animate) {
    K.depth = target;
    if (!animate) return;
    var t0 = null, dur = 700;
    var step = function (ts) {
      if (t0 == null) t0 = ts;
      var u = Math.min(1, (ts - t0) / dur);
      void u;
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------------- 时钟：驱动连续量（本件用作图上距离条） ---------------- */
  K.Clock = function (tmax) {
    this.t = 0; this.tmax = tmax == null ? L.map.scale.denom / 1000 : tmax; this.fns = []; this.raf = null; this.speed = 1; this.playing = false;
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
  /** 播放到 target，结束后调用 done */
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

  /** 公式字符串：数字中的减号统一为“−”，运算符为全角 */
  K.f = function (s) { return String(s).replace(/-/g, "−"); };
})();
