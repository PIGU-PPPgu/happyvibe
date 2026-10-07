import { init } from '../../_shared/runtime.mjs';

// 修辞手法例句对比：比喻/拟人/排比/夸张切换，成分高亮标注可显隐，比喻附本体喻体连线小练习
// 例句取自统编教材课文并核对原文：春(七上)、济南的冬天(七上)、紫藤萝瀑布(七下)、
// 木兰诗(七下)、安塞腰鼓(八下)、望庐山瀑布(小学学过，初中引用)；个别为通用练习句

const DATA = [
  {
    id: 'by', name: '比喻',
    intro: '用相似的事物打比方：本体＋喻词＋喻体；不用喻词、直接用「是」的叫暗喻。',
    legend: [['bt', '本体'], ['yc', '喻词'], ['yt', '喻体']],
    items: [
      { src: '朱自清《春》', s: '<bt>红的</bt><yc>像</yc><yt>火</yt>，<bt>粉的</bt><yc>像</yc><yt>霞</yt>，<bt>白的</bt><yc>像</yc><yt>雪</yt>。', a: '三组比喻连用（兼排比），写出春花颜色的明艳。' },
      { src: '宗璞《紫藤萝瀑布》', s: '只见一片辉煌的<bt>淡紫色</bt>，<yc>像</yc>一条<yt>瀑布</yt>，从空中垂下。', a: '把花丛比作瀑布，写出紫藤萝开得繁茂、有气势。' },
      { src: '老舍《济南的冬天》', s: '自上而下全是那么清亮，那么蓝汪汪的，<bt>整个的</bt><yc>是</yc>块空灵的<yt>蓝水晶</yt>。', a: '暗喻：喻词换成「是」，把水天一色的济南比作蓝水晶。' },
    ],
    pairs: [['太阳', '火球'], ['月亮', '玉盘'], ['眼睛', '星星'], ['时间', '流水']],
  },
  {
    id: 'nr', name: '拟人',
    intro: '把物当作人来写：给事物配上人的动作、情态或感情。',
    legend: [['bt', '对象'], ['yt', '人的动作情态']],
    items: [
      { src: '朱自清《春》', s: '<bt>小草</bt><yt>偷偷地</yt>从土里<yt>钻</yt>出来，嫩嫩的，绿绿的。', a: '「偷偷地」「钻」写出小草不经意间萌发，像个调皮的孩子。' },
      { src: '老舍《济南的冬天》', s: '一个<bt>老城</bt>，有山有水，全在天底下晒着阳光，暖和安适地<yt>睡着</yt>，只等春风来把它们<yt>唤醒</yt>。', a: '老城会「睡」会「醒」，写出济南冬天的温暖安适。' },
      { src: '朱自清《春》', s: '<bt>鸟儿</bt>将巢安在繁花嫩叶当中，高兴起来了，<yt>呼朋引伴地卖弄</yt>清脆的喉咙。', a: '「高兴」「卖弄」把鸟儿写出人的欢快心气。' },
    ],
  },
  {
    id: 'pb', name: '排比',
    intro: '三个或更多结构相同、语气一致的短语分句连排，读起来有一气呵成的气势。',
    legend: [['pp', '并列分句'], ['bt', '重复句式']],
    items: [
      { src: '朱自清《春》', s: '<pp>山<bt>朗润起来了</bt></pp>，<pp>水<bt>涨起来了</bt></pp>，<pp>太阳的脸<bt>红起来了</bt></pp>。', a: '三个「……起来了」并列，春回大地的变化扑面而来。' },
      { src: '刘成章《安塞腰鼓》', s: '<pp><bt>骤雨一样</bt>，是急促的鼓点</pp>；<pp><bt>旋风一样</bt>，是飞扬的流苏</pp>；<pp><bt>乱蛙一样</bt>，是蹦跳的脚步</pp>。', a: '「……一样，是……」句式反复，鼓点越来越密、气势越催越紧。' },
      { src: '通用练习句', s: '<pp><bt>爱心</bt>是冬日的阳光</pp>，<pp><bt>爱心</bt>是沙漠的清泉</pp>，<pp><bt>爱心</bt>是夜路的灯塔</pp>。', a: '句首「爱心」反复出现，排比之中又各含一个比喻。' },
    ],
  },
  {
    id: 'kh', name: '夸张',
    intro: '故意言过其实，放大或缩小事物的特征，加深印象。',
    legend: [['yt', '夸大处']],
    items: [
      { src: '李白《望庐山瀑布》', s: '飞流直下<yt>三千尺</yt>，疑是<yt>银河落九天</yt>。', a: '极言瀑布之高之急，奇想天外。' },
      { src: '《木兰诗》', s: '<yt>万里</yt>赴戎机，<yt>关山度若飞</yt>。', a: '极言行军之远、进军之速，战事紧张。' },
      { src: '通用练习句', s: '教室里静得连一根针<yt>掉在地上都能听见</yt>。', a: '以不可能听见的声响反衬安静到极点。' },
    ],
  },
];

