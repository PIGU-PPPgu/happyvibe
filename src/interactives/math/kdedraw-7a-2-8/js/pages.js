(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawSplit(root, total, parts) {
    var el = svg('svg', { viewBox: '0 0 900 180', style: 'width:100%;height:100%;overflow:visible' }, root);
    var seg = 700 / Math.abs(parts);
    var startX = 100, y = 90;
    for (var i = 0; i < Math.abs(parts); i++) {
      svg('rect', { x: startX + i * seg, y: y - 26, width: seg - 5, height: 52, rx: 8,
        fill: total < 0 ? 'rgba(108,33,102,.16)' : 'rgba(222,170,24,.35)', stroke: '#2B2326', 'stroke-width': 2.2 }, el);
    }
    svg('text', { x: 450, y: 30, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el)
      .textContent = f(total) + ' ÷ ' + f(parts) + ' = ' + f(M.div(total, parts)) + '（每段）';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '有理数的除法' }));
    cover.appendChild(h('p', { cls: 'lead', text: '均分与逆运算：除以一个数 = 乘它的倒数' }));
    var holder = box(cover, 190, 300, 900, 200);
    drawSplit(holder, -6, 3);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.8　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, a = -6, b = 3;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>翻卡片</b>——除以一个数 = 乘它的倒数，符号不变' });
    var stage = box(root, 40, 100, 900, 220, { cls: 'mini-stage' });
    var rb = box(root, 60, 350, 860, 100, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawSplit(stage, a, b);
      rb.innerHTML = '<span class=\'big\'>(' + f(a) + ') ÷ (' + f(b) + ') = (' + f(a) + ') × (' + f(M.reciprocal(b)) + ') = <b class=\'c-g\'>' + f(M.div(a, b)) + '</b></span><br><span class=\'mut\'>倒数：乘积为 1 的两个数（-2 与 -1/2）；相反数：只有符号不同（-2 与 2）。</span>';
    }
    render();
    var btns = box(root, 60, 470, 860, 54);
    [['被除数变号', function () { a = -a; render(); }], ['除数变号', function () { b = -b; render(); }], ['除数取 1/2', function () { b = b === 3 ? 0.5 : 3; render(); }], ['复位', function () { a = -6; b = 3; render(); }]].forEach((c, i) => {
      var bt = box(btns, i * 200, 0, 190, 44, { cls: 'tool', text: c[0] });
      bt.addEventListener('click', c[1]);
    });
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>符号表与零</b>' });
    var tb = box(root, 100, 100, 1080, 200, { s: 1 });
    K.table(tb, 0, 0, [['除法', '商的符号', '例'], ['同号（+÷+ 或 −÷−）', '+', '(-6)÷(-2)=3'], ['异号（+÷− 或 −÷+）', '-', '6÷(-2)=-3'], ['0 ÷ 非零', '0 本身', '0÷(-5)=0'], ['非零 ÷ 0', '无意义', '——']], [400, 260, 380]);
    box(root, 100, 330, 1080, 120, { cls: 'note-card', s: 2, html: '<b>记忆：</b>除法符号法则与乘法完全一致（同号得正、异号得负）。<span class=\'mut\'>0 作除数无意义——找不到谁乘 0 等于非零的数。</span>' });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>四种均分</b>' });
    [[6, 3], [-6, 3], [6, -3], [-6, -3]].forEach((cfg, i) => {
      var c = card(root, 60 + i * 290, 130, 260, 200, { s: 1 });
      var holder = box(c, 8, 20, 244, 130);
      drawSplit(holder, cfg[0], cfg[1]);
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
