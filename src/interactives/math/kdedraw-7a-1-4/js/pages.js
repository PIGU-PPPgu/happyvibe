(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  // 2.5D 积木绘制：网格 heights + 等距投影
  function drawBuild(root, g, ox, oy, cs, view) {
    view = view || 'iso';
    var NS = 'http://www.w3.org/2000/svg';
    var svgEl = svg('svg', { viewBox: '0 0 620 400', style: 'width:100%;height:100%;overflow:visible' }, root);
    function cube(cx, cy, cz) {
      var s = cs, dx = s * 0.87, dy = s * 0.5;
      var x = ox + (cx - cy) * dx, y = oy - (cx + cy) * dy * 0.58 - cz * s;
      function pl(pts, fill) { svg('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: fill, stroke: '#2B2326', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svgEl); }
      pl([[x, y], [x + dx, y - dy * 0.58], [x + dx, y - dy * 0.58 - s], [x, y - s]], '#FFFDF8');
      pl([[x + dx, y - dy * 0.58], [x + 2 * dx, y], [x + 2 * dx, y - s], [x + dx, y - dy * 0.58 - s]], '#EAD9C8');
      pl([[x, y - s], [x + dx, y - dy * 0.58 - s], [x + 2 * dx, y - s], [x + dx, y - s - dy * 0.58]], '#DEAA18');
    }
    for (let z = 0; z < 3; z++)
      for (let y = 4; y >= 0; y--)
        for (let x = 0; x < 5; x++)
          if (g[y] && g[y][x] > z) cube(x, y, z);
    return svgEl;
  }
  function drawView2D(root, g, kind) {
    var svgEl = svg('svg', { viewBox: '0 0 620 400', style: 'width:100%;height:100%;overflow:visible' }, root);
    const rows = kind === 'top' ? g : (kind === 'front' ? [M.frontView(g)] : [M.leftView(g)]);
    const cs = kind === 'top' ? 56 : 64;
    const ox = 310 - rows[0].length * cs / 2, oy = kind === 'top' ? 120 : 150;
    rows.forEach((r, y) => r.forEach((v, x) => {
      if (kind !== 'top' && v === 0) return;
      if (kind === 'top' && v === 0) return;
      var rect = svg('rect', { x: ox + x * cs, y: oy + (kind === 'top' ? y : 0) * cs, width: cs - 4, height: cs - 4, rx: 8,
        fill: v > 1 ? '#DEAA18' : '#FFFDF8', stroke: '#2B2326', 'stroke-width': 2.4 }, svgEl);
      if (kind !== 'top') svg('text', { x: ox + x * cs + cs / 2 - 2, y: oy + cs / 2 + 6, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#6C2166' }, svgEl).textContent = v;
      else if (v > 0) svg('text', { x: ox + x * cs + cs / 2 - 2, y: oy + y * cs + cs / 2 + 6, 'text-anchor': 'middle', 'font-size': 18, fill: '#7C7068' }, svgEl).textContent = v;
    }));
    return svgEl;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '从三个方向看物体的形状' }));
    cover.appendChild(h('p', { cls: 'lead', text: '主视图 · 左视图 · 俯视图 —— 搭积木与视图互推' }));
    var holder = box(cover, 440, 280, 400, 300);
    drawBuild(holder, L.build1, 310, 330, 44);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 1.4　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, cur = 'iso';
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>搭积木</b>——这个立体，主视/左视/俯视各看到什么？' });
    var stage = box(root, 40, 90, 620, 400, { cls: 'mini-stage' });
    var viewBox = box(root, 690, 90, 560, 400, { cls: 'mini-stage' });
    var g = L.build1;
    drawBuild(stage, g, 310, 340, 44);
    var btns = box(root, 690, 34, 560, 44);
    [['front', '主视图'], ['left', '左视图'], ['top', '俯视图']].forEach(it => {
      var b = box(btns, (btns === btns ? 0 : 0) + ['front', 'left', 'top'].indexOf(it[0]) * 150, 0, null, null, { cls: 'tool', text: it[1] });
      b.addEventListener('click', function () {
        viewBox.innerHTML = '';
        drawView2D(viewBox, g, it[0]);
      });
    });
    drawView2D(viewBox, g, 'front');
    box(root, 20, 520, 1240, 100, { cls: 'note-card', html: '<b>口诀：</b>主视定列高，左视定行高，俯视定地基。<span class=\'mut\'>金色数字表示这一列叠了几层。</span>' });
    return { steps: 3, step: function (k) {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>反过来</b>——给出三视图，最少要几块立方体？' });
    var g = L.build2;
    var stage = box(root, 40, 90, 620, 400, { cls: 'mini-stage', s: 1 });
    drawBuild(stage, g, 310, 340, 44);
    var vb = box(root, 690, 90, 560, 200, { cls: 'mini-stage', s: 1 });
    drawView2D(vb, g, 'front');
    var ans = box(root, 690, 320, 560, 160, { cls: 'note-card', s: 2, html:
      '<b>算一算：</b>实际用了 ' + M.blockCount(g) + ' 块。<br>' +
      '<span class=\'mut\'>把每格压到不能再压（视图不变），最少 ' + M.minBlocks(g) + ' 块——想一想哪几格可以「悬空贴面」。</span>' });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[4] = { build: function (ctx) {
    var root = ctx.root, i = 0, score = 0;
    var qz = L.quiz;
    var qEl = box(root, 120, 90, 1040, 120, { cls: 'note-card' });
    var opts = box(root, 120, 230, 1040, 240);
    var sc = box(root, 520, 500, 240, 46, { cls: 'pill big-score', text: '答对 0 / ' + qz.length });
    function show() {
      qEl.innerHTML = '<b>第 ' + (i + 1) + ' / ' + qz.length + ' 题</b>　' + qz[i].q;
      opts.innerHTML = '';
      qz[i].opts.forEach((o, oi) => {
        var b = box(opts, 20 + (oi % 2) * 510, Math.floor(oi / 2) * 90, 490, 70, { cls: 'tool', text: o });
        b.style.textAlign = 'left';
        b.addEventListener('click', function () {
          if (b.classList.contains('ok') || b.classList.contains('bad')) return;
          if (oi === qz[i].a) { b.classList.add('ok'); score++; }
          else { b.classList.add('bad'); opts.children[qz[i].a].classList.add('ok'); }
          sc.textContent = '答对 ' + score + ' / ' + qz.length;
          var why = box(opts, 20, 190, 1000, 40, { cls: 'strip', text: qz[i].why });
          setTimeout(function () { if (i < qz.length - 1) { i++; show(); } }, 2600);
        });
      });
    }
    show();
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[5] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>两个积木</b>——对照三视图口诀自己讲一遍' });
    var a = box(root, 40, 100, 600, 420, { cls: 'mini-stage' });
    var b2 = box(root, 660, 100, 600, 420, { cls: 'mini-stage' });
    drawBuild(a, L.build1, 300, 330, 40);
    drawBuild(b2, L.build2, 300, 330, 40);
    box(a, 10, 10, 200, 30, { cls: 'pill', text: '积木一' });
    box(b2, 10, 10, 200, 30, { cls: 'pill', text: '积木二' });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
