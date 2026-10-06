import { init } from '../../_shared/runtime.mjs';

// 拼音声母韵母表：23 声母 + 24 韵母分类表，点击放大看口型要点与拼读示例（无音频）
// 事实口径：《汉语拼音方案》声母表 21 个辅音声母，小学教学另加 y、w 记作 23 个；
// 韵母取教学常用 24 个 = 单韵母 6 + 复韵母 9（含特殊韵母 er）+ 前鼻韵母 5 + 后鼻韵母 4

const SM_GROUPS = [
  ['b', 'p', 'm', 'f'], ['d', 't', 'n', 'l'], ['g', 'k', 'h'], ['j', 'q', 'x'],
  ['zh', 'ch', 'sh', 'r'], ['z', 'c', 's'], ['y', 'w'],
];
const SM = {
  b: { pt: '双唇先闭紧，突然放开，气流较弱', p: 'b-ā→bā', z: '八' },
  p: { pt: '与 b 口型相同，放开时送出较强气流', p: 'p-á→pá', z: '爬' },
  m: { pt: '双唇闭紧，闭上嘴让气流从鼻孔出来', p: 'm-ā→mā', z: '妈' },
  f: { pt: '上牙轻碰下唇，气流从唇齿缝里摩擦而出', p: 'f-ā→fā', z: '发' },
  d: { pt: '舌尖抵住上牙床，突然放开，气流较弱', p: 'd-à→dà', z: '大' },
  t: { pt: '与 d 口型相同，放开时送出较强气流', p: 't-ǔ→tǔ', z: '土' },
  n: { pt: '舌尖抵住上牙床，气流从鼻腔出来', p: 'n-ǐ→nǐ', z: '你' },
  l: { pt: '舌尖抵住上牙床，气流从舌头两边出来', p: 'l-ù→lù', z: '路' },
  g: { pt: '舌根抵住上颚后部，突然放开，气流较弱', p: 'g-ē→gē', z: '哥' },
  k: { pt: '与 g 口型相同，放开时送出较强气流', p: 'k-ē→kē', z: '科' },
  h: { pt: '舌根接近上颚后部，留窄缝，气流摩擦而出', p: 'h-é→hé', z: '河' },
  j: { pt: '舌面前部抵住硬腭前部，突然放开，气流较弱', p: 'j-ī→jī', z: '鸡' },
  q: { pt: '与 j 口型相同，放开时送出较强气流', p: 'q-ī→qī', z: '七' },
  x: { pt: '舌面前部接近硬腭，留缝让气流挤出', p: 'x-ī→xī', z: '西' },
  zh: { pt: '舌尖翘起抵住硬腭前部（翘舌音），突然放开', p: 'zh-ū→zhū', z: '猪' },
  ch: { pt: '与 zh 口型相同，放开时送出较强气流', p: 'ch-ē→chē', z: '车' },
  sh: { pt: '舌尖翘起接近硬腭，留缝擦出气流', p: 'sh-ū→shū', z: '书' },
  r: { pt: '舌尖翘起接近硬腭，发音时声带颤动', p: 'r-è→rè', z: '热' },
  z: { pt: '舌尖抵住上齿背（平舌音），突然放开', p: 'z-ǎo→zǎo', z: '早' },
  c: { pt: '与 z 口型相同，放开时送出较强气流', p: 'c-ǎo→cǎo', z: '草' },
  s: { pt: '舌尖接近上齿背，留缝擦出气流', p: 's-ǎn→sǎn', z: '伞' },
  y: { pt: '嘴角向两边展开，与 i 的口型相近', p: 'yī', z: '一', tag: '整体认读 yi' },
  w: { pt: '双唇拢圆突出，与 u 的口型相同', p: 'wǔ', z: '五', tag: '整体认读 wu' },
};
const YM_GROUPS = [
  ['单韵母', ['a', 'o', 'e', 'i', 'u', 'ü']],
  ['复韵母', ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er']],
  ['前鼻韵母', ['an', 'en', 'in', 'un', 'ün']],
  ['后鼻韵母', ['ang', 'eng', 'ing', 'ong']],
];
const YM = {
  a: { pt: '口张大，舌头放平居中', p: 'ā á ǎ à', z: '啊（ā）' },
  o: { pt: '嘴唇拢圆，舌身后缩', p: 'ō ó ǒ ò', z: '喔（ō）' },
  e: { pt: '嘴角向两边展开，舌身后缩', p: 'ē é ě è', z: '鹅（é）' },
  i: { pt: '嘴角向两边展开，舌面抬高', p: 'ī í ǐ ì', z: '衣（yī）', tag: '自成音节写作 yi' },
  u: { pt: '双唇拢圆突出，只留一个小孔', p: 'ū ú ǔ ù', z: '乌（wū）', tag: '自成音节写作 wu' },
  ü: { pt: '先摆好 i 的口型，再把嘴唇拢圆', p: 'ǖ ǘ ǚ ǜ', z: '鱼（yú）', tag: '与 j、q、x、y 相拼去两点' },
  ai: { pt: '先发 a，口渐闭滑向 i', p: 'āi ái ǎi ài', z: '爱（ài）' },
  ei: { pt: '先发 e，口渐闭滑向 i', p: 'f-ēi→fēi', z: '飞' },
  ui: { pt: '先发 u，滑向 ei，嘴唇逐渐展开', p: 'sh-uǐ→shuǐ', z: '水' },
  ao: { pt: '先发 a，嘴唇渐渐拢圆', p: 'm-āo→māo', z: '猫' },
  ou: { pt: '先发 o，滑向 u，口收小', p: 'z-ǒu→zǒu', z: '走' },
  iu: { pt: '先发 i，滑向 ou，口收圆', p: 'n-iú→niú', z: '牛' },
  ie: { pt: '先发 i，口半开滑向 ê', p: 'x-iě→xiě', z: '写' },
  üe: { pt: '先发 ü，口半开滑向 ê', p: 'yuè', z: '月', tag: '整体认读 yue' },
  er: { pt: '发 e 的同时把舌尖卷起，不与声母相拼', p: 'ěr', z: '耳', tag: '特殊韵母' },
  an: { pt: '先发 a，舌尖渐渐抵住上牙床，气从鼻出', p: 's-ān→sān', z: '三' },
  en: { pt: '先发 e，舌尖抵住上牙床，气从鼻出', p: 'm-én→mén', z: '门' },
  in: { pt: '先发 i，舌尖抵住上牙床，气从鼻出', p: 'x-īn→xīn', z: '心' },
  un: { pt: '先发 u，舌尖抵住上牙床，气从鼻出', p: 'ch-ūn→chūn', z: '春' },
  ün: { pt: '先发 ü，舌尖抵住上牙床，气从鼻出', p: 'yún', z: '云', tag: '整体认读 yun' },
  ang: { pt: '先发 a，舌根抬起，气从鼻出（后鼻音）', p: 'sh-àng→shàng', z: '上' },
  eng: { pt: '先发 e，舌根抬起，气从鼻出（后鼻音）', p: 'd-ēng→dēng', z: '灯' },
  ing: { pt: '先发 i，舌根抬起，气从鼻出（后鼻音）', p: 't-īng→tīng', z: '听' },
  ong: { pt: '先发 o，口稍收拢，气从鼻出（后鼻音）', p: 'zh-ōng→zhōng', z: '中' },
};

// 总序列（声母 23 + 韵母 24），卡片内上个/下个沿此顺序
const FLAT = [
  ...SM_GROUPS.flat().map((l) => ({ l, kind: '声母', cat: '声母', d: SM[l] })),
  ...YM_GROUPS.flatMap(([g, arr]) => arr.map((l) => ({ l, kind: '韵母', cat: g, d: YM[l] }))),
];

const CSS = `
.py-wrap{position:absolute;inset:0;overflow:auto;padding:76px 22px 24px;display:flex;flex-direction:column;gap:6px}
.py-sec{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.py-h{font-size:21px;font-weight:700;letter-spacing:.02em}
.py-h .n{font-size:16px;font-weight:400;color:var(--muted);margin-left:10px}
.py-row{display:flex;align-items:stretch;flex-wrap:wrap;gap:8px;row-gap:10px}
.py-grp{display:flex;gap:6px;padding-right:12px;margin-right:8px;border-right:1px solid var(--line)}
.py-grp:last-child{border-right:none;margin-right:0;padding-right:0}
.py-glab{writing-mode:vertical-rl;font-size:16px;color:var(--muted);display:flex;align-items:center;letter-spacing:.2em;margin-right:2px}
.py-cell{min-width:66px;height:66px;padding:0 8px;font-size:30px;font-family:inherit;font-weight:700;line-height:1;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);cursor:pointer;touch-action:manipulation}
.py-cell.sm2{min-width:88px}
.py-cell:hover{border-color:var(--gold)}
.py-cell.sel{border-color:var(--gold);background:var(--panel2);box-shadow:0 0 0 3px rgba(254,179,0,.22)}
.py-mask{position:fixed;inset:0;background:rgba(8,5,16,.55);display:flex;align-items:center;justify-content:center;z-index:30;opacity:0;transition:opacity .18s}
.py-mask.on{opacity:1}
.py-card{width:min(600px,94vw);max-height:86vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px 26px 18px;box-shadow:0 18px 70px rgba(0,0,0,.45);transform:scale(.95);transition:transform .18s}
.py-mask.on .py-card{transform:scale(1)}
.py-top{display:flex;align-items:center;gap:10px}
.py-badge{font-size:16px;line-height:1;padding:5px 12px;border-radius:999px;font-weight:700}
.py-badge.sm{background:var(--gold);color:#23180a}
.py-badge.ym{background:var(--purple);color:#fff}
.py-tag{font-size:16px;color:var(--muted)}
.py-big{font-size:88px;font-weight:700;text-align:center;line-height:1.15;margin:2px 0 4px}
.py-big.sm{color:var(--gold)}
.py-big.ym{color:var(--purple)}
.py-pt{font-size:18px;line-height:1.7;margin:6px 0 12px}
.py-pt b{font-weight:700}
.py-ex{display:flex;align-items:center;justify-content:center;gap:18px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px}
.py-py{font-size:26px;font-weight:700;letter-spacing:.04em}
.py-zi{font-size:46px;font-weight:700;line-height:1}
.py-note{font-size:16px;color:var(--muted);text-align:center;margin-bottom:6px}
.py-ctl{display:flex;justify-content:center;gap:10px;margin-top:4px}
.hv-panel{position:fixed;top:56px;left:0;right:0;z-index:40;display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap}
.hv-panel .btn{font-size:15px;padding:7px 16px}
.hv-guide{flex:1;min-width:260px;font-size:15px;color:var(--text);line-height:1.6}
.hv-sum{position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:41;max-width:640px;margin:0 16px;padding:16px 20px;background:var(--panel);border:1px solid var(--line);border-radius:10px;font-size:16px;line-height:1.8;display:none}
`;

let wrap, mask, cardEl, selBtn = null, curIdx = -1;
const cellBtns = new Map(); // 字母 -> 按钮

function openCard(i) {
  curIdx = i;
  const it = FLAT[i];
  if (selBtn) selBtn.classList.remove('sel');
  selBtn = cellBtns.get(it.l) || null;
  if (selBtn) { selBtn.classList.add('sel'); selBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  const cls = it.kind === '声母' ? 'sm' : 'ym';
  cardEl.innerHTML = `
    <div class="py-top">
      <span class="py-badge ${cls}">${it.cat}</span>
      ${it.d.tag ? `<span class="py-tag">${it.d.tag}</span>` : ''}
    </div>
    <div class="py-big ${cls}">${it.l}</div>
    <div class="py-pt"><b>口型要点</b>　${it.d.pt}</div>
    <div class="py-ex"><span class="py-py">${it.d.p}</span><span class="py-zi">${it.d.z}</span></div>
    <div class="py-note">${it.kind === '声母' ? '拼读示例' : '读音示例'}：先看口型，再跟着读两遍</div>
    <div class="py-ctl">
      <button class="btn" type="button" data-a="prev">上个</button>
      <button class="btn" type="button" data-a="next">下个</button>
      <button class="btn" type="button" data-a="close">关闭</button>
    </div>`;
  cardEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.a;
    if (a === 'close') closeCard();
    else openCard(Math.max(0, Math.min(FLAT.length - 1, curIdx + (a === 'next' ? 1 : -1))));
  }));
  mask.classList.add('on');
}
function closeCard() {
  mask.classList.remove('on');
  curIdx = -1;
  if (selBtn) selBtn.classList.remove('sel');
  selBtn = null;
}

