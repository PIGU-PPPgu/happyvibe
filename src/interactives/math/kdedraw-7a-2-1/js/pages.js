(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawThermo(root, lo, hi, cur) {
    var el = svg('svg', { viewBox: '0 0 90 260', style: 'width:100%;height:100%;overflow:visible' }, root);
    svg('rect', { x: 30, y: 15, width: 26, height: 190, rx: 13, fill: '#FFFDF8', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('circle', { cx: 43, cy: 225, r: 20, fill: '#FFFDF8', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    var zeroY = 15 + 190 * (30 - lo) / (hi - lo) > 205 ? 205 : 15 + 190 * (30 - lo) / (hi - lo);
    var curY = 15 + 190 * (30 - cur) / (hi - lo);
    curY = Math.max(18, Math.min(202, curY));
    svg('rect', { x: 33, y: curY, width: 20, height: 222 - curY, rx: 10, fill: cur < 0 ? '#6C2166' : '#C0392B', opacity: .85 }, el);
    svg('circle', { cx: 43, cy: 225, r: 15, fill: cur < 0 ? '#6C2166' : '#C0392B', opacity: .9 }, el);
    for (var v = lo; v <= hi; v += 2) {
      var y = 15 + 190 * (30 - v) / (hi - lo); if (y < 12 || y > 208) continue;
      svg('line', { x1: 58, y1: y, x2: 66, y2: y, stroke: '#2B2326', 'stroke-width': v === 0 ? 2.6 : 1.4 }, el);
      svg('text', { x: 70, y: y + 4, 'font-size': 11, fill: '#7C7068' }, el).textContent = v;
    }
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '有理数' }));
    cover.appendChild(h('p', { cls: 'lead', text: '零下 18℃、支出 50 元、地下 3 层 —— 比 0 小的数怎么记？' }));
    var row = box(cover, 380, 280, 520, 260);
    L.temps.slice(0, 4).forEach((t, i) => { var c = box(row, i * 130, 20, 120, 240); drawThermo(c, -20, 30, t[1]); box(c, 0, 0, 120, 24, { cls: 'c-name', text: t[0] + ' ' + t[1] + '℃' }); });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 2.1　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 4, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, city = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖温度计</b>——把水银柱拖到当天温度，读出数并说它的意义' });
    var t = L.temps[0];
    var th = box(root, 80, 90, 180, 300, { cls: 'mini-stage' });
    var cur = t[1];
    var readout = box(root, 300, 120, 420, 90, { cls: 'note-card', html: '' });
    function render() {
      th.innerHTML = ''; drawThermo(th, t[1] - 4, t[2] + 4, cur);
      readout.innerHTML = '<b>' + t[0] + '　' + (cur > 0 ? '+' : '') + cur + '℃</b><br><span class=\'mut\'>' +
        (cur > 0 ? '零上 ' + cur + ' 度（比 0 高）' : cur < 0 ? '零下 ' + (-cur) + ' 度（比 0 低）—— 记作 ' + cur : '恰好 0 度') + '</span>';
    }
    render();
    var btns = box(root, 300, 230, 500, 46);
    ['降 1℃', '升 1℃'].forEach((lbl, i) => {
      var b = box(btns, i * 130, 0, 120, 40, { cls: 'tool', text: lbl });
      b.addEventListener('click', function () { cur += i ? 1 : -1; cur = Math.max(t[1] - 4, Math.min(t[2] + 4, cur)); render(); });
    });
    var sw = box(root, 300, 300, 620, 90, { cls: 'note-card', html: '<b>相反意义的量：</b>收入/支出、零上/零下、东/西……规定一个为正，另一个就用<b>负</b>记。' });
    var next = box(root, 940, 120, 260, 60, { cls: 'tool', text: '换一个城市 →' });
    next.addEventListener('click', function () { city = (city + 1) % L.temps.length; t = L.temps[city]; cur = t[1]; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    var BASKETS = [['int+', '正整数'], ['int-', '负整数'], ['frac+', '正分数'], ['frac-', '负分数'], ['zero', '零']];
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>分类</b>——把每张数卡拖进正确的篮子（点卡片再点篮子）' });
    var pick = null, done = 0;
    var tray = box(root, 40, 80, 1200, 90);
    var cards = L.cards.slice().sort(function () { return Math.random() - 0.5; });
    var slots = box(root, 40, 200, 1200, 330);
    BASKETS.forEach((bk, bi) => {
      var b = card(slots, 20 + bi * 236, 20, 216, 60, { cls: 'c-tgt', text: bk[1] });
      b.style.cursor = 'pointer';
      b.addEventListener('click', function () {
        if (!pick || b.classList.contains('ok')) return;
        var want = M.classifyName[M.classify(pick.v)];
        if (want === bk[1]) {
          pick.el.classList.add('ok'); b.classList.add('ok'); b.textContent = bk[1] + '　' + f(pick.v);
          pick.el.style.visibility = 'hidden'; done++;
          if (done === L.cards.length) score.textContent = '全部分对！有理数分类完成';
        } else { b.classList.add('bad'); setTimeout(function () { b.classList.remove('bad'); }, 600); }
        pick.el.classList.remove('pick'); pick = null;
      });
    });
    var score = box(root, 520, 545, 260, 40, { cls: 'pill big-score', text: '已分 0 / ' + L.cards.length });
    cards.forEach((v, i) => {
      var c = card(tray, 20 + i * 118, 12, 106, 62, { cls: 'c-obj', text: f(v) });
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        if (c.classList.contains('ok')) return;
        document.querySelectorAll('.c-obj.pick').forEach(e => e.classList.remove('pick'));
        c.classList.add('pick'); pick = { el: c, v: v };
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[4] = { build: function (ctx) {
    var root = ctx.root, i = 0, score = 0;
    var qz = L.quiz;
    var qEl = box(root, 120, 90, 1040, 110, { cls: 'note-card' });
    var opts = box(root, 120, 220, 1040, 240);
    var sc = box(root, 520, 500, 240, 46, { cls: 'pill big-score', text: '答对 0 / ' + qz.length });
    function show() {
      qEl.innerHTML = '<b>第 ' + (i + 1) + ' / ' + qz.length + ' 题</b>　' + qz[i].q;
      opts.innerHTML = '';
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>四城温度</b>——读数并说出正负的意义' });
    L.temps.forEach((t, i) => {
      var c = card(root, 60 + i * 300, 110, 270, 330, { s: 1 });
      var holder = box(c, 70, 20, 130, 250);
      drawThermo(holder, -20, 30, t[1]);
      box(c, 10, 280, 250, 40, { cls: 'c-name', text: t[0] + '　' + t[1] + ' ~ ' + t[2] + '℃' });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
