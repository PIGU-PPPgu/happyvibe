(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawDog(root, home, pos, range) {
    var el = svg('svg', { viewBox: '0 0 900 190', style: 'width:100%;height:100%;overflow:visible' }, root);
    var X = function (v) { return 450 + v / range * 400; };
    svg('line', { x1: X(-range), y1: 120, x2: X(range), y2: 120, stroke: '#2B2326', 'stroke-width': 3 }, el);
    svg('polygon', { points: [[X(range), 120], [X(range) - 16, 112], [X(range) - 16, 128]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
    for (var v = -range; v <= range; v++) {
      svg('line', { x1: X(v), y1: 112, x2: X(v), y2: 128, stroke: '#2B2326', 'stroke-width': v === 0 ? 3 : 1.6 }, el);
      svg('text', { x: X(v), y: 150, 'text-anchor': 'middle', 'font-size': 14, fill: '#2B2326' }, el).textContent = v;
    }
    svg('rect', { x: X(home) - 22, y: 58, width: 44, height: 44, fill: '#F3ECDD', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('polygon', { points: [[X(home) - 27, 58], [X(home), 34], [X(home) + 27, 58]].map(p => p.join(',')).join(' '), fill: '#C0392B', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    if (pos !== home) {
      svg('line', { x1: X(home), y1: 96, x2: X(pos), y2: 96, stroke: '#1E7F4F', 'stroke-width': 5, 'stroke-dasharray': '7 5' }, el);
      svg('text', { x: (X(home) + X(pos)) / 2, y: 86, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#1E7F4F' }, el).textContent = '距离 ' + Math.abs(pos - home);
    }
    var gx = X(pos), gy = 120;
    svg('ellipse', { cx: gx, cy: gy + 4, rx: 17, ry: 5, fill: 'rgba(43,35,38,.18)' }, el);
    svg('circle', { cx: gx, cy: gy - 18, r: 12, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('circle', { cx: gx + 8, cy: gy - 26, r: 7, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.2 }, el);
    svg('polygon', { points: [[gx - 4, gy - 30], [gx - 2, gy - 38], [gx + 1, gy - 30]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
    svg('polygon', { points: [[gx + 6, gy - 30], [gx + 9, gy - 38], [gx + 12, gy - 30]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
    svg('text', { x: gx, y: gy + 24, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(pos);
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '绝对值' }));
    cover.appendChild(h('p', { cls: 'lead', text: '小狗离家 3 米——家可能在原点两侧。距离，就是绝对值' }));
    var holder = box(cover, 190, 300, 900, 220);
    drawDog(holder, 0, 3, 6);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.3　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, pos = 3, range = 6;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖小狗</b>——读数板上的三个数怎样变？' });
    var stage = box(root, 40, 90, 900, 220, { cls: 'mini-stage' });
    var rb = box(root, 60, 330, 860, 120, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawDog(stage, L.home, pos, range);
      rb.innerHTML = '<span class=\'big\'>小狗在 <b>' + f(pos) + '</b>　到家的距离 <b class=\'c-g\'>|' + f(pos) + '| = ' + Math.abs(pos) + '</b></span><br>' +
        '<span class=\'mut\'>' + (pos < 0 ? '在原点左边，数是负的；距离不带符号' : pos > 0 ? '在原点右边，数是正的；距离不带符号' : '小狗在家，距离为 0') + '</span>';
    }
    render();
    var tip = box(root, 60, 470, 860, 60, { cls: 'strip', text: '点数轴任意位置放小狗（原点两侧都试试）；方向键左右微调' });
    stage.style.cursor = 'pointer';
    stage.addEventListener('click', function (e) {
      var r = stage.getBoundingClientRect();
      var v = Math.round(((e.clientX - r.left) / r.width * 900 - 450) / 400 * range);
      pos = Math.max(-range, Math.min(range, v)); render();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' && K.app.page === 2) { pos = Math.min(range, pos + 1); render(); }
      if (e.key === 'ArrowLeft' && K.app.page === 2) { pos = Math.max(-range, pos - 1); render(); }
    });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, a = -4, b = -2, range = 6;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>两个负数比大小</b>——拖 A、B 两个点，谁在右边谁大' });
    var stage = box(root, 40, 90, 900, 220, { cls: 'mini-stage' });
    var rb = box(root, 60, 330, 860, 110, { cls: 'note-card' });
    var drag = null;
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 190', style: 'width:100%;height:100%;overflow:visible' }, stage);
      var X = function (v) { return 450 + v / range * 400; };
      svg('line', { x1: X(-range), y1: 110, x2: X(range), y2: 110, stroke: '#2B2326', 'stroke-width': 3 }, el);
      for (var v = -range; v <= range; v++) { svg('line', { x1: X(v), y1: 102, x2: X(v), y2: 118, stroke: '#2B2326', 'stroke-width': v === 0 ? 3 : 1.4 }, el); svg('text', { x: X(v), y: 140, 'text-anchor': 'middle', 'font-size': 13, fill: '#2B2326' }, el).textContent = v; }
      [[a, 'A', '#6C2166'], [b, 'B', '#C0392B']].forEach(pt => {
        var gx = X(pt[0]);
        svg('circle', { cx: gx, cy: 110, r: 13, fill: pt[2], stroke: '#2B2326', 'stroke-width': 2.4, style: 'cursor:grab' }, el);
        svg('text', { x: gx, y: 84, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: pt[2] }, el).textContent = pt[1] + '=' + f(pt[0]);
      });
      var win = a > b ? 'A' : b > a ? 'B' : '一样大';
      rb.innerHTML = '<span class=\'big\'>|A| = ' + Math.abs(a) + '　|B| = ' + Math.abs(b) + '　→　<b class=\'c-g\'>' + win + ' 大</b></span><br>' +
        '<span class=\'mut\'>两个负数，绝对值大的反而小（离原点越远越靠左）。</span>';
    }
    render();
    stage.addEventListener('pointerdown', function (e) {
      var r = stage.getBoundingClientRect();
      var v = Math.round(((e.clientX - r.left) / r.width * 900 - 450) / 400 * range);
      drag = Math.abs(v - a) <= Math.abs(v - b) ? 'a' : 'b';
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var r = stage.getBoundingClientRect();
      var v = Math.round(((e.clientX - r.left) / r.width * 900 - 450) / 400 * range);
      v = Math.max(-range, Math.min(range, v));
      if (drag === 'a') a = v; else b = v;
      render();
    });
    window.addEventListener('pointerup', function () { drag = null; });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[4] = { build: function (ctx) {
    var root = ctx.root, i = 0, score = 0;
    var qz = L.quiz, qEl = box(root, 120, 90, 1040, 110, { cls: 'note-card' }), opts = box(root, 120, 220, 1040, 240);
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>对称的小狗</b>——±3 的狗离家一样远' });
    [[3, '右侧'], [-3, '左侧'], [5, '远处'], [-5, '远处左']].forEach((cfg, i) => {
      var c = card(root, 60 + i * 290, 110, 260, 240, { s: 1 });
      var holder = box(c, 10, 14, 240, 150);
      drawDog(holder, 0, cfg[0], 6);
      box(c, 10, 180, 240, 36, { cls: 'c-name', text: cfg[1] + '：|' + f(cfg[0]) + '| = ' + Math.abs(cfg[0]) });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
