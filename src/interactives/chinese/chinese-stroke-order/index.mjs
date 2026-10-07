import { init } from '../../_shared/runtime.mjs';

// 易错字笔顺对比：田字格逐笔演示，左侧规范笔顺、右侧常见错误笔顺，步进对照
// 笔顺依据《通用规范汉字笔顺规范》：火=点撇撇捺；出=竖折竖竖竖折竖（中竖一笔贯通）；
// 里=竖横折横横竖横横；方=点横横折钩撇；万=横横折钩撇（方、万都是最后写撇）
// 字形骨架参考楷体结构手工绘制，笔顺与易错点经多源核对

const ERR = '#e2543f'; // 错误侧强调色（深浅两主题下均为大号图形色块，可读）

const CHARS = [
  {
    ch: '火',
    note: '第一、二笔颠倒：错例先撇后点，规范是先点、后撇',
    strokes: [
      { n: '点', w: [48, 10], pts: [[262, 300], [300, 400], [338, 492]], b: [244, 264] },
      { n: '撇', w: [46, 10], pts: [[714, 282], [730, 340], [700, 400], [610, 470]], b: [752, 250] },
      { n: '撇', w: [78, 12], pts: [[436, 127], [500, 190], [496, 400], [470, 600], [400, 740], [280, 838], [174, 864]], b: [410, 104] },
      { n: '捺', w: [32, 44, 74, 92, 58], pts: [[513, 525], [545, 595], [660, 715], [790, 820], [930, 872]], b: [562, 542] },
    ],
    correct: [0, 1, 2, 3], error: [1, 0, 2, 3],
  },
  {
    ch: '出',
    note: '中间长竖被断成两笔、当成两个凵分写；规范第三笔从上到下一笔写成，全字五画',
    strokes: [
      { n: '竖折', w: [60, 52], pts: [[268, 330], [286, 420], [282, 505], [330, 508], [470, 470], [610, 440], [730, 420]], b: [232, 298] },
      { n: '竖', w: [58, 50], pts: [[772, 255], [800, 330], [786, 440], [762, 505]], b: [808, 236] },
      { n: '竖', w: [60, 56], pts: [[478, 80], [540, 160], [532, 400], [516, 700], [500, 770]], b: [448, 62] },
      { n: '竖', w: [58, 50], pts: [[478, 80], [536, 160], [526, 320], [520, 480]], b: [452, 250] },
      { n: '竖', w: [56, 50], pts: [[518, 512], [512, 650], [502, 770]], b: [572, 556] },
      { n: '竖折', w: [60, 50], pts: [[272, 620], [300, 700], [296, 830], [350, 838], [520, 796], [700, 762]], b: [236, 596] },
      { n: '竖', w: [56, 46], pts: [[764, 612], [802, 700], [820, 890]], b: [842, 596] },
    ],
    correct: [0, 1, 2, 5, 6], error: [0, 3, 1, 5, 4, 6],
  },
  {
    ch: '里',
    note: '写完上边的日后先横后竖；规范第五笔先竖，再写两横',
    strokes: [
      { n: '竖', w: [60, 56], pts: [[258, 258], [262, 400], [258, 545]], b: [224, 230] },
      { n: '横折', w: [58, 52], pts: [[262, 262], [498, 238], [742, 262], [750, 400], [742, 545]], b: [762, 230] },
      { n: '横', w: [54, 50], pts: [[268, 392], [498, 378], [738, 396]], b: [236, 366] },
      { n: '横', w: [54, 50], pts: [[270, 530], [500, 518], [736, 532]], b: [236, 506] },
      { n: '竖', w: [60, 56], pts: [[496, 268], [502, 420], [498, 650], [494, 855]], b: [532, 300] },
      { n: '横', w: [56, 52], pts: [[340, 700], [500, 688], [660, 700]], b: [310, 672] },
      { n: '横', w: [62, 56], pts: [[160, 860], [500, 842], [850, 862]], b: [126, 834] },
    ],
    correct: [0, 1, 2, 3, 4, 5, 6], error: [0, 1, 2, 3, 5, 4, 6],
  },
  {
    ch: '方',
    note: '第三、四笔颠倒：错例先撇后横折钩，规范先横折钩、撇收尾',
    strokes: [
      { n: '点', w: [50, 10], pts: [[446, 110], [520, 175], [566, 205]], b: [428, 96] },
      { n: '横', w: [62, 54], pts: [[150, 378], [480, 318], [830, 306], [905, 330]], b: [168, 434] },
      { n: '横折钩', w: [58, 56, 50, 44, 32, 20, 8], pts: [[516, 462], [610, 488], [695, 528], [672, 640], [622, 760], [560, 852], [462, 806]], b: [486, 428] },
      { n: '撇', w: [70, 10], pts: [[492, 380], [470, 520], [380, 650], [250, 760], [128, 820]], b: [530, 360] },
    ],
    correct: [0, 1, 2, 3], error: [0, 1, 3, 2],
  },
  {
    ch: '万',
    note: '第二、三笔颠倒：错例先撇后横折钩，规范先横折钩、撇收尾',
    strokes: [
      { n: '横', w: [62, 54], pts: [[165, 248], [470, 200], [830, 190], [900, 214]], b: [186, 300] },
      { n: '横折钩', w: [58, 56, 50, 46, 36, 26, 8], pts: [[484, 412], [600, 432], [718, 456], [690, 570], [640, 700], [575, 830], [470, 776]], b: [536, 382] },
      { n: '撇', w: [70, 10], pts: [[482, 252], [470, 380], [380, 540], [260, 680], [120, 792]], b: [524, 258] },
    ],
    correct: [0, 1, 2], error: [0, 2, 1],
  },
];

