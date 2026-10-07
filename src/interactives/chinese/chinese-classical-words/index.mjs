import { init } from '../../_shared/runtime.mjs';

// 文言实词翻面卡片：40 个高频实词，正面义项、背面课文例句（目标字【】标记高亮），按册次筛选
// 例句均为统编版课文原句并核对：论语十二章、陈太丘与友期行、狼（七上）；孙权劝学、卖油翁、
// 陋室铭、爱莲说（七下）；三峡、与朱元思书、生于忧患、周亚夫军细柳（八上）；桃花源记、
// 小石潭记、虽有嘉肴（八下）；岳阳楼记、醉翁亭记（九上）；曹刿论战、邹忌讽齐王纳谏、
// 送东阳马生序（九下）

const WORDS = [
  // 七上
  { g: '七上', w: '说', p: 'yuè', ys: '同「悦」，愉快', ex: '学而时习之，不亦【说】乎？', src: '《论语》十二章' },
  { g: '七上', w: '时', p: 'shí', ys: '当时', ex: '元方【时】年七岁，门外戏。', src: '《陈太丘与友期行》' },
  { g: '七上', w: '期', p: 'jī', ys: '约定', ex: '陈太丘与友【期】行，【期】日中。', src: '《陈太丘与友期行》' },
  { g: '七上', w: '信', p: 'xìn', ys: '诚信', ex: '日中不至，则是无【信】。', src: '《陈太丘与友期行》' },
  { g: '七上', w: '止', p: 'zhǐ', ys: '只，仅', ex: '担中肉尽，【止】有剩骨。', src: '蒲松龄《狼》' },
  { g: '七上', w: '意', p: 'yì', ys: '神情、态度', ex: '目似瞑，【意】暇甚。', src: '蒲松龄《狼》' },
  { g: '七上', w: '故', p: 'gù', ys: '学过的旧知识', ex: '温【故】而知新，可以为师矣。', src: '《论语》十二章' },
  // 七下
  { g: '七下', w: '辞', p: 'cí', ys: '推托', ex: '蒙【辞】以军中多务。', src: '《孙权劝学》' },
  { g: '七下', w: '治', p: 'zhì', ys: '研究', ex: '孤岂欲卿【治】经为博士邪！', src: '《孙权劝学》' },
  { g: '七下', w: '见', p: 'jiàn', ys: '知晓、认清', ex: '大兄何【见】事之晚乎！', src: '《孙权劝学》' },
  { g: '七下', w: '颔', p: 'hàn', ys: '点头', ex: '但微【颔】之。', src: '《卖油翁》' },
  { g: '七下', w: '徐', p: 'xú', ys: '慢慢地', ex: '【徐】以杓酌油沥之。', src: '《卖油翁》' },
  { g: '七下', w: '鸿', p: 'hóng', ys: '大', ex: '谈笑有【鸿】儒，往来无白丁。', src: '刘禹锡《陋室铭》' },
  { g: '七下', w: '鲜', p: 'xiǎn', ys: '少', ex: '菊之爱，陶后【鲜】有闻。', src: '周敦颐《爱莲说》' },
  // 八上
  { g: '八上', w: '阙', p: 'quē', ys: '同「缺」，空隙', ex: '两岸连山，略无【阙】处。', src: '郦道元《三峡》' },
  { g: '八上', w: '奔', p: 'bēn', ys: '飞奔的马', ex: '虽乘【奔】御风，不以疾也。', src: '郦道元《三峡》' },
  { g: '八上', w: '良', p: 'liáng', ys: '甚，很', ex: '清荣峻茂，【良】多趣味。', src: '郦道元《三峡》' },
  { g: '八上', w: '戾', p: 'lì', ys: '至、到达', ex: '鸢飞【戾】天者，望峰息心。', src: '吴均《与朱元思书》' },
  { g: '八上', w: '反', p: 'fǎn', ys: '同「返」，返回', ex: '经纶世务者，窥谷忘【反】。', src: '吴均《与朱元思书》' },
  { g: '八上', w: '举', p: 'jǔ', ys: '被选拔', ex: '傅说【举】于版筑之间。', src: '《生于忧患，死于安乐》' },
  { g: '八上', w: '军', p: 'jūn', ys: '驻军、驻扎', ex: '以河内守亚夫为将军，【军】细柳。', src: '《周亚夫军细柳》' },
  // 八下
  { g: '八下', w: '要', p: 'yāo', ys: '同「邀」，邀请', ex: '便【要】还家，设酒杀鸡作食。', src: '陶渊明《桃花源记》' },
  { g: '八下', w: '咸', p: 'xián', ys: '全、都', ex: '村中闻有此人，【咸】来问讯。', src: '陶渊明《桃花源记》' },
  { g: '八下', w: '寻', p: 'xún', ys: '不久', ex: '未果，【寻】病终。', src: '陶渊明《桃花源记》' },
  { g: '八下', w: '许', p: 'xǔ', ys: '用在数词后表示约数', ex: '潭中鱼可百【许】头。', src: '柳宗元《小石潭记》' },
  { g: '八下', w: '居', p: 'jū', ys: '停留', ex: '以其境过清，不可久【居】。', src: '柳宗元《小石潭记》' },
  { g: '八下', w: '嘉', p: 'jiā', ys: '好、美', ex: '虽有【嘉】肴，弗食，不知其旨也。', src: '《虽有嘉肴》' },
  { g: '八下', w: '旨', p: 'zhǐ', ys: '味美', ex: '虽有嘉肴，弗食，不知其【旨】也。', src: '《虽有嘉肴》' },
  // 九上
  { g: '九上', w: '谪', p: 'zhé', ys: '贬官', ex: '庆历四年春，滕子京【谪】守巴陵郡。', src: '范仲淹《岳阳楼记》' },
  { g: '九上', w: '备', p: 'bèi', ys: '详尽', ex: '前人之述【备】矣。', src: '范仲淹《岳阳楼记》' },
  { g: '九上', w: '薄', p: 'bó', ys: '迫近', ex: '【薄】暮冥冥，虎啸猿啼。', src: '范仲淹《岳阳楼记》' },
  { g: '九上', w: '景', p: 'jǐng', ys: '日光', ex: '至若春和【景】明，波澜不惊。', src: '范仲淹《岳阳楼记》' },
  { g: '九上', w: '名', p: 'míng', ys: '命名', ex: '【名】之者谁？太守自谓也。', src: '欧阳修《醉翁亭记》' },
  { g: '九上', w: '辄', p: 'zhé', ys: '就', ex: '饮少【辄】醉，而年又最高。', src: '欧阳修《醉翁亭记》' },
  // 九下
  { g: '九下', w: '鄙', p: 'bǐ', ys: '浅陋，目光短浅', ex: '肉食者【鄙】，未能远谋。', src: '《曹刿论战》' },
  { g: '九下', w: '间', p: 'jiàn', ys: '参与', ex: '肉食者谋之，又何【间】焉？', src: '《曹刿论战》' },
  { g: '九下', w: '狱', p: 'yù', ys: '案件', ex: '小大之【狱】，虽不能察，必以情。', src: '《曹刿论战》' },
  { g: '九下', w: '再', p: 'zài', ys: '第二次', ex: '一鼓作气，【再】而衰，三而竭。', src: '《曹刿论战》' },
  { g: '九下', w: '蔽', p: 'bì', ys: '受蒙蔽', ex: '王之【蔽】甚矣。', src: '《邹忌讽齐王纳谏》' },
  { g: '九下', w: '走', p: 'zǒu', ys: '跑', ex: '录毕，【走】送之，不敢稍逾约。', src: '宋濂《送东阳马生序》' },
];
const GRADES = ['七上', '七下', '八上', '八下', '九上', '九下'];

