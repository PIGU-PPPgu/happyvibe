import { init } from '../../_shared/runtime.mjs';

// 古诗文名句情境填空：按月/山/水主题分组，读情境选名句，即时判定并显示全句出处
// 诗句均为统编小学/初中教材必背名句，出处只标篇名与作者

const ERR = '#e2543f';
const GROUPS = [
  {
    id: 'yue', name: '月',
    extra: ['春风又绿江南岸，明月何时照我还', '月落乌啼霜满天，江枫渔火对愁眠', '烟笼寒水月笼沙，夜泊秦淮近酒家'],
    qs: [
      { s: '中秋之夜，苏轼想念七年未见的弟弟，把美好祝愿送给天下离人。', a: '但愿人长久，千里共婵娟', src: '苏轼《水调歌头》' },
      { s: '战乱之中，杜甫思念离散的弟弟，觉得故乡的月色格外明亮。', a: '露从今夜白，月是故乡明', src: '杜甫《月夜忆舍弟》' },
      { s: '初秋夜晚，年轻的李白行舟平羌江，半轮秋月的影子随江水流动。', a: '峨眉山月半轮秋，影入平羌江水流', src: '李白《峨眉山月歌》' },
      { s: '听说好友王昌龄被贬到偏远之地，李白把牵挂托付给明月，让它一路随行。', a: '我寄愁心与明月，随君直到夜郎西', src: '李白《闻王昌龄左迁龙标遥有此寄》' },
      { s: '曹操登临碣石观沧海，想象日月仿佛在大海中运行。', a: '日月之行，若出其中', src: '曹操《观沧海》' },
    ],
  },
  {
    id: 'shan', name: '山',
    extra: ['绿树村边合，青山郭外斜', '千山鸟飞绝，万径人踪灭', '两岸猿声啼不住，轻舟已过万重山'],
    qs: [
      { s: '杜甫远望泰山，立志登上最高峰俯瞰群山，满怀豪情。', a: '会当凌绝顶，一览众山小', src: '杜甫《望岳》' },
      { s: '王安石登高远望，说自己不怕浮云挡住视线，因为正身在最高层。', a: '不畏浮云遮望眼，自缘身在最高层', src: '王安石《登飞来峰》' },
      { s: '陆游行至山间，正怀疑无路可走，忽然眼前出现一个村庄。', a: '山重水复疑无路，柳暗花明又一村', src: '陆游《游山西村》' },
      { s: '苏轼横看侧看远看近看庐山，感慨看不清它的真面目，只因自己身在山中。', a: '不识庐山真面目，只缘身在此山中', src: '苏轼《题西林壁》' },
      { s: '陶渊明在东篱下采菊，抬头悠然望见远处的南山。', a: '采菊东篱下，悠然见南山', src: '陶渊明《饮酒》' },
    ],
  },
  {
    id: 'shui', name: '水',
    extra: ['孤帆远影碧空尽，唯见长江天际流', '天门中断楚江开，碧水东流至此回', '九曲黄河万里沙，浪淘风簸自天涯'],
    qs: [
      { s: '白居易回忆江南：日出时江边的花比火还红，春水碧绿如蓝草。', a: '日出江花红胜火，春来江水绿如蓝', src: '白居易《忆江南》' },
      { s: '河边芦苇苍苍，白露成霜，诗人追寻的那个人仿佛就在河的另一边。', a: '所谓伊人，在水一方', src: '《诗经·蒹葭》' },
      { s: '李白乘舟将行，汪伦踏歌相送，李白说千尺潭水也比不上这份情谊。', a: '桃花潭水深千尺，不及汪伦送我情', src: '李白《赠汪伦》' },
      { s: '李白仰望庐山瀑布，夸张地说它像银河从九天之上倾落。', a: '飞流直下三千尺，疑是银河落九天', src: '李白《望庐山瀑布》' },
      { s: '暮色渐浓，崔颢登上黄鹤楼眺望，江上烟波勾起无尽乡愁。', a: '日暮乡关何处是？烟波江上使人愁', src: '崔颢《黄鹤楼》' },
    ],
  },
];

const CSS = `
.fl-wrap{position:absolute;inset:0;overflow:auto;padding:16px 22px 30px;display:flex;flex-direction:column;gap:14px}
.fl-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fl-cnt{font-size:16px;color:var(--muted);margin-left:6px}
.fl-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:20px 24px;display:flex;flex-direction:column;gap:14px;max-width:820px}
.fl-s{font-size:20px;line-height:1.8;font-weight:500}
.fl-s .th{color:var(--gold);font-weight:700;margin-right:8px}
.fl-opts{display:flex;flex-direction:column;gap:10px}
.fl-opt{font:inherit;font-size:18px;text-align:left;padding:13px 16px;border:1.5px solid var(--line);border-radius:11px;background:var(--panel2);color:var(--text);cursor:pointer;touch-action:manipulation;line-height:1.6}
.fl-opt:hover{border-color:var(--gold)}
.fl-opt.ok{border-color:var(--gold);color:var(--gold);font-weight:700}
.fl-opt.bad{border-color:${ERR};color:${ERR}}
.fl-opt:disabled{cursor:default}
.fl-src{border-left:4px solid var(--gold);background:var(--panel2);border-radius:8px;padding:12px 16px;display:none;flex-direction:column;gap:6px}
.fl-src.on{display:flex}
.fl-line{font-size:20px;font-weight:700;line-height:1.7}
.fl-from{font-size:17px;color:var(--muted)}
.fl-judge{font-size:17px;font-weight:700}
.fl-judge.ok{color:var(--gold)}
.fl-judge.bad{color:${ERR}}
.fl-ctl{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fl-sum{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:26px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;max-width:820px}
.fl-sum .big{font-size:24px;font-weight:700}
`;

