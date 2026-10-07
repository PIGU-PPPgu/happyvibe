import { init } from '../../_shared/runtime.mjs';

// 文章结构思维导图：写景 / 写人 / 议论文三棵可折叠结构树，节点卡带写作提示语
// 结构与提示语为初中写作教学通用方法（按顺序写景、以事写人、论证有层），配合统编写作单元使用

const TREES = [
  {
    id: 'jing', name: '写景', tip: '要领：按顺序、多感官，景中含情。',
    kids: [
      {
        name: '开头 · 引出景物', tip: '一两句交代时间地点和总体印象，忌绕远。',
        kids: [
          { name: '开门见山', tip: '直接点出要写的景和第一印象。' },
          { name: '缘起引入', tip: '从出游缘由、一句诗或一个问句带出景物。' },
        ],
      },
      {
        name: '中间 · 按顺序展开', tip: '选一条顺序线：地点线、时间线或观察线。',
        kids: [
          { name: '定点观察', tip: '站在一处四面看，按远近、高低逐层写。' },
          { name: '移步换景', tip: '边走边看，每换一处用「走进、转过、登上」带出。' },
          { name: '多感官写景', tip: '不只写看到的，还写听到的、闻到的、触到的。' },
          { name: '景中融情', tip: '用比喻拟人写活景物，顺手落一两笔心情。' },
        ],
      },
      {
        name: '结尾 · 收束升华', tip: '回应开头的印象，或写景物带来的感悟。',
        kids: [
          { name: '回应开头', tip: '用相似的句子呼应开头的总印象，首尾圆合。' },
          { name: '由景入情', tip: '从景物自然说到感悟，忌空喊口号。' },
        ],
      },
    ],
  },
  {
    id: 'ren', name: '写人', tip: '要领：以事写人，细节见精神。',
    kids: [
      {
        name: '开头 · 人物出场', tip: '让人物带着特点出场，给读者第一印象。',
        kids: [
          { name: '外貌切入', tip: '抓一两处最显眼的特征，忌从头发写到鞋子。' },
          { name: '事件切入', tip: '先闻其声、先见其事，再亮出人物。' },
        ],
      },
      {
        name: '中间 · 典型事件', tip: '选能表现特点的事，把镜头放慢写。',
        kids: [
          { name: '一事写人', tip: '详写一件事，动作、语言、神态逐层展开。' },
          { name: '多事写人', tip: '几件事都指向同一特点，一详一略。' },
          { name: '细节描写', tip: '动词用准，让人物自己说话、自己做事。' },
          { name: '侧面衬托', tip: '借他人反应和环境烘托主角，比直接夸有力。' },
        ],
      },
      {
        name: '结尾 · 点出特点', tip: '自然收束，回到人物的一个画面或一份情感。',
        kids: [
          { name: '画面收尾', tip: '定格人物的一个动作、一个背影。' },
          { name: '情感升华', tip: '写「我」对人物的感情变化，点而不破。' },
        ],
      },
    ],
  },
  {
    id: 'yi', name: '议论文', tip: '要领：观点鲜明，论证有层。',
    kids: [
      {
        name: '引论 · 提出论点', tip: '由现象或名言引出，观点一句话说清。',
        kids: [
          { name: '现象引入', tip: '从身边现象或材料说起，三句内亮出论点。' },
          { name: '名言引入', tip: '引一句名言警句，随即落到自己的论点。' },
        ],
      },
      {
        name: '本论 · 分析论证', tip: '至少两种论证方法，一层一层往前推。',
        kids: [
          { name: '举例论证', tip: '叙例三句话以内，分析比叙述更重要。' },
          { name: '道理论证', tip: '讲理围着论点说，例子讲完不能就停。' },
          { name: '对比论证', tip: '一正一反对照着写，反例用来反衬论点。' },
          { name: '比喻论证', tip: '喻体贴切，说清与论点相似在哪里。' },
        ],
      },
      {
        name: '结论 · 总结重申', tip: '回扣论点，或发出行动号召。',
        kids: [
          { name: '回扣论点', tip: '换一种说法重申观点，忌原句重复开头。' },
          { name: '号召展望', tip: '落到「我们应当怎样做」，收得有力。' },
        ],
      },
    ],
  },
];