const CSS = `
.rh-wrap{position:absolute;inset:0;overflow:auto;padding:18px 24px 30px;display:flex;flex-direction:column;gap:14px}
.rh-tabs{display:flex;gap:8px;flex-wrap:wrap}
.rh-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:18px 22px;display:flex;flex-direction:column;gap:12px;max-width:880px}
.rh-src{font-size:16px;color:var(--muted)}
.rh-sent{font-size:22px;line-height:2.1;font-weight:500}
.rh-sent b{font-weight:700;transition:color .25s,background .25s,border-color .25s;border-bottom:2px solid transparent;padding:1px 2px}
.rh-show .rh-sent b.bt{color:var(--gold)}
.rh-show .rh-sent b.yt{color:var(--purple);border-color:var(--purple)}
.rh-show .rh-sent b.yc{color:var(--muted);border:1.5px dashed var(--muted);border-radius:6px;padding:0 6px;font-size:19px}
.rh-show .rh-sent b.pp{background:rgba(166,61,151,.14);border-bottom:2px solid var(--purple)}
.rh-show .rh-sent b.pp b.bt{color:var(--gold);background:none;border-color:transparent}
.rh-ana{font-size:17px;color:var(--muted);line-height:1.7}
.rh-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:16px;color:var(--muted);align-items:center}
.rh-legend i{display:inline-block;width:18px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.rh-legend .i-bt{background:var(--gold)}
.rh-legend .i-yt{background:var(--purple)}
.rh-legend .i-yc{background:none;border:1.5px dashed var(--muted)}
.rh-ctl{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.rh-cnt{font-size:16px;color:var(--muted);margin-left:2px}
.rh-quiz{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:18px 22px;display:flex;flex-direction:column;gap:12px;max-width:880px}
.rh-quiz h3{font-size:20px}
.rh-board{position:relative;display:flex;justify-content:space-between;gap:18px;padding:6px 0}
.rh-col{display:flex;flex-direction:column;gap:12px;z-index:2}
.rh-word{font:inherit;font-size:20px;padding:10px 18px;border:1.5px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);cursor:pointer;touch-action:manipulation;min-width:110px}
.rh-word.sel{border-color:var(--gold);color:var(--gold);font-weight:700}
.rh-word.done{border-color:var(--gold);color:var(--gold);opacity:.85;pointer-events:none}
.rh-word.wrong{border-color:#e2543f;animation:rh-shake .4s}
@keyframes rh-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.rh-svg{position:absolute;inset:0;z-index:1;pointer-events:none}
.rh-svg line{stroke-width:2.5;stroke-linecap:round}
.rh-tip{font-size:17px;color:var(--muted)}
.rh-teach{border:1px solid var(--line);border-radius:14px;background:var(--panel2);padding:12px 16px;display:flex;flex-direction:column;gap:8px;max-width:880px}
.rh-tsteps{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.rh-tsteps .btn[aria-pressed=true]{border-color:var(--gold);color:var(--gold)}
.rh-tguide{display:block;font-size:15px;line-height:1.7;color:var(--text)}
.rh-sumbtn{margin-left:auto}
.rh-panel{position:fixed;top:calc(var(--shell-top) + 12px);left:50%;transform:translateX(-50%);z-index:30;max-width:640px;margin:0 16px;padding:16px 20px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;font-size:16px;line-height:1.9;display:none;box-shadow:0 8px 30px rgba(0,0,0,.35)}
`;