// 教学环节：点击后场景切到预设状态（打开对应字母卡），每步一句教师引导语
// （未激活的留在 DOM 里隐藏），激活时按钮压下、卡片打开、引导语切换
const STEPS = [
  {
    name: '认声母',
    target: { l: 'b', kind: '声母' },
    guide:
      '先看 b 的口型要点：双唇闭紧，突然放开。老师示范一遍，大家对着口型读两遍，再点「下个」沿 b、p、m、f 一组往下认。',
  },
  {
    name: '辨前后鼻音',
    target: { l: 'an', kind: '韵母' },
    guide:
      '先读 an，再点开 ang 比一比：an 是舌尖抵住上牙床，ang 是舌根抬起。边读边用手在嘴边指一指舌头的位置，说说你发现了什么。',
  },
  {
    name: '练拼读',
    target: { l: 'ao', kind: '韵母' },
    guide:
      '复韵母要滑着读：先发 a，嘴唇渐渐拢圆就变成 ao。再照卡片上的 m-āo→māo，自己挑一个声母和一个韵母拼一拼，同桌互相听一听。',
  },
];
// 小结口径与本表表头一致：《汉语拼音方案》声母表 21 个，教学另加 y、w；
// 韵母 24 = 单 6 + 复 9（含 er）+ 前鼻 5 + 后鼻 4
const SUMMARY =
  '声母 23 个：《汉语拼音方案》声母表 21 个，小学教学另加 y、w。韵母 24 个：单韵母 6、复韵母 9（含特殊韵母 er）、前鼻韵母 5、后鼻韵母 4。发音看口型：前鼻音舌尖抵住上牙床，后鼻音舌根抬起，复韵母由一个音滑向另一个音。声母和韵母相拼组成音节，如 b-ā→bā。';