const CSS = `
.es-wrap{position:absolute;inset:0;overflow:auto;padding:16px 22px 30px;display:flex;flex-direction:column;gap:14px}
.es-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.es-tree{align-self:flex-start;display:flex;flex-direction:column}
.nd{border:1.5px solid var(--line);border-radius:12px;background:var(--panel);padding:10px 14px;cursor:pointer;touch-action:manipulation;position:relative;max-width:340px}
.nd:hover{border-color:var(--gold)}
.nd.sel{border-color:var(--gold);background:var(--panel2)}
.nd .nm{font-size:18px;font-weight:700;line-height:1.4}
.nd .tp{font-size:16px;color:var(--muted);line-height:1.65;margin-top:4px}
.nd .tg{display:inline-block;width:0;height:0;border-left:8px solid var(--muted);border-top:6px solid transparent;border-bottom:6px solid transparent;margin-right:8px;vertical-align:2px;transition:transform .2s}
.nd.open>.hd .tg{transform:rotate(90deg)}
.nd.root{border-color:var(--gold);max-width:420px}
.nd.root .nm{font-size:21px;color:var(--gold)}
.nd.l1 .nm{color:var(--purple)}
.kids{display:flex;flex-direction:column;margin:6px 0 6px 20px;padding-left:26px;border-left:2px solid var(--line)}
.kids>.nd{margin:7px 0;position:relative}
.kids>.nd::before{content:'';position:absolute;left:-26px;top:22px;width:26px;height:2px;background:var(--line)}
.nd.closed>.kids{display:none}
.es-teach{border:1px solid var(--line);border-radius:14px;background:var(--panel2);padding:12px 16px;display:flex;flex-direction:column;gap:8px;max-width:880px}
.es-tsteps{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.es-tsteps .btn[aria-pressed=true]{border-color:var(--gold);color:var(--gold)}
.es-tguide{display:block;font-size:15px;line-height:1.7;color:var(--text)}
.es-sumbtn{margin-left:auto}
.es-panel{position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:30;max-width:640px;margin:0 16px;padding:16px 20px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;font-size:16px;line-height:1.9;box-shadow:0 8px 30px rgba(0,0,0,.35)}

.kw-hit .nm{color:var(--gold);font-weight:700}
.kw-dim{opacity:.38}
`;

// 教研员契约：三环节各对应一组预设场景（哪棵树、展开哪些一级分支、选中哪个节点）
const STEPS = [
  {
    name: '认结构',
    tree: 0, open: [0, 1, 2], focus: '',
    guide: '先不急着动笔。看这棵「写景」结构树：一篇写景作文分成哪三大块？每一块的任务是什么？同桌互相说一遍，再对照树上的提示语检查。',
    note: '万事开头难，是因为一上来就想句子；先定结构，句子才有地方放。通用骨架三块：开头引出（入题要快）、中间展开（承担主体）、结尾收束（回扣升华）。写景文的开头交代地点与总体印象，中间按一条顺序线展开，结尾融情收束。结构先于词句，这是提纲的价值。',
  },
  {
    name: '读写法',
    tree: 0, open: [1], focus: '0/1/1',
    guide: '中间这一块是重头。逐个读四种写法的提示语：「移步换景」每换一处用什么词带出？「多感官写景」除了看到的还写什么？选一种，说说你打算写校园的哪处景。',
    note: '写景中段四种写法各有抓手：移步换景用方位词与行踪词（进门、绕过、再往前）串起景；多感官除视觉外调用听觉、嗅觉、触觉；定点观察按远近高低分层写；情景交融把情语织进景语。一篇不必全用，选定一两种写透，比四种都沾强。',
  },
  {
    name: '搭提纲',
    tree: 2, open: [0, 1, 2], focus: '',
    guide: '换议论文验证一下：是不是还是「开头—中间—结尾」三块骨架？照树上顺序口头列一份提纲，每块至少选一种写法，再对照修改你自己已写的作文。',
    note: '议论文同一副骨架换个器官：开头亮论点（一句话说清），本论用举例、道理、对比等至少两种论证方法层层推进，结尾回扣论点。文体不同、骨架相通——三块论的普适性正是提纲法能通用于各文体的原因。列提纲每块选好写法再动笔，改作文先改结构再改句子。',
  },
];
const SUMMARY = '文章结构的通用骨架：开头引出、中间展开、结尾收束。写景文按一条顺序线（地点、时间或观察）展开，多感官落笔、景中融情；写人文以事写人，用典型事件和细节描写表现人物特点；议论文论点一句话说清，本论至少用两种论证方法层层推进，结尾回扣论点。列提纲就按这三块，每块至少选定一种写法。';

