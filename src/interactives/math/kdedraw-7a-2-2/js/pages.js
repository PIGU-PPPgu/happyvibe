(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawAxis(root, range, opt) {
    opt = opt || {};
    var el = svg('svg', { viewBox: '0 0 900 170', style: 'width:100%;height:100%;overflow:visible' }, root);
    var X = function (v) { return 450 + v / range * 380; };
    if (opt.origin) svg('circle', { cx: X(0), cy: 85, r: 7, fill: '#6C2166' }, el);
    if (opt.arrow) {
      svg('line', { x1: X(-range), y1: 85, x2: X(range), y2: 85, stroke: '#2B2326', 'stroke-width': 3 }, el);
      svg('polygon', { points: [[X(range) + 14, 85], [X(range) - 8, 76], [X(range) - 8, 94]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
    } else if (opt.line) svg('line', { x1: X(-range), y1: 85, x2: X(range), y2: 85, stroke: '#2B2326', 'stroke-width': 3 }, el);
    if (opt.ticks) for (var v = -range; v <= range; v++) {
      svg('line', { x1: X(v), y1: 77, x2: X(v), y2: 93, stroke: '#2B2326', 'stroke-width': v === 0 ? 3 : 1.6 }, el);
      svg('text', { x: X(v), y: 115, 'text-anchor': 'middle', 'font-size': 14, fill: '#2B2326' }, el).textContent = v;
    }
    if (opt.gap) svg('text', { x: 450, y: 40, 'text-anchor': 'middle', 'font-size': 15, fill: '#C0392B', 'font-weight': 700 }, el).textContent = '缺：' + opt.gap;
    if (opt.pt != null) {
      svg('circle', { cx: X(opt.pt), cy: 85, r: 11, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      svg('text', { x: X(opt.pt), y: 60, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(opt.pt);
    }
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '数轴' }));
    cover.appendChild(h('p', { cls: 'lead', text: '原点 · 正方向 · 单位长度 —— 温度计竖起来就是一条数轴' }));
    var holder = box(cover, 190, 290, 900, 200);
    drawAxis(holder, 6, { origin: 1, arrow: 1, ticks: 1, pt: 2.5 });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.2　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, stageN = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拼三要素</b>——每点一次补一件，缺了它还行吗？' });
    var stage = box(root, 40, 100, 900, 200, { cls: 'mini-stage' });
    var cases = [
      { line: 1, gap: '原点（正负的分界）' },
      { line: 1, origin: 1, gap: '正方向（哪边是正？）' },
      { line: 1, origin: 1, arrow: 1, gap: '单位长度（每格一样长）' },
      { origin: 1, arrow: 1, ticks: 1 },
    ];
    function render() { stage.innerHTML = ''; drawAxis(stage, 6, cases[stageN]); }
    render();
    var btn = box(root, 970, 160, 240, 60, { cls: 'tool', text: '补一件 →' });
    btn.addEventListener('click', function () { stageN = (stageN + 1) % cases.length; render(); });
    box(root, 20, 330, 1240, 100, { cls: 'note-card', html: '<b>三要素：</b>原点（0 的位置）、正方向（箭头，通常向右）、单位长度（均匀刻度）。<span class=\'mut\'>缺一不可——最后一张图才是一条合格的数轴。</span>' });
    return { steps: 3, step: function (k) { stageN = Math.min(k, 3); render(); }, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, pos = 2.5, range = 6;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>描点</b>——点数轴任意位置放金点，读出它表示的数' });
    var stage = box(root, 40, 100, 900, 200, { cls: 'mini-stage' });
    var rb = box(root, 60, 330, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawAxis(stage, range, { origin: 1, arrow: 1, ticks: 1, pt: pos });
      rb.innerHTML = '<span class=\'big\'>金点表示 <b class=\'c-g\'>' + f(pos) + '</b>　在原点' + (pos > 0 ? '右' : pos < 0 ? '左' : '上') + '边 ' + Math.abs(pos) + ' 个单位长度</span><br><span class=\'mut\'>先看方向定符号，再数格数定大小。</span>';
    }
    render();
    stage.style.cursor = 'pointer';
    stage.addEventListener('click', function (e) {
      var r = stage.getBoundingClientRect();
      pos = M.fromX((e.clientX - r.left) / r.width * 900, range, 900);
      pos = Math.max(-range, Math.min(range, pos)); render();
    });
    window.addEventListener('keydown', function (e) {
      if (K.app.page !== 3) return;
      if (e.key === 'ArrowRight') { pos = Math.min(range, pos + 0.5); render(); }
      if (e.key === 'ArrowLeft') { pos = Math.max(-range, pos - 0.5); render(); }
    });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[4] = { build: function (ctx) {
    var root = ctx.root, i = 0, score = 0, qz = L.quiz;
    var qEl = box(root, 120, 90, 1040, 110, { cls: 'note-card' }), opts = box(root, 120, 220, 1040, 240);
    var sc = box(root, 520, 500, 240, 46, { cls: 'pill big-score', text: '答对 0 / ' + qz.length });
    function show() {
      qEl.innerHTML = '<b>第 ' + (i + 1) + ' / ' + qz.length + ' 题</b>　' + qz[i].q; opts.innerHTML = '';
      qz[i].opts.forEach((o, oi) => {
        var b = box(opts, 20 + (oi % 2) * 510, Math.floor(oi / 2) * 90, 490, 70, { cls: 'tool', text: o });
        b.addEventListener('click', function () {
          if (b.classList.contains('ok') || b.classList.contains('bad')) return;
          if (oi === qz[i].a) { b.classList.add('ok'); score++; } else { b.classList.add('bad'); opts.children[qz[i].a].classList.add('ok'); }
          sc.textContent = '答对 ' + score + ' / ' + qz.length;
          box(opts, 20, 190, 1000, 40, { cls: 'strip', text: qz[i].why });
          setTimeout(function () { if (i < qz.length - 1) { i++; show(); } }, 2600);
        });
      });
    }
    show();
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[5] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>同一根数轴</b>——几个关键点' });
    [[-3, ''], [0, ''], [2.5, ''], [5, '']].forEach((cfg, i) => {
      var c = card(root, 60 + i * 290, 120, 260, 200, { s: 1 });
      var holder = box(c, 8, 14, 244, 140);
      drawAxis(holder, 5, { origin: 1, arrow: 1, ticks: 1, pt: cfg[0] });
      box(c, 10, 160, 240, 30, { cls: 'c-name', text: '点 ' + f(cfg[0]) });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
