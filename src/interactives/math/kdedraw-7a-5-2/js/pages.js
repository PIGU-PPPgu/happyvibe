(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawBalance(root, l, r, cAdd) {
    var el = svg('svg', { viewBox: '0 0 900 250', style: 'width:100%;height:100%;overflow:visible' }, root);
    var cx = 450, tilt = (l - r) * 0.04; tilt = Math.max(-0.13, Math.min(0.13, tilt));
    var bal = Math.abs(l - r) < 1e-9;
    function weights(x, y, n, col) {
      for (var i = 0; i < Math.min(Math.abs(n), 9); i++)
        svg('rect', { x: x - Math.min(Math.abs(n), 9) * 13 + i * 26, y: y - 34, width: 22, height: 34, rx: 4, fill: col, stroke: '#2B2326', 'stroke-width': 2 }, el);
    }
    svg('rect', { x: cx - 14, y: 40, width: 28, height: 28, fill: '#2B2326' }, el);
    svg('line', { x1: cx - 120, y1: 68, x2: cx + 120, y2: 68, stroke: '#2B2326', 'stroke-width': 5, transform: 'rotate(' + (tilt * 57.3) + ' ' + cx + ' 68)' }, el);
    [[cx - 120, l, '左', '#6C2166'], [cx + 120, r, '右', '#DEAA18']].forEach(function (arm) {
      var px = arm[0], py = 68 + (px < cx ? -1 : 1) * tilt * 120;
      svg('rect', { x: px - 55, y: py + 12, width: 110, height: 14, rx: 5, fill: '#9C7A4C', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      weights(px, py + 12, arm[1], arm[3]);
      svg('text', { x: px, y: py + 52, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(arm[1]);
    });
    if (cAdd) svg('text', { x: cx, y: 30, 'text-anchor': 'middle', 'font-size': 16, fill: '#1E7F4F', 'font-weight': 700 }, el).textContent = '两边同' + (cAdd > 0 ? '加 ' : '减 ') + Math.abs(cAdd) + '：' + f(l) + ' = ' + f(r);
    svg('text', { x: cx, y: 225, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: bal ? '#1E7F4F' : '#C0392B' }, el).textContent = bal ? '仍然平衡 ✓' : '不平衡 ✗';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '等式的基本性质' }));
    cover.appendChild(h('p', { cls: 'lead', text: '天平两边做同样的事——平衡不会被打破' }));
    var holder = box(cover, 190, 300, 900, 280);
    drawBalance(holder, 8, 8, 0);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 5.2　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, eq = { l: 8, r: 8 }, hist = ['x + 3 = 7（两边都是 8 个砝码）'];
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>同加减</b>——两边加/减同一个数，天平仍平；同减 3 就解出 x' });
    var stage = box(root, 40, 90, 900, 270, { cls: 'mini-stage' });
    var rb = box(root, 970, 120, 270, 330, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawBalance(stage, eq.l, eq.r, 0);
      rb.innerHTML = '<b>操作记录：</b><br>' + hist.map(s => '<span class=\'mono\'>' + s + '</span>').join('<br>');
    }
    render();
    [[ '+1', 1], ['+2', 2], ['−1', -1], ['−3', -3]].forEach(function (op, i) {
      var b = box(root, 100 + i * 160, 400, 140, 48, { cls: 'tool', text: '两边' + op[0] });
      b.addEventListener('click', function () {
        eq = M.apply1(eq, op[1]);
        hist.push('两边同' + (op[1] > 0 ? '加 ' : '减 ') + Math.abs(op[1]) + ' → ' + f(eq.l) + ' = ' + f(eq.r));
        render();
      });
    });
    var reset = box(root, 100, 470, 140, 44, { cls: 'tool', text: '复位' });
    reset.addEventListener('click', function () { eq = { l: 8, r: 8 }; hist = ['x + 3 = 7']; render(); });
    box(root, 280, 470, 700, 60, { cls: 'note-card', html: '<b>性质 1：</b>等式两边都加（或减）同一个数，结果仍是等式。' });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, eq = { l: 5, r: 5 }, c = 2;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>同乘除</b>——乘一个数放大两边；除以 0 不行！' });
    var stage = box(root, 40, 90, 900, 270, { cls: 'mini-stage' });
    var rb = box(root, 970, 120, 270, 330, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawBalance(stage, eq.l, eq.r, 0);
      rb.innerHTML = '<b>当前：</b>' + f(eq.l) + ' = ' + f(eq.r) + '<br><span class=\'mut\'>选一个倍数按下去。除以 0 会怎样？——没有天平能除以 0，无意义。</span>';
    }
    render();
    [['×2', 2], ['×3', 3], ['÷2', 0.5], ['÷5', 0.2]].forEach(function (op, i) {
      var b = box(root, 100 + i * 160, 400, 140, 48, { cls: 'tool', text: '两边' + op[0] });
      b.addEventListener('click', function () {
        var ne = M.apply2(eq, op[1]);
        if (ne) { eq = ne; rb.innerHTML = '<b>当前：</b>' + f(eq.l) + ' = ' + f(eq.r); render(); }
        else rb.innerHTML = '<b class=\'bad\'>除以 0 无意义！</b>';
      });
    });
    var reset = box(root, 100, 470, 140, 44, { cls: 'tool', text: '复位' });
    reset.addEventListener('click', function () { eq = { l: 5, r: 5 }; render(); });
    box(root, 280, 470, 700, 60, { cls: 'note-card', html: '<b>性质 2：</b>等式两边同乘一个数、或同除以一个<b>不为 0</b> 的数，仍是等式。' });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>性质用一遍</b>——从 x + 3 = 7 走到 x = 4' });
    var steps = [['x + 3 = 7', '原方程'], ['x + 3 − 3 = 7 − 3', '性质 1：两边同减 3'], ['x = 4', '解出来了']];
    var cards = steps.map(function (s, i) {
      return box(root, 120, 120 + i * 110, 1040, 90, { cls: 'note-card', s: i + 1, html: '<b>第' + (i + 1) + '步</b>　<span class=\'mono big\'>' + s[0] + '</span>　<span class=\'mut\'>' + s[1] + '</span>' });
    });
    box(root, 120, 460, 1040, 90, { cls: 'note-card', s: 3, html: '<b>为什么敢两边同减？</b>因为等式说的是"一样重"——同样的操作作用在一样重的东西上，结果当然还一样重。这就是天平的意义。' });
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
})();