let wrap, bodyEl, gi = 0, qi = 0, groupRight = 0;

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

function options(g, q) {
  const pool = [...g.qs.filter((x) => x.a !== q.a).map((x) => x.a), ...g.extra];
  return shuffle([q.a, ...shuffle(pool).slice(0, 3)]);
}

function render() {
  const g = GROUPS[gi];
  bodyEl.innerHTML = '';
  if (qi >= g.qs.length) {
    const sum = document.createElement('div');
    sum.className = 'fl-sum';
    sum.innerHTML = `<div class="big">${g.name}主题完成：答对 ${groupRight}/${g.qs.length}</div>`;
    const row = document.createElement('div');
    row.className = 'fl-ctl';
    const re = document.createElement('button');
    re.type = 'button';
    re.className = 'btn';
    re.textContent = '重练本组';
    re.addEventListener('click', () => startGroup(gi));
    const nx = document.createElement('button');
    nx.type = 'button';
    nx.className = 'btn';
    nx.textContent = '换一组';
    nx.addEventListener('click', () => startGroup((gi + 1) % GROUPS.length));
    row.appendChild(re);
    row.appendChild(nx);
    sum.appendChild(row);
    bodyEl.appendChild(sum);
    return;
  }
  const q = g.qs[qi];
  const card = document.createElement('div');
  card.className = 'fl-card';
  const st = document.createElement('div');
  st.className = 'fl-s';
  st.innerHTML = `<span class="th">${g.name}·${qi + 1}</span>${q.s}`;
  card.appendChild(st);
  const opts = document.createElement('div');
  opts.className = 'fl-opts';
  const srcBox = document.createElement('div');
  srcBox.className = 'fl-src';
  let judged = false;
  for (const o of options(g, q)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fl-opt';
    b.textContent = o;
    b.addEventListener('click', () => {
      if (judged) return;
      judged = true;
      const correct = o === q.a;
      if (correct) { b.classList.add('ok'); groupRight++; }
      else {
        b.classList.add('bad');
        opts.querySelectorAll('.fl-opt').forEach((x) => { if (x.textContent === q.a) x.classList.add('ok'); });
      }
      opts.querySelectorAll('.fl-opt').forEach((x) => (x.disabled = true));
      srcBox.classList.add('on');
      const judge = srcBox.querySelector('.fl-judge');
      judge.textContent = correct ? '答对了' : '再想想，正确的是金色句';
      judge.classList.add(correct ? 'ok' : 'bad');
    });
    opts.appendChild(b);
  }
  card.appendChild(opts);
  srcBox.innerHTML = `
    <div class="fl-judge"></div>
    <div class="fl-line">${q.a}</div>
    <div class="fl-from">——${q.src}</div>`;
  card.appendChild(srcBox);
  const ctl = document.createElement('div');
  ctl.className = 'fl-ctl';
  const nx = document.createElement('button');
  nx.type = 'button';
  nx.className = 'btn';
  nx.textContent = qi === g.qs.length - 1 ? '看成绩' : '下一题';
  nx.addEventListener('click', () => { qi++; render(); });
  ctl.appendChild(nx);
  card.appendChild(ctl);
  bodyEl.appendChild(card);
  document.querySelector('.fl-cnt').textContent = `第 ${Math.min(qi + 1, g.qs.length)}/${g.qs.length} 题`;
}

function startGroup(i) {
  gi = i;
  qi = 0;
  groupRight = 0;
  wrap.querySelectorAll('.fl-bar .btn').forEach((x, j) => {
    const on = j === i;
    x.style.borderColor = on ? 'var(--gold)' : 'var(--line)';
    x.style.color = on ? 'var(--gold)' : 'var(--text)';
  });
  render();
}

init({
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    wrap = document.createElement('div');
    wrap.className = 'fl-wrap';
    const bar = document.createElement('div');
    bar.className = 'fl-bar';
    GROUPS.forEach((g, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = g.name;
      b.addEventListener('click', () => startGroup(i));
      bar.appendChild(b);
    });
    const cnt = document.createElement('span');
    cnt.className = 'fl-cnt';
    bar.appendChild(cnt);
    wrap.appendChild(bar);
    bodyEl = document.createElement('div');
    bodyEl.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    wrap.appendChild(bodyEl);
    stage.appendChild(wrap);
    startGroup(0);

    // 深链：?t=shan 选主题，&q=2 跳到第 2 题，&a=1 自动选正确项演示判定态
    try {
      const q = new URLSearchParams(location.search);
      const t = q.get('t');
      const i = GROUPS.findIndex((g) => g.id === t);
      if (i >= 0) startGroup(i);
      const n = parseInt(q.get('q') || '', 10);
      if (n >= 1 && n <= GROUPS[gi].qs.length) { qi = n - 1; render(); }
      if (q.get('a') === '1') {
        const btn = [...bodyEl.querySelectorAll('.fl-opt')].find((x) => x.textContent === GROUPS[gi].qs[qi].a);
        if (btn) btn.click();
      }
    } catch (e) {}
  },
});