// ---------- 笔画几何：样条加密 + 变宽轮廓 ----------
function densify(pts) {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 16));
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

// 把一个字的骨架归一化进田字格（保留纵横比，居中）
function prepChar(c) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of c.strokes) for (const p of s.pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const m = 42; // 最大笔画半宽余量
  x0 -= m; y0 -= m; x1 += m; y1 += m;
  const BOX = [118, 138, 882, 862]; // 目标区域 x0,y0,x1,y1
  const k = Math.min((BOX[2] - BOX[0]) / (x1 - x0), (BOX[3] - BOX[1]) / (y1 - y0));
  const cx = (BOX[0] + BOX[2] - (x0 + x1) * k) / 2, cy = (BOX[1] + BOX[3] - (y0 + y1) * k) / 2;
  const T = (p) => [p[0] * k + cx, p[1] * k + cy];
  for (const s of c.strokes) {
    const P = densify(s.pts.map(T));
    const lens = [0];
    for (let i = 1; i < P.length; i++) lens.push(lens[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const total = lens[lens.length - 1];
    // 宽度沿弧长分段插值（控制点均分弧长）
    const w = s.w;
    const ws = P.map((_, i) => {
      if (w.length === 1) return w[0];
      const t = total ? lens[i] / total : 0;
      const f = t * (w.length - 1), j = Math.min(w.length - 2, Math.floor(f));
      return w[j] + (w[j + 1] - w[j]) * (f - j);
    });
    s.P = P; s.lens = lens; s.total = total; s.ws = ws;
    s.b = [Math.max(52, Math.min(948, s.b[0] * k + cx)), Math.max(52, Math.min(948, s.b[1] * k + cy))];
  }
  return c;
}
for (const c of CHARS) prepChar(c);

// 按进度 p（0..1）构造变宽笔画轮廓（圆头收笔）
function strokePath(s, p) {
  const P = s.P, lens = s.lens, ws = s.ws;
  const target = p * s.total;
  let i = 0;
  while (i < P.length - 2 && lens[i + 1] < target) i++;
  const span = lens[i + 1] - lens[i] || 1;
  const t = Math.max(0, Math.min(1, (target - lens[i]) / span));
  const pts = P.slice(0, i + 1).concat([[P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t]]);
  const widths = ws.slice(0, i + 1).concat([ws[i] + (ws[i + 1] - ws[i]) * t]);
  const n = pts.length;
  const L = [], R = [];
  for (let j = 0; j < n; j++) {
    const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const w = widths[j] / 2;
    L.push([pts[j][0] - dy * w, pts[j][1] + dx * w]);
    R.push([pts[j][0] + dy * w, pts[j][1] - dx * w]);
  }
  const path = new Path2D();
  path.moveTo(L[0][0], L[0][1]);
  for (let j = 1; j < n; j++) path.lineTo(L[j][0], L[j][1]);
  cap(path, pts[n - 1], widths[n - 1] / 2, L[n - 1], R[n - 1]);
  for (let j = n - 1; j >= 0; j--) path.lineTo(R[j][0], R[j][1]);
  cap(path, pts[0], widths[0] / 2, R[0], L[0]);
  path.closePath();
  return path;
}
function cap(path, c, r, from, to) {
  const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
  const a1 = Math.atan2(to[1] - c[1], to[0] - c[0]);
  let d = a1 - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  for (let j = 1; j < 6; j++) {
    const a = a0 + d * j / 5;
    path.lineTo(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r);
  }
}

// ---------- 状态与绘制 ----------
let canvas, ctx, W = 0, H = 0, dpr = 1;
let ci = 0, step = -1; // step：当前展示的笔画下标（0 起），-1 为空格；两侧同一下标同步推进
let anim = [0, 0], animStart = 0, raf = 0, replayToken = 0;
let badgeHits = []; // {x,y,r,side,idx} 屏幕坐标，供点击跳转
let teachPanel = null; // 教学面板（顶栏下方），田字格布局需为其让出高度
const FONT = "'Noto Sans SC','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return { text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'), gold: v('--gold', '#E8B04B'), panel: v('--panel', '#1e1433'), bg: v('--bg', '#150e22'), line: v('--line', 'rgba(180,130,210,.16)') };
}
function cur() { return CHARS[ci]; }
function seqs() { return [cur().correct, cur().error]; }
function maxStep() { return Math.max(cur().correct.length, cur().error.length); }

function layout(ctlH) {
  const top = teachPanel ? teachPanel.offsetHeight + 8 : 10, gap = 20;
  const availW = W - gap * 3, availH = H - ctlH - top - 10;
  const side = availW >= availH; // 宽则并排，窄则上下
  const cell = side
    ? [{ w: availW / 2, h: availH }, { w: availW / 2, h: availH }]
    : [{ w: availW, h: availH / 2 }, { w: availW, h: availH / 2 }];
  return cell.map((c, i) => {
    const s = Math.max(120, Math.min(c.w - 8, c.h - 78));
    const cellX = side ? gap + i * (availW / 2 + gap) : gap;
    const cellY = side ? top + (availH - s - 78) / 2 : top + i * (availH / 2) + (c.h - s - 78) / 2;
    return { x: cellX + (c.w - s) / 2, y: cellY + 40, s };
  });
}

function draw() {
  const t = theme();
  ctx.clearRect(0, 0, W, H);
  const ctlH = ctlEl ? ctlEl.offsetHeight + 26 : 130;
  const rects = layout(ctlH);
  badgeHits = [];
  const c = cur();

  rects.forEach((r, side) => {
    const seq = seqs()[side];
    const accent = side === 0 ? t.gold : ERR;
    const label = side === 0 ? '正确笔顺' : '易错笔顺';
    // 面板标题
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = side === 0 ? t.gold : ERR;
    ctx.fillText(label, r.x + r.s / 2, r.y - 10);
    ctx.fillRect(r.x + r.s / 2 - 19, r.y - 2, 38, 3);

    // 田字格
    ctx.save();
    ctx.strokeStyle = t.muted;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.s, r.s);
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([9, 7]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r.x + r.s / 2, r.y); ctx.lineTo(r.x + r.s / 2, r.y + r.s);
    ctx.moveTo(r.x, r.y + r.s / 2); ctx.lineTo(r.x + r.s, r.y + r.s / 2);
    ctx.stroke();
    ctx.restore();

    // 笔画（网格坐标 → 屏幕）
    const map = (p) => [r.x + p[0] / 1000 * r.s, r.y + p[1] / 1000 * r.s];
    seq.forEach((sid, k) => {
      const s = c.strokes[sid];
      if (k > step) return;
      const done = k < step;
      let p = 1;
      if (!done) p = k === step ? anim[side] : 1;
      if (p <= 0) return;
      ctx.save();
      ctx.fillStyle = done ? t.text : accent;
      const path = strokePath(s, p);
      ctx.translate(r.x, r.y); ctx.scale(r.s / 1000, r.s / 1000);
      ctx.fill(path, 'nonzero');
      ctx.restore();
      // 未写完的笔画名先不标序号
    });

    // 幽影（本侧目标字形）
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = t.text;
    ctx.translate(r.x, r.y); ctx.scale(r.s / 1000, r.s / 1000);
    for (const sid of seq) ctx.fill(strokePath(c.strokes[sid], 1), 'nonzero');
    ctx.restore();

    // 序号徽标（当前笔高亮，错侧偏离规范的笔用红色）
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    seq.forEach((sid, k) => {
      if (k > step || (k === step && anim[side] < 0.15)) return;
      const s = c.strokes[sid];
      const [bx, by] = map(s.b);
      const isCur = k === step;
      const wrongSide = side === 1 && seqs()[0][k] !== sid;
      const rad = 16;
      ctx.beginPath();
      ctx.arc(bx, by, rad, 0, Math.PI * 2);
      ctx.fillStyle = isCur ? accent : t.panel;
      ctx.fill();
      ctx.lineWidth = isCur ? 2.5 : 1.5;
      ctx.strokeStyle = isCur ? accent : (wrongSide ? ERR : t.muted);
      ctx.stroke();
      ctx.fillStyle = isCur ? t.bg : (wrongSide ? ERR : t.muted);
      ctx.font = `700 16px ${FONT}`;
      ctx.fillText(String(k + 1), bx, by + 1);
      badgeHits.push({ x: bx, y: by, r: rad + 8, side, idx: k + 1 });
    });
    ctx.textBaseline = 'alphabetic';

    // 笔顺序列行
    const names = seq.map((sid, k) => {
      const wrongSide = side === 1 && seqs()[0][k] !== sid;
      const isCur = k === step;
      const col = isCur ? accent : wrongSide ? ERR : t.muted;
      return { txt: c.strokes[sid].n, col, bold: isCur || wrongSide };
    });
    ctx.font = `16px ${FONT}`;
    const gapc = 7;
    let widths = names.map((nn) => ctx.measureText(nn.txt).width);
    const bold = names.map((nn) => { ctx.font = `700 16px ${FONT}`; const w2 = ctx.measureText(nn.txt).width; ctx.font = `16px ${FONT}`; return w2; });
    const totalW = names.reduce((a, nn, i) => a + Math.max(widths[i], bold[i]) + (i ? gapc : 0), 0);
    const cnt = `${Math.min(step + 1, seq.length)}/${seq.length}`;
    let x = r.x + r.s / 2 - totalW / 2;
    const yBase = r.y + r.s + 26;
    names.forEach((nn, i) => {
      ctx.font = `16px ${FONT}`;
      let w = widths[i];
      if (nn.bold) { ctx.font = `700 16px ${FONT}`; w = bold[i]; }
      ctx.fillStyle = nn.col;
      ctx.fillText(nn.txt, x + w / 2, yBase);
      x += w + gapc;
    });
    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = t.muted;
    ctx.textAlign = 'left';
    ctx.fillText(cnt, r.x, yBase);
  });
}