let wrap, cardEl, quizEl, tabsEl, mi = 0, ii = 0, showMark = false;
let pickL = -1, doneCnt = 0;
const ERR = '#e2543f';

function render() {
  const d = DATA[mi];
  cardEl.innerHTML = `
    <div class="rh-src">${d.items[ii].src}</div>
    <div class="rh-sent">${d.items[ii].s}</div>
    <div class="rh-ana">${d.items[ii].a}</div>
    <div class="rh-legend">${d.legend.map(([k, t]) => `<span><i class="i-${k}"></i>${t}</span>`).join('')}</div>
    <div class="rh-ctl">
      <button class="btn" type="button" data-a="prev">上一句</button>
      <button class="btn" type="button" data-a="next">下一句</button>
      <button class="btn" type="button" data-a="mark">${showMark ? '隐藏标注' : '显示标注'}</button>
      <span class="rh-cnt">${ii + 1}/${d.items.length}</span>
    </div>`;
  cardEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.a;
    if (a === 'prev') ii = (ii + d.items.length - 1) % d.items.length;
    else if (a === 'next') ii = (ii + 1) % d.items.length;
    else if (a === 'mark') showMark = !showMark;
    render();
  }));
  cardEl.classList.toggle('rh-show', showMark);
  quizEl.style.display = d.pairs ? '' : 'none';
  if (d.pairs) buildQuiz(d);
}

let svg, lCol, rCol, tipEl, tempLine = null;
function buildQuiz(d) {
  quizEl.innerHTML = '<h3>本体喻体连连看</h3><div class="rh-tip">先点左边本体，再点右边喻体：连对变金线，连错闪红</div>';
  const board = document.createElement('div');
  board.className = 'rh-board';
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'rh-svg');
  board.appendChild(svg);
  const right = [...d.pairs].sort(() => Math.random() - 0.5);
  lCol = document.createElement('div');
  lCol.className = 'rh-col';
  rCol = document.createElement('div');
  rCol.className = 'rh-col';
  d.pairs.forEach(([l], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rh-word';
    b.textContent = l;
    b.dataset.i = i;
    lCol.appendChild(b);
  });
  right.forEach(([l, r]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rh-word';
    b.textContent = r;
    b.dataset.pair = l;
    rCol.appendChild(b);
  });
  board.appendChild(lCol);
  board.appendChild(rCol);
  quizEl.appendChild(board);
  tipEl = document.createElement('div');
  tipEl.className = 'rh-tip';
  quizEl.appendChild(tipEl);
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'btn';
  reset.textContent = '重连';
  reset.style.alignSelf = 'flex-start';
  reset.addEventListener('click', () => buildQuiz(d));
  quizEl.appendChild(reset);

  lCol.querySelectorAll('.rh-word').forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('done')) return;
    pickL = +b.dataset.i;
    lCol.querySelectorAll('.rh-word').forEach((x) => x.classList.remove('sel'));
    b.classList.add('sel');
  }));
  rCol.querySelectorAll('.rh-word').forEach((b) => b.addEventListener('click', () => {
    if (pickL < 0 || b.classList.contains('done')) return;
    if (b.dataset.pair === d.pairs[pickL][0]) {
      drawLine(lCol.children[pickL], b, 'var(--gold)');
      lCol.children[pickL].classList.add('done');
      lCol.children[pickL].classList.remove('sel');
      b.classList.add('done');
      doneCnt++;
      pickL = -1;
      tipEl.textContent = doneCnt === d.pairs.length ? '全部连对' : '';
    } else {
      tempLine = drawLine(lCol.children[pickL], b, ERR);
      b.classList.add('wrong');
      setTimeout(() => { b.classList.remove('wrong'); tempLine?.remove(); tempLine = null; }, 500);
      tipEl.textContent = '不对，再想想：两者哪里相似？';
    }
  }));
  pickL = -1; doneCnt = 0;
}

