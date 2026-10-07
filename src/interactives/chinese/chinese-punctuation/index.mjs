import { init } from '../../_shared/runtime.mjs';

// 标点符号用法决策图：按「位置 → 意图」两步走到对应标点，终点卡含用法要点与对错例句并列
// 用法依据 GB/T 15834—2011《标点符号用法》：句末 。？！；句中 、，；：；引用与名称 “”《》——……
// 例句为三至六年级常见病句类型，全部自编

const ERR = '#e2543f'; // 错例强调色（大号图形/文字色，深浅两主题均可读）

const TREE = [
  { t: '句子末尾', q: '这句话想做什么？', opts: [
    { t: '心平气和地说一件事', p: 'juhao' },
    { t: '向别人提出问题', p: 'wenhao' },
    { t: '抒发强烈感情或发出命令', p: 'gantanhao' },
  ] },
  { t: '句子中间', q: '这里为什么要停顿？', opts: [
    { t: '并列的词语之间，停顿最短', p: 'dunhao' },
    { t: '一句话没说完，中间停一下', p: 'douhao' },
    { t: '并列的几层意思，停顿比逗号大', p: 'fenhao' },
    { t: '提示下文或总结上文', p: 'maohao' },
  ] },
  { t: '引用与名称', q: '要标出来的是什么？', opts: [
    { t: '别人直接说的话', p: 'yinhao' },
    { t: '书报或影视作品的名称', p: 'shuminghao' },
    { t: '解释说明、话题转折', p: 'pozhehao' },
    { t: '话没说完、列举没有穷尽', p: 'shengluehao' },
  ] },
];

// b 标记 = 需要学生关注的标点，渲染时高亮
const PUNCT = {
  juhao: {
    mark: '。', name: '句号', key: '一句话说完了，句末用句号。',
    ok: ['今天我们学习了两位数乘法<b>。</b>'],
    bad: ['今天我们学习了两位数乘法<b>，</b>'],
    why: '句子已经完整，逗号不能收尾，要用句号。',
  },
  wenhao: {
    mark: '？', name: '问号', key: '提出问题或有疑问语气，句末用问号；反问句也用问号。',
    ok: ['你今天为什么迟到了<b>？</b>', '难道我们不应该遵守交通规则吗<b>？</b>'],
    bad: ['你今天为什么迟到了<b>。</b>'],
    why: '句子带着疑问语气，句末点号要用问号。',
  },
  gantanhao: {
    mark: '！', name: '感叹号', key: '表达惊讶、赞叹、命令等强烈感情，句末用感叹号。',
    ok: ['这场比赛太精彩了<b>！</b>', '快把门窗关好<b>！</b>'],
    bad: ['这场比赛太精彩了<b>。</b>'],
    why: '强烈的赞叹语气，句号表现不出感情，要用感叹号。',
  },
  dunhao: {
    mark: '、', name: '顿号', key: '句中并列词语之间的小停顿用顿号；最后一项前的「和」后面不再加。',
    ok: ['书包里有课本<b>、</b>铅笔<b>、</b>橡皮和尺子。'],
    bad: ['书包里有课本<b>，</b>铅笔<b>，</b>橡皮和尺子。'],
    why: '并列词语之间停顿最短，用顿号，不用逗号。',
  },
  douhao: {
    mark: '，', name: '逗号', key: '一句话中间的停顿用逗号，表示句子还没说完。',
    ok: ['下课了<b>，</b>同学们跑到操场上做游戏。'],
    bad: ['下课了<b>。</b>同学们跑到操场上做游戏。'],
    why: '前后是一个连贯的意思，中间只是短停顿，不能断成两句。',
  },
  fenhao: {
    mark: '；', name: '分号', key: '并列的几层意思之间用分号，停顿比逗号大，层次更清楚。',
    ok: ['白天，他去图书馆看书<b>；</b>晚上，他在家练习书法。'],
    bad: ['白天，他去图书馆看书<b>，</b>晚上，他在家练习书法。'],
    why: '两层意思并列，都用逗号就分不出层次，中间要用分号。',
  },
  maohao: {
    mark: '：', name: '冒号', key: '提示下文（说话、列举、解释）或总结上文，用冒号。',
    ok: ['老师说<b>：</b>“大家把书翻到第五页。”'],
    bad: ['老师说“大家把书翻到第五页<b>。</b>”'],
    why: '提示后面是直接说的话，说话人后面要加冒号。',
  },
  yinhao: {
    mark: '“”', name: '引号', key: '直接引用别人的话、特定称谓或表示讽刺否定，用引号。',
    ok: ['小明说<b>：</b>“我明天要去参观科技馆<b>。</b>”'],
    bad: ['小明说：我明天要去参观科技馆<b>。</b>'],
    why: '直接引用的原话要加引号，不能光着尾巴放在句子里。',
  },
  shuminghao: {
    mark: '《》', name: '书名号', key: '书报、文章、影视剧等作品的名称，用书名号。',
    ok: ['我最近在读<b>《</b>西游记<b>》</b>。'],
    bad: ['我最近在读<b>“</b>西游记<b>”</b>。'],
    why: '作品名称要用书名号，不能用引号代替。',
  },
  pozhehao: {
    mark: '——', name: '破折号', key: '引出解释说明的内容，或表示话题转折、声音延长。',
    ok: ['我的家乡<b>——</b>北京，秋天最美。'],
    bad: ['我的家乡<b>、</b>北京，秋天最美。'],
    why: '「北京」是解释「家乡」的，不是并列词语，前面要用破折号。',
  },
  shengluehao: {
    mark: '……', name: '省略号', key: '话没说完、内容省略或列举没有穷尽，用省略号。',
    ok: ['果园里有苹果树<b>、</b>梨树<b>、</b>桃树<b>……</b>'],
    bad: ['果园里有苹果树<b>、</b>梨树<b>、</b>桃树等等<b>……</b>'],
    why: '「等等」和省略号意思重复，两个只能留一个。',
  },
};

