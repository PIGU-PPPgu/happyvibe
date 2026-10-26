(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawThree(root, kind) {
    var el = svg('svg', { viewBox: '0 0 900 220', style: 'width:100%;height:100%;overflow:visible' }, root);
    var y = 110;
    function dot(x) { svg('circle', { cx: x, cy: y, r: 9, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2.4 }, el); }
    function label(t, x) { svg('text', { x: x, y: y + 42, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#6C2166' }, el).textContent = t; }
    if (kind === 'seg') {
      svg('line', { x1: 200, y1: y, x2: 700, y2: y, stroke: '#2B2326', 'stroke-width': 4 }, el);
      dot(200); dot(700); label('A', 200); label('B', 700);
      svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = '2 个端点 · 不可延伸 · 可量长度';
    } else if (kind === 'ray') {
      svg('line', { x1: 200, y1: y, x2: 890, y2: y, stroke: '#2B2326', 'stroke-width': 4 }, el);
      svg('polygon', { points: [[900, y], [878, y - 9], [878, y + 9]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
      dot(200); label('A', 200);
      svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = '1 个端点 · 向一方无限延伸';
    } else {
      svg('line', { x1: 20, y1: y, x2: 880, y2: y, stroke: '#2B2326', 'stroke-width': 4 }, el);
      svg('polygon', { points: [[900, y], [878, y - 9], [878, y + 9]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
      svg('polygon', { points: [[0, y], [22, y - 9], [22, y + 9]].map(p => p.join(',')).join(' '), fill: '#2B2326' }, el);
      dot(260); dot(640); label('A', 260); label('B', 640);
      svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = '无端点 · 向两方无限延伸 · 两点确定它';
    }
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '线段、射线、直线' }));
    cover.appendChild(h('p', { cls: 'lead', text: '琴弦 · 光束 · 铁轨 —— 端点与延伸的三重奏' }));
    var tabs = [['seg', '线段'], ['ray', '射线'], ['line', '直线']];
    tabs.forEach((t, i) => {
      var holder = box(cover, 100 + i * 370, 280, 340, 230, { s: 1 });
      drawThree(holder, t[0]);
    });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 4.1　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, cur = 0;
    var KINDS = [['seg', '线段'], ['ray', '射线'], ['line', '直线']];
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>切换三线</b>——数一数端点，比一比延伸' });
    var stage = box(root, 40, 90, 900, 240, { cls: 'mini-stage' });
    var tb = box(root, 100, 350, 1080, 130, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawThree(stage, KINDS[cur][0]);
      tb.innerHTML = '<b>' + KINDS[cur][1] + '：</b>端点 ' + (cur === 0 ? '2 个' : cur === 1 ? '1 个' : '0 个') + '，' +
        (cur === 0 ? '不可延伸，能度量长度（有始有终）' : cur === 1 ? '向一方无限延伸（有始无终），不能度量' : '向两方无限延伸（无始无终）') + '。<span class=\'mut\'>绷紧的琴弦≈线段，手电光束≈射线，笔直铁轨≈直线。</span>';
    }
    render();
    KINDS.forEach((k, i) => {
      var b = box(root, 100 + i * 200, 500, 180, 50, { cls: 'tool' + (i === 0 ? ' on' : ''), text: k[1] });
      b.addEventListener('click', function () {
        cur = i; render();
        root.querySelectorAll('.tool').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
    });
    return { steps: 3, step: function (k2) { cur = Math.min(k2, 2); render(); }, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, n = 3;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>数线段</b>——平面上 n 个点，两两之间能连几条线段？' });
    var stage = box(root, 100, 90, 1080, 280, { cls: 'mini-stage' });
    var rb = box(root, 100, 390, 1080, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 1080 260', style: 'width:100%;height:100%' }, stage);
      var pts = [];
      for (var i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2 - Math.PI / 2;
        pts.push([540 + 300 * Math.cos(a), 130 + 105 * Math.sin(a)]);
      }
      for (var i = 0; i < n; i++) for (var j2 = i + 1; j2 < n; j2++)
        svg('line', { x1: pts[i][0], y1: pts[i][1], x2: pts[j2][0], y2: pts[j2][1], stroke: '#DEAA18', 'stroke-width': 2, opacity: .75 }, el);
      pts.forEach((p, i) => {
        svg('circle', { cx: p[0], cy: p[1], r: 11, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
        svg('text', { x: p[0], y: p[1] - 20, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent = 'P' + (i + 1);
      });
      rb.innerHTML = '<b>' + n + ' 个点：</b><span class=\'mono big\'>n(n−1)/2 = ' + n + '×' + (n - 1) + '/2 = ' + M.segments(n) + '</span> 条线段。<span class=\'mut\'>过任意两点都能画直线——两点确定一条直线。</span>';
    }
    render();
    var slider = box(root, 200, 510, 880, 60);
    slider.innerHTML = '<label>点数 n</label><input type=range min=2 max=8 value=3 style=width:100%>';
    slider.querySelector('input').addEventListener('input', function (e) { n = +e.target.value; render(); });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>三线对比表</b>' });
    var tb = box(root, 140, 120, 1000, 360, { s: 1 });
    K.table(tb, 0, 0, [
      ['图形', '端点数', '延伸性', '能否度量', '表示法'],
      ['线段', '2', '不可', '能', '线段 AB / 线段 a'],
      ['射线', '1', '向一方', '否', '射线 AB（端点字母在前）'],
      ['直线', '0', '向两方', '否', '直线 AB / 直线 l'],
    ], [180, 140, 180, 180, 280]);
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
