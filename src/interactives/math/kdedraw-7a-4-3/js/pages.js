(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawAngle(root, deg, showProtractor) {
    var el = svg('svg', { viewBox: '0 0 900 260', style: 'width:100%;height:100%;overflow:visible' }, root);
    var cx = 330, cy = 210, R = 150;
    var rad = -deg * Math.PI / 180;
    if (showProtractor) {
      svg('circle', { cx: cx, cy: cy, r: R + 34, fill: 'rgba(255,253,248,.92)', stroke: '#2B2326', 'stroke-width': 2.2 }, el);
      for (var a = 0; a <= 180; a += 10) {
        var r1 = -a * Math.PI / 180;
        var long = a % 30 === 0;
        svg('line', { x1: cx + (R + 34) * Math.cos(r1), y1: cy - (R + 34) * Math.sin(r1),
          x2: cx + (R + (long ? 16 : 26)) * Math.cos(r1), y2: cy - (R + (long ? 16 : 26)) * Math.sin(r1), stroke: '#2B2326', 'stroke-width': long ? 2.2 : 1.2 }, el);
        if (long) svg('text', { x: cx + (R + 46) * Math.cos(r1), y: cy - (R + 46) * Math.sin(r1) + 5, 'text-anchor': 'middle', 'font-size': 12, fill: '#7C7068' }, el).textContent = a;
      }
    }
    svg('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: '#2B2326', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
    svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(rad), y2: cy + R * Math.sin(rad), stroke: '#6C2166', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
    svg('path', { d: 'M ' + (cx + 44) + ' ' + cy + ' A 44 44 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + (cx + 44 * Math.cos(rad)) + ' ' + (cy + 44 * Math.sin(rad)), fill: 'none', stroke: '#DEAA18', 'stroke-width': 4 }, el);
    svg('circle', { cx: cx, cy: cy, r: 7, fill: '#2B2326' }, el);
    svg('text', { x: cx + 66 * Math.cos(rad / 2), y: cy - 66 * Math.sin(rad / 2) - 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#6C2166' }, el).textContent = f(deg) + '°';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '角' }));
    cover.appendChild(h('p', { cls: 'lead', text: '一条射线绕端点旋转——钟面、剪刀、张开的圆规都是角' }));
    var holder = box(cover, 190, 300, 900, 280);
    drawAngle(holder, 50, false);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 4.3　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, deg = 50, pro = true;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>量角器</b>——拖滑杆转边，中心对顶点、0 线对边' });
    var stage = box(root, 40, 90, 900, 290, { cls: 'mini-stage' });
    var rb = box(root, 60, 400, 860, 110, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawAngle(stage, deg, pro);
      rb.innerHTML = '<b>读数 ' + f(deg) + '°</b>：<span class=\'mut\'>另一边在 0° 线下方读内圈，上方读外圈。量角器中心必须压住角的顶点。</span>';
    }
    render();
    var s = box(root, 100, 530, 1080, 60);
    s.innerHTML = '<label>角度</label><input type=range min=5 max=180 value=50 step=1 style=width:70%><button class="tool" style="margin-left:20px" id="proTog">量角器开/关</button>';
    s.querySelector('input').addEventListener('input', function (e) { deg = +e.target.value; render(); });
    s.querySelector('#proTog').addEventListener('click', function () { pro = !pro; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, deg = 35.5;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>度分秒</b>——1° = 60′，1′ = 60″（六十进制）' });
    var stage = box(root, 100, 100, 1080, 180, { cls: 'mini-stage' });
    var conv = box(root, 100, 310, 1080, 130, { cls: 'note-card' });
    function render() {
      stage.innerHTML = ''; drawAngle(stage, deg, false);
      var dms = M.toDMS(deg);
      conv.innerHTML = '<b>' + f(deg) + '° = ' + dms[0] + '°' + dms[1] + '′' + dms[2] + '″</b><br>' +
        '<span class=\'mut\'>小数部分乘 60 变分，分的小数部分再乘 60 变秒。反向：' + dms[0] + '°' + dms[1] + '′' + dms[2] + '″ = ' + M.toDeg(dms[0], dms[1], dms[2]) + '°</span>';
    }
    render();
    var s = box(root, 150, 470, 980, 60);
    s.innerHTML = '<label>度数</label><input type=range min=1 max=90 step=0.05 value=35.5 style=width:100%>';
    s.querySelector('input').addEventListener('input', function (e) { deg = +e.target.value; render(); });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>钟面角</b>——整点时刻的夹角' });
    [[3, 90], [4, 120], [6, 180], [2, 60]].forEach((cfg, i) => {
      var c = card(root, 70 + i * 290, 120, 260, 260, { s: 1 });
      var holder = box(c, 8, 12, 244, 190);
      drawAngle(holder, cfg[1], false);
      box(c, 10, 208, 240, 40, { cls: 'c-name', text: cfg[0] + ' 点整：' + cfg[1] + '°' });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
