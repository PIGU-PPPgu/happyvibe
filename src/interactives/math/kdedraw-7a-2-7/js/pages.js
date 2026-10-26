(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawWalk(root, v, t, range) {
    var el = svg('svg', { viewBox: '0 0 900 200', style: 'width:100%;height:100%;overflow:visible' }, root);
    var X = function (p) { return 450 + p / range * 400; };
    svg('line', { x1: X(-range), y1: 130, x2: X(range), y2: 130, stroke: '#2B2326', 'stroke-width': 3 }, el);
    svg('polygon', { points: [[X(range) + 14, 130], [X(range) - 8, 122], [X(range) - 8, 138]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
    for (var q = -range; q <= range; q++) { svg('line', { x1: X(q), y1: 122, x2: X(q), y2: 138, stroke: '#2B2326', 'stroke-width': q === 0 ? 3 : 1.4 }, el); svg('text', { x: X(q), y: 160, 'text-anchor': 'middle', 'font-size': 13, fill: '#2B2326' }, el).textContent = q; }
    var p = M.pos(v, t);
    svg('rect', { x: Math.min(X(0), X(p)), y: 96, width: Math.abs(X(p) - X(0)), height: 14, fill: v * t >= 0 ? 'rgba(222,170,24,.5)' : 'rgba(108,33,102,.35)' }, el);
    svg('circle', { cx: X(p), cy: 130, r: 12, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('text', { x: X(p), y: 110, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(p);
    svg('text', { x: 60, y: 40, 'font-size': 15, fill: '#2B2326' }, el).textContent = '速度 ' + f(v) + ' × 时间 ' + f(t) + ' = ' + f(p);
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '有理数的乘法' }));
    cover.appendChild(h('p', { cls: 'lead', text: '速度 × 时间：向右为正、向前为正，四个象限的答案' }));
    var holder = box(cover, 190, 300, 900, 220);
    drawWalk(holder, 2, 3, 8);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.7　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, v = 2, t = 3, range = 8;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>翻转符号</b>——分别翻转速度与时间的符号，看积的符号' });
    var stage = box(root, 40, 90, 900, 230, { cls: 'mini-stage' });
    var rb = box(root, 60, 340, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawWalk(stage, v, t, range);
      rb.innerHTML = '<span class=\'big\'>(' + f(v) + ') × (' + f(t) + ') = <b class=\'c-g\'>' + f(M.pos(v, t)) + '</b></span>　<span class=\'mut\'>同号得正、异号得负，绝对值相乘。</span>';
    }
    render();
    var btns = box(root, 60, 470, 860, 54);
    [['速度翻转', function () { v = -v; render(); }], ['时间倒放', function () { t = -t; render(); }], ['复位', function () { v = 2; t = 3; render(); }]].forEach((c, i) => {
      var b = box(btns, i * 180, 0, 160, 44, { cls: 'tool', text: c[0] });
      b.addEventListener('click', c[1]);
    });
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>为什么负负得正？</b>——规律外推' });
    var rows = [['2×3=6', '2×2=4', '2×1=2', '2×0=0', '2×(-1)=−2', '每步减 2'],
                ['1×(-1)=-1', '0×(-1)=0', '(-1)×(-1)=?', '', '', '每步加 1']];
    var tb = box(root, 80, 100, 1100, 200, { s: 1 });
    K.table(tb, 0, 0, [['规律']].concat(rows.map(r => [r.join('　|　')])), [1100]);
    box(root, 80, 330, 1100, 140, { cls: 'note-card', s: 2, html: '<b>两种解释：</b>① 乘法对加法的分配律保持一致：(-1)×(-1) + (-1)×1 = (-1)×[(-1)+1] = 0，所以 (-1)×(-1) = 1；② 视频倒放：以 -2 m/s 倒放 3 秒前（-3 s），人在 +6——向反方向的反方向 = 向正方向。' });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>四种组合</b>——(+v,+t) (+v,−t) (−v,+t) (−v,−t)' });
    [[2, 3], [2, -3], [-2, 3], [-2, -3]].forEach((cfg, i) => {
      var c = card(root, 60 + i * 290, 120, 260, 220, { s: 1 });
      var holder = box(c, 8, 12, 244, 150);
      drawWalk(holder, cfg[0], cfg[1], 8);
      box(c, 10, 175, 240, 34, { cls: 'c-name', text: '(' + f(cfg[0]) + ')×(' + f(cfg[1]) + ') = ' + f(cfg[0] * cfg[1]) });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