const CSS = `
.pn-wrap{position:absolute;inset:0;overflow:auto;padding:72px 24px 28px;display:flex;flex-direction:column;gap:14px}
.pn-tabs{display:flex;gap:8px}
.pn-crumb{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:16px;color:var(--muted)}
.pn-crumb .sep{opacity:.6}
.pn-crumb .cur{color:var(--text);font-weight:700}
.pn-q{font-size:23px;font-weight:700;margin:2px 0 6px}
.pn-opts{display:flex;flex-direction:column;gap:10px;max-width:760px}
.pn-opt{font:inherit;font-size:19px;text-align:left;padding:14px 18px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);cursor:pointer;touch-action:manipulation}
.pn-opt:hover{border-color:var(--gold)}
.pn-back{display:flex;gap:10px;flex-wrap:wrap}
.pn-card{display:flex;flex-direction:column;gap:12px;max-width:860px}
.pn-head{display:flex;align-items:center;gap:16px}
.pn-mark{font-size:64px;font-weight:700;line-height:1;color:var(--gold);min-width:96px;text-align:center}
.pn-name{font-size:26px;font-weight:700}
.pn-key{font-size:18px;color:var(--muted);line-height:1.6}
.pn-ex{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pn-col{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--panel)}
.pn-col.ok{border-left:4px solid var(--gold)}
.pn-col.bad{border-left:4px solid ${ERR}}
.pn-lab{font-size:16px;font-weight:700;margin-bottom:8px}
.pn-col.ok .pn-lab{color:var(--gold)}
.pn-col.bad .pn-lab{color:${ERR}}
.pn-sent{font-size:18px;line-height:1.9;margin-bottom:6px}
.pn-sent b{color:var(--gold);font-weight:700}
.pn-col.bad .pn-sent b{color:${ERR}}
.pn-why{font-size:16px;color:var(--muted);line-height:1.7}
.pn-ctl{display:flex;gap:10px;flex-wrap:wrap}
.pn-all{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
.pn-col2{border:1px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--panel);display:flex;flex-direction:column;gap:8px}
.pn-col2 h3{font-size:19px}
.pn-item{display:flex;align-items:center;gap:8px;font:inherit;font-size:17px;text-align:left;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--text);cursor:pointer;touch-action:manipulation}
.pn-item:hover{border-color:var(--gold)}
.pn-item .m{color:var(--gold);font-weight:700;min-width:34px;text-align:center}
.pn-item .n{color:var(--muted);font-size:16px}
@media (max-width:700px){.pn-wrap{padding-top:150px}.pn-ex{grid-template-columns:1fr}.pn-mark{font-size:48px;min-width:64px}}
`;