const CSS = `
.cw-wrap{position:absolute;inset:0;overflow:auto;padding:64px 22px 26px;display:flex;flex-direction:column;gap:14px}
.cw-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cw-cnt{font-size:17px;color:var(--muted);margin-left:6px}
.cw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:12px}
.cw-card{position:relative;height:198px;perspective:900px;cursor:pointer;touch-action:manipulation}
.cw-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .45s}
.cw-card.flip .cw-in{transform:rotateY(180deg)}
.cw-f{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:1.5px solid var(--line);border-radius:14px;background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 12px}
.cw-card:hover .cw-f{border-color:var(--gold)}
.cw-back{transform:rotateY(180deg);justify-content:flex-start;padding-top:16px;background:var(--panel2)}
.cw-z{font-size:56px;font-weight:700;line-height:1.1;color:var(--gold);text-shadow:0 0 24px rgba(232,176,75,.25)}
.cw-py{font-size:19px;color:var(--muted);letter-spacing:.04em}
.cw-ys{font-size:19px;line-height:1.6;text-align:center}
.cw-gr{position:absolute;top:8px;right:10px;font-size:16px;color:var(--muted);opacity:.8}
.cw-ex{font-size:19px;line-height:1.7;text-align:center;color:var(--text)}
.cw-ex b{color:var(--gold);font-weight:700}
.cw-src{margin-top:auto;font-size:17px;color:var(--muted);text-align:center;padding-bottom:2px}
`;