let treeBox, barEl, cur = 0, selPath = '';

function nodeCard(node, path, depth) {
  const el = document.createElement('div');
  const hasKids = !!node.kids;
  const kw = (barEl && barEl.querySelector('input'))?.dataset.kw || '';
  const hit = kw && node.name.includes(kw);
  el.className = 'nd open' + (depth === 0 ? ' root' : depth === 1 ? ' l1' : '') + (selPath === path ? ' sel' : '') + (kw ? (hit ? ' kw-hit' : ' kw-dim') : '');
  const hd = document.createElement('div');
  hd.className = 'hd';
  hd.innerHTML = (hasKids ? '<span class="tg"></span>' : '<span style="display:inline-block;width:16px"></span>') + `<span class="nm">${node.name}</span>`;
  el.appendChild(hd);
  const tp = document.createElement('div');
  tp.className = 'tp';
  tp.textContent = node.tip;
  el.appendChild(tp);
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (selPath === path) { selPath = ''; el.classList.remove('sel'); }
    else { selPath = path; treeBox.querySelectorAll('.nd.sel').forEach((x) => x.classList.remove('sel')); el.classList.add('sel'); }
    if (hasKids) el.classList.toggle('closed');
  });
  if (hasKids) {
    const kids = document.createElement('div');
    kids.className = 'kids';
    node.kids.forEach((k, i) => kids.appendChild(nodeCard(k, path + '/' + i, depth + 1)));
    el.appendChild(kids);
  }
  return el;
}

function render() {
  treeBox.innerHTML = '';
  const t = TREES[cur];
  treeBox.appendChild(nodeCard(t, '0', 0));
}

function syncBar() {
  [...barEl.children].forEach((x, j) => {
    x.style.borderColor = j === cur ? 'var(--gold)' : 'var(--line)';
    x.style.color = j === cur ? 'var(--gold)' : 'var(--text)';
  });
}

function pickTree(i) {
  cur = i;
  selPath = '';
  syncBar();
  render();
}

