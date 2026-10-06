import { init } from '../../_shared/runtime.mjs';

// 中国近代史大事年表：1840-1949 可拖可缩时间线，事件按屈辱/探索/抗争三色分层
const Y0 = 1840, Y1 = 1949;
const LANES = [
  { name: '屈辱', sub: '列强侵略', color: '#e26a6a' },
  { name: '探索', sub: '近代化探索', color: '#feb300' },
  { name: '抗争', sub: '反抗与革命', color: '#66d9a8' },
];

const EVENTS = [
  // 屈辱：列强侵略
  { y: 1840, t: '鸦片战争', lane: 0, p: 1, d: '英国发动侵略战争，中国近代史开端。1842 年《南京条约》割香港岛、赔款 2100 万银元、五口通商，中国开始沦为半殖民地半封建社会。' },
  { y: 1856, y2: 1860, t: '第二次鸦片战争', lane: 0, p: 2, d: '英法联军侵华，1860 年攻入北京，火烧圆明园，中国半殖民地化程度进一步加深。' },
  { y: 1894, t: '甲午中日战争', lane: 0, p: 1, d: '黄海大战邓世昌壮烈殉国。1895 年《马关条约》割辽东半岛、台湾全岛及所有附属各岛屿、澎湖列岛，外国侵略势力深入内地，大大加深了中国的半殖民地化程度。' },
  { y: 1900, t: '八国联军侵华', lane: 0, p: 1, d: '镇压义和团运动。1901 年《辛丑条约》赔款白银 4.5 亿两，清政府沦为列强统治中国的工具，中国完全陷入半殖民地半封建社会的深渊。' },
  { y: 1931, t: '九一八事变', lane: 0, p: 1, d: '日军炸毁柳条湖铁路，侵占东北三省，中国人民的局部抗战开始。' },
  { y: 1937, t: '七七事变', lane: 0, p: 1, d: '日军炮轰宛平城，中国全民族抗战开始。同年 12 月南京大屠杀，死难者 30 万人以上。' },
  // 探索：近代化
  { y: 1861, y2: 1895, t: '洋务运动', lane: 1, p: 1, d: '19 世纪 60 至 90 年代，曾国藩、李鸿章等以「自强」「求富」为口号创办军事与民用工业、建立新式海陆军，是中国近代化的开端。' },
  { y: 1895, t: '公车上书', lane: 1, p: 2, d: '康有为、梁启超联合举人上书，反对签订《马关条约》，揭开变法维新运动的序幕。' },
  { y: 1898, t: '戊戌变法', lane: 1, p: 1, d: '历时百余日的「百日维新」，学习西方政治制度，失败但在社会上起了思想启蒙作用。' },
  { y: 1905, t: '中国同盟会', lane: 1, p: 2, d: '在日本东京成立，第一个全国规模的资产阶级革命政党，以「驱除鞑虏，恢复中华，创立民国，平均地权」为纲领，后阐发为三民主义。' },
  { y: 1911, t: '辛亥革命', lane: 1, p: 1, d: '10 月 10 日武昌起义，各省响应。1912 年中华民国成立，清帝退位，结束了我国两千多年的君主专制制度。' },
  { y: 1912, t: '中华民国成立', lane: 1, p: 2, d: '1912 年 1 月 1 日孙中山在南京就任临时大总统。' },
  { y: 1915, t: '新文化运动', lane: 1, p: 1, d: '陈独秀创办《青年杂志》，高举民主与科学两面大旗，是一次伟大的思想解放运动。' },
  { y: 1921, t: '中国共产党诞生', lane: 1, p: 1, d: '7 月中共一大在上海召开（后转移嘉兴南湖），中国革命的面貌焕然一新。' },
  // 抗争：反抗与革命
  { y: 1851, y2: 1864, t: '太平天国运动', lane: 2, p: 1, d: '洪秀全金田起义，建号太平天国，定都天京，沉重打击了中外反动势力。' },
  { y: 1899, t: '义和团运动', lane: 2, p: 2, d: '提出「扶清灭洋」，抗击八国联军侵略，粉碎列强瓜分中国的迷梦。' },
  { y: 1919, t: '五四运动', lane: 2, p: 1, d: '5 月 4 日北京学生「外争主权、内除国贼」，随后工人罢工、商人罢市，中国新民主主义革命的开端。' },
  { y: 1927, t: '南昌起义', lane: 2, p: 2, d: '8 月 1 日周恩来、贺龙等领导起义，打响武装反抗国民党反动派的第一枪。' },
  { y: 1935, t: '遵义会议', lane: 2, p: 2, d: '1 月长征途中召开，确立毛泽东在党中央的领导地位，是党的历史上生死攸关的转折点。' },
  { y: 1937, y2: 1945, t: '抗日战争', lane: 2, p: 1, d: '全民族抗战：平型关大捷、台儿庄战役、百团大战。1945 年 8 月 15 日日本宣布无条件投降，9 月 2 日签署投降书，台湾回到祖国怀抱。' },
  { y: 1946, y2: 1949, t: '解放战争', lane: 2, p: 1, d: '1947 年刘邓大军挺进大别山转入战略进攻；辽沈、淮海、平津三大战役基本消灭国民党军队主力；1949 年 4 月渡江战役解放南京。' },
  { y: 1949.75, t: '开国大典', lane: 2, p: 1, d: '10 月 1 日中华人民共和国成立，中国真正成为独立自主的国家，中国近代史到此结束。' },
];

