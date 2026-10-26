(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  var DAYS = ['周一', '周二', '周三', '周四', '周五'];
  var TEMPS = [22, 25, 24, 28, 26];
  var COLORS = ['#6C2166', '#DEAA18', '#1E7F4F', '#C0392B', '#4A90A4'];
  function drawBar(root) {
    var el = svg('svg', { viewBox: '0 0 900 300', style: 'width:100%;height:100%' }, root);
    TEMPS.forEach(function (t, i) {
      var x = 90 + i * 160, hh = t * 7;
      svg('rect', { x: x, y: 250 - hh, width: 100, height: hh, fill: 'rgba(222,170,24,.42)', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      svg('text', { x: x + 50, y: 240 - hh, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#6C2166' }, el).textContent = t + '°C';
      svg('text', { x: x + 50, y: 280, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = DAYS[i];
    });
    svg('line', { x1: 70, y1: 250, x2: 870, y2: 250, stroke: '#2B2326', 'stroke-width': 3 }, el);
    svg('text', { x: 450, y: 24, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '条形图：比多少';
    return el;
  }
  function drawLine(root) {
    var el = svg('svg', { viewBox: '0 0 900 300', style: 'width:100%;height:100%' }, root);
    var pts = TEMPS.map(function (t, i) { return [110 + i * 170, 250 - t * 7]; });
    svg('polyline', { points: pts.map(function (p) { return p.join(','); }).join(' '), fill: 'none', stroke: '#C0392B', 'stroke-width': 4.5 }, el);
    pts.forEach(function (p, i) {
      svg('circle', { cx: p[0], cy: p[1], r: 9, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      svg('text', { x: p[0], y: p[1] - 18, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: '#6C2166' }, el).textContent = TEMPS[i] + '°';
      svg('text', { x: p[0], y: 285, 'text-anchor': 'middle', 'font-size': 15, fill: '#2B2326' }, el).textContent = DAYS[i];
    });
    svg('line', { x1: 70, y1: 250, x2: 870, y2: 250, stroke: '#2B2326', 'stroke-width': 3 }, el);
    svg('text', { x: 450, y: 24, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '折线图：看变化趋势';
    return el;
  }
  function drawPie(root, cx, cy, R) {
    var total = TEMPS.reduce(function (a, b) { return a + b; }, 0);
    var el = svg('svg', { viewBox: '0 0 900 300', style: 'width:100%;height:100%' }, root);
    var a0 = -Math.PI / 2;
    TEMPS.forEach(function (t, i) {
      var a1 = a0 + M.arc(t, total) * Math.PI / 180;
      var large = M.arc(t, total) > 180 ? 1 : 0;
      svg('path', { d: 'M ' + cx + ' ' + cy + ' L ' + (cx + R * Math.cos(a0)) + ' ' + (cy + R * Math.sin(a0)) + ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + (cx + R * Math.cos(a1)) + ' ' + (cy + R * Math.sin(a1)) + ' Z',
        fill: COLORS[i], stroke: '#FBF7EE', 'stroke-width': 3, opacity: .9 }, el);
      var mid = (a0 + a1) / 2;
      svg('text', { x: cx + (R * 0.62) * Math.cos(mid), y: cy + (R * 0.62) * Math.sin(mid) + 6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#FFFDF8' }, el).textContent = M.pct(t, total) + '%';
      svg('text', { x: cx + (R + 34) * Math.cos(mid), y: cy + (R + 34) * Math.sin(mid) + 5, 'text-anchor': 'middle', 'font-size': 13, fill: '#2B2326' }, el).textContent = DAYS[i];
      a0 = a1;
    });
    svg('text', { x: 450, y: 24, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '扇形图：看占比（总量隐去）';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '统计图的选择' }));
    cover.appendChild(h('p', { cls: 'lead', text: '同一周气温，三种图讲三个故事' }));
    var holder = box(cover, 190, 290, 900, 320);
    drawBar(holder);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 6.3　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, cur = 'bar';
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>一键切图</b>——同一组数据，三种图各强调什么？' });
    var stage = box(root, 40, 90, 900, 330, { cls: 'mini-stage' });
    var rb = box(root, 970, 110, 270, 340, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      if (cur === 'bar') { drawBar(stage); rb.innerHTML = '<b>条形图：</b>直观比较各类数据<b>多少</b>。适合「谁最多」。'; }
      else if (cur === 'line') { drawLine(stage); rb.innerHTML = '<b>折线图：</b>表现数据随时间的<b>变化趋势</b>。适合「升了还是降了」。'; }
      else { drawPie(stage, 450, 170, 118); rb.innerHTML = '<b>扇形图：</b>表现<b>占总体的百分比</b>。注意：看不出总量！5 天总温度没有实际意义——这里扇形图其实<b>不合适</b>，正好说明选图要看数据语义。'; }
    }
    render();
    [['条形', 'bar'], ['折线', 'line'], ['扇形', 'pie']].forEach(function (c, i) {
      var b = box(root, 100 + i * 180, 450, 160, 50, { cls: 'tool', text: c[0] });
      b.addEventListener('click', function () { cur = c[1]; render(); root.querySelectorAll('.tool').forEach(function (x2) { x2.classList.remove('on'); }); b.classList.add('on'); });
    });
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, cut = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>纵轴截断</b>——两个班级"平均分差距"被夸大了几倍？' });
    var stage = box(root, 40, 90, 900, 330, { cls: 'mini-stage' });
    var rb = box(root, 970, 110, 270, 340, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 320', style: 'width:100%;height:100%' }, stage);
      var base = cut ? 85 : 0;
      var sc = cut ? 11 : 2.2;
      var y0 = 280;
      var xs = [240, 560];
      var vals = [92, 90];
      xs.forEach(function (x, i) {
        var hh = (vals[i] - base) * sc;
        svg('rect', { x: x, y: y0 - hh, width: 140, height: hh, fill: i ? 'rgba(30,127,79,.35)' : 'rgba(108,33,102,.3)', stroke: '#2B2326', 'stroke-width': 2.6 }, el);
        svg('text', { x: x + 70, y: y0 - hh - 12, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#6C2166' }, el).textContent = vals[i] + ' 分';
        svg('text', { x: x + 70, y: 306, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = i ? '乙班' : '甲班';
      });
      for (var g = 0; g <= 4; g++) {
        var v = base + g * (cut ? 2 : 20);
        svg('line', { x1: 160, y1: y0 - (v - base) * sc, x2: 800, y2: y0 - (v - base) * sc, stroke: 'rgba(43,35,38,.18)', 'stroke-width': 1.2 }, el);
        svg('text', { x: 148, y: y0 - (v - base) * sc + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#7C7068' }, el).textContent = v;
      }
      svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: cut ? '#C0392B' : '#1E7F4F' }, el).textContent = cut ? '截断纵轴：差距"看起来"翻了倍' : '纵轴从 0 开始：真实差距 2 分';
    }
    render();
    var tg = box(root, 100, 450, 860, 54, { cls: 'tool', text: '切换：纵轴从 0 / 从 85' });
    tg.addEventListener('click', function () { cut = 1 - cut; render(); });
    rb.innerHTML = '<b>统计图会撒谎：</b>纵轴不从 0 开始、只截取有利区间、3D 效果……看图先看<b>坐标轴</b>。<span class=\'mut\'>实际差距 2/92 ≈ 2%，截断后视觉差距 100%。</span>';
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>选图速查表</b>' });
    var tb = box(root, 120, 110, 1040, 240, { s: 1 });
    K.table(tb, 0, 0, [
      ['你想讲的故事', '选图', '理由'],
      ['各类数量谁多谁少', '条形图', '高度直接对应数量'],
      ['随时间怎么变化', '折线图', '趋势一眼可见'],
      ['各部分占总体的比例', '扇形图', '圆=总体 100%'],
    ], [400, 240, 380]);
    box(root, 120, 380, 1040, 100, { cls: 'note-card', s: 2, html: '<b>一句话：</b>先想「要讲什么故事」，再选图；看别人的图，先查坐标轴。' });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
