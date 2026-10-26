(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '一元一次方程的解法' }));
    cover.appendChild(h('p', { cls: 'lead', text: '移项飞行：穿过等号要变号——本质是两边同减的快捷写法' }));
    var holder = box(cover, 190, 300, 900, 240);
    var el = svg('svg', { viewBox: '0 0 900 220', style: 'width:100%;height:100%' }, holder);
    svg('line', { x1: 340, y1: 40, x2: 340, y2: 180, stroke: '#2B2326', 'stroke-width': 5 }, el);
    svg('text', { x: 190, y: 120, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#6C2166' }, el).textContent = 'x + 5';
    svg('text', { x: 700, y: 120, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#1E7F4F' }, el).textContent = '18';
    var fly = svg('text', { x: 190, y: 180, 'text-anchor': 'middle', 'font-size': 30, fill: '#C0392B', 'font-weight': 700 }, el);
    fly.textContent = '−5 →';
    var t = 0;
    var iv = setInterval(function () {
      t += 0.02; if (!document.body.contains(fly)) { clearInterval(iv); return; }
      fly.setAttribute('x', 190 + t * 480);
      fly.setAttribute('y', 120 + Math.sin(t * Math.PI) * -50);
      fly.textContent = (t > 0.5 ? '+5' : '−5 →');
      if (t >= 1) { clearInterval(iv); fly.textContent = '+5 ✓ 变号了'; }
    }, 30);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 5.3　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    var a = 3, b = -5, c = 16;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>三步解 3x − 5 = 16</b>——每点一下走一步' });
    var stage = box(root, 100, 100, 1080, 300, { cls: 'mini-stage' });
    function render() {
      stage.innerHTML = '';
      var rows = [['原方程', '3x − 5 = 16', '依据：等式'] .concat(M.steps(a, b, c).map(function (s) { return [s.label, s.expr, '性质 1/2']; }))];
      var all = [['原方程', '3x − 5 = 16', '']].concat(M.steps(a, b, c).map(function (s) { return [s.label, s.expr, '性质 1/2']; }));
      K.table(stage, 40, 20, [['步骤', '式子', '依据']].concat(all), [280, 380, 280], { hl: [Math.min(step, all.length), 0] });
    }
    render();
    var next = box(root, 400, 470, 280, 56, { cls: 'tool', text: '下一步 →' });
    next.addEventListener('click', function () { step = (step + 1) % 4; render(); });
    box(root, 100, 470, 260, 56, { cls: 'note-card', html: '<b>移项为什么变号？</b><br>等价于两边同加 5。' });
    return { steps: 3, step: function (k) { step = k; render(); }, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, step = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>五步曲</b>——解 (x+1)/2 − 1 = (x−2)/3' });
    var stepsFive = [
      ['① 去分母（同乘 6）', '3(x + 1) − 6 = 2(x − 2)', '每一项都乘，含分母不含分母都要乘'],
      ['② 去括号', '3x + 3 − 6 = 2x − 4', '分配律'],
      ['③ 移项', '3x − 2x = −4 − 3 + 6', '过等号变号'],
      ['④ 合并', 'x = −1', '同类项合并'],
      ['⑤ 检验', '左边 = (−1+1)/2 − 1 = −1；右边 = (−1−2)/3 = −1 ✓', '养成习惯'],
    ];
    var cards = stepsFive.map(function (s, i) {
      return box(root, 100, 100 + i * 88, 1080, 76, { cls: 'note-card', s: i + 1, html: '<b>' + s[0] + '</b>　<span class=\'mono big\'>' + s[1] + '</span>　<span class=\'mut\'>' + s[2] + '</span>' });
    });
    return { steps: 5, step: function () {}, leave: function () {} };
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
    var root = ctx.root, a = 3, b = -5, c = 16;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>解方程生成器</b>——改系数，看步骤自动重排' });
    var stage = box(root, 100, 100, 1080, 320, { cls: 'mini-stage' });
    function render() {
      stage.innerHTML = '';
      var all = [['原方程', f(a) + 'x ' + (b >= 0 ? '+ ' : '− ') + f(Math.abs(b)) + ' = ' + f(c), '']].concat(
        M.steps(a, b, c).map(function (s) { return [s.label, s.expr, '性质 1/2']; }));
      K.table(stage, 40, 20, [['步骤', '式子', '依据']].concat(all), [300, 380, 280]);
    }
    render();
    var s = box(root, 100, 460, 1080, 80);
    s.innerHTML = '<label>a</label><input type=range min=1 max=9 value=3 style=width:26%><label style="margin-left:24px">b</label><input type=range min=-12 max=12 value=-5 style=width:26%><label style="margin-left:24px">c</label><input type=range min=-20 max=40 value=16 style=width:26%>';
    var ins = s.querySelectorAll('input');
    ins.forEach(function (inp) { inp.addEventListener('input', function () { a = +ins[0].value; b = +ins[1].value; c = +ins[2].value; render(); }); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
