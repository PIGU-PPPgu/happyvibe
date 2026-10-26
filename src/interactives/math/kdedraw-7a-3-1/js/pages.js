(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawSquares(root, n) {
    var el = svg('svg', { viewBox: '0 0 900 190', style: 'width:100%;height:100%;overflow:visible' }, root);
    var s = Math.min(64, 800 / Math.max(n, 1));
    var x0 = 450 - (n * s) / 2, y = 60;
    for (var i = 0; i < n; i++) {
      svg('rect', { x: x0 + i * s, y: y, width: s, height: s, fill: i % 2 ? 'rgba(222,170,24,.22)' : 'rgba(108,33,102,.10)', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      if (i < n - 1) svg('circle', { cx: x0 + (i + 1) * s, cy: y + s / 2, r: 3.4, fill: '#6C2166' }, el);
    }
    svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent = n + ' 个正方形 · ' + M.matches(n) + ' 根火柴';
    svg('text', { x: 450, y: 175, 'text-anchor': 'middle', 'font-size': 14, fill: '#7C7068' }, el).textContent = '4 + 3×' + (n - 1) + ' = ' + M.matches(n) + '　|　4×' + n + ' − ' + (n - 1) + ' = ' + M.matchesB(n) + '　|　' + n + '+' + n + '+' + (n + 1) + ' = ' + M.matchesC(n);
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '字母表示数' }));
    cover.appendChild(h('p', { cls: 'lead', text: '摆 100 个正方形要几根火柴？——数不过来，就得请字母帮忙' }));
    var holder = box(cover, 190, 300, 900, 210);
    drawSquares(holder, 5);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 3.1　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, n = 4;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖个数</b>——三种数法答案一样吗？100 个时谁最快？' });
    var stage = box(root, 40, 100, 900, 210, { cls: 'mini-stage' });
    var rb = box(root, 60, 340, 860, 130, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawSquares(stage, n);
      rb.innerHTML = '<b>三种列式：</b><span class=\'mono\'>① 4+3(n−1)　② 4n−(n−1)　③ n+n+(n+1)</span><br>' +
        '<span class=\'mut\'>展开后都是 <b class=\'c-g\'>3n+1</b>——字母把「怎么数」的分歧统一成同一个结果，这就是它的威力。</span>';
    }
    render();
    var slider = box(root, 60, 490, 860, 60);
    slider.innerHTML = '<label>个数 n</label><input type=range min=1 max=30 value=4 style=width:100%>';
    slider.querySelector('input').addEventListener('input', function (e) { n = +e.target.value; render(); });
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>字母能表示什么</b>——点卡片看例子' });
    var EX = [['a + 3', '比 a 大 3 的数', 'a=5 时得 8'], ['2x − 1', '比 x 的 2 倍小 1 的数', 'x=10 时得 19'], ['n/2', 'n 的一半', 'n=偶数时是整数'], ['a−2, a, a+2', '三个连续整数', '相邻差 1'], ['2n, 2n+2', '两个连续偶数', '相邻差 2']];
    EX.forEach((ex, i) => {
      var col = i % 3, row = (i / 3) | 0;
      var c = card(root, 70 + col * 390, 110 + row * 190, 360, 165, { s: 1 });
      var expr = box(c, 14, 14, 330, 46, { cls: 'c-name', style: 'font-size:22px', text: ex[0] });
      var mean = box(c, 14, 66, 330, 40, { text: ex[1] });
      var eg = box(c, 14, 112, 330, 40, { cls: 'mut', text: ex[2], style: 'font-size:12.5px' });
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        mean.textContent = mean.textContent === ex[1] ? '点我看例子' : ex[1];
      });
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
    var root = ctx.root, n = 10;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>大数目</b>——50 个正方形需要几根？' });
    var stage = box(root, 40, 100, 900, 220, { cls: 'mini-stage' });
    var slider = box(root, 150, 360, 700, 60);
    slider.innerHTML = '<label>n</label><input type=range min=1 max=60 value=10 style=width:100%>';
    function render() { stage.innerHTML = ''; drawSquares(stage, n); }
    render();
    slider.querySelector('input').addEventListener('input', function (e) { n = +e.target.value; render(); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