let grid, grade = '全部', flipped = new Set();

function hl(s) { return s.replace(/【/g, '<b>').replace(/】/g, '</b>'); }

function render() {
  grid.innerHTML = '';
  const list = WORDS.filter((x) => grade === '全部' || x.g === grade);
  document.querySelector('.cw-cnt').textContent = `${list.length} 词`;
  for (const it of list) {
    const card = document.createElement('div');
    card.className = 'cw-card' + (flipped.has(it.w) ? ' flip' : '');
    card.dataset.w = it.w;
    card.innerHTML = `
      <div class="cw-in">
        <div class="cw-f">
          <span class="cw-gr">${it.g}</span>
          <div class="cw-z">${it.w}</div>
          <div class="cw-py">${it.p}</div>
          <div class="cw-ys">${it.ys}</div>
        </div>
        <div class="cw-f cw-back">
          <div class="cw-ex">${hl(it.ex)}</div>
          <div class="cw-src">${it.src}</div>
        </div>
      </div>`;
    card.addEventListener('click', () => {
      card.classList.toggle('flip');
      if (card.classList.contains('flip')) flipped.add(it.w);
      else flipped.delete(it.w);
    });
    grid.appendChild(card);
  }
  // 翻页笔/键盘支持：→ 翻到下一张并亮面，← 回上一张（教师拿翻页笔远程操作）
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
    const cards = [...grid.children];
    if (!cards.length) return;
    const cur = cards.findIndex((c) => c.classList.contains('flip'));
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? Math.min(cards.length - 1, cur + 1) : Math.max(0, cur - 1);
      cards.forEach((c, i) => {
        c.classList.toggle('flip', i === next);
        const w = WORDS.find((x) => x.w === c.dataset.w);
        if (w) { if (i === next) flipped.add(w.w); else flipped.delete(w.w); }
      });
      cards[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

// 教研员契约：定位行 / 教学环节 / 教师引导语 / 知识小结
// 环节对应条目「课堂用法」三步：出示认读 → 翻面印证 → 盖面快答，每步真设册次与翻面状态
function setGrade(g) {
  const btn = [...document.querySelectorAll('.cw-bar .btn')].find((x) => x.textContent === g);
  if (btn) btn.click();
}

const STEPS = [
  {
    name: '认一认',
    preset: () => { setGrade('七上'); flipped.clear(); render(); },
    guide: '第一轮认读。我点一张卡，全班齐读字音、说出义项：「说」这里读 yuè，同「悦」；「期」是约定。像这样把七上的七张过一遍，拿不准的记在积累本上。',
    note: '文言实词积累的正确单位是「字＋义项＋课文例句」三位一体：只背义项没有语境，考试时套不进句子；只读例句不记义项，遇到新句又陌生。通假字还要带读音——「说」同「悦」读 yuè、「反」同「返」读 fǎn，通假按本字读，音随字定。',
  },
  {
    name: '翻一翻',
    preset: () => {
      setGrade('七上');
      flipped = new Set(WORDS.filter((x) => x.g === '七上').map((x) => x.w));
      render();
    },
    guide: '卡片已全部翻到背面，课文例句里的目标字金色高亮。齐读例句，再用现代话说说整句意思：刚记的义项放进句子里，通不通？',
    note: '回课文是防止「死记义项」的关键一步：义项放进原句翻译，通顺才算真会。这一步同时练了翻译——文言翻译的三原则「留、删、补」在此先行体验：人名地名保留、语气词删去、省略成分补出。译完再对照卡片释义，形成正反馈。',
  },
  {
    name: '快问快答',
    preset: () => { setGrade('全部'); flipped.clear(); render(); },
    guide: '六册四十张全部盖住混在一起：我说例句，你们抢答字义；答不上的翻面看完例句再盖回去，接着抽下一张，看哪一组积累得多。',
    note: '古今异义是文言实词最大的坑：「走」古义是跑、「狱」指案件、「再」是第二次——拿现代义硬套必错。快问快答用混合抽取逼着你在语境里调取义项，答错即是漏点，记回积累本循环检测。记忆规律是「间隔＋混合」：分散多次、打乱顺序，好于集中抄写。',
  },
];
const SUMMARY =
  '文言实词积累三步：记义项、回课文例句印证、盖面快答自查。本库 40 个高频实词与例句均出自统编版七至九年级课文。' +
  '判断词义要看句子：不少实词古今义不同，「走」古义是跑，「狱」指案件，「再」是第二次，不能拿现代义硬套；' +
  '通假字按本字读，「说」同「悦」读 yuè，「反」同「返」读 fǎn。';

function setStep(i) {
  STEPS[i].preset();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
  });
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => {
    el.style.display = k === i ? '' : 'none';
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·初中七至九年级｜统编版初中文言文 · 高频实词积累',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '「学而时习之，不亦说乎」的「说」读什么、什么意思？',
      opts: ['shuō，说话', 'shuō，高兴', 'yuè，同「悦」，高兴', 'yuè，说话'],
      a: 2,
      why: '「说」在此通「悦」，读 yuè、意为高兴——通假字按本字读，音随字定，义也随字定。',
    },
    {
      q: '「弃甲曳兵而走」的「走」，古义是？',
      opts: ['逃跑', '跑', '步行', '离开'],
      a: 1,
      why: '「走」的古义是跑——拖着兵器跑掉，正是战败奔逃之态；今义的步行是后起义。古今异义拿现代义硬套必错。',
    },
    {
      q: '「小大之狱，虽不能察，必以情」的「狱」指？',
      opts: ['监狱', '案件', '诉讼双方', '刑罚'],
      a: 1,
      why: '「狱」古义指案件，这句说大小案件虽不能一一明察但必按实情处理。监狱是今义。',
    },
    {
      q: '文言实词积累最有效的单位是？',
      opts: ['单独背义项表', '字＋义项＋课文例句三位一体', '抄写整篇课文', '只背通假字'],
      a: 1,
      why: '义项要能放回例句才算掌握：三位一体有语境支撑，迁移到新句才用得出。抄写与单背都缺语境闭环。',
    },
    {
      q: '「再」在文言中的含义是？',
      opts: ['又一次，重复发生', '第二次', '更加', '然后'],
      a: 1,
      why: '文言「再」专指第二次（一鼓作气，再而衰），「又一次」是今义。古今异义词要整词记忆，不能拆开推断。',
    },
  ],
};



