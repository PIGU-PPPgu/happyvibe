(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  function drawCrowd(root, mode, seed) {
    var el = svg('svg', { viewBox: '0 0 900 260', style: 'width:100%;height:100%;overflow:visible' }, root);
    var N = 60;
    var picked = mode === 'all' ? Array.from({ length: N }, function (_, i) { return i; }) : M.sample(N, mode === 'basket' ? 12 : 24, seed);
    for (var i = 0; i < N; i++) {
      var col = i % 12, row = (i / 12) | 0;
      var x = 90 + col * 62, y = 44 + row * 62;
      var on = picked.indexOf(i) >= 0;
      svg('circle', { cx: x, cy: y, r: 15, fill: on ? '#DEAA18' : 'rgba(108,33,102,.10)', stroke: '#2B2326', 'stroke-width': on ? 2.4 : 1.4, opacity: on ? 1 : .55 }, el);
      if (on) svg('text', { x: x, y: y + 5, 'text-anchor': 'middle', 'font-size': 11, fill: '#6C2166', 'font-weight': 700 }, el).textContent = '✓';
    }
    svg('text', { x: 450, y: 246, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#6C2166' }, el).textContent =
      mode === 'all' ? '普查：60 人全部调查' : '抽样调查了 ' + picked.length + ' 人（总体 60 人）';
    return el;
  }
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '数据的收集' }));
    cover.appendChild(h('p', { cls: 'lead', text: '每一个都查，还是查一部分？——普查与抽样' }));
    var holder = box(cover, 190, 300, 900, 280);
    drawCrowd(holder, 'sample', 7);
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 6.1　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, mode = 'sample';
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>切换调查方式</b>——普查、随机抽样、小范围抽样' });
    var stage = box(root, 40, 90, 900, 280, { cls: 'mini-stage' });
    var rb = box(root, 970, 110, 270, 340, { cls: 'note-card' });
    var seed = 7;
    function render() {
      stage.innerHTML = ''; drawCrowd(stage, mode, seed);
      rb.innerHTML = mode === 'all' ? '<b>普查：</b>每一个都查。准确但费时费力，破坏性调查（灯泡寿命）不能用。'
        : '<b>抽样调查：</b>只查一部分。<br>总体 = 全体考察对象<br>个体 = 每一个对象<br>样本 = 被抽查的部分<br><span class=\'mut\'>「再抽一次」看随机性。</span>';
    }
    render();
    [['普查', 'all'], ['随机抽样', 'sample'], ['小样本', 'basket']].forEach(function (c, i) {
      var b = box(root, 100 + i * 190, 400, 175, 48, { cls: 'tool', text: c[0] });
      b.addEventListener('click', function () { mode = c[1]; render(); });
    });
    var again = box(root, 700, 400, 175, 48, { cls: 'tool', text: '再抽一次' });
    again.addEventListener('click', function () { seed = (seed * 31 + 7) % 2147483647; render(); });
    return { steps: 2, step: function () {}, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>样本代表性</b>——同样 12 人，抽样地点不同结论大不同' });
    var tb = box(root, 100, 100, 1080, 240, { s: 1 });
    K.table(tb, 0, 0, [
      ['抽样地点', '样本构成', '推测「全校最爱的运动」', '问题'],
      ['篮球场', '12 人全爱篮球', '篮球？', '严重偏向篮球'],
      ['图书馆', '12 人多爱阅读', '运动都不爱？', '偏向安静活动'],
      ['随机门岗', '12 人各不相同', '接近真实分布', '代表性好'],
    ], [220, 280, 320, 240]);
    box(root, 100, 370, 1080, 150, { cls: 'note-card', s: 2, html: '<b>样本偏差：</b>抽样要「随机」且「覆盖各群体」，否则样本越大错得越远。<span class=\'mut\'>1936 年美国民调：260 万份问卷预测错总统——因为名单来自电话簿（当年富人 Republican 偏多）。</span>' });
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
    var root = ctx.root, seed = 13;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>随机抽样模拟器</b>——每次抽 12 人，爱好分布稳定吗？' });
    var stage = box(root, 40, 90, 900, 280, { cls: 'mini-stage' });
    var rb = box(root, 970, 110, 270, 300, { cls: 'note-card' });
    var NAMES = ['球类', '游泳', '田径', '棋类'];
    function render() {
      stage.innerHTML = ''; drawCrowd(stage, 'basket', seed);
      var picked = M.sample(60, 12, seed);
      var cnt = {};
      picked.forEach(function (i) { var k = NAMES[i % 4]; cnt[k] = (cnt[k] || 0) + 1; });
      rb.innerHTML = '<b>本次样本：</b><br>' + NAMES.map(function (n) { return n + '：' + (cnt[n] || 0) + ' 人'; }).join('<br>') + '<br><span class=\'mut\'>多抽几次看波动——样本小波动大，这正是要「足够且有代表性」的原因。</span>';
    }
    render();
    var again = box(root, 400, 400, 260, 52, { cls: 'tool', text: '再抽一次' });
    again.addEventListener('click', function () { seed = (seed * 31 + 7) % 2147483647; render(); });
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
