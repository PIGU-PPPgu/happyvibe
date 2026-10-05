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
`;

let treeBox, cur = 0, selPath = '';

function nodeCard(node, path, depth) {
  const el = document.createElement('div');
  const hasKids = !!node.kids;
  el.className = 'nd open' + (depth === 0 ? ' root' : depth === 1 ? ' l1' : '') + (selPath === path ? ' sel' : '');
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

init({
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    const wrap = document.createElement('div');
    wrap.className = 'es-wrap';
    const bar = document.createElement('div');
    bar.className = 'es-bar';
    TREES.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = t.name;
      b.addEventListener('click', () => {
        cur = i; selPath = '';
        bar.querySelectorAll('.btn').forEach((x, j) => {
          x.style.borderColor = j === i ? 'var(--gold)' : 'var(--line)';
          x.style.color = j === i ? 'var(--gold)' : 'var(--text)';
        });
        render();
      });
      bar.appendChild(b);
    });
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'btn';
    all.textContent = '全部展开';
    all.addEventListener('click', () => { selPath = ''; render(); });
    bar.appendChild(all);
    wrap.appendChild(bar);
    treeBox = document.createElement('div');
    treeBox.className = 'es-tree';
    wrap.appendChild(treeBox);
    stage.appendChild(wrap);
    bar.children[0].click();

    // 深链：?t=jing 直接选树
    try {
      const t = new URLSearchParams(location.search).get('t');
      const i = TREES.findIndex((x) => x.id === t);
      if (i >= 0) bar.children[i].click();
    } catch (e) {}
  },
});