// ---------- 动画 ----------
function tick() {
  const el = Math.min(1, (performance.now() - animStart) / 520);
  const e = 1 - Math.pow(1 - el, 3);
  anim = [e, e];
  draw();
  if (el < 1) raf = requestAnimationFrame(tick);
  else { anim = [1, 1]; draw(); }
}
function animate() {
  cancelAnimationFrame(raf);
  anim = [0, 0];
  animStart = performance.now();
  raf = requestAnimationFrame(tick);
}
function setStep(n, withAnim = true) {
  step = Math.max(-1, Math.min(maxStep() - 1, n));
  if (withAnim && step >= 0) animate(); else { anim = [1, 1]; draw(); }
  updateUI();
}
function replay() {
  replayToken++;
  const token = replayToken;
  setStep(-1, false);
  const n = maxStep();
  for (let k = 0; k < n; k++) {
    setTimeout(() => { if (token === replayToken) setStep(k); }, 320 + k * 640);
  }
}
function userStep(n) { replayToken++; setStep(n); }
function setChar(i) { replayToken++; ci = i; step = -1; anim = [1, 1]; draw(); updateUI(); }

// ---------- UI ----------
let ctlEl, noteEl, tabsEl, prevBtn, nextBtn;
function btn(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}
function buildUI(stage) {
  ctlEl = document.createElement('div');
  ctlEl.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:20;display:flex;flex-direction:column;gap:8px;align-items:center;max-width:94vw';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;padding:8px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px';
  tabsEl = document.createElement('div');
  tabsEl.style.cssText = 'display:flex;gap:6px;margin-right:10px';
  CHARS.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.style.cssText = 'font-size:22px;line-height:1;padding:4px 12px';
    b.textContent = c.ch;
    b.addEventListener('click', () => setChar(i));
    tabsEl.appendChild(b);
  });
  row.appendChild(tabsEl);
  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;align-self:stretch;background:var(--line);margin:0 4px';
  row.appendChild(sep);
  prevBtn = btn('上笔', () => userStep(step - 1));
  nextBtn = btn('下笔', () => userStep(step + 1));
  row.appendChild(prevBtn);
  row.appendChild(nextBtn);
  row.appendChild(btn('重播', replay));
  ctlEl.appendChild(row);
  noteEl = document.createElement('div');
  noteEl.style.cssText = 'font-size:16px;color:var(--muted);text-align:center;padding:2px 12px';
  ctlEl.appendChild(noteEl);
  stage.appendChild(ctlEl);
  updateUI();
}
function updateUI() {
  [...tabsEl.children].forEach((b, i) => {
    b.style.borderColor = i === ci ? 'var(--gold)' : 'var(--line)';
    b.style.color = i === ci ? 'var(--gold)' : 'var(--text)';
    b.style.fontWeight = i === ci ? '700' : '400';
  });
  prevBtn.disabled = step < 0;
  nextBtn.disabled = step >= maxStep() - 1;
  noteEl.textContent = `${cur().ch}：${cur().note}。`;
}

