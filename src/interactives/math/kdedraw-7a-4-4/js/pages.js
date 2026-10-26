(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawBisect(root, deg, bisected) {
    var el = svg('svg', { viewBox: '0 0 900 260', style: 'width:100%;height:100%;overflow:visible' }, root);
    var cx = 300, cy = 210, R = 160, rad = -deg * Math.PI / 180;
    svg('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: '#2B2326', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
    svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(rad), y2: cy + R * Math.sin(rad), stroke: '#2B2326', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
    svg('path', { d: 'M ' + (cx + 52) + ' ' + cy + ' A 52 52 0 0 0 ' + (cx + 52 * Math.cos(rad)) + ' ' + (cy + 52 * Math.sin(rad)), fill: 'rgba(222,170,24,.3)', stroke: '#DEAA18', 'stroke-width': 3.5 }, el);
    if (bisected) {
      var hr = rad / 2;
      svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(hr), y2: cy + R * Math.sin(hr), stroke: '#C0392B', 'stroke-width': 4, 'stroke-dasharray': '10 6' }, el);
      svg('text', { x: cx + 84 * Math.cos(hr), y: cy + 84 * Math.sin(hr) + 6, 'font-size': 15, fill: '#C0392B' }, el).textContent = f(M.half(deg)) + '°';
      svg('text', { x: cx + 84 * Math.cos(rad / 4), y: cy + 84 * Math.sin(rad / 4) + 6, 'font-size': 15, fill: '#1E7F4F' }, el).textContent = f(M.half(deg)) + '°';
    }
    svg('circle', { cx: cx, cy: cy, r: 7, fill: '#2B2326' }, el);
    svg('text', { x: cx, y: 244, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '∠AOB = ' + f(deg) + '°';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '角的比较' }));
    cover.appendChild(h('p', { cls: 'lead', text: '折纸折出的那条线——角平分线' }));
    var holder = box(cover, 190, 300, 900, 280);
    drawBisect(holder, 72, true);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 4.4　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>角的和差</b>——∠AOB 与 ∠BOC 拼出 ∠AOC' });
    var stage = box(root, 40, 90, 900, 300, { cls: 'mini-stage' });
    var a1 = 40, a2 = 30;
    var rb = box(root, 970, 120, 270, 250, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 300', style: 'width:100%;height:100%' }, stage);
      var cx = 300, cy = 260, R = 170;
      svg('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: '#2B2326', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
      var r1 = -a1 * Math.PI / 180, r2 = -(a1 + a2) * Math.PI / 180;
      svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(r1), y2: cy + R * Math.sin(r1), stroke: '#6C2166', 'stroke-width': 5 }, el);
      svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(r2), y2: cy + R * Math.sin(r2), stroke: '#C0392B', 'stroke-width': 5 }, el);
      svg('path', { d: 'M ' + (cx + 60) + ' ' + cy + ' A 60 60 0 0 0 ' + (cx + 60 * Math.cos(r1)) + ' ' + (cy + 60 * Math.sin(r1)), fill: 'rgba(108,33,102,.2)', stroke: '#DEAA18', 'stroke-width': 3 }, el);
      svg('path', { d: 'M ' + (cx + 88 * Math.cos(r1)) + ' ' + (cy + 88 * Math.sin(r1)) + ' A 88 88 0 0 0 ' + (cx + 88 * Math.cos(r2)) + ' ' + (cy + 88 * Math.sin(r2)), fill: 'rgba(222,170,24,.25)', stroke: '#DEAA18', 'stroke-width': 3 }, el);
      svg('text', { x: cx, y: 40, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '∠AOC = ' + f(a1) + '° + ' + f(a2) + '° = ' + f(a1 + a2) + '°';
      rb.innerHTML = '<b>角的和差：</b>∠AOC = ∠AOB + ∠BOC<br><span class=\'mut\'>反过来就是减法。叠合比较：顶点对顶点、始边对始边，看终边位置。</span>';
    }
    render();
    var s1 = box(root, 100, 470, 1080, 70);
    s1.innerHTML = '<label>∠AOB</label><input type=range min=10 max=80 value=40 style=width:30%><label style="margin-left:30px">∠BOC</label><input type=range min=10 max=80 value=30 style=width:30%>';
    var ins = s1.querySelectorAll('input');
    ins[0].addEventListener('input', function (e) { a1 = +e.target.value; render(); });
    ins[1].addEventListener('input', function (e) { a2 = +e.target.value; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, deg = 72;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>角平分线</b>——红色虚线把角分成相等的两半' });
    var stage = box(root, 40, 90, 900, 300, { cls: 'mini-stage' });
    var rb = box(root, 60, 410, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawBisect(stage, deg, true);
      rb.innerHTML = '<b>角平分线：</b>从一个角的顶点引出、把这个角分成相等的两个角的射线。<span class=\'mono\'>∠AOC = ∠BOC = ½∠AOB</span>';
    }
    render();
    var s = box(root, 100, 530, 1080, 60);
    s.innerHTML = '<label>∠AOB</label><input type=range min=10 max=160 value=72 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { deg = +e.target.value; render(); });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>余角补角速查</b>' });
    [[30, '补角 150° / 余角 60°'], [45, '补角 135° / 余角 45°'], [60, '补角 120° / 余角 30°'], [90, '补角 90° / 余角 0°']].forEach((cfg, i) => {
      var c = card(root, 70 + i * 290, 130, 260, 200, { s: 1 });
      var holder = box(c, 8, 12, 244, 130);
      drawBisect(holder, cfg[0], false);
      box(c, 10, 150, 240, 40, { cls: 'c-name', text: cfg[0] + '°：' + cfg[1] });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
