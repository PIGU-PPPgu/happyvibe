(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '代数式' }));
    cover.appendChild(h('p', { cls: 'lead', text: '文字与式子互相翻译——代数是一门语言' }));
    var row = box(cover, 240, 290, 800, 160);
    [['比 a 大 5 的数', 'a + 5'], ['x 的 3 倍少 2', '3x - 2']].forEach((pr, i) => {
      var c = card(row, i * 410, 10, 390, 130, { s: 1 });
      box(c, 20, 18, 350, 44, { cls: 'c-name', text: pr[0] });
      box(c, 20, 70, 350, 44, { cls: 'c-name', style: 'font-size:24px;color:var(--gold-dark)', text: pr[1] });
    });
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 3.2　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>对对碰</b>——点左边的文字，再点右边的式子' });
    var pick = null, done = 0;
    var score = box(root, 520, 540, 240, 40, { cls: 'pill big-score', text: '配对 0 / ' + L.pairs.length });
    var txts = L.pairs.slice().sort(function () { return Math.random() - 0.5; });
    var exprs = L.pairs.slice().sort(function () { return Math.random() - 0.5; });
    txts.forEach((pr, i) => {
      var c = card(root, 100, 100 + i * 90, 460, 66, { cls: 'c-obj', text: pr.txt });
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        if (c.classList.contains('ok')) return;
        document.querySelectorAll('.c-obj.pick').forEach(e => e.classList.remove('pick'));
        c.classList.add('pick'); pick = pr;
      });
    });
    exprs.forEach((pr, i) => {
      var c = card(root, 720, 100 + i * 90, 440, 66, { cls: 'c-tgt', style: 'font-size:22px', text: pr.expr });
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        if (!pick || c.classList.contains('ok')) return;
        document.querySelectorAll('.c-obj.pick').forEach(e => e.classList.remove('pick'));
        if (pick === pr) { c.classList.add('ok'); done++; score.textContent = '配对 ' + done + ' / ' + L.pairs.length; }
        else { c.classList.add('bad'); setTimeout(function () { c.classList.remove('bad'); }, 600); }
        pick = null;
      });
    });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root, x = 2;
    var EXPRS = ['2x + 1', 'x² - 1', '3(x + 1)', '(2x - 1) / 3'];
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>代入机</b>——拖 x 的值，四个式子的值一起变' });
    var grid = box(root, 60, 100, 1160, 240);
    var cells = EXPRS.map((e, i) => {
      var c = card(grid, 20 + i * 287, 20, 265, 190, { s: 1 });
      box(c, 14, 20, 237, 50, { cls: 'c-name', style: 'font-size:24px', text: e });
      var val = box(c, 14, 90, 237, 70, { cls: 'c-name', style: 'font-size:30px;color:var(--gold-dark)', text: '' });
      return { val: val, e: e };
    });
    var rb = box(root, 60, 370, 1160, 80, { cls: 'note-card' });
    var slider = box(root, 150, 470, 980, 60);
    slider.innerHTML = '<label>x</label><input type=range min=-6 max=6 step=0.5 value=2 style=width:100%><output style="font-size:22px;margin-left:14px">x = 2</output>';
    function render() {
      cells.forEach(c => {
        var r = M.evalExpr(c.e.replace('²', '**2'), { x: x });
        c.val.textContent = r === null ? '—' : '= ' + f(Math.round(r * 100) / 100);
      });
      rb.innerHTML = '<b>代入要加括号：</b>x = ' + f(x) + ' 时，x² 就是 (' + f(x) + ')² ——先算乘方再算加减。<span class=\'mut\'>负数与分数代入必须加括号。</span>';
      slider.querySelector('output').textContent = 'x = ' + f(x);
    }
    render();
    slider.querySelector('input').addEventListener('input', function (e) { x = +e.target.value; render(); });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>两位数的代数式</b>——10a + b' });
    box(root, 100, 120, 1080, 110, { cls: 'note-card', html: '<b>十位 a、个位 b 的两位数 = 10a + b</b>（a 表示 a 个 10）。交换数字位置：10b + a，两数之差 = 9(a − b)，能被 9 整除——数字黑魔术的原理。' });
    var stage = box(root, 250, 270, 780, 220, { cls: 'mini-stage' });
    var slider = box(root, 250, 510, 780, 60);
    slider.innerHTML = '<label>a（十位）</label><input type=range min=1 max=9 value=2 style=width:30%><label style="margin-left:30px">b（个位）</label><input type=range min=0 max=9 value=7 style=width:30%>';
    function render() {
      var ins = slider.querySelectorAll('input'), a = +ins[0].value, b = +ins[1].value;
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 780 200', style: 'width:100%;height:100%' }, stage);
      svg('text', { x: 390, y: 60, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#6C2166' }, el).textContent = a + '' + b;
      svg('text', { x: 390, y: 110, 'text-anchor': 'middle', 'font-size': 17, fill: '#2B2326' }, el).textContent = '= 10×' + a + ' + ' + b + ' = ' + (10 * a + b);
      svg('text', { x: 390, y: 150, 'text-anchor': 'middle', 'font-size': 15, fill: '#7C7068' }, el).textContent = '交换后 ' + b + '' + a + ' = ' + (10 * b + a) + '，两数之差 = ' + Math.abs(10 * a + b - 10 * b - a) + '（9 的倍数）';
    }
    render();
    slider.querySelectorAll('input').forEach(inp => inp.addEventListener('input', render));
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
