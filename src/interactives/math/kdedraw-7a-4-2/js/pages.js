(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawCmp(root, la, lb, aligned) {
    var el = svg('svg', { viewBox: '0 0 900 240', style: 'width:100%;height:100%;overflow:visible' }, root);
    var S = 62;  // px per cm
    var x0 = aligned ? 120 : 120;
    [[la, 70, 'AB', '#6C2166'], [lb, 150, 'CD', '#1E7F4F']].forEach(function (it) {
      var y = it[1];
      svg('line', { x1: x0, y1: y, x2: x0 + it[0] * S, y2: y, stroke: '#2B2326', 'stroke-width': 6, 'stroke-linecap': 'round' }, el);
      svg('line', { x1: x0, y1: y - 16, x2: x0, y2: y + 16, stroke: '#C0392B', 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }, el);
      svg('text', { x: x0 + it[0] * S + 24, y: y + 7, 'font-size': 19, 'font-weight': 700, fill: it[3] }, el).textContent = it[2] + ' = ' + f(it[0]) + ' cm';
    });
    svg('text', { x: 450, y: 34, 'text-anchor': 'middle', 'font-size': 16, fill: '#2B2326' }, el).textContent = M.cmp(la, lb) + '（红色虚线 = 起点对齐）';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '比较线段的长短' }));
    cover.appendChild(h('p', { cls: 'lead', text: '一头对齐，再看另一头 —— 叠合法' }));
    var holder = box(cover, 190, 300, 900, 260);
    drawCmp(holder, 7.5, 6, true);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 4.2　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, la = 7.5, lb = 6;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖长度</b>——改变 AB 与 CD，读结论' });
    var stage = box(root, 40, 90, 900, 270, { cls: 'mini-stage' });
    var rb = box(root, 60, 380, 860, 100, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawCmp(stage, la, lb, true);
      rb.innerHTML = '<b>结论：</b>' + M.cmp(la, lb) + '。<span class=\'mut\'>度量法：用刻度尺量出数值再比；叠合法：起点对齐，看终点远近。</span>';
    }
    render();
    var sliders = box(root, 100, 500, 1080, 70);
    sliders.innerHTML = '<label>AB</label><input type=range min=2 max=12 step=0.5 value=7.5 style=width:38%><label style="margin-left:26px">CD</label><input type=range min=2 max=12 step=0.5 value=6 style=width:38%>';
    var ins = sliders.querySelectorAll('input');
    ins[0].addEventListener('input', function (e) { la = +e.target.value; render(); });
    ins[1].addEventListener('input', function (e) { lb = +e.target.value; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, mb = 5;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>中点</b>——M 在 AB 上且 AM = MB' });
    var stage = box(root, 40, 90, 900, 230, { cls: 'mini-stage' });
    var rb = box(root, 60, 340, 860, 120, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 200', style: 'width:100%;height:100%' }, stage);
      var A = 120, B = 780, Mx = (A + B) / 2;
      svg('line', { x1: A, y1: 110, x2: B, y2: 110, stroke: '#2B2326', 'stroke-width': 6, 'stroke-linecap': 'round' }, el);
      [[A, 'A'], [B, 'B']].forEach(p => {
        svg('circle', { cx: p[0], cy: 110, r: 10, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
        svg('text', { x: p[0], y: 148, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: '#6C2166' }, el).textContent = p[1];
      });
      svg('circle', { cx: Mx, cy: 110, r: 10, fill: '#DEAA18', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      svg('text', { x: Mx, y: 148, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: '#A87C06' }, el).textContent = 'M';
      var half = (B - A) / 2;
      svg('line', { x1: A, y1: 70, x2: Mx, y2: 70, stroke: '#1E7F4F', 'stroke-width': 3 }, el);
      svg('line', { x1: Mx, y1: 70, x2: B, y2: 70, stroke: '#1E7F4F', 'stroke-width': 3 }, el);
      svg('text', { x: A + half / 2, y: 58, 'text-anchor': 'middle', 'font-size': 15, fill: '#1E7F4F' }, el).textContent = 'AM = ' + f(half / 62 * 10);
      svg('text', { x: Mx + half / 2, y: 58, 'text-anchor': 'middle', 'font-size': 15, fill: '#1E7F4F' }, el).textContent = 'MB = ' + f(half / 62 * 10);
      svg('text', { x: 450, y: 190, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent = 'AM = MB = AB/2';
    }
    render();
    rb.innerHTML = '<b>线段中点：</b>把线段分成两条相等线段的点。数学写法：<span class=\'mono\'>AM = MB = ½AB</span>，或 AB = 2AM = 2MB。<span class=\'mut\'>中点必须在线段上——线段外等距的点不是中点。</span>';
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
    var root = ctx.root, la = 8;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>折纸找中点</b>——对折后折痕就是中点' });
    var stage = box(root, 150, 110, 980, 280, { cls: 'mini-stage' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 980 250', style: 'width:100%;height:100%' }, stage);
      var x0 = 90, w = la * 60, y = 130;
      svg('rect', { x: x0, y: y - 40, width: w, height: 80, rx: 10, fill: '#FBF7EE', stroke: '#2B2326', 'stroke-width': 2.6 }, el);
      svg('line', { x1: x0 + w / 2, y1: y - 56, x2: x0 + w / 2, y2: y + 56, stroke: '#C0392B', 'stroke-width': 3, 'stroke-dasharray': '9 6' }, el);
      svg('text', { x: x0 + w / 2, y: y - 64, 'text-anchor': 'middle', 'font-size': 15, fill: '#C0392B' }, el).textContent = '折痕 = 中点';
      svg('text', { x: x0 + w / 2, y: y + 96, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent = 'AB = ' + f(la) + ' cm，AM = MB = ' + f(la / 2) + ' cm';
    }
    render();
    var s = box(root, 250, 420, 780, 60);
    s.innerHTML = '<label>AB 长度</label><input type=range min=3 max=13 step=0.5 value=8 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { la = +e.target.value; render(); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
