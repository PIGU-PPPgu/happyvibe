/* pages.js — 2.2 数轴 v2（math-bs-7a-2-2）：11 页一个问题世界（糖豆找家）
   核心资产：drawRunway——有厚度的 2.5D 跑道（顶面+正面+右端面+刻度在顶面前缘+数字在正面），
   平面模式（V 键）切换为普通数轴；糖豆（小狗）站在跑道顶面上带影子。
   v2 差额（library-v2-spec §6）：B4 输入题统一 {q,accepts,rejects,why}、答案进 data.js 题库；
   B5 板书页逐条揭示+末条留白；B6 投票键换 hv 前缀；P5/P6/P9 双视图（V）实接 K.setDepth。 */
(function () {
  "use strict";
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  var INK = "#2B2326", PAPER = "#FFFDF8", PURPLE = "#6C2166", GOLD = "#DEAA18", GREEN = "#1E7F4F", RED = "#C0392B";

  /* ———— 2.5D 跑道引擎 ————
     o: {range, min?*, dog(数值|null), dog2, dogColor, arrow, origin, ticks, flat, width}
     返回 {x(v), el} */
  function runway(root, o) {
    o = o || {};
    var range = o.range || 6;
    var W = o.width || 900;
    var el = svg("svg", { viewBox: "0 0 " + W + " 300", style: "width:100%;height:100%;overflow:visible" }, root);
    var x = function (v) { return M.toX(v, range, W, 80); };
    var LX = x(-range), RX = x(range), yT = 168, depth = 34, dskew = 24, frontH = 30;
    var arrowLen = o.arrow === false ? 0 : 34;
    if (o.flat) {
      // 平面模式：普通数轴（中考平面图式）
      var yF = 130;
      svg("line", { x1: LX - 40, y1: yF, x2: RX + arrowLen, y2: yF, stroke: INK, "stroke-width": 4 }, el);
      if (arrowLen) svg("polygon", { points: [[RX + arrowLen + 16, yF], [RX + arrowLen - 8, yF - 9], [RX + arrowLen - 8, yF + 9]].map(function (p) { return p.join(","); }).join(" "), fill: INK }, el);
      for (var v = -range; v <= range; v++) {
        svg("line", { x1: x(v), y1: yF - 8, x2: x(v), y2: yF + 8, stroke: INK, "stroke-width": v === 0 ? 3.4 : 1.8 }, el);
        svg("text", { x: x(v), y: yF + 34, "text-anchor": "middle", "font-size": 16, fill: INK }, el).textContent = v;
      }
      function dotF(v, col, name) {
        svg("circle", { cx: x(v), cy: yF, r: 11, fill: col, stroke: INK, "stroke-width": 2.4 }, el);
        svg("text", { x: x(v), y: yF - 20, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: col }, el).textContent = name || f(v);
      }
      if (o.dog != null) dotF(o.dog, GOLD, o.dogName);
      if (o.dog2 != null) dotF(o.dog2, GREEN, o.dog2Name);
      return { x: x, el: el, y: yF };
    }
    // —— 2.5D：正面（前墙）+ 顶面（有厚度的跑道面）+ 右端面 ——
    svg("polygon", { points: [[LX, yT], [RX + 8, yT], [RX + 8 + dskew, yT - depth], [LX + dskew, yT - depth]].map(function (p) { return p.join(","); }).join(" "),
      fill: PAPER, stroke: INK, "stroke-width": 2.6, "stroke-linejoin": "round" }, el);                       // 顶面
    svg("polygon", { points: [[LX, yT], [RX + 8, yT], [RX + 8, yT + frontH], [LX, yT + frontH]].map(function (p) { return p.join(","); }).join(" "),
      fill: "#EAD9C8", stroke: INK, "stroke-width": 2.6, "stroke-linejoin": "round" }, el);                    // 正面
    svg("polygon", { points: [[RX + 8, yT], [RX + 8 + dskew, yT - depth], [RX + 8 + dskew, yT - depth + frontH], [RX + 8, yT + frontH]].map(function (p) { return p.join(","); }).join(" "),
      fill: "#D9C4AC", stroke: INK, "stroke-width": 2.6, "stroke-linejoin": "round" }, el);                    // 右端面
    // 原点刻度（顶面前缘上的红点）
    if (o.origin !== false) {
      svg("circle", { cx: x(0), cy: yT, r: 6.5, fill: PURPLE, stroke: INK, "stroke-width": 2 }, el);
      svg("text", { x: x(0), y: yT + frontH + 22, "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: INK }, el).textContent = "0（原点）";
    }
    // 箭头（顶面右端，向右上伸出）
    if (arrowLen) {
      svg("line", { x1: RX + 8 + dskew, y1: yT - depth, x2: RX + 8 + dskew + arrowLen, y2: yT - depth - 14, stroke: INK, "stroke-width": 4.5, "stroke-linecap": "round" }, el);
      svg("polygon", { points: [[RX + 8 + dskew + arrowLen + 18, yT - depth - 20], [RX + 8 + dskew + arrowLen - 2, yT - depth - 20], [RX + 8 + dskew + arrowLen + 4, yT - depth - 34]].map(function (p) { return p.join(","); }).join(" "), fill: INK }, el);
    }
    // 均匀刻度：顶面上的短斜线 + 正面上的数字
    if (o.ticks !== false) {
      for (var t = -range; t <= range; t++) {
        if (t === 0) continue;
        var tx = x(t), ty = yT;
        svg("line", { x1: tx, y1: ty - 2, x2: tx + dskew * 0.42, y2: ty - depth * 0.42 - 2, stroke: INK, "stroke-width": t % 1 === 0 ? 2 : 1.2, opacity: .8 }, el);
        if (t % 1 === 0) svg("text", { x: tx + 4, y: yT + frontH - 8, "text-anchor": "middle", "font-size": 15, fill: INK, "font-weight": 600 }, el).textContent = t;
      }
    }
    // 站在跑道上的糖豆（小狗）：影子贴顶面，腿在顶面前缘上方
    function dog(v, col, name, phase) {
      var px = x(v), py = yT - 4;
      svg("ellipse", { cx: px, cy: py, rx: 20, ry: 6, fill: "rgba(43,35,38,.22)" }, el);   // 影子
      var sw = phase != null ? Math.sin(phase) * 7 : 0;                                     // 跑动摆腿
      svg("line", { x1: px - 8, y1: py - 14, x2: px - 8 + sw, y2: py, stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }, el);
      svg("line", { x1: px + 8, y1: py - 14, x2: px + 8 - sw, y2: py, stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }, el);
      svg("ellipse", { cx: px, cy: py - 22, rx: 17, ry: 12, fill: col, stroke: INK, "stroke-width": 2.6 }, el);
      svg("circle", { cx: px + 15, cy: py - 34, r: 9.5, fill: col, stroke: INK, "stroke-width": 2.6 }, el);
      svg("polygon", { points: [[px + 9, py - 41], [px + 11, py - 50], [px + 16, py - 42]].map(function (p) { return p.join(","); }).join(" "), fill: col, stroke: INK, "stroke-width": 2.2 }, el);
      svg("circle", { cx: px + 19, cy: py - 36, r: 1.8, fill: INK }, el);
      svg("line", { x1: px - 16, y1: py - 26, x2: px - 26, y2: py - 32 + (phase != null ? Math.sin(phase * 1.3) * 4 : 0), stroke: col, "stroke-width": 5, "stroke-linecap": "round" }, el);
      svg("text", { x: px, y: py - 58, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: PURPLE }, el).textContent = name || (f(v) + " · 糖豆");
    }
    if (o.dog != null) dog(o.dog, GOLD, o.dogName, o.run ? (o.dog * 1.4) : null);
    if (o.dog2 != null) dog(o.dog2, GREEN, o.dog2Name);
    return { x: x, el: el, y: yT };
  }
  function stage900(root, hgt) { return box(root, 40, 88, 900, hgt || 470, { cls: "mini-stage" }); }
  function strip(root, text) { box(root, 20, 12, 1240, 46, { cls: "strip", html: text }); }
  function sidecard(root, html, y, h) { return box(root, 970, 88, 270, 470, { cls: "note-card", html: html }); }
  /** 把本页的跑道挂进双视图切换（V 键 → K.setDepth 动画逐帧回调 setK） */
  function hookDepth(onFlip) {
    K.lines.push({ setK: function (k) { onFlip(k < 0.5); } });
  }

  /* ═════════ 第1页 封面：糖豆往返跑（自动循环）+ 本课要点 ═════════ */
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: "cover" });
    cover.appendChild(h("h1", { text: "数轴" }));
    cover.appendChild(h("p", { cls: "lead", text: "糖豆的家在原点。它往右跑、往左跑——每一步都落在一条线上。这条线，就是今天的主角。" }));
    var holder = box(cover, 150, 330, 680, 260);
    var dir = 1, v = 0;
    var draw = function () { holder.innerHTML = ""; runway(holder, { range: 6, dog: v, arrow: true, run: true }); };
    draw();
    var iv = setInterval(function () {
      if (!document.body.contains(holder)) { clearInterval(iv); return; }
      v += dir * 0.06;
      if (v > 4.5) dir = -1; if (v < -4.5) dir = 1;
      draw();
    }, 40);
    cover.appendChild(h("div", { cls: "points" }, [
      h("h2", { text: "本课要点" }),
      h("ol", {}, [
        "三要素：原点、正方向、单位长度",
        "描点：先定符号，再数格数",
        "动点：位置 = 起点 + 速度 × 时间",
        "相反数：对称于原点",
        "比大小：右大左小",
      ].map(function (t) { return h("li", { text: t }); })),
      h("div", { cls: "tail", text: "四幕 11 页 · 每页学生动手 · 记录时刻页你来算" }),
    ]));
    cover.appendChild(h("p", { cls: "fig-foot", html: "北师大版七年级上册 · 2.2　<span class='mono'>FIG · 情境引入 · 糖豆找家</span>" }));
    return { steps: 2, step: function () {}, leave: function () { clearInterval(iv); } };
  }};

  /* ═════════ 第2页 温度计放平（变身动画，4 步） ═════════ */
  P[2] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "任务一：<b>温度计放平</b>——竖着放是测温度，放平了呢？每点一下走一步");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 330);
    function draw(angleDeg, withArrow) {
      stage.innerHTML = "";
      var el = svg("svg", { viewBox: "0 0 900 320", style: "width:100%;height:100%" }, stage);
      var cx = 430, cy = 210;
      var rad = angleDeg * Math.PI / 180;
      var ux = Math.cos(rad), uy = -Math.sin(rad);
      var len = 330;
      // 管体（有厚度的圆角矩形沿角度）
      function at(d, off) { return [cx + ux * d - uy * off, cy + uy * d + ux * off]; }
      var w2 = 17;
      var p1 = at(-len / 2, -w2), p2 = at(len / 2, -w2), p3 = at(len / 2, w2), p4 = at(-len / 2, w2);
      svg("polygon", { points: [p1, p2, p3, p4].map(function (p) { return p.join(","); }).join(" "), fill: PAPER, stroke: INK, "stroke-width": 2.6, "stroke-linejoin": "round" }, el);
      // 刻度：0 居中，每 30px 一格
      for (var d = -150; d <= 150; d += 30) {
        var a = at(d, -w2), b = at(d, d === 0 ? -w2 + 16 : -w2 + 9);
        svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: d === 0 ? PURPLE : INK, "stroke-width": d === 0 ? 3 : 1.6 }, el);
        if (angleDeg > 60 || d % 60 === 0) {
          var lbl = at(d, w2 + 16);
          svg("text", { x: lbl[0], y: lbl[1] + 4, "text-anchor": "middle", "font-size": 13, fill: INK }, el).textContent = String(-d / 30);
        }
      }
      if (withArrow) {
        var tip = at(len / 2 + 30, 0);
        svg("polygon", { points: [tip, at(len / 2 + 6, -9), at(len / 2 + 6, 9)].map(function (p) { return p.join(","); }).join(" "), fill: INK }, el);
      }
      svg("circle", { cx: cx, cy: cy, r: 6, fill: PURPLE, stroke: INK, "stroke-width": 2 }, el);
      svg("text", { x: cx + 24, y: cy + 66, "font-size": 15, fill: "#7C7068" }, el).textContent =
        ["温度计：竖着量冷热", "放平 45°……", "完全放平：0 在中间，右边越来越热（正），左边越来越冷（负）", "加上箭头：右边就是正方向"][angleDeg === 90 ? 0 : angleDeg === 45 ? 1 : angleDeg === 0 ? (withArrow ? 3 : 2) : 2];
    }
    var PHASES = [[90, false], [45, false], [0, false], [0, true]];
    function render() { var p = PHASES[step]; draw(p[0], p[1]); }
    render();
    rb.innerHTML = "<b>温度计是竖着的数轴：</b><br>0℃ = 原点<br>零上 = 一侧（规定为正）<br>零下 = 另一侧（负）<br>每一格一样大 = 单位长度<br><span class='mut'>放平之后，它就是数轴。</span>";
    var next = box(root, 970, 580, 270, 54, { cls: "tool", text: "放平一步 →" });
    next.addEventListener("click", function () { step = (step + 1) % 4; render(); });
    return { steps: 4, step: function (k) { step = Math.min(k, 3); render(); }, leave: function () {} };
  }};

  /* ═════════ 第3页 现场投票（条形实时生长，本机保存） ═════════ */
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "任务二：<b>现场投票</b>——" + L.vote.q + "　<span class='mut'>（点选项投票，数据只存在本机）</span>");
    var KEY = "hv-math-bs-7a-2-2-vote";
    var counts = [0, 0, 0, 0];
    try { counts = JSON.parse(localStorage.getItem(KEY)) || counts; } catch (e) {}
    var stage = stage900(root, 470);
    function render() {
      stage.innerHTML = "";
      var total = counts.reduce(function (a, b) { return a + b; }, 0) || 1;
      var el = svg("svg", { viewBox: "0 0 900 380", style: "width:100%;height:100%" }, stage);
      counts.forEach(function (c, i) {
        var y = 40 + i * 88, w2 = c / total * 620;
        svg("rect", { x: 240, y: y, width: Math.max(w2, 6), height: 56, rx: 10,
          fill: i === L.vote.ans ? "rgba(30,127,79,.28)" : "rgba(108,33,102,.14)", stroke: INK, "stroke-width": 2.4 }, el);
        svg("text", { x: 226, y: y + 36, "text-anchor": "end", "font-size": 18, fill: INK }, el).textContent = String.fromCharCode(65 + i) + "　" + L.vote.opts[i];
        svg("text", { x: 254 + Math.max(w2, 6), y: y + 36, "font-size": 19, "font-weight": 700, fill: PURPLE }, el).textContent = c;
      });
    }
    render();
    var btnRow = box(root, 970, 100, 270, 340);
    L.vote.opts.forEach(function (o, i) {
      var b = box(btnRow, 0, i * 84, 270, 68, { cls: "tool", style: "text-align:left", text: String.fromCharCode(65 + i) + "　" + o });
      b.addEventListener("click", function () {
        counts[i]++; try { localStorage.setItem(KEY, JSON.stringify(counts)); } catch (e) {}
        render();
      });
    });
    var clr = box(root, 970, 460, 270, 46, { cls: "tool", text: "清空本机投票" });
    clr.addEventListener("click", function () { counts = [0, 0, 0, 0]; try { localStorage.removeItem(KEY); } catch (e) {} render(); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第4页 三要素拼装（2.5D，逐步点亮） ═════════ */
  P[4] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "任务三：<b>三要素拼装</b>——每点一下补一件，缺一件都不叫数轴");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 340);
    var PH = [
      { line: 1, gap: "缺：原点（0 在哪？）" },
      { line: 1, origin: 1, gap: "缺：正方向（哪边是正？）" },
      { line: 1, origin: 1, arrow: 1, gap: "缺：均匀刻度（每格多长？）" },
      { line: 1, origin: 1, arrow: 1, ticks: 1 },
    ];
    function render() {
      stage.innerHTML = "";
      var p = PH[step];
      runway(stage, { range: 5, arrow: !!p.arrow, origin: !!p.origin, ticks: !!p.ticks });
      if (p.gap) {
        var el2 = stage.querySelector("svg");
        var tip = svg("text", { x: 450, y: 40, "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: RED }, el2);
        tip.textContent = p.gap;
      }
      rb.innerHTML = step < 3
        ? "<b>还差一件：</b>" + p.gap.replace("缺：", "") + "<br><span class='mut'>三要素：原点、正方向、单位长度——缺一不可。</span>"
        : "<b class='c-g'>齐了！这就是数轴。</b><br><span class='mut'>原点定基准、箭头定正方向、均匀刻度定单位长度。</span>";
    }
    render();
    var next = box(root, 970, 580, 270, 54, { cls: "tool", text: "补一件 →" });
    next.addEventListener("click", function () { step = (step + 1) % 4; render(); });
    return { steps: 4, step: function (k) { step = Math.min(k, 3); render(); }, leave: function () {} };
  }};

  /* ═════════ 第5页 描点（点跑道放糖豆，V 切平面） ═════════ */
  P[5] = { build: function (ctx) {
    var root = ctx.root, pos = 2.5, flat = K.depth < 0.5;
    strip(root, "任务四：<b>描点</b>——点跑道任何位置放糖豆；方向键左右微调；V 切平面图");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 340);
    function render() {
      stage.innerHTML = "";
      runway(stage, { range: 6, dog: pos, flat: flat, arrow: true });
      rb.innerHTML = "<b>糖豆站在 " + f(pos) + "</b><br><span class='mut'>" +
        (pos > 0 ? "在原点右边 " + f(pos) + " 个单位长度（正）" : pos < 0 ? "在原点左边 " + f(-pos) + " 个单位长度（负）" : "正好在家：原点") +
        "<br>先看方向定符号，再数格数定大小。" + (flat ? "（平面图：考试画图就画这样）" : "") + "</span>";
    }
    render();
    hookDepth(function (isFlat) { if (isFlat !== flat) { flat = isFlat; render(); } });
    stage.style.cursor = "pointer";
    stage.addEventListener("click", function (e) {
      var r = stage.getBoundingClientRect();
      pos = M.fromX((e.clientX - r.left) / r.width * 900, 6, 900);
      render();
    });
    var keyH = function (e) {
      if (K.app.page !== 5) return;
      if (e.key === "ArrowRight") { pos = Math.min(6, pos + 0.5); render(); }
      if (e.key === "ArrowLeft") { pos = Math.max(-6, pos - 0.5); render(); }
    };
    window.addEventListener("keydown", keyH);
    return { steps: 2, step: function () {}, leave: function () { window.removeEventListener("keydown", keyH); } };
  }};

  /* ═════════ 第6页 糖豆匀速跑（时间条 + V 切平面） ═════════ */
  P[6] = { build: function (ctx) {
    var root = ctx.root, lastT = 0, flat = K.depth < 0.5;
    strip(root, "任务五：<b>糖豆匀速跑</b>——从 −4 出发，每秒跑 2 格。拖时间条或按播放，读它的位置");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 88, 430);
    var D = L.dog;
    function render(t) {
      lastT = t;
      stage.innerHTML = "";
      var p = M.pos(D.start, D.speed, t);
      runway(stage, { range: 7, dog: p, arrow: true, run: true, flat: flat });
      rb.innerHTML = "<b class='mono' style='font-size:20px'>位置 = 起点 + 速度 × 时间</b><br>" +
        "<span class='mono big'>= " + f(D.start) + " + " + f(D.speed) + " · t</span><br><br>" +
        "t = " + f(t) + " 秒时，糖豆在<br><span class='c-g' style='font-size:34px;font-weight:700'>" + f(p) + "</span><br><br>" +
        "<span class='mut'>已跑 " + f(D.speed * t) + " 格。" + (p >= 0 ? "过家（原点）了！" : "还没到家。") + "</span>";
    }
    var ck = new K.Clock(6);
    ck.on(render);
    render(0);
    hookDepth(function (isFlat) { if (isFlat !== flat) { flat = isFlat; render(lastT); } });
    return { steps: 1, step: function () {}, clock: ck, leave: function () {} };
  }};

  /* ═════════ 第7页 记录时刻（学生输入判定，题库见 data.js L.judge） ═════════ */
  P[7] = { build: function (ctx) {
    var root = ctx.root;
    var J = L.judge, D = L.dog, target = 2;
    strip(root, "任务六：<b>记录时刻</b>——糖豆站在 +2 了，那是出发后第几秒？输入你的答案");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 340);
    function render(t, state) {
      stage.innerHTML = "";
      var p = M.pos(D.start, D.speed, t);
      runway(stage, { range: 7, dog: p, arrow: true });
      rb.innerHTML = "<b>逆向想：</b>从 −4 到 " + f(target) + "，糖豆跑了 " + f(target - D.start) + " 格<br>每秒 2 格 → 时间 = <span class='mono'>" + f((target - D.start) / D.speed) + "</span> 秒" +
        (state === true ? "<br><b class='c-ok'>对了</b>" : state === false ? "<br><b class='c-r'>再想想：先算跑了多少格</b>" : "");
    }
    render(0, null);
    var inp = box(root, 970, 88, 270, 0, { cls: "note-card" });
    inp.innerHTML = "<label style='font-size:15px'>第几秒？</label><br><input class='inp' style='width:150px;font-size:22px;margin-top:8px' inputmode='numeric'><button class='tool' style='margin-top:10px;display:block'>检查</button><div class='fb'></div>";
    var input = inp.querySelector("input"), fb = inp.querySelector(".fb"), btn = inp.querySelector(".tool");
    function judge() {
      var okInp = M.checkInput(input.value, J.accepts);
      var t = okInp ? (target - D.start) / D.speed : Math.max(0, parseFloat(M.normalize(input.value)) || 0);
      render(t, okInp);
      fb.innerHTML = okInp
        ? "<b class='c-ok'>对了</b>　" + J.why
        : "<b class='c-r'>再想想</b>：" + J.why.split("：")[0] + "……";
    }
    btn.addEventListener("click", judge);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") judge(); });
    var reveal = box(root, 970, 300, 270, 54, { cls: "tool", text: "让糖豆跑到 +2" });
    reveal.addEventListener("click", function () { render(3, true); });
    return { steps: 2, step: function (k) { render(k * 3, null); }, leave: function () {} };
  }};

  /* ═════════ 第8页 相反数 · 对称折（3 步） ═════════ */
  P[8] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "任务七：<b>相反数</b>——只有符号不同的两个数，站在原点两侧对称的位置");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 340);
    function render() {
      stage.innerHTML = "";
      var o = { range: 6, arrow: true };
      if (step >= 1) o.dog = 3, o.dogName = "+3";
      if (step >= 2) o.dog2 = -3, o.dog2Name = "−3";
      runway(stage, o);
      if (step >= 2) {
        var el2 = stage.querySelector("svg");
        svg("path", { d: "M " + M.toX(3, 6, 900, 80) + " 96 Q " + M.toX(0, 6, 900, 80) + " 40 " + M.toX(-3, 6, 900, 80) + " 96", fill: "none", stroke: RED, "stroke-width": 3, "stroke-dasharray": "8 6" }, el2);
        svg("text", { x: M.toX(0, 6, 900, 80), y: 34, "text-anchor": "middle", "font-size": 15, fill: RED, "font-weight": 700 }, el2).textContent = "关于原点对称";
      }
      rb.innerHTML = step === 0 ? "<b>先放 +3：</b>糖豆在原点右边 3 格。"
        : step === 1 ? "<b>沿原点折过去</b>——对称点是谁？<br><span class='mut'>距离原点也是 3 格，但方向相反。</span>"
        : "<b>+3 与 −3 互为相反数</b>：只有符号不同，到原点的距离都是 3。<span class='mut'>糖豆换了个方向看家，离家一样远。</span>";
    }
    render();
    var next = box(root, 970, 580, 270, 54, { cls: "tool", text: "下一步 →" });
    next.addEventListener("click", function () { step = (step + 1) % 3; render(); });
    return { steps: 3, step: function (k) { step = Math.min(k, 2); render(); }, leave: function () {} };
  }};

  /* ═════════ 第9页 右大左小（拖 A/B 比较，V 切平面） ═════════ */
  P[9] = { build: function (ctx) {
    var root = ctx.root, a = -4, b = -1, drag = null, flat = K.depth < 0.5;
    strip(root, "任务八：<b>右大左小</b>——拖 A、B 两颗糖豆，谁在右边谁大（V 切平面）");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 100, 340);
    function render() {
      stage.innerHTML = "";
      runway(stage, { range: 6, dog: a, dogName: "A=" + f(a), dogColor: GOLD, dog2: b, dog2Name: "B=" + f(b), dog2Color: GREEN, flat: flat, arrow: true });
      rb.innerHTML = "<b>结论：</b>A " + M.cmp(a, b) + " B　<span class='mut'>（" + f(a) + " " + M.cmp(a, b) + " " + f(b) + "）</span><br><span class='mut'>" +
        (a < 0 && b < 0 ? "两个都在负半场：离原点越远越靠左、数越小——「绝对值大的反而小」。" : "数轴上的点越靠右，表示的数越大。") + "</span>";
    }
    render();
    hookDepth(function (isFlat) { if (isFlat !== flat) { flat = isFlat; render(); } });
    stage.style.cursor = "pointer";
    stage.addEventListener("pointerdown", function (e) {
      var r = stage.getBoundingClientRect();
      var v = M.fromX((e.clientX - r.left) / r.width * 900, 6, 900);
      drag = Math.abs(v - a) <= Math.abs(v - b) ? "a" : "b";
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var r = stage.getBoundingClientRect();
      var v = M.fromX((e.clientX - r.left) / r.width * 900, 6, 900);
      if (drag === "a") a = v; else b = v;
      render();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第10页 当堂检测（输入 + 选择混合；错答反馈指向 why 第一步） ═════════ */
  P[10] = { build: function (ctx) {
    var root = ctx.root;
    strip(root, "当堂检测：<b>前两题输入，后两题选择</b>");
    var done = 0, score = 0, total = L.check.length + 2;
    var sc = box(root, 520, 640, 240, 42, { cls: "pill big-score", text: "得分 0 / " + total });
    L.check.forEach(function (c, i) {
      var row = card(root, 80, 150 + i * 118, 640, 106, { cls: "note-card" });
      row.innerHTML = "<b>第" + (i + 1) + "题</b>　" + c.q;
      var inp = box(row, 26, 54, 620, 0);
      inp.innerHTML = "<input class='inp' style='width:140px;font-size:18px' inputmode='text'><button class='tool' style='margin-left:10px'>检查</button><span class='fb' style='margin-left:12px'></span>";
      var input = inp.querySelector("input"), btn = inp.querySelector(".tool"), fb = inp.querySelector(".fb");
      function judge() {
        if (fb.textContent) return;
        if (M.checkInput(input.value, c.accepts)) {
          input.classList.add("ok");
          fb.innerHTML = "<b class='c-ok'>对</b>　<span class='mut'>" + c.why + "</span>";
          score++;
        } else {
          input.classList.add("bad");
          fb.innerHTML = "<b class='c-r'>错</b>　提示：" + c.why.split(/[：;；]/)[0] + "……";
        }
        done++; sc.textContent = "得分 " + score + " / " + total;
      }
      btn.addEventListener("click", judge);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") judge(); });
    });
    L.quiz.slice(0, 2).forEach(function (q, qi) {
      var col = card(root, 760, 150 + qi * 244, 480, 232, { cls: "note-card" });
      col.innerHTML = "<b>第" + (3 + qi) + "题</b>　" + q.q;
      var opts = box(col, 14, 54, 452, 0);
      var whyEl = null;
      q.opts.forEach(function (o, oi) {
        var b = box(opts, 0, oi * 32, 452, 30, { cls: "tool", style: "text-align:left;padding:4px 12px;font-size:14px", text: o });
        b.addEventListener("click", function () {
          if (b.classList.contains("ok") || b.classList.contains("bad")) return;
          if (oi === q.a) { b.classList.add("ok"); score++; }
          else { b.classList.add("bad"); opts.children[q.a].classList.add("ok"); }
          if (!whyEl) {
            whyEl = h("div", { cls: "fb", style: "margin-top:8px;font-size:13px;line-height:1.5", html: "<b class='c-ok'>为什么：</b>" + q.why });
            opts.appendChild(whyEl);
          }
          done++; sc.textContent = "得分 " + score + " / " + total;
        });
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};

  /* ═════════ 第11页 板书设计（逐条揭示 + 末条留白先说后看） ═════════ */
  P[11] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    strip(root, "板书设计：<b>数轴</b>——一图三要素一规则；每点下一步出一条，最后一条先说后看");
    var stage = stage900(root, 470);
    var rb = sidecard(root, "", 88, 300);
    var items = [
      ["三要素", "原点 · 正方向 · 单位长度（刻度均匀）"],
      ["描点", "先定符号（看方向），再数格数"],
      ["动点", "位置 = 起点 + 速度 × 时间"],
      ["相反数", "只有符号不同，对称于原点"],
      ["比大小", "右大左小；负数绝对值大的反而小"],
    ];
    function render() {
      stage.innerHTML = "";
      var el = svg("svg", { viewBox: "0 0 900 470", style: "width:100%;height:100%" }, stage);
      var y = 120;
      svg("polygon", { points: [[110, y], [790, y], [814, y - 30], [134, y - 30]].map(function (p) { return p.join(","); }).join(" "), fill: PAPER, stroke: INK, "stroke-width": 2.6 }, el);
      svg("polygon", { points: [[110, y], [790, y], [790, y + 26], [110, y + 26]].map(function (p) { return p.join(","); }).join(" "), fill: "#EAD9C8", stroke: INK, "stroke-width": 2.6 }, el);
      svg("circle", { cx: 450, cy: y, r: 6, fill: PURPLE, stroke: INK, "stroke-width": 2 }, el);
      svg("text", { x: 450, y: y + 44, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: INK }, el).textContent = "0";
      for (var t = -4; t <= 4; t++) if (t) {
        var tx = 450 + t * 80;
        svg("line", { x1: tx, y1: y - 2, x2: tx + 10, y2: y - 13, stroke: INK, "stroke-width": 1.8 }, el);
        svg("text", { x: tx + 2, y: y + 19, "text-anchor": "middle", "font-size": 14, fill: INK }, el).textContent = t;
      }
      svg("line", { x1: 814, y1: y - 30, x2: 844, y2: y - 45, stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }, el);
      if (step === 0) {
        svg("text", { x: 450, y: 60, "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: PURPLE }, el).textContent = "点「出一条」，把今天的结论一条条请上黑板";
      }
      items.forEach(function (it, i) {
        var show = step >= i + 1;
        if (!show) return;
        var yy = 215 + i * 48;
        var isBlankLast = (i === items.length - 1 && step < 6);
        svg("rect", { x: 70, y: yy - 24, width: 122, height: 38, rx: 10, fill: GOLD, opacity: .5, stroke: INK, "stroke-width": 2 }, el);
        svg("text", { x: 131, y: yy + 2, "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: INK }, el).textContent = it[0];
        if (isBlankLast) {
          svg("line", { x1: 214, y1: yy + 8, x2: 560, y2: yy + 8, stroke: INK, "stroke-width": 2, "stroke-dasharray": "7 6" }, el);
          svg("text", { x: 214, y: yy - 6, "font-size": 15, "font-weight": 700, fill: RED }, el).textContent = "先说：比大小怎么说？说完点下一步对照";
        } else {
          svg("text", { x: 214, y: yy + 2, "font-size": 17, fill: INK }, el).textContent = it[1];
        }
      });
      rb.innerHTML = step === 0 ? "<b>逐条揭示：</b>每点「出一条」多一条板书。"
        : step < 5 ? "<b>已出 " + step + " 条。</b><br><span class='mut'>对照前面几页的结论，一条条收上来。</span>"
        : step === 5 ? "<b>末条留白。</b><br><span class='mut'>让学生先说比大小，说完再点下一步对照。</span>"
        : "<b>五条齐了。</b><br><span class='mut'>拍照留存，对照课本 2.2 节。</span>";
    }
    render();
    var next = box(root, 970, 580, 270, 54, { cls: "tool", text: "出一条 →" });
    next.addEventListener("click", function () { step = (step + 1) % 7; render(); });
    return { steps: 6, step: function (k) { step = Math.min(k, 6); render(); }, leave: function () {} };
  }};
})();