const SELFTEST = new URLSearchParams(location.search).has('selftest');

function runSelfChecks() {
  const push = (name, pass, detail) => window.__hvPushCheck(name, pass, detail);
  push('声母共 23 个', SM_GROUPS.flat().length === 23, String(SM_GROUPS.flat().length));
  push('韵母共 24 个', YM_GROUPS.reduce((n, [, a]) => n + a.length, 0) === 24,
    YM_GROUPS.map(([g, a]) => `${g}${a.length}`).join(' '));
  push('韵母分类 6/9/5/4', JSON.stringify(YM_GROUPS.map(([, a]) => a.length)) === '[6,9,5,4]',
    JSON.stringify(YM_GROUPS.map(([, a]) => a.length)));
  push('每条卡片数据齐全', FLAT.every((it) => it.d.pt && it.d.p && it.d.z),
    FLAT.filter((it) => !(it.d.pt && it.d.p && it.d.z)).map((it) => it.l).join(','));
}

function flatIndex(target) {
  return FLAT.findIndex((x) => x.l === target.l && x.kind === target.kind);
}

function setStep(i, open = true) {
  if (open) {
    const idx = flatIndex(STEPS[i].target);
    if (idx >= 0) openCard(idx);
  }
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
  });
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => {
    el.style.display = k === i ? '' : 'none';
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·一年级｜统编版一上 · 汉语拼音声母韵母',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, apply: () => setStep(i) })),
  summary: SUMMARY,
};