const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;
let canvas, ctx, W = 0, H = 0, dpr = 1;
const view = { z: 1, off: 0 }; // off：视口左缘对应的年份偏移（年）
let sel = -1;
let drawn = []; // 已画卡片 {x,y,w,h,i}
let yearW = []; // 每事件卡片宽缓存
const PAD = 20, LABEL_W = 96;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return {
    bg: v('--bg', '#150e22'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'),
    line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#feb300'),
    panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'),
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function ppy() { return ((W - PAD * 2 - LABEL_W) / (Y1 - Y0 + 1)) * view.z; }
function xOf(year) { return LABEL_W + PAD + (year - Y0) * ppy() - view.off; }

function layout() {
  const top = 14, bottom = H - 148;
  const eraH = 30;
  const axisH = 34;
  const laneH = (bottom - top - eraH - axisH) / LANES.length;
  return { top, eraY: top, laneY0: top + eraH, laneH, axisY: top + eraH + laneH * LANES.length, bottom };
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw() {
  const t = theme();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  const L = layout();
  drawn = [];

  // 内容裁剪区（左侧泳道标签固定，卡片从其后滑过）
  ctx.save();
  ctx.beginPath();
  ctx.rect(LABEL_W, 0, W - LABEL_W, H);
  ctx.clip();

  // 时代段背景：清 / 中华民国
  const xQing0 = xOf(1840), xQing1 = xOf(1912), xROC = xOf(1949.99);
  ctx.fillStyle = t.panel2;
  ctx.fillRect(Math.max(xQing0, LABEL_W), L.laneY0, xQing1 - Math.max(xQing0, LABEL_W), L.laneH * 3 + L.axisH - 8);
  ctx.fillStyle = t.panel;
  ctx.fillRect(xQing1, L.laneY0, xROC - xQing1, L.laneH * 3 + L.axisH - 8);

  // 时代条
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const eras = [
    { n: '清（1840-1912）', a: 1840, b: 1912 },
    { n: '中华民国（1912-1949）', a: 1912, b: 1949.99 },
  ];
  ctx.font = `700 ${17}px ${FONT}`;
  for (const e of eras) {
    const cx = (xOf(e.a) + xOf(e.b)) / 2;
    if (cx > LABEL_W + 40 && cx < W - 40) {
      ctx.fillStyle = t.muted;
      ctx.fillText(e.n, cx, L.eraY + 15);
    }
  }
  // 1919 分界（新旧民主主义革命）
  const x1919 = xOf(1919);
  if (x1919 > LABEL_W && x1919 < W) {
    ctx.strokeStyle = t.muted;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x1919, L.eraY + 6);
    ctx.lineTo(x1919, L.axisY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = t.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('1919 五四运动', x1919, L.eraY + 15);
    ctx.font = `16px ${FONT}`;
    ctx.fillText('旧民主主义革命', (xOf(1840) + x1919) / 2, L.laneY0 - 0.5 + 10);
    ctx.fillText('新民主主义革命', (x1919 + xOf(1949.99)) / 2, L.laneY0 - 0.5 + 10);
  }

  // 泳道线 + 事件
  for (let li = 0; li < LANES.length; li++) {
    const cy = L.laneY0 + L.laneH * li + L.laneH / 2;
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LABEL_W, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();

    const evs = EVENTS.map((e, i) => ({ e, i })).filter((o) => o.e.lane === li).sort((a, b) => a.e.y - b.e.y);
    // 贪心选卡：above/below 两行交错
    const lastX = [-1e9, -1e9];
    for (const { e, i } of evs) {
      const cx = xOf(e.y + (e.y2 ? (e.y2 - e.y) / 2 : 0));
      const w = yearW[i];
      let side = -1;
      if (cx - w / 2 - lastX[0] > 14 && lastX[0] <= lastX[1]) side = 0;
      else if (cx - w / 2 - lastX[1] > 14) side = 1;
      if (side < 0) continue;
      lastX[side] = cx + w / 2;

      // 区间条 / 锚点
      if (e.y2) {
        const xa = xOf(e.y), xb = xOf(e.y2);
        ctx.fillStyle = LANES[li].color;
        ctx.globalAlpha = 0.55;
        roundRect(Math.max(xa, LABEL_W + 2), cy - 4, Math.min(xb, W - 4) - Math.max(xa, LABEL_W + 2), 8, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = LANES[li].color;
        ctx.fill();
      }
      // 连接线
      const cy2 = side === 0 ? cy - 26 : cy + 26;
      ctx.strokeStyle = LANES[li].color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // 卡片
      const ch = 44;
      const cardY = side === 0 ? cy - 26 - ch : cy + 26;
      const isSel = sel === i;
      ctx.fillStyle = t.panel;
      roundRect(cx - w / 2, cardY, w, ch, 8);
      ctx.fill();
      ctx.strokeStyle = isSel ? t.gold : LANES[li].color;
      ctx.lineWidth = isSel ? 2.4 : 1.4;
      ctx.stroke();
      ctx.fillStyle = LANES[li].color;
      ctx.fillRect(cx - w / 2 + (isSel ? 0 : 0), cardY, 4, ch);
      ctx.fillStyle = LANES[li].color;
      ctx.font = `700 16px ${FONT}`;
      ctx.textAlign = 'center';
      const yr = e.y2 ? `${Math.round(e.y)}-${Math.round(e.y2)}` : `${Math.round(e.y)}`;
      ctx.fillText(yr, cx, cardY + 13, w - 14);
      ctx.fillStyle = t.text;
      ctx.font = `700 17px ${FONT}`;
      ctx.fillText(e.t, cx, cardY + 31, w - 14);
      drawn.push({ x: cx - w / 2, y: cardY, w, h: ch, i });
    }
  }

  // 时间刻度
  ctx.strokeStyle = t.muted;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(LABEL_W, L.axisY);
  ctx.lineTo(W, L.axisY);
  ctx.stroke();
  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = t.muted;
  const step = view.z >= 7 ? 1 : view.z >= 3 ? 5 : 10;
  for (let yr = Math.ceil(Y0 / step) * step; yr <= 1950; yr += step) {
    const x = xOf(yr);
    if (x < LABEL_W || x > W) continue;
    const major = yr % 10 === 0;
    ctx.beginPath();
    ctx.moveTo(x, L.axisY);
    ctx.lineTo(x, L.axisY + (major ? 10 : 6));
    ctx.strokeStyle = t.muted;
    ctx.stroke();
    if (major || view.z >= 3) {
      ctx.fillStyle = major ? t.text : t.muted;
      ctx.textAlign = 'center';
      ctx.fillText(String(yr), x, L.axisY + (major ? 24 : 22));
    }
  }
  ctx.restore();

  // 泳道标签（固定）
  for (let li = 0; li < LANES.length; li++) {
    const cy = L.laneY0 + L.laneH * li + L.laneH / 2;
    ctx.fillStyle = t.panel;
    roundRect(10, cy - 34, LABEL_W - 18, 68, 10);
    ctx.fill();
    ctx.strokeStyle = LANES[li].color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = LANES[li].color;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(LANES[li].name, 10 + (LABEL_W - 18) / 2, cy - 10);
    ctx.fillStyle = t.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(LANES[li].sub, 10 + (LABEL_W - 18) / 2, cy + 14);
  }
}

let els = {};
function buildPanel(stage) {
  const st = document.createElement('style');
  st.textContent = `
    #mp{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;
      background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:10px 18px 12px;max-width:min(760px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3);
      text-align:center}
    #mp .yr{color:var(--gold);font-weight:700;font-size:20px;margin-right:10px}
    #mp .tt{font-weight:700;font-size:19px}
    #mp .tx{font-size:16px;color:var(--muted);margin-top:4px;line-height:1.5}
  `;
  stage.appendChild(st);
  const p = document.createElement('div');
  p.id = 'mp';
  p.innerHTML = '<div><span class="yr"></span><span class="tt"></span></div><div class="tx"></div>';
  stage.appendChild(p);
  els = { yr: p.querySelector('.yr'), tt: p.querySelector('.tt'), tx: p.querySelector('.tx') };
  updatePanel();
}
const LANES_TXT = ['屈辱', '探索', '抗争'];

// 教研员契约：定位行 / 环节 / 引导语 / 小结。环节预设真实切换视图（缩放、视口、选中卡片）
const TEACH_META = '历史·八年级｜统编版八上第 1-8 单元 · 中国近代史大事年表';
const TEACH_STEPS = [
  {
    name: '认线索',
    z: 1, center: 1894.5, sel: -1,
    guide: '先不缩放，整体看三条泳道：红色是屈辱、金色是探索、绿色是抗争。谁能按 1840 到 1949 的顺序，只看点位把这段历史的主线口述一遍？',
  },
  {
    name: '比道路',
    z: 9, center: 1897.5, sel: -1,
    guide: '画面已放大到 1894 到 1901 的密集段：同样面对甲午战败，戊戌变法主张变法图强，义和团提出「扶清灭洋」。点开两张卡片，比一比两条道路的主张与结局有何不同。',
  },
  {
    name: '理转折',
    z: 5, center: 1923, sel: 16,
    guide: '画面已定位到 1919 年虚线：虚线前后革命的任务与领导力量发生了什么变化？结合卡片详情说一说，为什么把五四运动作为新民主主义革命的开端。',
  },
];
const TEACH_SUMMARY =
  '1840 年鸦片战争是中国近代史的开端，1949 年中华人民共和国成立为近代史画上句号。屈辱线：《南京条约》使中国开始沦为半殖民地半封建社会，《马关条约》大大加深了这一程度，《辛丑条约》使中国完全陷入半殖民地半封建社会的深渊。探索线：洋务运动、戊戌变法、辛亥革命、新文化运动先后学习西方的器物、制度与思想文化，但都未能改变中国的社会性质。抗争线：1919 年五四运动中工人阶级登上政治舞台，是新民主主义革命的开端；在中国共产党领导下，1949 年新民主主义革命取得胜利。';

// 把 center 年份置于视口中央并选中指定卡片（sel 传 -1 表示清空选中）
function focusYear(center, z, selIdx) {
  view.z = clamp(z, 1, 14);
  const visW = W - LABEL_W - PAD;
  view.off = clamp((center - Y0) * ppy() - visW / 2, 0, Math.max(0, (Y1 - Y0 + 1) * ppy() - visW));
  sel = typeof selIdx === 'number' ? selIdx : -1;
  draw();
  updatePanel();
}

function setTeachStep(i) {
  const s = TEACH_STEPS[i];
  focusYear(s.center, s.z, s.sel);
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}

// 自测：环节按钮确实切到预设视图（缩放倍率、视口中心年份、选中卡片）
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  push('初始全览', view.z === 1 && view.off === 0, `z=${view.z} off=${view.off}`);
  setTeachStep(1);
  const visW = W - LABEL_W - PAD;
  const cxYear = Y0 + (view.off + visW / 2) / ppy();
  push(
    '比道路-聚焦甲午段',
    Number.isFinite(cxYear) && Math.abs(view.z - 9) < 1e-9 && Math.abs(cxYear - 1897.5) < 0.5,
    `z=${view.z} 视口中心=${Number.isFinite(cxYear) ? cxYear.toFixed(1) : 'NaN'}`
  );
  setTeachStep(2);
  push(
    '理转折-选中五四',
    sel === 16 && EVENTS[sel] && EVENTS[sel].t === '五四运动',
    `sel=${sel} ${sel >= 0 && EVENTS[sel] ? EVENTS[sel].t : '无'}`
  );
  setTeachStep(0);
}

function buildTeachingPanel(stage) {
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;top:56px;left:0;right:0;z-index:15;display:flex;align-items:center;gap:10px;' +
    'padding:8px 14px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap';
  const metaEl = document.createElement('span');
  metaEl.dataset.hvMeta = '';
  metaEl.textContent = TEACH_META;
  metaEl.style.cssText = 'color:var(--gold);font-size:14px;white-space:nowrap';
  panel.appendChild(metaEl);
  panel.insertAdjacentHTML(
    'beforeend',
    TEACH_STEPS.map(
      (s, i) => `<button class="btn" data-hv-step type="button" aria-pressed="false" style="font-size:14px;padding:6px 12px;white-space:nowrap">${i + 1}. ${s.name}</button>`
    ).join('') +
      TEACH_STEPS.map(
        (s, i) => `<span data-hv-guide style="flex:1;min-width:240px;font-size:14px;color:var(--text);line-height:1.6;${i === 0 ? '' : 'display:none'}">${s.guide}</span>`
      ).join('') +
      '<button class="btn" id="summary-btn" type="button" style="margin-left:auto;font-size:14px;padding:6px 12px">小结</button>'
  );
  document.body.appendChild(panel);
  panel.querySelectorAll('[data-hv-step]').forEach((el, i) => el.addEventListener('click', () => setTeachStep(i)));

  const summaryEl = document.createElement('div');
  summaryEl.dataset.hvSummary = '';
  summaryEl.textContent = TEACH_SUMMARY;
  summaryEl.style.cssText =
    'position:fixed;left:50%;transform:translateX(-50%);z-index:16;max-width:620px;margin:0 16px;' +
    'padding:16px 20px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;' +
    'font-size:15px;line-height:1.9;display:none';
  document.body.appendChild(summaryEl);
  panel.querySelector('#summary-btn').addEventListener('click', () => {
    summaryEl.style.display = summaryEl.style.display === 'none' ? '' : 'none';
  });

  // 画面让位：舞台顶部移到环节条之下，画布随之重排（面板换行时跟随）
  const fit = () => {
    const top = 56 + panel.offsetHeight + 6;
    stage.style.top = top + 'px';
    summaryEl.style.top = top + 10 + 'px';
  };
  fit();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(panel);
  setTeachStep(0);
}

function updatePanel() {
  if (sel >= 0) {
    const e = EVENTS[sel];
    els.yr.textContent = e.y2 ? `${Math.round(e.y)}-${Math.round(e.y2)} 年` : `${Math.round(e.y)} 年`;
    els.tt.textContent = `${e.t}（${LANES_TXT[e.lane]}）`;
    els.tx.textContent = e.d;
  } else {
    els.yr.textContent = '1840-1949';
    els.tt.textContent = '中国近代史大事年表';
    els.tx.textContent = '三条泳道：屈辱（列强侵略）、探索（近代化）、抗争（反抗与革命）。拖动平移，滚轮缩放，点击卡片看详情。';
  }
}

init({
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');
    buildPanel(stage);

    const measure = () => {
      ctx.font = `700 17px ${FONT}`;
      yearW = EVENTS.map((e) => {
        const yr = e.y2 ? `${Math.round(e.y)}-${Math.round(e.y2)}` : String(Math.round(e.y));
        const w = Math.max(ctx.measureText(e.t).width, ctx.measureText(yr).width * 16 / 17) + 22;
        return Math.max(74, Math.min(150, w));
      });
    };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      draw();
    };
    resize();
    api.onResize = resize;
    api.onTheme = draw;
    buildTeachingPanel(stage);
    resize(); // 环节条使舞台顶部下移，重算一次画布尺寸（后续换行由 ResizeObserver 链触发）
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

    const clampOff = () => {
      const span = (Y1 - Y0 + 1) * ppy();
      const vis = W - LABEL_W - PAD;
      view.off = clamp(view.off, 0, Math.max(0, span - vis));
    };
    const zoomAt = (mx, f) => {
      const yearAt = view.off + (mx - LABEL_W - PAD) / ppy();
      view.z = clamp(view.z * f, 1, 14);
      clampOff();
      view.off = clamp(yearAt - (mx - LABEL_W - PAD) / ppy(), 0, (Y1 - Y0 + 1) * ppy() - (W - LABEL_W - PAD));
      draw();
    };

    const pointers = new Map();
    let dragging = false, lastX = 0, moved = 0, pinch0 = 0, z0 = 1;
    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 1) { dragging = true; lastX = e.clientX; moved = 0; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.abs(a - b); z0 = view.z;
      }
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.abs(a - b);
        if (d > 10 && pinch0 > 10) {
          view.z = clamp(z0 * d / pinch0, 1, 14);
          clampOff();
          draw();
        }
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lastX;
      moved += Math.abs(dx);
      lastX = e.clientX;
      view.off = clamp(view.off - dx / ppy(), 0, 1e9);
      clampOff();
      draw();
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) dragging = false; };
    canvas.addEventListener('pointerup', (e) => {
      release(e);
      if (moved < 6) {
        let hit = -1;
        for (const c of drawn) {
          if (e.clientX >= c.x && e.clientX <= c.x + c.w && e.clientY >= c.y && e.clientY <= c.y + c.h) { hit = c.i; break; }
        }
        sel = hit === sel ? -1 : hit;
        updatePanel();
        draw();
      }
    });
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.deltaY < 0 ? 1.18 : 1 / 1.18);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const vis = (W - LABEL_W - PAD) / ppy();
      if (e.key === 'ArrowRight') { view.off = clamp(view.off + vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === 'ArrowLeft') { view.off = clamp(view.off - vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === '0') { view.z = 1; view.off = 0; draw(); }
    });
  },
});