function drawLine(a, b, color) {
  const board = svg.parentElement;
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const rc = board.getBoundingClientRect();
  const x1 = ra.right - rc.left, y1 = ra.top + ra.height / 2 - rc.top;
  const x2 = rb.left - rc.left, y2 = rb.top + rb.height / 2 - rc.top;
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  svg.appendChild(line);
  return line;
}

// 教学环节：按钮点击把场景切到预设状态（手法标签 mi、例句序号 ii、标注显隐 mk），并显示该环节引导语
// 认手法：比喻第 1 句、标注隐藏，让学生先找成分；验标注：比喻第 3 句（暗喻）、标注显示对照检验；
// 辨异同：切到排比《安塞腰鼓》、标注显示，与比喻对照归纳
const STEPS = [
  {
    name: '认手法',
    m: 0, i: 0, mk: false,
    guide: '先读原句：红的像火，粉的像霞，白的像雪。作者把什么比作了什么？请你指出句中的本体、喻词和喻体，先不看标注。',
    note: '比喻三要素：本体（被比的事物）、喻词（像、是、仿佛等）、喻体（用来打比方的事物）。成立的前提是本体喻体「不同类但有相似点」——花与火不同类，相似点是颜色与热烈。辨析第一问永远是：相似点在哪里？说不清相似点，多半不是比喻。',
  },
  {
    name: '验标注',
    m: 0, i: 2, mk: true,
    guide: '对照标注检验：金色是本体，紫色是喻体，虚线框是喻词。注意这句的喻词是「是」不是「像」，暗喻和明喻差别在哪里？点「下一句」连看三例。',
    note: '明喻与暗喻只差喻词：用「像、好像、仿佛」是明喻，用「是、成了、变成」是暗喻（隐喻）。暗喻更斩钉截铁，「本体是喻体」直接画等号，语气更重。还有借喻——本体喻词都不出现，只出现喻体（「我们之间隔着一堵墙」），辨认难度最高，要靠上下文补回本体。',
  },
  {
    name: '辨异同',
    m: 2, i: 1, mk: true,
    guide: '换成《安塞腰鼓》再比一比：三个「……一样，是……」连排，读出一气呵成的气势。回头看《春》第一句，比喻兼排比的句子怎么辨？',
    note: '一句话可以兼用两种修辞：「红的像火，粉的像霞，白的像雪」既是三个比喻连用，又构成排比（三个结构相同、语气一致的分句连排）。答题不要非此即彼，要分层说：结构上构成排比，内容上各分句是比喻，表达效果取并集——气势与形象兼得。',
  },
];
// 小结为结论性内容，与各手法标签页的释义一致
const SUMMARY = '修辞辨析要点：比喻用相似的事物打比方，句中有本体、喻词、喻体，喻词用「像」是明喻、用「是」是暗喻；拟人把物当作人来写，给事物配上人的动作、情态或感情；排比是三个或更多结构相同、语气一致的短语或分句连排，读来一气呵成；夸张故意言过其实，放大或缩小事物的特征。辨析先找结构标志，再追问相似点在哪里。';

