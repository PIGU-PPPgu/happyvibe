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
.pn-wrap{position:absolute;inset:0;overflow:auto;padding:18px 24px 28px;display:flex;flex-direction:column;gap:14px}
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
@media (max-width:700px){.pn-ex{grid-template-columns:1fr}.pn-mark{font-size:48px;min-width:64px}}
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

init({
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
    render();

    // 深链：?p=dunhao 直达终点卡；?view=all 打开全景
    try {
      const q = new URLSearchParams(location.search);
      const pid = q.get('p');
      if (pid && PUNCT[pid]) {
        endId = pid;
        branch = TREE.findIndex((b) => b.opts.some((o) => o.p === pid));
        render();
      } else if (q.get('view') === 'all') {
        view = 'all';
        render();
        renderTabs();
      }
    } catch (e) {}
  },
});