function setStep(k) {
  const st = STEPS[k];
  cur = st.tree;
  selPath = st.focus;
  syncBar();
  render();
  // 预设状态：只展开本环节聚焦的一级分支
  treeBox.querySelectorAll('.nd.l1').forEach((el, j) => el.classList.toggle('closed', !st.open.includes(j)));
  document.querySelectorAll('[data-hv-step]').forEach((el, j) => el.setAttribute('aria-pressed', String(j === k)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, j) => { el.style.display = j === k ? '' : 'none'; });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·初中｜统编版七至九年级各册写作单元 · 课题《文章结构与提纲》',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '文章结构的通用骨架是？',
      opts: ['起承转合四块', '开头引出、中间展开、结尾收束', '总分总必须三次重复', '随意分段'],
      a: 1,
      why: '三块骨架：开头引出入题快、中间展开担主体、结尾收束回扣。起承转合是古诗文章法术语，不必硬套所有文体。',
    },
    {
      q: '「移步换景」的行文抓手是？',
      opts: ['比喻和拟人', '方位词与行踪词串起不同景点', '对话推进', '倒叙插叙'],
      a: 1,
      why: '移步换景靠「进门、绕过、再往前」这类行踪词带读者走，每换一处写一景；修辞是句子层面的润色，不是结构抓手。',
    },
    {
      q: '「多感官写景」除视觉外还可以写？',
      opts: ['只能写看到的', '听觉、嗅觉、触觉', '心理活动', '议论句'],
      a: 1,
      why: '多感官落笔调用听、嗅、触等感官通道，画面立体；心理与议论不属于感官描写。',
    },
    {
      q: '议论文本论的最低配置是？',
      opts: ['一个例子', '至少两种论证方法层层推进', '三段排比', '名人名言越多越好'],
      a: 1,
      why: '论点一句话说清后，本论要用举例、道理、对比等至少两种论证方法层层推进——单一方法论证单薄，堆名言不等于论证。',
    },
    {
      q: '修改作文的正确顺序是？',
      opts: ['先改错别字', '先改结构再改句子', '先换好词好句', '从头抄一遍'],
      a: 1,
      why: '结构是骨架、句子是血肉：骨架歪了句子再好也立不住。先对照提纲查三块是否齐全，再打磨语言——顺序反了就是白改。',
    },
  ],
};



// 自测断言：逐个点击环节，验证场景真的切到预设状态（哪棵树、展开几个一级分支、选中节点）
function runSelfChecks() {
  STEPS.forEach((st, k) => {
    setStep(k);
    const l1 = [...treeBox.querySelectorAll('.nd.l1')];
    const openCnt = l1.filter((el) => !el.classList.contains('closed')).length;
    const selOk = st.focus === '' ? !treeBox.querySelector('.nd.sel') : !!treeBox.querySelector('.nd.sel');
    const treeOk = cur === st.tree;
    const openOk = openCnt === st.open.length;
    window.__hvPushCheck(`step-${k}-${st.name}`, treeOk && openOk && selOk, `tree=${cur}/${st.tree} 展开=${openCnt}/${st.open.length} 选中=${st.focus || '无'}`);
  });
  setStep(0);
}

init({
  teaching: TEACHING,
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    const wrap = document.createElement('div');
    wrap.className = 'es-wrap';
    barEl = document.createElement('div');
    barEl.className = 'es-bar';
    TREES.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = t.name;
      b.addEventListener('click', () => pickTree(i));
      barEl.appendChild(b);
    });
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'btn';
    all.textContent = '全部展开';
    all.addEventListener('click', () => { selPath = ''; render(); });
    barEl.appendChild(all);
    const filter = document.createElement('input');
    filter.type = 'search';
    filter.placeholder = '筛选写法关键词';
    filter.setAttribute('aria-label', '筛选写法关键词');
    filter.style.cssText = 'font:inherit;font-size:14px;padding:7px 12px;border-radius:8px;border:1px solid var(--line2);background:var(--inset);color:var(--text);outline:none;width:150px;margin-left:6px';
    filter.addEventListener('input', () => {
      const kw = filter.value.trim();
      filter.dataset.kw = kw;
      render();
    });
    barEl.appendChild(filter);
    wrap.appendChild(barEl);
    treeBox = document.createElement('div');
    treeBox.className = 'es-tree';
    wrap.appendChild(treeBox);
    stage.appendChild(wrap);

    // 初始状态由教学环节 1 落定（须在 treeBox 就绪之后）
    setStep(0);
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

    // 深链：?t=jing 直接选树（深链优先于环节预设）
    try {
      const t = new URLSearchParams(location.search).get('t');
      const i = TREES.findIndex((x) => x.id === t);
      if (i >= 0) barEl.children[i].click();
    } catch (e) {}
  },
});
