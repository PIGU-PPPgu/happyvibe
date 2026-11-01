/* 外壳：侧边栏目录（按 act 四幕分组）、分步播放、距离条、画笔批注、教师备注、缩放与快捷键。 */
(function () {
  "use strict";
  var L = K.L, $ = function (id) { return document.getElementById(id); };
  var ACT_NAMES = { 1: "入场 · 问题世界", 2: "探究 · 读图三件事", 3: "判定 · 当堂检测", 4: "板书 · 一图收束" };
  var SLIDE = {};
  L.slides.forEach(function (s) { SLIDE[s.no] = s; });

  var stage = $("stage"), ink = $("ink"), cur = null, page = null, step = 0;

  // ---------- 目录（数据源：slides[].act，无硬编码页号） ----------
  function buildToc() {
    var toc = $("toc");
    var byAct = {};
    L.slides.forEach(function (s) { (byAct[s.act] = byAct[s.act] || []).push(s.no); });
    Object.keys(byAct).forEach(function (act) {
      var g = K.h("div", { cls: "grp" });
      g.appendChild(K.h("div", { cls: "grp-h" }, [K.h("span", { cls: "num", text: act }), ACT_NAMES[act]]));
      byAct[act].forEach(function (no) {
        var s = SLIDE[no];
        g.appendChild(K.h("button", { cls: "item", attrs: { "data-no": no },
          on: { click: function () { go(no); } } }, [
          K.h("span", { cls: "pg", text: String(no).padStart(2, "0") }),
          K.h("span", { cls: "tt", text: s.title }),
          K.h("span", { cls: "web", text: s.handsOn }),
        ]));
      });
      toc.appendChild(g);
    });
    var sh = $("showHidden");
    sh.addEventListener("change", function () { $("side").classList.toggle("show-hidden", sh.checked); });
  }

  // ---------- 页面 ----------
  function chrome(no) {
    var s = SLIDE[no];
    K.box(stage, 0, 0, null, null, { cls: "pg-tag", text: s.tag || "" });
    K.box(stage, 0, 0, null, null, { cls: "pg-title", text: s.title });
    K.box(stage, 0, 0, null, null, { cls: "pg-rule" });
    K.box(stage, 0, 0, null, null, { cls: "pg-brand", text: "香港中文大学（深圳）基础教育集团 · 校内教学使用" });
    K.box(stage, 0, 0, null, null, { cls: "pg-no", text: "课件第 " + no + " 页" });
    ["pg-tag", "pg-title", "pg-rule", "pg-brand", "pg-no"].forEach(function (c) {
      var el = stage.querySelector("." + c); el.style.left = ""; el.style.top = "";
    });
  }

  function go(no, startStep) {
    if (!K.PAGES[no]) no = 1;
    if (page && page.leave) page.leave();
    if (page && page.clock) page.clock.stop();
    saveInk();
    cur = no; step = 0;
    stage.innerHTML = "";
    K.lines = [];
    var def = K.PAGES[no];
    if (!def.full) chrome(no);
    page = def.build({ root: stage, no: no, store: store }) || {};
    page.steps = page.steps || 0;
    bindClock(page.clock);
    setStep(Math.min(startStep || 0, page.steps), false);
    document.querySelectorAll(".item").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-no") === String(no)); });
    var active = document.querySelector(".item.on");
    if (active) active.scrollIntoView({ block: "nearest" });
    var s = SLIDE[no];
    $("crumb").innerHTML = "课件第 <b>" + no + "</b> 页 · <b>" + s.title + "</b>" +
      (s.minutes ? "　建议 " + s.minutes + " 分钟" : "");
    try { history.replaceState(null, "", "#p=" + no); } catch (e) { /* file:// 下可能不允许，忽略 */ }
    loadInk();
    renderNotes();
    updateNav();
  }

  function order() { return L.slides.map(function (s) { return s.no; }); }
  function setStep(k, forward) {
    step = Math.max(0, Math.min(page.steps, k));
    stage.querySelectorAll("[data-s]").forEach(function (el) {
      el.classList.toggle("on", Number(el.getAttribute("data-s")) <= step);
    });
    if (page.step) page.step(step, !!forward);
    renderDots();
    updateNav();
  }
  function next() {
    if (step < page.steps) setStep(step + 1, true);
    else nextPage();
  }
  function prev() {
    if (step > 0) setStep(step - 1, false);
    else prevPage();
  }
  function nextPage() { var o = order(), i = o.indexOf(cur); if (i < o.length - 1) go(o[i + 1]); }
  function prevPage() { var o = order(), i = o.indexOf(cur); if (i > 0) go(o[i - 1], 99); }

  function renderDots() {
    var d = $("dots");
    d.innerHTML = "";
    for (var i = 1; i <= page.steps; i++) {
      (function (k) {
        d.appendChild(K.h("i", { cls: k < step ? "done" : k === step ? "cur" : "", attrs: { title: "第" + k + "步" },
          on: { click: function () { setStep(k, k === step + 1); } } }));
      })(i);
    }
  }
  function updateNav() {
    var o = order(), i = o.indexOf(cur);
    $("prevPage").disabled = i <= 0;
    $("nextPage").disabled = i >= o.length - 1;
    $("prevStep").disabled = i <= 0 && step === 0;
    $("nextStep").textContent = step < page.steps ? "下一步 ▶" : "下一页 ▶";
    $("nextStep").disabled = step >= page.steps && i >= o.length - 1;
  }

  // ---------- 距离条（时钟驱动图上距离） ----------
  function bindClock(c) {
    var bar = $("clockBar"), sl = $("tSlider"), out = $("tOut"), play = $("playBtn");
    bar.hidden = !c;
    if (!c) return;
    sl.max = c.tmax;
    var show = function (t) { sl.value = t; out.textContent = "图上 " + K.fmt(Math.round(t * 10) / 10) + " 厘米"; };
    c.on(show);
    c.onstate = function (on) { play.textContent = on ? "⏸" : "▶"; };
    c.speed = Number($("speedSel").value);
    show(c.t);
  }
  $("tSlider").addEventListener("input", function () { if (page.clock) { page.clock.stop(); page.clock.set(Number(this.value)); } });
  $("playBtn").addEventListener("click", function () {
    var c = page.clock;
    if (!c) return;
    if (c.playing) { c.stop(); return; }
    if (c.t >= c.tmax - 1e-6) c.set(0);
    c.to(c.tmax);
  });
  $("speedSel").addEventListener("change", function () { if (page.clock) page.clock.speed = Number(this.value); });

  // ---------- 本地存储（投票等，统一 hv-<slug>- 前缀） ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("hv-geography-rj-7a-1-3:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("hv-geography-rj-7a-1-3:" + k, JSON.stringify(v)); } catch (e) { /* 存储不可用时只在本次打开有效 */ } },
  };

  // ---------- 画笔批注 ----------
  var ctx = ink.getContext("2d"), inkOn = false, color = "#6C2166", strokes = {}, drawing = null;
  function pagesInk() { return strokes[cur] || (strokes[cur] = []); }
  function redraw() {
    ctx.clearRect(0, 0, 1280, 720);
    pagesInk().forEach(function (s) {
      ctx.save();
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.strokeStyle = s.hl ? "#F4D35E" : s.c;
      ctx.globalAlpha = s.hl ? 0.45 : 1;
      ctx.lineWidth = s.hl ? 22 : 4;
      ctx.beginPath();
      s.pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
      ctx.restore();
    });
  }
  function saveInk() { /* 笔迹按页保存在内存里 */ }
  function loadInk() { redraw(); }
  function toStage(e) {
    var r = ink.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * 1280, (e.clientY - r.top) / r.height * 720];
  }
  ink.addEventListener("pointerdown", function (e) {
    if (!inkOn) return;
    ink.setPointerCapture(e.pointerId);
    drawing = { c: color, hl: color === "hl", pts: [toStage(e)] };
    pagesInk().push(drawing);
  });
  ink.addEventListener("pointermove", function (e) { if (drawing) { drawing.pts.push(toStage(e)); redraw(); } });
  ink.addEventListener("pointerup", function () { drawing = null; });
  function togglePen(on) {
    inkOn = on == null ? !inkOn : on;
    ink.classList.toggle("active", inkOn);
    $("penbar").hidden = !inkOn;
    $("penBtn").classList.toggle("on", inkOn);
  }
  $("penBtn").addEventListener("click", function () { togglePen(); });
  document.querySelectorAll(".sw").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".sw").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); color = b.getAttribute("data-color");
    });
  });
  $("penUndo").addEventListener("click", function () { pagesInk().pop(); redraw(); });
  $("penClear").addEventListener("click", function () { strokes[cur] = []; redraw(); });

  // ---------- 教师备注（内存态，不落盘） ----------
  function renderNotes() {
    var boxN = $("notes"), n = L.notes[cur];
    boxN.innerHTML = "";
    if (!n) return;
    boxN.appendChild(K.h("h3", { text: "第" + cur + "页　" + SLIDE[cur].title }));
    [["本页问题", n.goal], ["教师开口", n.open], ["提问与追问", (n.ask || []).join("\n")], ["点击顺序", n.clicks], ["关键困难", n.difficulty], ["过渡", n.transition]]
      .forEach(function (r) {
        boxN.appendChild(K.h("h4", { text: r[0] }));
        String(r[1]).split("\n").forEach(function (line) { boxN.appendChild(K.h("p", { text: line })); });
      });
  }
  function toggleNotes() { $("notes").hidden = !$("notes").hidden; $("notesBtn").classList.toggle("on", !$("notes").hidden); }
  $("notesBtn").addEventListener("click", toggleNotes);

  // ---------- 缩放、全屏、目录 ----------
  function fit() {
    var vp = $("viewport"), s = Math.min(vp.clientWidth / 1280, vp.clientHeight / 720) * 0.97;
    [stage, ink].forEach(function (el) { el.style.transformOrigin = "50% 50%"; el.style.transform = "translate(-50%, -50%) scale(" + s + ")"; });
  }
  window.addEventListener("resize", fit);
  function toggleSide() {
    var app = $("app");
    if (window.innerWidth <= 900) app.classList.toggle("side-open"); else app.classList.toggle("collapsed");
    setTimeout(fit, 320);
  }
  $("toggleSide").addEventListener("click", toggleSide);
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  $("fullBtn").addEventListener("click", toggleFull);
  document.addEventListener("fullscreenchange", function () { setTimeout(fit, 100); });

  $("nextStep").addEventListener("click", next);
  $("prevStep").addEventListener("click", prev);
  $("nextPage").addEventListener("click", nextPage);
  $("prevPage").addEventListener("click", prevPage);

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
    var k = e.key;
    if (k === "ArrowRight" || k === " " || k === "Enter") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (k === "PageDown" || k === "ArrowDown") { e.preventDefault(); nextPage(); }
    else if (k === "PageUp" || k === "ArrowUp") { e.preventDefault(); prevPage(); }
    else if (k === "b" || k === "B") toggleSide();
    else if (k === "d" || k === "D") togglePen();
    else if (k === "n" || k === "N") toggleNotes();
    else if (k === "f" || k === "F") toggleFull();
    else if (k === "Escape") { togglePen(false); if (!$("notes").hidden) toggleNotes(); }
  });

  // ---------- 启动：#p= 深链 ----------
  function fromHash() {
    var m = /p=(\d+)/.exec(location.hash);
    if (m && K.PAGES[Number(m[1])]) return Number(m[1]);
    return 1;
  }
  K.app = { go: go, next: next, prev: prev, get step() { return step; }, get page() { return cur; } };
  buildToc();
  fit();
  go(fromHash());
  window.addEventListener("hashchange", function () { var p = fromHash(); if (p !== cur) go(p); });
})();