function syncTabs() {
  tabsEl.querySelectorAll('.btn').forEach((x, j) => {
    x.style.borderColor = j === mi ? 'var(--gold)' : 'var(--line)';
    x.style.color = j === mi ? 'var(--gold)' : 'var(--text)';
  });
}

function setStep(k) {
  const st = STEPS[k];
  mi = st.m; ii = st.i; showMark = st.mk;
  syncTabs();
  render();
  document.querySelectorAll('[data-hv-step]').forEach((el, j) => el.setAttribute('aria-pressed', String(j === k)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, j) => { el.style.display = j === k ? '' : 'none'; });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·初中七八年级｜统编版七上至八下 · 修辞手法辨析',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '「红的像火，粉的像霞，白的像雪」中，本体是？',
      opts: ['火、霞、雪', '花（各种颜色的花）', '喻词「像」', '没有本体'],
      a: 1,
      why: '本体是被比的事物——各色的花；火、霞、雪是喻体。找本体要看语境，颜色词「红的、粉的、白的」指代的都是花。',
    },
    {
      q: '喻词用「是、成了、变成」的比喻叫？',
      opts: ['明喻', '暗喻', '借喻', '拟人'],
      a: 1,
      why: '明喻用「像」，暗喻用「是」类词直接画等号，语气更重；借喻连本体都不出现。喻词类型是三者的分界线。',
    },
    {
      q: '判断「他长得像他爸爸」不是比喻的依据是？',
      opts: ['句子太短', '同类事物相比，没有不同类的相似点', '没有喻词', '不是文学句子'],
      a: 1,
      why: '比喻要求本体喻体不同类而有相似点；人与人是同类相比，属于比较不是比喻。「像」字句要先验同类与否。',
    },
    {
      q: '排比的构成要求是？',
      opts: ['两个句子并列', '三个或更多结构相同、语气一致的短语或分句连排', '字数完全相等', '必须有比喻'],
      a: 1,
      why: '排比三要素：三项起、结构相同、语气一致，读来一气呵成。两项是对偶或并列，字数相等不是必要条件。',
    },
    {
      q: '「红的像火，粉的像霞，白的像雪」的完整修辞判断是？',
      opts: ['只是排比', '只是比喻', '排比兼比喻', '排比兼夸张'],
      a: 2,
      why: '结构上三个相同句式连排是排比，内容上各分句又各是明喻——兼用要分层说，效果取并集：气势与形象兼得。',
    },
  ],
};



init({
  teaching: TEACHING,
  mount(stage, api) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    wrap = document.createElement('div');
    wrap.className = 'rh-wrap';
    tabsEl = document.createElement('div');
    tabsEl.className = 'rh-tabs';
    DATA.forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = d.name;
      b.addEventListener('click', () => {
        mi = i; ii = 0;
        syncTabs();
        render();
      });
      tabsEl.appendChild(b);
    });
    wrap.appendChild(tabsEl);
    cardEl = document.createElement('div');
    cardEl.className = 'rh-card';
    wrap.appendChild(cardEl);
    quizEl = document.createElement('div');
    quizEl.className = 'rh-quiz';
    wrap.appendChild(quizEl);
    stage.appendChild(wrap);
    api.onResize = () => { if (DATA[mi].pairs) buildQuiz(DATA[mi]); };
    // 初始状态由教学环节 1 落定（须在 cardEl/quizEl 就绪之后，否则 render() 写 undefined.innerHTML）
    setStep(0);

    // 深链：?m=by&i=2 选手法与例句，&mk=1 直接显示标注
    try {
      const q = new URLSearchParams(location.search);
      const m = q.get('m');
      const idx = DATA.findIndex((d) => d.id === m);
      if (idx >= 0) {
        tabsEl.children[idx].click();
        const it = parseInt(q.get('i') || '', 10);
        if (it >= 1 && it <= DATA[idx].items.length) ii = it - 1;
        if (q.get('mk') === '1') showMark = true;
        render();
      }
    } catch (e) {}
  },
});