let wrap, bodyEl, view = 'flow', branch = -1, endId = null;

function render() {
  bodyEl.innerHTML = '';
  const crumbs = document.createElement('div');
  crumbs.className = 'pn-crumb';
  crumbs.innerHTML = '<span>标点决策</span>';
  const parts = [];
  if (branch >= 0) parts.push(TREE[branch].t);
  if (TREE[branch] && endId === null) parts.push(TREE[branch].q);
  else if (endId !== null) parts.push(PUNCT[endId].name);
  parts.forEach((p, i) => {
    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '›';
    crumbs.appendChild(sep);
    const s = document.createElement('span');
    s.className = i === parts.length - 1 ? 'cur' : '';
    s.textContent = p;
    crumbs.appendChild(s);
  });
  bodyEl.appendChild(crumbs);

  if (view === 'all') { renderAll(); return; }

  if (endId !== null) { renderEnd(); return; }

  if (branch < 0) {
    const q = document.createElement('div');
    q.className = 'pn-q';
    q.textContent = '要点的这个位置，在句子哪里？';
    bodyEl.appendChild(q);
    const opts = document.createElement('div');
    opts.className = 'pn-opts';
    TREE.forEach((b, i) => {
      const o = document.createElement('button');
      o.type = 'button';
      o.className = 'pn-opt';
      o.textContent = b.t;
      o.addEventListener('click', () => { branch = i; endId = null; render(); });
      opts.appendChild(o);
    });
    bodyEl.appendChild(opts);
    return;
  }

  const b = TREE[branch];
  const q = document.createElement('div');
  q.className = 'pn-q';
  q.textContent = b.q;
  bodyEl.appendChild(q);
  const opts = document.createElement('div');
  opts.className = 'pn-opts';
  b.opts.forEach((o) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pn-opt';
    btn.textContent = o.t;
    btn.addEventListener('click', () => { endId = o.p; render(); });
    opts.appendChild(btn);
  });
  bodyEl.appendChild(opts);
  bodyEl.appendChild(ctlRow(true));
}

function ctlRow(withBack) {
  const row = document.createElement('div');
  row.className = 'pn-back';
  if (withBack) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = '上一步';
    b.addEventListener('click', () => {
      if (endId !== null) endId = null;
      else branch = -1;
      render();
    });
    row.appendChild(b);
  }
  const r = document.createElement('button');
  r.type = 'button';
  r.className = 'btn';
  r.textContent = '重新选择';
  r.addEventListener('click', () => { branch = -1; endId = null; view = 'flow'; render(); });
  row.appendChild(r);
  return row;
}

function renderEnd() {
  const p = PUNCT[endId];
  const card = document.createElement('div');
  card.className = 'pn-card';
  card.innerHTML = `
    <div class="pn-head">
      <div class="pn-mark">${p.mark}</div>
      <div><div class="pn-name">${p.name}</div><div class="pn-key">${p.key}</div></div>
    </div>
    <div class="pn-ex">
      <div class="pn-col ok"><div class="pn-lab">对例</div>${p.ok.map((s) => `<div class="pn-sent">${s}</div>`).join('')}</div>
      <div class="pn-col bad"><div class="pn-lab">错例</div>${p.bad.map((s) => `<div class="pn-sent">${s}</div>`).join('')}<div class="pn-why">${p.why}</div></div>
    </div>`;
  bodyEl.appendChild(card);
  bodyEl.appendChild(ctlRow(true));
}

function renderAll() {
  const grid = document.createElement('div');
  grid.className = 'pn-all';
  for (const b of TREE) {
    const col = document.createElement('div');
    col.className = 'pn-col2';
    col.innerHTML = `<h3>${b.t}</h3><div style="font-size:16px;color:var(--muted)">${b.q}</div>`;
    for (const o of b.opts) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'pn-item';
      const p = PUNCT[o.p];
      item.innerHTML = `<span class="m">${p.mark}</span><span>${p.name}</span><span class="n">${o.t}</span>`;
      item.addEventListener('click', () => { branch = TREE.indexOf(b); endId = o.p; view = 'flow'; render(); });
      col.appendChild(item);
    }
    grid.appendChild(col);
  }
  bodyEl.appendChild(grid);
}

function renderTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'pn-tabs';
  [['flow', '走流程'], ['all', '全景']].forEach(([v, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = label;
    b.style.borderColor = view === v ? 'var(--gold)' : 'var(--line)';
    b.style.color = view === v ? 'var(--gold)' : 'var(--text)';
    b.addEventListener('click', () => { view = v; render(); renderTabs(); });
    tabs.appendChild(b);
  });
  wrap.querySelector('.pn-tabs').replaceWith(tabs);
}

// 教研员契约：定位行 / 教学环节 / 每环节引导语 / 知识小结
// 环节预设与条目「课堂用法」一致：出示病句 → 走流程验证 → 全景归纳
const META_TEXT = '语文·小学三至六年级｜统编版各册语文园地 · 标点符号正确使用';
const STEPS = [
  {
    name: '病句会诊', view: 'flow', branch: 1, end: 'dunhao',
    guide: '书包里那句红字病句，并列的文具之间点了逗号。先说一说这里该换成哪个标点、为什么，再对照金色对例检查你的判断。',
    note: '并列词语之间的停顿最短，用顿号不用逗号——「铅笔、橡皮、尺子」。判断标点两问：先看它在句子里的位置（句末还是句中），再看这里的停顿有多长、是什么意图。病句改对不是终点，能说清「为什么该用」才算掌握。',
  },
  {
    name: '走流程验证', view: 'flow', branch: -1, end: null,
    guide: '换一个新句子自己走流程：先点它在句子里的位置，再点这里为什么要停顿，看流程把你带到哪个标点，和你的判断一致吗？',
    note: '决策流程就是判断口诀的展开：位置（句末/句中/引用/名称）→意图（疑问、感叹、并列、提示、引用……）→标点。句末三兄弟按语气分工：说完了句号、提出问题（含反问）问号、感情强烈感叹号。反问句句末虽「问」的意味弱，但形式是问句仍用问号——这是高频考点。',
  },
  {
    name: '全景归纳', view: 'all', branch: -1, end: null,
    guide: '对着全景把十一种标点分成句末、句中、引用与名称三类，同桌互相考一种标点的用法，并各说一个正确的例句。',
    note: '十一种标点分三类记：句末（句号、问号、感叹号）管语气；句中（顿号、逗号、分号、冒号）管停顿，由短到长排成一条链——顿号并列词语、逗号一般停顿、分号并列分句、冒号提示下文；引用与名称（引号、书名号、破折号、省略号）管标明。归类后成对辨析（顿号对逗号、分号对逗号）最见效。',
  },
];
const SUMMARY =
  '句末用句号、问号、感叹号：句子说完了用句号，提出问题（含反问）用问号，感情强烈用感叹号。' +
  '句中停顿有长短：并列词语之间最短，用顿号；句中一般停顿用逗号；并列的几层意思之间用分号；提示下文或总结上文用冒号。' +
  '标明引用与名称：直接引用别人的话加引号，作品名称用书名号，解释说明、话题转折用破折号，话没说完、列举未尽用省略号。' +
  '判断口诀：先看位置，再看意图。';

function setStep(i) {
  view = STEPS[i].view;
  branch = STEPS[i].branch;
  endId = STEPS[i].end;
  render();
  renderTabs();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·小学中高年级｜统编版各册语文园地 · 标点符号正确使用',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '「书包里有铅笔、橡皮和尺子」中并列词语间用顿号，原因是？',
      opts: ['语气强烈', '并列词语之间停顿最短', '句子太长', '习惯写法'],
      a: 1,
      why: '句中停顿由短到长：顿号（并列词语）→逗号（一般停顿）→分号（并列分句）。停顿长短决定标点选择，与句子长度无关。',
    },
    {
      q: '反问句「这难道不对吗？」句末应加？',
      opts: ['句号', '问号', '感叹号', '分号'],
      a: 1,
      why: '反问句形式仍是问句，句末用问号。语气强弱由「难道」等词承担，标点只认句类——这是最容易想歪的考点。',
    },
    {
      q: '并列的几层意思之间（分句并列），用哪个标点？',
      opts: ['顿号', '逗号', '分号', '冒号'],
      a: 2,
      why: '分句内部已有逗号，再并列就用更高一级的分号隔开层次。顿号只用于词语并列，级别最低。',
    },
    {
      q: '「提示下文或总结上文」该用的标点是？',
      opts: ['破折号', '省略号', '冒号', '书名号'],
      a: 2,
      why: '冒号管提示与总结，如「他说：」「成绩如下：」。破折号管解释说明与话题转折，省略号管话没说完，三者分工不同。',
    },
    {
      q: '判断一个位置该用什么标点，口诀是？',
      opts: ['先看长短，再看好坏', '先看位置，再看意图', '凭语感直接选', '全部用逗号最保险'],
      a: 1,
      why: '「先看位置（句末/句中/引用/名称），再看意图（疑问、并列、提示……）」两步走，任何标点题都能落到流程上。',
    },
  ],
};



