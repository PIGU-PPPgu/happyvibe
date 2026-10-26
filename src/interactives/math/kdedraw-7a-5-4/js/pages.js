(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawMeet(root, t, D, v1, v2) {
    var el = svg('svg', { viewBox: '0 0 900 230', style: 'width:100%;height:100%;overflow:visible' }, root);
    var x1 = 80, x2 = 820;
    svg('line', { x1: x1, y1: 150, x2: x2, y2: 150, stroke: '#2B2326', 'stroke-width': 3.5 }, el);
    for (var q = 0; q <= 10; q++) svg('line', { x1: x1 + q * (x2 - x1) / 10, y1: 143, x2: x1 + q * (x2 - x1) / 10, y2: 157, stroke: '#2B2326', 'stroke-width': 1.5 }, el);
    var px1 = x1 + (x2 - x1) * v1 * t / D, px2 = x2 - (x2 - x1) * v2 * t / D;
    svg('rect', { x: Math.min(px1, px2), y: 120, width: Math.max(0, px2 - px1), height: 12, fill: 'rgba(222,170,24,.4)' }, el);
    svg('circle', { cx: px1, cy: 150, r: 13, fill: '#6C2166', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('text', { x: px1, y: 115, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '甲 ' + f(v1) + 'm/min';
    svg('circle', { cx: px2, cy: 150, r: 13, fill: '#1E7F4F', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
    svg('text', { x: px2, y: 115, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#1E7F4F' }, el).textContent = '乙 ' + f(v2);
    svg('text', { x: (x1 + x2) / 2, y: 195, 'text-anchor': 'middle', 'font-size': 15, fill: '#2B2326' }, el).textContent = '全程 ' + f(D) + ' m　t = ' + f(t) + ' min';
    svg('text', { x: 80, y: 50, 'font-size': 15, fill: '#6C2166' }, el).textContent = '甲走了 ' + f(v1 * t) + ' m';
    svg('text', { x: 820, y: 50, 'text-anchor': 'end', 'font-size': 15, fill: '#1E7F4F' }, el).textContent = '乙走了 ' + f(v2 * t) + ' m';
    var met = Math.abs(px2 - px1) < 14;
    svg('text', { x: 450, y: 222, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: met ? '#1E7F4F' : '#7C7068' }, el).textContent = met ? '相遇！(60+40)t = 1000' : '60t + 40t = 1000';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '一元一次方程的应用' }));
    cover.appendChild(h('p', { cls: 'lead', text: '审 → 设 → 列 → 解 → 验：把生活问题翻译成方程' }));
    var holder = box(cover, 190, 300, 900, 260);
    drawMeet(holder, 10, 1000, 60, 40);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 5.4　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, t = 4;
    var D = 1000, v1 = 60, v2 = 40;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>拖时间 t</b>——两人什么时候相遇？等量关系是什么？' });
    var stage = box(root, 40, 90, 900, 260, { cls: 'mini-stage' });
    var rb = box(root, 970, 110, 270, 330, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawMeet(stage, t, D, v1, v2);
      rb.innerHTML = '<b>四步走：</b><br>① 审：相向而行<br>② 设：t 分后相遇<br>③ 列：<span class=\'mono\'>60t + 40t = 1000</span><br>④ 解验：t = ' + f(M.meetT(D, v1, v2)) + ' 分<br><span class=\'mut\'>等量关系：甲程 + 乙程 = 全程</span>';
    }
    render();
    var s = box(root, 100, 520, 860, 60);
    s.innerHTML = '<label>t</label><input type=range min=0 max=12 step=0.5 value=4 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { t = +e.target.value; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, x = 7;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>调配</b>——从甲处调 x 人去乙处，两处人数相等' });
    var stage = box(root, 100, 90, 1080, 300, { cls: 'mini-stage' });
    var rb = box(root, 100, 420, 1080, 120, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 1080 280', style: 'width:100%;height:100%' }, stage);
      svg('rect', { x: 60, y: 60, width: 380, height: 150, rx: 14, fill: 'rgba(108,33,102,.10)', stroke: '#6C2166', 'stroke-width': 2.6 }, el);
      svg('rect', { x: 640, y: 60, width: 380, height: 150, rx: 14, fill: 'rgba(222,170,24,.12)', stroke: '#A87C06', 'stroke-width': 2.6 }, el);
      svg('text', { x: 250, y: 100, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#6C2166' }, el).textContent = '甲处：32 − x';
      svg('text', { x: 250, y: 140, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(32 - x);
      svg('text', { x: 830, y: 100, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#A87C06' }, el).textContent = '乙处：18 + x';
      svg('text', { x: 830, y: 140, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#A87C06' }, el).textContent = f(18 + x);
      for (var i = 0; i < Math.min(x, 10); i++) {
        var yy = 78 + i * 14;
        svg('circle', { cx: 470 + (yy - 78) * 0.4, cy: yy, r: 6, fill: '#C0392B' }, el);
        svg('path', { d: 'M ' + (478 + (yy - 78) * 0.4) + ' ' + yy + ' Q 540 ' + (yy - 8) + ' 602 ' + yy, fill: 'none', stroke: '#C0392B', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, el);
      }
      svg('text', { x: 540, y: 250, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: x === 7 ? '#1E7F4F' : '#C0392B' }, el).textContent = x === 7 ? '相等！32 − 7 = 18 + 7 = 25 ✓' : '方程：32 − x = 18 + x';
    }
    render();
    var s = box(root, 250, 550, 780, 60);
    s.innerHTML = '<label>调动人数 x</label><input type=range min=0 max=14 value=7 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { x = +e.target.value; render(); });
    rb.innerHTML = '<b>调配等量关系：</b>调动后甲 = 调动后乙。设调 x 人：32 − x = 18 + x，解得 x = 7。<span class=\'mut\'>注意 x 的去向：甲减乙加。</span>';
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
    var root = ctx.root, v1 = 60, v2 = 40, D = 1000;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>参数改动场</b>——改速度与距离，相遇时间跟着变' });
    var stage = box(root, 40, 90, 900, 260, { cls: 'mini-stage' });
    var rb = box(root, 970, 120, 270, 300, { cls: 'note-card' });
    function render() {
      var t = M.meetT(D, v1, v2);
      stage.innerHTML = ''; drawMeet(stage, t, D, v1, v2);
      rb.innerHTML = '<b>解：</b>t = D/(v₁+v₂) = ' + f(D) + '/' + f(v1 + v2) + ' = <b class=\'c-g\'>' + f(Math.round(t * 100) / 100) + '</b> 分<br><span class=\'mut\'>速度和越大相遇越快；距离越长越慢——公式背后的直觉。</span>';
    }
    render();
    var s = box(root, 100, 520, 860, 110);
    s.innerHTML = '<label>v₁</label><input type=range min=20 max=120 value=60 style=width:30%><label style="margin-left:18px">v₂</label><input type=range min=20 max=120 value=40 style=width:30%><label style="margin-left:18px">D</label><input type=range min=200 max=2000 step=100 value=1000 style=width:26%>';
    var ins = s.querySelectorAll('input');
    ins.forEach(function (inp) { inp.addEventListener('input', function () { v1 = +ins[0].value; v2 = +ins[1].value; D = +ins[2].value; render(); }); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