init({
  teaching: TEACHING,
  mount(stage) {
    const style = document.createElement('style');
    style.textContent = CSS;
    stage.appendChild(style);

    wrap = document.createElement('div');
    wrap.className = 'py-wrap';

    // 声母区
    const sec1 = document.createElement('div');
    sec1.className = 'py-sec';
    sec1.innerHTML = '<div class="py-h">声母<span class="n">23 个 · 《汉语拼音方案》声母表 21 个，教学另加 y、w</span></div>';
    const row1 = document.createElement('div');
    row1.className = 'py-row';
    for (const grp of SM_GROUPS) {
      const g = document.createElement('div');
      g.className = 'py-grp';
      for (const l of grp) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'py-cell' + (l.length > 1 ? ' sm2' : '');
        b.textContent = l;
        b.addEventListener('click', () => openCard(FLAT.findIndex((x) => x.l === l && x.kind === '声母')));
        g.appendChild(b);
        cellBtns.set(l, b);
      }
      row1.appendChild(g);
    }
    sec1.appendChild(row1);
    wrap.appendChild(sec1);

    // 韵母区
    const sec2 = document.createElement('div');
    sec2.className = 'py-sec';
    sec2.innerHTML = '<div class="py-h">韵母<span class="n">24 个 · 单韵母 6、复韵母 9（含特殊韵母 er）、前鼻韵母 5、后鼻韵母 4</span></div>';
    for (const [gname, arr] of YM_GROUPS) {
      const row = document.createElement('div');
      row.className = 'py-row';
      const lab = document.createElement('div');
      lab.className = 'py-glab';
      lab.textContent = gname;
      row.appendChild(lab);
      for (const l of arr) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'py-cell' + (l.length > 1 ? ' sm2' : '');
        b.textContent = l;
        b.addEventListener('click', () => openCard(FLAT.findIndex((x) => x.l === l && x.kind === '韵母')));
        row.appendChild(b);
        cellBtns.set(l, b);
      }
      sec2.appendChild(row);
    }
    wrap.appendChild(sec2);
    stage.appendChild(wrap);

    // 详情卡
    mask = document.createElement('div');
    mask.className = 'py-mask';
    cardEl = document.createElement('div');
    cardEl.className = 'py-card';
    mask.appendChild(cardEl);
    mask.addEventListener('pointerdown', (e) => { if (e.target === mask) closeCard(); });
    stage.appendChild(mask);

    window.addEventListener('keydown', (e) => {
      if (curIdx < 0) return;
      if (e.key === 'Escape') closeCard();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') openCard(Math.min(FLAT.length - 1, curIdx + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') openCard(Math.max(0, curIdx - 1));
    });

    // 深链：?p=b 或 ?p=ang 直接打开对应卡片
    try {
      const p = new URLSearchParams(location.search).get('p');
      if (p) {
        const i = FLAT.findIndex((x) => x.l === p);
        if (i >= 0) openCard(i);
      }
    } catch (e) {}
  },
});