// 教学环节：每个环节把场景切到预设状态（指定汉字 + 推进到关键笔画），配教师引导语
// ch+step 为预设：认一认停在空田字格；比一比、找规律停在规范与易错首个分歧笔（错侧红标）
const STEPS = [
  {
    name: '认一认',
    ch: '火',
    step: -1,
    guide: '先不看序号。这是「火」，伸出手指跟我书空：你的第一笔写什么、第二笔写什么？把答案记在心里，等下对照田字格。',
    note: '笔顺不是死记的规矩，它决定字好不好看、查字典快不快、连笔写不写得顺。「火」的正确笔顺是：点、撇、撇、捺——很多人先写两撇再补点，点被挤到上面就失位了。书空时心里默数笔画数，四画的「火」如果数出五画，多半是把点写成了横。',
  },
  {
    name: '比一比',
    ch: '火',
    step: 1,
    guide: '逐笔点「下笔」：左格是规范笔顺，右格是常见错法。第二笔停一停，一边是点、一边是撇，红色序号圈出的就是写反的那一笔。刚才书空你写对了吗？',
    note: '规范写法与错例并排对照，分歧点用红色序号标出。「火」的第二笔是撇不是点：先点后撇对应「先中间后两边」之外的特例——火字旁的点要先立住，撇从中上部起笔向左下扫出。对照着看错从哪一笔开始，比单纯抄十遍有效得多。',
  },
  {
    name: '找规律',
    ch: '里',
    step: 4,
    guide: '换「里」再验一次：写完上面的「日」，先写中间的长竖，再写底下两横。想一想「火、里、方、万」写错的都是哪一笔，用先横后竖、先撇后捺的规则说给同桌听。',
    note: '笔顺五规则：先横后竖、先撇后捺、从上到下、从左到右、先中间后两边。「里」七画：写完「日」先竖再写两横——「先横后竖」只在同一部件内生效，跨部件要「从上到下」。规则不是背出来的，是拿一批易错字（火、里、方、万）逐笔验证出来的。',
  },
];
const SUMMARY =
  '笔顺基本规则：先横后竖、先撇后捺、从上到下、从左到右、先中间后两边。本组易错点：火先点后撇；出的中间长竖一笔贯通，全字五画；里写完「日」先竖、再写两横；方、万都是最后写撇。';