function runSelfChecks() {
  if (typeof window.__hvPushCheck !== 'function') return;
  // 数据级：决策树每个选项都有终点卡，终点卡字段齐全
  const missing = [];
  for (const b of TREE) for (const o of b.opts) if (!PUNCT[o.p]) missing.push(o.p);
  window.__hvPushCheck('decision-tree-complete', missing.length === 0, missing.length ? '缺终点卡: ' + missing.join(',') : '11 个选项终点卡齐全');
  const broken = [];
  for (const id of Object.keys(PUNCT)) {
    const p = PUNCT[id];
    if (!p.mark || !p.name || !p.key || !p.why || p.ok.length === 0 || p.bad.length === 0) broken.push(id);
  }
  window.__hvPushCheck('end-card-fields', broken.length === 0, broken.length ? '字段缺失: ' + broken.join(',') : '11 张终点卡用法要点与对错例句齐全');
  // 教研契约标记就位
  window.__hvPushCheck(
    'teaching-panel-ready',
    document.querySelectorAll('[data-hv-step]').length === STEPS.length && TEACHING.steps.map((s) => (s.guide || '').length).reduce((a, b) => a + b, 0) >= 60,
    `${STEPS.length} 个环节、teaching-panel 配置核对`
  );
  // 场景级：环节按钮真的切换到预设状态
  setStep(2);
  const allGrid = bodyEl.querySelector('.pn-all');
  window.__hvPushCheck('step-scene-all', view === 'all' && !!allGrid, allGrid ? '环节3切到全景网格' : '环节3未渲染全景网格');
  setStep(1);
  const q = bodyEl.querySelector('.pn-q');
  window.__hvPushCheck('step-scene-flow', view === 'flow' && branch === -1 && endId === null && !!q, q ? '环节2回到流程根部提问' : '环节2未回到流程根部');
  setStep(0);
  const mark = bodyEl.querySelector('.pn-mark');
  window.__hvPushCheck('step-scene-card', endId === 'dunhao' && !!mark && mark.textContent === PUNCT.dunhao.mark, mark ? '环节1出示顿号病句终点卡' : '环节1未出示病句卡');
}

init({
  teaching: TEACHING,
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    wrap = document.createElement('div');
    wrap.className = 'pn-wrap';
    const tabs = document.createElement('div');
    tabs.className = 'pn-tabs';
    wrap.appendChild(tabs);
    bodyEl = document.createElement('div');
    bodyEl.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    wrap.appendChild(bodyEl);
    stage.appendChild(wrap);
    renderTabs();

    // 深链：?p=dunhao 直达终点卡；?view=all 打开全景
    try {
      const q = new URLSearchParams(location.search);
      const pid = q.get('p');
      const deep = pid && PUNCT[pid] ? true : q.get('view') === 'all';
      if (pid && PUNCT[pid]) {
        endId = pid;
        branch = TREE.findIndex((b) => b.opts.some((o) => o.p === pid));
        render();
      } else if (q.get('view') === 'all') {
        view = 'all';
        render();
        renderTabs();
      }
      if (deep) {
        // 深链直接改场景，环节高亮与引导语一并取消
        document.querySelectorAll('[data-hv-step]').forEach((el) => el.setAttribute('aria-pressed', 'false'));
      }
    } catch (e) {}

    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
  },
});