init({
  teaching: TEACHING,
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);
    const wrap = document.createElement('div');
    wrap.className = 'cw-wrap';
    const bar = document.createElement('div');
    bar.className = 'cw-bar';
    ['全部', ...GRADES].forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = g;
      b.addEventListener('click', () => {
        grade = g;
        bar.querySelectorAll('.btn').forEach((x) => {
          const on = x.textContent === grade;
          x.style.borderColor = on ? 'var(--gold)' : 'var(--line)';
          x.style.color = on ? 'var(--gold)' : 'var(--text)';
        });
        render();
      });
      bar.appendChild(b);
    });
    const cnt = document.createElement('span');
    cnt.className = 'cw-cnt';
    bar.appendChild(cnt);
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn';
    back.textContent = '全部翻回';
    back.addEventListener('click', () => { flipped.clear(); render(); });
    bar.appendChild(back);
    wrap.appendChild(bar);
    grid = document.createElement('div');
    grid.className = 'cw-grid';
    wrap.appendChild(grid);
    stage.appendChild(wrap);
    bar.children[0].click();

    // 深链：?g=七上 筛选册次，&f=1 全部翻开
    try {
      const q = new URLSearchParams(location.search);
      const g = q.get('g');
      if (g && (g === '全部' || GRADES.includes(g))) {
        grade = g;
        [...bar.querySelectorAll('.btn')].find((x) => x.textContent === g).click();
      }
      if (q.get('f') === '1') { flipped = new Set(WORDS.filter((x) => grade === '全部' || x.g === grade).map((x) => x.w)); render(); }
    } catch (e) {}
  },
});