function teachGo(i) {
  const s = STEPS[i];
  setChar(CHARS.findIndex((c) => c.ch === s.ch));
  userStep(s.step);
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '语文·小学低年级｜统编版一年级上、下册《识字与写字》· 笔顺规则',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => teachGo(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '「火」的规范笔顺，第二笔是？',
      opts: ['点', '撇', '捺', '横'],
      a: 1,
      why: '火的笔顺是点、撇、撇、捺：先点后撇，点立住、撇扫出。第二笔写成点是常见错法。',
    },
    {
      q: '「里」共几画？',
      opts: ['6 画', '7 画', '8 画', '9 画'],
      a: 1,
      why: '里是七画：日（四画）＋长竖＋两横。把长竖断成两段或漏掉一横都会数错。',
    },
    {
      q: '「里」写完上面的「日」后，下一笔是？',
      opts: ['横', '竖', '撇', '点'],
      a: 1,
      why: '先写贯穿上下的长竖，再写底部两横。跨部件时「从上到下」优先于部件内的「先横后竖」。',
    },
    {
      q: '「方」的最后一笔是？',
      opts: ['横折钩', '撇', '点', '横'],
      a: 1,
      why: '方的笔顺：点、横、横折钩、撇——最后写撇。方、万同属「最后写撇」的易错字。',
    },
    {
      q: '下列不属于笔顺基本规则的是？',
      opts: ['先横后竖', '先撇后捺', '先外后内再封口', '先难后易'],
      a: 3,
      why: '基本规则是先横后竖、先撇后捺、从上到下、从左到右、先中间后两边，以及先外后内再封口。「先难后易」不是笔顺规则。',
    },
  ],
};



