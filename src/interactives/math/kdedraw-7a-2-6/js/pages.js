(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawWater(root, levels, curIdx, startLine) {
    var el = svg('svg', { viewBox: '0 0 900 300', style: 'width:100%;height:100%;overflow:visible' }, root);
    var minV = Math.min.apply(null, levels) - 1, maxV = Math.max.apply(null, levels) + 1;
    var Y = function (v) { return 260 - (v - minV) / (maxV - minV) * 210; };
    svg('line', { x1: 40, y1: Y(startLine), x2: 860, y2: Y(startLine), stroke: '#7C7068', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, el);
    svg('text', { x: 52, y: Y(startLine) - 8, 'font-size': 13, fill: '#7C7068' }, el).textContent = '初始水位 ' + f(startLine) + ' m';
    for (var i = 0; i <= curIdx && i < levels.length; i++) {
      var x = 60 + i * 190;
      svg('rect', { x: x, y: Y(levels[i]), width: 130, height: 260 - Y(levels[i]), fill: i === 0 ? 'rgba(108,33,102,.14)' : 'rgba(222,170,24,.18)', stroke: '#2B2326', 'stroke-width': 2 }, el);
      svg('text', { x: x + 65, y: Y(levels[i]) - 8, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(levels[i]);
      if (i > 0) {
        var d = levels[i] - levels[i - 1];
        svg('text', { x: x + 65, y: 25, 'text-anchor': 'middle', 'font-size': 14, fill: d > 0 ? '#1E7F4F' : '#C0392B', 'font-weight': 700 }, el).textContent = (d > 0 ? '+' : '') + f(d);
      }
    }
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '有理数的加减混合运算' }));
    cover.appendChild(h('p', { cls: 'lead', text: '水位涨了又落、落了又涨——一条加减混合算式说清楚' }));
    var holder = box(cover, 190, 290, 900, 260);
    drawWater(holder, M.waterLevels(L.start, L.events), L.events.length, L.start);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.6　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, cur = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>水位播报</b>——逐步推进，读每天的水位与变化量' });
    var levels = M.waterLevels(L.start, L.events);
    var stage = box(root, 40, 100, 900, 320, { cls: 'mini-stage' });
    var expr = box(root, 970, 120, 270, 220, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawWater(stage, levels, cur, L.start);
      var parts = [];
      for (var i = 1; i <= cur; i++) { var d = levels[i] - levels[i - 1]; parts.push((d > 0 ? '+' : '') + f(d)); }
      expr.innerHTML = '<b>列式：</b><br><span class=\'mono big\'>' + f(L.start) + (parts.length ? ' ' + parts.join(' ') : '') + '</span><br><span class=\'mut\'>涨记正、落记负，最后水位 = 初始 + 各天变化之和。</span>';
    }
    render();
    var btn = box(root, 970, 360, 270, 54, { cls: 'tool', text: '推进一天 →' });
    btn.addEventListener('click', function () { cur = (cur + 1) % (L.events.length + 1); render(); });
    return { steps: 4, step: function (k) { cur = k; render(); }, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>统一成加法</b>——同号放一起算得快' });
    var terms = [['+', 8], ['-', 12], ['+', 7], ['-', 5]];
    var cards = [box(root, 90, 120, 1100, 110, { cls: 'note-card' }), box(root, 90, 260, 1100, 110, { cls: 'note-card', s: 1 }), box(root, 90, 400, 1100, 130, { cls: 'note-card', s: 2 })];
    function render() {
      var u = M.unify(terms);
      cards[0].innerHTML = '<b>原式：</b><span class=\'mono big\'>8 - 12 + 7 - 5</span>';
      cards[1].innerHTML = '<b>改写：</b><span class=\'mono big\'>' + u.map((t, i) => (i ? '+' : '') + '(' + f(t[1]) + ')').join(' ') + '</span><br><span class=\'mut\'>减一个数 = 加它的相反数</span>';
      var pos = u.filter(t => t[1] > 0).reduce((s, t) => s + t[1], 0), neg = u.filter(t => t[1] < 0).reduce((s, t) => s + t[1], 0);
      cards[2].innerHTML = '<b>同号合并：</b><span class=\'mono big\'>' + f(pos) + ' ' + f(neg) + ' = ' + f(pos + neg) + '</span>';
      cards.forEach((c, i) => c.style.display = i <= step ? '' : 'none');
    }
    render();
    return { steps: 3, step: function (k) { step = k; render(); }, leave: function () {} };
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>四天水位</b>——自己列一条混合算式再核对' });
    var holder = box(root, 150, 100, 980, 380, { cls: 'mini-stage' });
    drawWater(holder, M.waterLevels(L.start, L.events), L.events.length, L.start);
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
