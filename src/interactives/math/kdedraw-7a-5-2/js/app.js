/* 外壳：侧边栏目录（与课件19页一一对应）、分步播放、时钟条、画笔批注、教师备注、缩放与快捷键。 */
(function () {
  "use strict";
  var L = K.L, $ = function (id) { return document.getElementById(id); };
  var GROUPS = [
    { name: "认识", pages: [1, 2] },
    { name: "探究", num: "1", pages: [3] },
    { name: "检测与演示", pages: [4, 5] }
  ];
  var TAGS = { 2: "认识", 3: "探究 · 数一数", 4: "当堂检测" };
  var HANDS_ON = { 2: "点击", 3: "算一算", 4: "连线" };
  var SLIDE = {};
  L.slides.forEach(function (s) { SLIDE[s.no] = s; });
  SLIDE.demo = { no: "demo", title: "演示台", minutes: 0 };

  var stage = $("stage"), ink = $("ink"), cur = null, page = null, step = 0;

  // ---------- 目录 ----------
  function buildToc() {
    var toc = $("toc");
    GROUPS.forEach(function (g) {
      var box = K.h("div", { cls: "grp" });
      box.appendChild(K.h("div", { cls: "grp-h" }, [g.num ? K.h("span", { cls: "num", text: g.num }) : null, g.name]));
      g.pages.forEach(function (no) {
        var s = SLIDE[no], hidden = typeof no === "number" && no > L.main;
        var b = K.h("button", { cls: "item" + (hidden ? " hidden-page" : ""), attrs: { "data-no": no },
          on: { click: function () { go(no); } } }, [
          K.h("span", { cls: "pg", text: typeof no === "number" ? String(no).padStart(2, "0") : "★" }),
          K.h("span", { cls: "tt", text: s.title }),
          HANDS_ON[no] ? K.h("span", { cls: "web", text: HANDS_ON[no] }) : null
        ]);
        box.appendChild(b);
      });
      toc.appendChild(box);
    });
    var sh = $("showHidden");
    sh.addEventListener("change", function () { $("side").classList.toggle("show-hidden", sh.checked); });
  }

  // ---------- 页面 ----------
  function chrome(no) {
    var s = SLIDE[no];
    K.box(stage, 0, 0, null, null, { cls: "pg-tag", text: TAGS[no] || "" });
    K.box(stage, 0, 0, null, null, { cls: "pg-title", text: s.title });
    K.box(stage, 0, 0, null, null, { cls: "pg-rule" });
    K.box(stage, 0, 0, null, null, { cls: "pg-brand", text: "香港中文大学（深圳）基础教育集团 · 校内教学使用" });
    K.box(stage, 0, 0, null, null, { cls: "pg-no", text: typeof no === "number" ? "课件第 " + no + " 页" : "演示台" });
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
    if (active) {
      if (active.classList.contains("hidden-page")) { $("showHidden").checked = true; $("side").classList.add("show-hidden"); }
      active.scrollIntoView({ block: "nearest" });
    }
    var s = SLIDE[no];
    $("crumb").innerHTML = (typeof no === "number" ? "课件第 <b>" + no + "</b> 页 · " : "") + "<b>" + s.title + "</b>" +
      (s.minutes ? "　建议 " + s.minutes + " 分钟" : (typeof no === "number" && no > L.main ? "　（课件隐藏页）" : ""));
    try { history.replaceState(null, "", "#p=" + no); } catch (e) { /* file:// 下可能不允许，忽略 */ }
    loadInk();
    renderNotes();
    updateNav();
  }

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
  function order() {
    var all = [];
    GROUPS.forEach(function (g) { g.pages.forEach(function (p) { all.push(p); }); });
    var showHidden = $("showHidden").checked;
    return all.filter(function (p) { return p === cur || showHidden || !(typeof p === "number" && p > L.main) && p !== "demo"; });
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

  // ---------- 时钟条 ----------
  function bindClock(c) {
    var bar = $("clockBar"), sl = $("tSlider"), out = $("tOut"), play = $("playBtn");
    bar.hidden = !c;
    if (!c) return;
    sl.max = c.tmax;
    var show = function (t) { sl.value = t; out.textContent = "t＝" + K.fmt(Math.round(t * 10) / 10); };
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

  // ---------- 本地存储（投票、学生原话） ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("dongdian:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("dongdian:" + k, JSON.stringify(v)); } catch (e) { /* 存储不可用时只在本次打开有效 */ } }
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

  // ---------- 教师备注 ----------
  function renderNotes() {
    var box = $("notes"), n = L.notes[cur];
    box.innerHTML = "";
    if (!n) { box.appendChild(K.h("p", { text: "演示台：选择轮次，播放或拖动时间，定位追上、相距几米、到奶酪一样远的时刻。" })); return; }
    box.appendChild(K.h("h3", { text: "第" + cur + "页　" + SLIDE[cur].title }));
    [["本页问题", n.goal], ["教师开口", n.open], ["提问与追问", n.ask.join("\n")], ["点击顺序", n.clicks], ["关键困难", n.difficulty], ["过渡", n.transition]]
      .forEach(function (r) {
        box.appendChild(K.h("h4", { text: r[0] }));
        r[1].split("\n").forEach(function (line) { box.appendChild(K.h("p", { text: line })); });
      });
    if (cur === 8 && L.ai_prompt) {
      box.appendChild(K.h("h4", { text: "可选：AI追问提示词（本网页不连接AI）" }));
      var ta = K.h("textarea", { cls: "inp", style: "height:180px;font-size:12px", attrs: { "aria-label": "AI追问提示词" } });
      ta.value = L.ai_prompt;
      box.appendChild(ta);
      box.appendChild(K.h("button", { cls: "btn", text: "复制提示词", style: "margin-top:6px", on: { click: function () {
        ta.select();
        try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand("copy"); }
      } } }));
    }
  }
  function toggleNotes() { $("notes").hidden = !$("notes").hidden; $("notesBtn").classList.toggle("on", !$("notes").hidden); fit(); }
  $("notesBtn").addEventListener("click", toggleNotes);

  // ---------- 2.5D ⇄ 平面图（中考卷面） ----------
  function syncDepthBtn() {
    var b = $("depthBtn"), flat = K.depth < 0.5;
    b.textContent = flat ? "平面图 → 2.5D" : "2.5D → 平面图";
    b.classList.toggle("on", flat);
    b.setAttribute("aria-pressed", flat ? "true" : "false");
  }
  function toggleDepth() { K.setDepth(K.depth < 0.5 ? 1 : 0, true); syncDepthBtn(); }
  $("depthBtn").addEventListener("click", toggleDepth);
  syncDepthBtn();

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
  $("prevPage").addEventListener("click", function () { prevPage(); });

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
    else if (k === "v" || k === "V") toggleDepth();
    else if (k === "Escape") togglePen(false);
  });

  // ---------- 启动：#p=9；兼容旧链接 #tool=explain / record / demo ----------
  function fromHash() {
    var h = location.hash, m = /p=(\w+)/.exec(h);
    if (m) return m[1] === "demo" ? "demo" : Number(m[1]);
    if (/tool=explain/.test(h)) return 9;
    if (/tool=record/.test(h)) return 11;
    if (/tool=demo/.test(h)) return "demo";
    return 1;
  }
  K.app = { go: go, next: next, prev: prev, get step() { return step; }, get page() { return cur; } };
  buildToc();
  fit();
  go(fromHash());
  window.addEventListener("hashchange", function () { var p = fromHash(); if (p !== cur) go(p); });
})();