// 自测：数据级断言——错例与规范确有分歧、环节预设停在分歧笔上（NaN 防护先判整型）
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  const bad = [];
  for (const c of CHARS) {
    const ok = (a) => Array.isArray(a) && a.length > 0 && a.every((i) => Number.isInteger(i) && i >= 0 && i < c.strokes.length);
    if (!ok(c.correct) || !ok(c.error)) bad.push(c.ch + ':序号越界');
    else {
      const firstDiff = c.correct.findIndex((v, k) => c.error[k] !== undefined && c.error[k] !== v);
      if (firstDiff < 0) bad.push(c.ch + ':错例与规范无分歧');
    }
  }
  push('数据-易错分歧', bad.length === 0, bad.join(' '));
  STEPS.forEach((s, i) => {
    const c = CHARS.find((x) => x.ch === s.ch);
    // 预设要么停在空格，要么停在两侧写法不同的那笔（错侧会亮红标）
    const onDiff = c && Number.isInteger(c.correct[s.step]) && Number.isInteger(c.error[s.step]) &&
      c.correct[s.step] !== c.error[s.step];
    push(`环节预设-${i}-${s.name}`, !!c && (s.step === -1 || onDiff), `ch=${s ? s.ch : '?'} step=${s ? s.step : '?'}`);
  });
  // 行为自测：模拟点击环节按钮，验证场景真的切到预设状态（字与笔画推进），且只显示当前环节引导语
  const btns = [...document.querySelectorAll('[data-hv-step]')];
  btns.forEach((b, i) => {
    b.click();
    const s = STEPS[i] || {};
    const stateOk = cur().ch === s.ch && step === s.step;
    const guideOk = (document.getElementById('g-tip').textContent || '').replace(/\s+/g, '') === (s.guide || '').replace(/\s+/g, '');
    push(`环节切换-${i}-${s.name}`, stateOk && guideOk, `ch=${cur().ch} step=${step}`);
  });
  teachGo(0);
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:pointer';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');

    buildUI(stage);

    const resize = () => {
      dpr = Math.min(devicePixelRatio, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    resize();
    api.onResize = resize;
    api.onTheme = () => draw();

    // 深链：?c=火&s=3 直接定位到某字某笔（s 从 1 数）
    try {
      const q = new URLSearchParams(location.search);
      const ciq = CHARS.findIndex((c) => c.ch === q.get('c'));
      if (ciq >= 0) ci = ciq;
      const sq = parseInt(q.get('s') || '', 10);
      if (!Number.isNaN(sq) && sq >= 1) step = Math.min(maxStep() - 1, sq - 1);
      updateUI();
      draw();
    } catch (e) {}

    let px = 0, py = 0, moved = 0;
    canvas.addEventListener('pointerdown', (e) => { px = e.clientX; py = e.clientY; moved = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => { moved += Math.hypot(e.clientX - px, e.clientY - py); px = e.clientX; py = e.clientY; });
    canvas.addEventListener('pointerup', (e) => {
      if (moved > 8) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const hit = badgeHits.find((b) => Math.hypot(x - b.x, y - b.y) < b.r);
      if (hit) userStep(hit.idx - 1);
      else userStep(step + 1);
    });
    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); userStep(step + 1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); userStep(step - 1); }
    });

    draw();
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
  },
});
