(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  var KINDNAME = { x2: 'x² 类', x: 'x 类', y: 'y 类', c: '常数类' };
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '整式的加减' }));
    cover.appendChild(h('p', { cls: 'lead', text: '苹果加苹果，橙子加橙子——同类项才能合并' }));
    var row = box(cover, 240, 300, 800, 150);
    [['3x²', 'x² 类'], ['5x²', 'x² 类'], ['4x', 'x 类'], ['2y', 'y 类']].forEach((pr, i) => {
      var c = card(row, i * 202, 10, 180, 120, { s: 1 });
      box(c, 10, 14, 160, 56, { cls: 'c-name', style: 'font-size:28px', text: pr[0] });
      box(c, 10, 80, 160, 30, { cls: 'mut', text: pr[1] });
    });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 3.4　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, bins = {}, score = { ok: 0 };
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>装箱</b>——点式子再点箱子，同类进同箱' });
    var tray = box(root, 40, 84, 1200, 84);
    var binRow = box(root, 40, 420, 1200, 170);
    var pick = null;
    var sc = box(root, 520, 600, 260, 40, { cls: 'pill big-score', text: '装对 0 / ' + L.items.length });
    L.items.slice().sort(function () { return Math.random() - 0.5; }).forEach((it, i) => {
      var c = card(tray, 24 + i * 118, 10, 106, 62, { cls: 'c-obj', style: 'font-size:20px', text: it.e });
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        if (c.classList.contains('ok')) return;
        document.querySelectorAll('.c-obj.pick').forEach(e => e.classList.remove('pick'));
        c.classList.add('pick'); pick = { it: it, el: c };
      });
    });
    Object.keys(KINDNAME).forEach((k, ki) => {
      var b = card(binRow, 20 + ki * 297, 16, 272, 130, { cls: 'c-tgt', text: KINDNAME[k] });
      b.style.cursor = 'pointer';
      b.addEventListener('click', function () {
        if (!pick) return;
        if (pick.it.kind === k) {
          pick.el.classList.add('ok'); pick.el.style.visibility = 'hidden';
          bins[k] = (bins[k] || 0) + 1;
          b.textContent = KINDNAME[k] + '　' + Object.keys(bins).length && (b.textContent.split('　')[0] + '　' + (bins[k]) + ' 个');
          score.ok++; sc.textContent = '装对 ' + score.ok + ' / ' + L.items.length;
          if (score.ok === L.items.length) sc.textContent = '全部装对！';
        } else { b.classList.add('bad'); setTimeout(function () { b.classList.remove('bad'); }, 600); }
        pick.el.classList.remove('pick'); pick = null;
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>去括号</b>——负号乘进去，全变号' });
    var cases = [
      { pre: '2(x − 3)', terms: [{ c: 2, e: 'x' }, { c: -6, e: '' }], sign: 1 },
      { pre: '-(2a - 3)', inner: [{ c: 2, e: 'a' }, { c: -3, e: '' }], sign: -1 },
      { pre: '3x - 2(x - 1)', inner: [{ c: 2, e: 'x' }, { c: -1, e: '' }], sign: -1, lead: [{ c: 3, e: 'x' }] },
    ];
    var cards = [box(root, 90, 110, 1100, 110, { cls: 'note-card' }), box(root, 90, 250, 1100, 110, { cls: 'note-card', s: 1 }), box(root, 90, 390, 1100, 110, { cls: 'note-card', s: 2 })];
    function render() {
      var c = cases[Math.min(step, cases.length - 1)];
      var out = c.sign === 1 ? c.terms : M.distribute(c.inner, c.sign);
      var all = c.lead ? c.lead.concat(out) : out;
      cards[0].innerHTML = '<b>原式：</b><span class=\'mono big\'>' + c.pre + '</span>';
      cards[1].innerHTML = '<b>去括号：</b><span class=\'mono big\'>' + M.termsStr(all) + '</span>' + (c.sign === -1 ? '<br><span class=\'mut\'>负号乘进去：每一项都变号</span>' : '');
      var combined = M.combine(all);
      cards[2].innerHTML = '<b>合并（如有同类）：</b><span class=\'mono big\'>' + M.termsStr(combined) + '</span>';
      cards.forEach((cd, i) => cd.style.display = i <= step ? '' : 'none');
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>化简全自动</b>——(3x² + 4x − 2) − (5x² − 2x + 7)' });
    var t1 = [{ c: 3, e: 'x^2' }, { c: 4, e: 'x' }, { c: -2, e: '' }];
    var t2 = [{ c: 5, e: 'x^2' }, { c: -2, e: 'x' }, { c: 7, e: '' }];
    var out = M.distribute(t2, -1);
    var all = t1.concat(out);
    box(root, 100, 110, 1080, 110, { cls: 'note-card', html: '<b>去括号：</b><span class=\'mono big\'>' + M.termsStr(all).replace(/x\^2/g, 'x²') + '</span>' });
    var comb = M.combine(all);
    box(root, 100, 250, 1080, 110, { cls: 'note-card', s: 1, html: '<b>合并：</b><span class=\'mono big\'>' + M.termsStr(comb).replace(/x\^2/g, 'x²') + '</span><br><span class=\'mut\'>降幂排列，常数放最后。</span>' });
    var chk = box(root, 100, 390, 1080, 90, { cls: 'note-card', s: 2, html: '<b>验算（代入 x=2）：</b>原式 = ' + f(M.evalTerm ? 0 : ((3 * 4 + 8 - 2) - (5 * 4 - 4 + 7))) + '，化简式 = ' + f(((-2) * 4) + 6 + (-9)) + ' ✓' });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
