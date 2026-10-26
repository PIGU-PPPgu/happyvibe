(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function chip(root, x, y, text, ok) {
    var c = card(root, x, y, 170, 62, { cls: ok === false ? 'c-tgt' : 'c-obj', style: 'font-size:22px', text: text });
    c.style.cursor = 'pointer';
    return c;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '整式' }));
    cover.appendChild(h('p', { cls: 'lead', text: '单项式与多项式——代数式的「零件」与「组合件」' }));
    var row = box(cover, 200, 300, 880, 130);
    ['3x²', '-ab', '2x²-3x+1', 'a²+2ab+b²'].forEach((e, i) => {
      var c = card(row, i * 222, 10, 200, 100, { s: 1, style: 'font-size:26px', text: e });
      c.classList.add('c-name');
    });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 3.3　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>流水线分拣</b>——单项式进左箱，不是的进右箱（点式子再点箱子）' });
    var pick = null, okN = 0;
    var tray = box(root, 40, 84, 1200, 84);
    var bins = box(root, 40, 440, 1200, 120);
    var score = box(root, 520, 570, 260, 40, { cls: 'pill big-score', text: '分对 0 / ' + L.monomials.length });
    L.monomials.slice().sort(function () { return Math.random() - 0.5; }).forEach((m, i) => {
      var c = chip(tray, 24 + i * 192, 10, m.e, m.ok);
      c.addEventListener('click', function () {
        if (c.classList.contains('ok')) return;
        document.querySelectorAll('.tray-pick').forEach(e => e.classList.remove('tray-pick'));
        c.classList.add('tray-pick'); pick = m; pick.el = c;
      });
    });
    [['单项式', true], ['不是单项式', false]].forEach((bk, bi) => {
      var b = card(bins, 90 + bi * 600, 16, 420, 84, { cls: 'c-tgt', text: bk[0] + '　（' + (bi ? '分母含字母等' : '数与字母的积') + '）' });
      b.style.cursor = 'pointer';
      b.addEventListener('click', function () {
        if (!pick) return;
        var hit = (pick.ok === bk[1]);
        if (hit) {
          pick.el.classList.add('ok'); pick.el.style.visibility = 'hidden';
          b.classList.add('ok'); okN++;
          if (bk[1] && pick.c != null) b.textContent = bk[0] + '　' + pick.e + '：系数 ' + pick.c + ' 次数 ' + pick.d;
          score.textContent = '分对 ' + okN + ' / ' + L.monomials.length;
        } else { b.classList.add('bad'); setTimeout(function () { b.classList.remove('bad'); }, 600); }
        pick.el.classList.remove('tray-pick'); pick = null;
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, cur = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>找次数</b>——点每个项，最高次项决定多项式的次数' });
    var stage = box(root, 100, 100, 1080, 220, { cls: 'mini-stage' });
    var rb = box(root, 100, 350, 1080, 150, { cls: 'note-card' });
    function render() {
      var poly = L.polys[cur];
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 1080 200', style: 'width:100%;height:100%' }, stage);
      var terms = poly.e.split(/(?=[+-])/);
      var x = 90;
      terms.forEach(t => {
        t = t.trim();
        var deg = M.termDeg(t);
        var isConst = /^[+\-]?\d+$/.test(t);
        svg('rect', { x: x - 12, y: 60, width: t.length * 22 + 24, height: 74, rx: 12, fill: 'rgba(222,170,24,.16)', stroke: '#2B2326', 'stroke-width': 2.2 }, el);
        svg('text', { x: x + t.length * 11, y: 108, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 700, fill: '#6C2166' }, el).textContent = t;
        svg('text', { x: x + t.length * 11, y: 160, 'text-anchor': 'middle', 'font-size': 14, fill: '#7C7068' }, el).textContent = isConst ? '常数项（0 次）' : deg + ' 次项';
        x += t.length * 22 + 66;
      });
      var maxDeg = Math.max.apply(null, terms.filter(t => !/^[+\-]?\d+$/.test(t.trim())).map(t => M.termDeg(t)));
      rb.innerHTML = '<b>' + poly.e + '：</b>' + terms.length + ' 项，<b class=\'c-g\'>次数 = ' + maxDeg + '</b>（最高次项决定），常数项次数为 0。<span class=\'mut\'>点「下一个」换一个多项式。</span>';
    }
    render();
    var next = box(root, 900, 520, 260, 54, { cls: 'tool', text: '下一个 →' });
    next.addEventListener('click', function () { cur = (cur + 1) % L.polys.length; render(); });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>整式家族表</b>' });
    var tb = box(root, 120, 110, 1040, 380, { s: 1 });
    K.table(tb, 0, 0, [
      ['整式', '单项式', '系数', '次数', '多项式次数'],
      ['3x²', '✓', '3', '2', '—'],
      ['-ab', '✓', '-1', '2', '—'],
      ['5', '✓', '5', '0', '—'],
      ['2x²-3x+1', '—', '—', '—', '2'],
      ['a²+2ab+b²', '—', '—', '—', '2'],
    ], [280, 160, 160, 160, 220]);
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
