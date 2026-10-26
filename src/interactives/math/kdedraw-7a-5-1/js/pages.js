(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawScale(root, leftBoxes, ballsPerBox, rightBalls, xGuess) {
    var el = svg('svg', { viewBox: '0 0 900 260', style: 'width:100%;height:100%;overflow:visible' }, root);
    var cx = 450, tilt = (leftBoxes * (xGuess == null ? ballsPerBox : xGuess) - rightBalls);
    var ang = Math.max(-0.16, Math.min(0.16, tilt * 0.035));
    svg('polygon', { points: [[cx, 40], [cx - 130, 70 + ang * 100], [cx + 130, 70 + ang * 100]].map(p => p.join(',')).join(' '), fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.6, transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el);
    svg('rect', { x: cx - 16, y: 40, width: 32, height: 30, fill: '#2B2326' }, el);
    svg('polygon', { points: [[cx - 40, 70], [cx + 40, 70], [cx + 58, 100], [cx - 58, 100]].map(p => p.join(',')).join(' '), fill: '#6C2166' }, el);
    [[cx - 118, 'L'], [cx + 118, 'R']].forEach(function (arm, ai) {
      var px = arm[0], py = 70 + (ai === 0 ? -1 : 1) * ang * 100;
      var ly = py + 26;
      svg('line', { x1: cx, y1: 55, x2: px, y2: py, stroke: '#2B2326', 'stroke-width': 4, transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el);
      svg('rect', { x: px - 56, y: ly, width: 112, height: 16, rx: 5, fill: '#9C7A4C', stroke: '#2B2326', 'stroke-width': 2.4, transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el);
      var oy = ly - 4;
      if (ai === 0) {
        for (var b = 0; b < leftBoxes; b++)
          svg('rect', { x: px - 40 + b * 26, y: oy - 38, width: 22, height: 38, rx: 4, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2, transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el);
        svg('text', { x: px, y: oy - 48, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166', transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el).textContent = leftBoxes + ' 盒 · 每盒 x 球';
      } else {
        for (var r2 = 0; r2 < rightBalls; r2++)
          svg('circle', { cx: px - 46 + (r2 % 8) * 13, cy: oy - 10 - Math.floor(r2 / 8) * 13, r: 6, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 1.6, transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el);
        svg('text', { x: px, y: oy - 48 - Math.floor(rightBalls / 8) * 13, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#A87C06', transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 55)' }, el).textContent = rightBalls + ' 个球';
      }
    });
    var balanced = Math.abs(tilt) < 0.5;
    svg('text', { x: cx, y: 235, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: balanced ? '#1E7F4F' : '#C0392B' }, el).textContent = balanced ? '平衡！2x = 10' : (tilt > 0 ? '左边重 → 2x > 10' : '右边重 → 2x < 10');
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '方程' }));
    cover.appendChild(h('p', { cls: 'lead', text: '盒子里装着未知数——天平平衡的那一刻，方程成立了' }));
    var holder = box(cover, 190, 290, 900, 300);
    drawScale(holder, 2, 5, 10, null);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 5.1　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, x = 5;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖 x</b>——每盒放几个球，天平才平？' });
    var stage = box(root, 40, 90, 900, 280, { cls: 'mini-stage' });
    var rb = box(root, 60, 390, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawScale(stage, 2, 5, 10, x);
      rb.innerHTML = '<b>2x = 10</b>　代入 x = ' + f(x) + '：左边 2×' + f(x) + ' = ' + f(2 * x) + (2 * x === 10 ? ' = 右边 ✓ 平衡' : ' ≠ 右边 ✗ 不平衡') + '<span class=\'mut\'>　使方程成立的 x 就是「方程的解」。</span>';
    }
    render();
    var s = box(root, 100, 520, 1080, 60);
    s.innerHTML = '<label>x（每盒球数）</label><input type=range min=1 max=8 value=5 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { x = +e.target.value; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>从文字到方程</b>——点左列，看右列方程' });
    var tb = box(root, 100, 100, 1080, 320, { s: 1 });
    K.table(tb, 0, 0, [
      ['文字叙述', '方程', '解'],
      ['x 的 2 倍等于 10', '2x = 10', 'x = 5'],
      ['比 x 小 3 的数是 7', 'x − 3 = 7', 'x = 10'],
      ['x 的一半是 4', 'x/2 = 4', 'x = 8'],
      ['比 x 的 3 倍大 1 的数是 16', '3x + 1 = 16', 'x = 5'],
    ], [420, 300, 280]);
    box(root, 100, 440, 1080, 110, { cls: 'note-card', s: 2, html: '<b>辨析：</b>等式不一定是方程（3+5=8 没有未知数）；方程一定是等式。x>5 是不等式不是方程。<span class=\'mut\'>代数的历史：用字母把「不知道」写成可以运算的对象。</span>' });
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
    var root = ctx.root, x = 3;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>3x + 1 = 16</b>——天平上的三盒一球' });
    var stage = box(root, 40, 90, 900, 300, { cls: 'mini-stage' });
    var rb = box(root, 60, 410, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 280', style: 'width:100%;height:100%' }, stage);
      var cx = 450, tilt = (3 * x + 1) - 16;
      var ang = Math.max(-0.14, Math.min(0.14, tilt * 0.03));
      svg('g', { transform: 'rotate(' + (ang * 57.3) + ' ' + cx + ' 60)' }, el);
      svg('rect', { x: cx - 14, y: 46, width: 28, height: 26, fill: '#2B2326' }, el);
      [[cx - 110, '3 盒 x'], [cx + 110, '1 个 1 + 16 球']].forEach(function (arm, ai) {
        svg('line', { x1: cx, y1: 60, x2: arm[0], y2: 86, stroke: '#2B2326', 'stroke-width': 4 }, el);
        svg('rect', { x: arm[0] - 52, y: 86, width: 104, height: 14, rx: 5, fill: '#9C7A4C', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
        if (ai === 0) for (var b = 0; b < 3; b++)
          svg('rect', { x: arm[0] - 38 + b * 26, y: 50, width: 22, height: 36, rx: 4, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2 }, el);
        else {
          for (var r2 = 0; r2 < 16; r2++)
            svg('circle', { cx: arm[0] - 44 + (r2 % 8) * 12, cy: 74 - Math.floor(r2 / 8) * 12, r: 5.5, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 1.5 }, el);
        }
      });
      rb.innerHTML = '<b>3x + 1 = 16</b>　代入 x = ' + f(x) + '：3×' + f(x) + '+1 = ' + f(3 * x + 1) + (3 * x + 1 === 16 ? ' ✓ 平衡' : ' ✗ 不平');
    }
    render();
    var s = box(root, 100, 530, 1080, 60);
    s.innerHTML = '<label>x</label><input type=range min=1 max=6 value=3 step=1 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { x = +e.target.value; render(); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
