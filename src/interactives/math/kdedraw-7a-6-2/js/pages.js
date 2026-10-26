(function () {
  'use strict';
  var L = window.LESSON, M = window.MathEngine, f = M.fmt;
  var h = K.h, box = K.box, card = K.card, svg = K.svg;
  var P = (K.PAGES = {});
  var OPTIONS = ['篮球', '足球', '游泳', '棋类'];
  var VOTES = [];
  for (var v = 0; v < 40; v++) VOTES.push(v % 7 === 0 ? 2 : v % 3);
  P[1] = { full: true, build: function (ctx) {
    var cover = box(ctx.root, 0, 0, 1280, 720, { cls: 'cover' });
    cover.appendChild(h('h1', { text: '数据的整理' }));
    cover.appendChild(h('p', { cls: 'lead', text: '40 张选票落下来——用「正」字把它们接住' }));
    var holder = box(cover, 190, 300, 900, 280);
    var el = svg('svg', { viewBox: '0 0 900 260', style: 'width:100%;height:100%' }, holder);
    for (var i = 0; i < 40; i++) {
      var x = 70 + (i % 20) * 40, y = 40 + Math.floor(i / 20) * 46;
      svg('circle', { cx: x, cy: y, r: 13, fill: ['rgba(108,33,102,.16)','rgba(222,170,24,.3)','rgba(30,127,79,.2)','rgba(192,57,43,.16)'][VOTES[i]], stroke: '#2B2326', 'stroke-width': 1.8 }, el);
      svg('text', { x: x, y: y + 5, 'text-anchor': 'middle', 'font-size': 12, fill: '#2B2326' }, el).textContent = OPTIONS[VOTES[i]];
    }
    cover.appendChild(h('p', { cls: 'fig-foot', html: '北师大版七年级上册 · 6.2　<span class=\'mono\'>FIG · 情境引入</span>' }));
    return { steps: 3, step: function () {}, leave: function () {} };
  }};
  P[2] = { build: function (ctx) {
    var root = ctx.root, shown = 0;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务一：<b>点「来一票」</b>——看划记怎么长出来' });
    var stage = box(root, 40, 90, 900, 260, { cls: 'mini-stage' });
    var counter = box(root, 970, 110, 270, 200, { cls: 'note-card' });
    function render() {
      stage.innerHTML = '';
      var el = svg('svg', { viewBox: '0 0 900 240', style: 'width:100%;height:100%' }, stage);
      var cnt = [0, 0, 0, 0];
      for (var i = 0; i < shown; i++) cnt[VOTES[i]]++;
      var rows = [130, 168, 206, 244];
      OPTIONS.forEach(function (o, k) {
        svg('text', { x: 80, y: rows[k] - 28, 'font-size': 17, 'font-weight': 700, fill: '#6C2166' }, el).textContent = o;
        svg('text', { x: 200, y: rows[k] - 28, 'font-size': 26, fill: '#2B2326', 'letter-spacing': 4 }, el).textContent = M.tally(cnt[k]);
        svg('text', { x: 620, y: rows[k] - 28, 'font-size': 17, fill: '#A87C06', 'font-weight': 700 }, el).textContent = cnt[k] + ' 票';
      });
      counter.innerHTML = '<b>已唱票 ' + shown + ' / ' + VOTES.length + '</b><br><span class=\'mut\'>「正」字计数：每 5 票凑一个正字，一眼看出几组。</span>';
    }
    render();
    var btn = box(root, 970, 340, 270, 56, { cls: 'tool', text: '来一票 →' });
    btn.addEventListener('click', function () { shown = Math.min(shown + 1, VOTES.length); render(); });
    var all = box(root, 970, 410, 270, 56, { cls: 'tool', text: '全部唱完' });
    all.addEventListener('click', function () { shown = VOTES.length; render(); });
    return { steps: 3, step: function (k) { shown = [0, 13, 27, 40][k] || 0; render(); }, leave: function () {} };
  }};
  P[3] = { build: function (ctx) {
    var root = ctx.root;
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '任务二：<b>频数分布表</b>——频数 ÷ 总数 = 频率' });
    var cnt = [0, 0, 0, 0];
    VOTES.forEach(function (v) { cnt[v]++; });
    var tb = box(root, 100, 100, 1080, 250, { s: 1 });
    K.table(tb, 0, 0, [['选项', '划记', '频数', '频率']]
      .concat(OPTIONS.map(function (o, k) { return [o, M.tally(cnt[k]), String(cnt[k]), M.freq(cnt[k], VOTES.length)]; })), [220, 320, 240, 240]);
    box(root, 100, 380, 1080, 130, { cls: 'note-card', s: 2, html: '<b>检验：</b>频数之和 = ' + cnt.reduce(function (a, b) { return a + b; }, 0) + '（等于总数）；频率之和 = ' + M.freq(cnt.reduce(function (a, b) { return a + b; }, 0), VOTES.length) + '（恒为 1）。<span class=\'mut\'>频率×100% 就是百分比。</span>' });
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
    box(root, 20, 12, 1240, 46, { cls: 'strip', html: '演示台：<b>从表到条形图</b>——同一组数据的两种长相' });
    var cnt = [0, 0, 0, 0];
    VOTES.forEach(function (v) { cnt[v]++; });
    var stage = box(root, 100, 100, 1080, 360, { cls: 'mini-stage' });
    var el = svg('svg', { viewBox: '0 0 1080 340', style: 'width:100%;height:100%' }, stage);
    cnt.forEach(function (c, k) {
      var x = 140 + k * 240, hh = c * 22;
      svg('rect', { x: x, y: 300 - hh, width: 130, height: hh, fill: 'rgba(222,170,24,.4)', stroke: '#2B2326', 'stroke-width': 2.4 }, el);
      svg('text', { x: x + 65, y: 292 - hh, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#6C2166' }, el).textContent = c;
      svg('text', { x: x + 65, y: 330, 'text-anchor': 'middle', 'font-size': 18, fill: '#2B2326' }, el).textContent = OPTIONS[k];
    });
    svg('line', { x1: 100, y1: 300, x2: 1040, y2: 300, stroke: '#2B2326', 'stroke-width': 3 }, el);
    return { steps: 1, step: function () {}, leave: function () {} };
  }};
})();
