import { init } from '../../_shared/runtime.mjs';

// 秦统一多民族国家建立：战国形势 → 灭六国 → 秦疆域四至 的分步地图动画
// 地理坐标为经纬度近似（教学示意图），等距圆柱投影（中纬度余弦校正）

const LON0 = 96, LON1 = 127.5, LAT0 = 18.5, LAT1 = 44.5;
const KX = Math.cos((((LAT0 + LAT1) / 2) * Math.PI) / 180);
const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;

// 大陆轮廓：自越南北部海岸向东沿海至鸭绿江口，经内陆北界与西界闭合
const COAST = [
  [104.5, 20.5], [106.6, 20.8], [108.0, 21.7], [110.5, 21.3], [113.5, 22.2], [116.6, 23.3],
  [118.2, 24.6], [119.9, 26.1], [121.0, 28.0], [121.8, 30.0], [121.0, 30.5], [121.9, 31.4],
  [121.3, 32.2], [120.4, 33.2], [120.3, 34.1], [119.4, 34.8], [119.6, 35.4], [120.3, 36.1],
  [121.7, 36.3], [122.6, 37.3], [121.4, 37.6], [120.7, 37.9], [119.2, 37.5], [118.3, 37.9],
  [117.7, 38.6], [117.9, 39.1], [119.1, 39.9], [119.9, 40.05], [120.5, 40.4], [121.1, 40.7],
  [122.0, 40.9], [122.3, 40.2], [121.8, 39.4], [121.7, 38.9], [122.5, 39.3], [123.6, 39.7],
  [124.3, 39.85],
];
const INLAND = [
  [125.0, 40.7], [126.3, 41.5], [127.4, 42.0], [127.4, 43.7], [120.0, 43.9], [112.0, 43.7],
  [104.0, 43.9], [97.0, 43.6], [96.2, 40.0], [95.8, 36.0], [96.4, 31.0], [97.4, 26.5],
  [98.6, 22.8], [101.2, 21.3], [103.5, 20.9],
];
// 黄河（战国至秦走禹河故道，于渤海湾西岸入海）、长江
const HWANGHO = [
  [101.6, 35.4], [103.6, 35.8], [103.9, 36.1], [105.2, 37.0], [106.3, 38.4], [107.2, 39.6],
  [108.3, 40.5], [109.8, 40.7], [111.3, 40.3], [110.6, 39.4], [110.3, 38.2], [110.5, 36.8],
  [110.4, 35.5], [111.6, 34.9], [113.4, 34.9], [114.4, 35.8], [115.6, 36.6], [116.4, 37.6],
  [117.4, 38.6], [118.0, 39.0],
];
const YANGTZE = [
  [102.5, 28.2], [104.4, 28.6], [106.4, 29.6], [108.9, 30.3], [110.0, 30.7], [111.7, 30.6],
  [112.6, 30.3], [114.3, 30.6], [115.9, 29.9], [117.3, 30.5], [118.4, 31.2], [119.2, 32.0],
  [120.2, 31.9], [121.5, 31.6],
];
// 秦长城：西起临洮，沿阴山、燕长城故线，东到辽东
const WALL = [
  [103.9, 34.35], [106.2, 36.7], [108.8, 38.1], [111.0, 39.2], [112.6, 40.95], [115.0, 41.35],
  [118.5, 41.5], [121.5, 41.4], [124.2, 41.3],
];
// 统一后秦疆域：北界沿长城、东至海、南至岭南、西至陇西蜀西
const QIN_N = [
  [104.0, 34.45], [106.0, 36.5], [108.5, 37.9], [110.6, 38.9], [111.9, 40.2], [113.6, 41.05],
  [117.0, 41.25], [120.8, 41.15], [123.6, 41.1], [124.4, 40.3], [124.3, 39.85],
];
const QIN_W = [
  [106.6, 21.0], [105.4, 20.6], [104.6, 20.5], [104.2, 21.8], [104.0, 23.2], [104.2, 25.2],
  [103.9, 27.2], [103.3, 29.6], [103.9, 31.6], [103.6, 33.2], [104.0, 34.45],
];
const QIN_FINAL = [...QIN_N, ...COAST.slice().reverse(), ...QIN_W];

// 七雄（数组顺序即绘制顺序，灭亡顺序见 KILL_STEP；capDir 控制都城名排在圆点左/右侧）
const STATES = [
  { id: 'chu', name: '楚', color: '#7FBF9E', cap: [116.8, 32.6, '寿春'], capDir: 'right', label: [112.4, 30.3],
    poly: [[107.1, 31.7], [108.2, 32.3], [109.2, 33.0], [110.8, 33.3], [112.4, 33.4], [113.9, 33.4], [115.1, 33.0], [116.4, 32.5], [117.7, 33.1], [118.6, 34.3], [120.0, 34.3], [120.5, 33.1], [121.9, 31.4], [121.0, 30.4], [121.7, 28.7], [120.6, 27.4], [118.9, 26.2], [116.9, 25.0], [114.5, 24.6], [111.8, 24.5], [110.0, 25.2], [109.3, 26.9], [108.3, 28.6], [107.7, 30.0], [106.8, 30.8]] },
  { id: 'qi', name: '齐', color: '#7fd4e8', cap: [118.3, 36.8, '临淄'], capDir: 'right', label: [119.0, 36.2],
    poly: [[116.4, 34.9], [117.8, 34.6], [119.0, 34.7], [119.8, 35.4], [120.9, 36.3], [122.1, 36.9], [122.6, 37.3], [121.4, 37.6], [120.6, 37.85], [119.2, 37.4], [117.7, 37.5], [116.8, 37.1], [116.2, 36.3]] },
  { id: 'yan', name: '燕', color: '#f2789f', cap: [116.4, 39.9, '蓟'], capDir: 'right', label: [119.9, 41.5],
    poly: [[114.9, 39.4], [116.4, 39.5], [117.8, 39.9], [119.2, 40.4], [120.8, 40.6], [122.6, 40.9], [124.5, 40.7], [125.4, 41.7], [124.2, 42.5], [121.5, 42.9], [118.5, 42.8], [116.2, 42.2], [115.2, 41.2], [114.7, 40.3]] },
  { id: 'zhao', name: '赵', color: '#9D8FD1', cap: [114.5, 36.6, '邯郸'], capDir: 'right', label: [114.7, 38.5],
    poly: [[110.8, 38.6], [111.9, 40.2], [113.7, 40.5], [115.2, 39.9], [116.2, 39.2], [116.0, 38.1], [115.1, 37.2], [114.4, 36.5], [113.8, 36.4], [114.0, 37.6], [112.4, 38.0], [110.9, 37.5]] },
  { id: 'wei', name: '魏', color: '#6FA8C9', cap: [114.3, 34.8, '大梁'], capDir: 'right', label: [111.5, 35.5],
    poly: [[110.7, 34.6], [110.8, 36.1], [112.0, 37.2], [113.5, 36.9], [114.0, 36.35], [115.7, 35.9], [116.5, 35.1], [116.3, 34.3], [114.7, 33.9], [114.05, 34.95], [113.0, 35.9], [111.9, 35.4], [112.0, 34.8]] },
  { id: 'qin', name: '秦', color: '#E8B04B', cap: [108.7, 34.35, '咸阳'], capDir: 'right', label: [106.6, 33.2],
    poly: [[103.6, 34.9], [103.7, 33.2], [104.6, 31.6], [106.5, 30.7], [108.4, 31.3], [108.6, 32.4], [109.6, 33.2], [110.5, 34.1], [110.6, 35.1], [110.4, 36.6], [109.0, 37.9], [107.2, 38.3], [105.7, 37.1], [104.1, 35.7]] },
  { id: 'han', name: '韩', color: '#ef7d57', cap: [113.73, 34.4, '新郑'], capDir: 'left', label: [112.5, 34.7],
    poly: [[111.8, 34.0], [112.0, 34.8], [111.9, 35.4], [113.0, 35.9], [113.9, 35.7], [114.05, 34.95], [113.7, 33.9], [112.6, 33.8]] },
];

const STEPS = [
  { year: '前260年前后', title: '战国形势', kill: null,
    text: '七雄并立。商鞅变法后秦国日益强盛，采取远交近攻策略逐一兼并，六国中韩最弱、离秦最近。' },
  { year: '前230年', title: '秦灭韩', kill: 'han', text: '内史腾攻韩，俘韩王安，韩国灭亡。' },
  { year: '前228年', title: '秦灭赵', kill: 'zhao', text: '王翦大破赵军，俘赵王迁。公子嘉逃往代郡自立为代王，前222年被灭。' },
  { year: '前225年', title: '秦灭魏', kill: 'wei', text: '王贲引黄河水灌大梁，城坏，魏王假出降。' },
  { year: '前223年', title: '秦灭楚', kill: 'chu', text: '王翦率六十万大军伐楚，大败楚军，俘楚王负刍。' },
  { year: '前222年', title: '秦灭燕', kill: 'yan', text: '王贲攻辽东，俘燕王喜，燕亡，同年灭代。' },
  { year: '前221年', title: '秦灭齐 · 完成统一', kill: 'qi',
    text: '王贲自燕南下攻齐，俘齐王建。秦定都咸阳，建立起我国历史上第一个统一的多民族的封建国家。' },
  { year: '前221年之后', title: '秦的疆域', kill: null, final: true,
    text: '东至东海，西到陇西，北至长城一带，南达南海。北击匈奴，修筑西起临洮、东到辽东的长城；南平百越，开凿灵渠。' },
];
const KILL_STEP = {};
STEPS.forEach((s, i) => { if (s.kill) KILL_STEP[s.kill] = i; });

// 教研员契约：教学环节 = 映射到上方地图的预设状态（0 战国形势 / 1 灭韩开局 / 7 疆域四至），
// 每个环节配一句教师课堂引导语（未激活的留在 DOM 里）；小结为结论性知识
const TEACH = [
  {
    name: '认七雄', mapStep: 0,
    guide: '先认一认战国形势：请对照地图说出齐、楚、燕、韩、赵、魏、秦七雄的方位与都城，再指一指秦国在哪里，想想它「远交近攻」为什么会先拿最近的韩开刀。',
    note: '战国七雄的地理格局：齐在东、楚在南、燕在北，韩、赵、魏居中，秦据西陲关中。范雎给秦王定下「远交近攻」——对齐燕远处交好结盟，对邻国逐个攻取，每灭一国实力就滚一层雪球。地缘战略不难懂：最近的韩最先亡，就是这条策略的直接落地。',
  },
  {
    name: '观进程', mapStep: 1,
    guide: '公元前230年秦灭韩，统一战争开始。每点一次「下个」之前，先让学生猜下一个被灭的是谁、为什么，再核对年份与金色进攻路线：韩、赵、魏、楚、燕、齐，近者先亡。',
    note: '灭国顺序是韩（前230）、赵（前228）、魏（前225）、楚（前224）、燕（前222）、齐（前221），十年而六国毕。规律就在地图上：离秦越近越先亡，齐最后不战而降——它一直信着秦的「远交」。看年份还能读出节奏：灭楚动用六十万大军耗时最久，国力大小决定战事长短。',
  },
  {
    name: '看疆域', mapStep: 7,
    guide: '到统一后的疆域了。请学生按图复述四至：东至东海、西到陇西、北至长城一带、南达南海；再指认长城（西起临洮、东到辽东）、灵渠与都城咸阳，说说这些建设对巩固统一的作用。',
    note: '秦朝疆域四至：东至东海、西到陇西、北至长城一带、南达南海，是我国历史上第一个统一的多民族的封建国家。长城御匈奴、灵渠通湘漓沟通长江与珠江水系、咸阳居关中扼天下——三大建设都是「巩固统一」的具体手段：北边防、南边通、中心控。疆域图不只用来背四至，更要用建设说明政权怎么落地。',
  },
];
const SUMMARY = '公元前230年至前221年，秦先后灭掉韩、赵、魏、楚、燕、齐，完成统一，定都咸阳，建立起我国历史上第一个统一的多民族的封建国家。秦朝疆域东至东海，西到陇西，北至长城一带，南达南海；为抵御匈奴修筑了西起临洮、东到辽东的长城，南平百越后开凿灵渠。秦的统一结束了春秋战国以来长期争战混战的局面。';

const TRIBES = [
  { n: '匈奴', p: [105.5, 42.3] }, { n: '东胡', p: [121.6, 43.2] }, { n: '羌', p: [100.2, 33.4] },
  { n: '西南夷', p: [101.6, 26.6] }, { n: '百越', p: [110.6, 23.2] }, { n: '朝鲜', p: [126.3, 39.9] },
];
const RIVER_LABELS = [
  { n: '黄河', p: [109.4, 37.3] }, { n: '长江', p: [113.3, 29.7] },
];

let canvas, ctx, W = 0, H = 0, dpr = 1;
let base = { k: 1, cx: 0, cy: 0 };
const view = { s: 1, tx: 0, ty: 0 };
let stepI = 0, animT = 1, animStart = 0;
let fontF = 1;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return {
    bg: v('--bg', '#150e22'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'),
    line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#E8B04B'),
    panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'),
  };
}
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function computeBase() {
  // top 让出顶栏下方教学环节条的高度，避免压住地图北部族名
  const top = 104, bottom = Math.max(120, H - 158);
  const uW = (LON1 - LON0) * KX, uH = LAT1 - LAT0;
  base.k = Math.min((W - 16) / uW, (bottom - top) / uH);
  base.cx = W / 2;
  base.cy = (top + bottom) / 2;
}
function P(lon, lat) {
  const ux = (lon - LON0) * KX, uy = LAT1 - lat;
  return [
    base.cx + (ux - uW2) * base.k * view.s + view.tx,
    base.cy + (uy - uH2) * base.k * view.s + view.ty,
  ];
}
const uW2 = ((LON1 - LON0) * KX) / 2, uH2 = (LAT1 - LAT0) / 2;

function clampPan() {
  const a = P(LON0, LAT1), b = P(LON1, LAT0);
  const bw = b[0] - a[0], bh = b[1] - a[1];
  const limX = Math.max(0, (bw - W) / 2), limY = Math.max(0, (bh - H) / 2);
  view.tx = clamp(view.tx, -limX, limX);
  view.ty = clamp(view.ty, -limY, limY);
}

function poly(pts) {
  ctx.beginPath();
  const p0 = P(pts[0][0], pts[0][1]);
  ctx.moveTo(p0[0], p0[1]);
  for (let i = 1; i < pts.length; i++) {
    const p = P(pts[i][0], pts[i][1]);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
}
function line(pts) {
  ctx.beginPath();
  const p0 = P(pts[0][0], pts[0][1]);
  ctx.moveTo(p0[0], p0[1]);
  for (let i = 1; i < pts.length; i++) {
    const p = P(pts[i][0], pts[i][1]);
    ctx.lineTo(p[0], p[1]);
  }
}
function labelBG(text, x, y, padX, alpha) {
  const w = ctx.measureText(text).width;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(x - w / 2 - padX, y - 14 * fontF, w + padX * 2, 28 * fontF);
}
function star(x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + rr * Math.cos(a), py = y + rr * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function conqOf(id) {
  const idx = KILL_STEP[id];
  if (idx === undefined) return id === 'qin' ? 1 : 0;
  if (stepI < idx) return 0;
  if (stepI === idx) return ease(animT);
  return 1;
}

function bez(p0, c, p1, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}
function drawArrow(t) {
  const kill = STEPS[stepI].kill;
  if (!kill) return;
  const st = STATES.find((s) => s.id === kill);
  const from = P(108.7, 34.35), to = P(st.cap[0], st.cap[1]);
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; } // 控制点取向上的一侧
  const c = [mx + nx * len * 0.22, my + ny * len * 0.22];
  const th = theme();
  ctx.strokeStyle = th.gold;
  ctx.lineWidth = 3.5 * view.s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  const N = 26;
  for (let i = 1; i <= N; i++) {
    const p = bez(from, c, to, (i / N) * t);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
  if (t > 0.02) {
    const head = bez(from, c, to, t);
    const prev = bez(from, c, to, Math.max(0, t - 0.03));
    const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]);
    const r = 9 * view.s;
    ctx.beginPath();
    ctx.moveTo(head[0] + Math.cos(ang) * r, head[1] + Math.sin(ang) * r);
    ctx.lineTo(head[0] + Math.cos(ang + 2.5) * r, head[1] + Math.sin(ang + 2.5) * r);
    ctx.lineTo(head[0] + Math.cos(ang - 2.5) * r, head[1] + Math.sin(ang - 2.5) * r);
    ctx.closePath();
    ctx.fillStyle = th.gold;
    ctx.fill();
  }
}

function draw() {
  const th = theme();
  fontF = clamp(Math.min(W, H) / 820, 0.95, 1.15);
  clampPan();
  ctx.clearRect(0, 0, W, H);

  // 海洋
  ctx.fillStyle = mix(th.bg, '#6FA8C9', 0.16);
  ctx.fillRect(0, 0, W, H);

  // 大陆（其他地区）+ 海岸线
  poly([...COAST, ...INLAND]);
  ctx.fillStyle = th.panel2;
  ctx.fill();
  ctx.strokeStyle = 'rgba(79,195,247,0.8)';
  ctx.lineWidth = 2 * view.s;
  ctx.stroke();

  const finalT = STEPS[stepI].final ? ease(animT) : 0;

  // 统一后疆域（末步渐显：补上岭南、河套、辽东）
  if (finalT > 0) {
    poly(QIN_FINAL);
    ctx.globalAlpha = finalT;
    ctx.fillStyle = th.gold;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 七雄色块
  for (const st of STATES) {
    const c = conqOf(st.id);
    poly(st.poly);
    ctx.fillStyle = mix(st.color, th.gold, c);
    ctx.fill();
    if (c < 0.96) {
      ctx.strokeStyle = th.text;
      ctx.globalAlpha = 0.35 * (1 - c);
      ctx.lineWidth = 1.2 * view.s;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // 河流（画在政区色块之上）
  ctx.strokeStyle = 'rgba(79,195,247,0.8)';
  ctx.lineWidth = 3.2 * view.s;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  line(HWANGHO); ctx.stroke();
  line(YANGTZE); ctx.stroke();

  // 河流名
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `17px ${FONT}`;
  for (const r of RIVER_LABELS) {
    const p = P(r.p[0], r.p[1]);
    labelBG(r.n, p[0], p[1], 6 * fontF, 0.45);
    ctx.fillStyle = th.text;
    ctx.fillText(r.n, p[0], p[1]);
  }

  // 族名
  ctx.font = `${18 * fontF}px ${FONT}`;
  for (const tb of TRIBES) {
    const p = P(tb.p[0], tb.p[1]);
    labelBG(tb.n, p[0], p[1], 7 * fontF, 0.5);
    ctx.fillStyle = th.text;
    ctx.fillText(tb.n, p[0], p[1]);
  }

  // 长城（末步，自西向东生长）
  if (finalT > 0) {
    ctx.strokeStyle = th.gold;
    ctx.lineWidth = 3 * view.s;
    ctx.lineCap = 'round';
    const segs = WALL.length - 1;
    const upto = Math.max(1, segs * finalT);
    ctx.beginPath();
    const p0 = P(WALL[0][0], WALL[0][1]);
    ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= Math.floor(upto); i++) {
      const p = P(WALL[i][0], WALL[i][1]);
      ctx.lineTo(p[0], p[1]);
    }
    const fr = upto - Math.floor(upto);
    if (fr > 0 && Math.floor(upto) < segs) {
      const a = WALL[Math.floor(upto)], b = WALL[Math.floor(upto) + 1];
      const pa = P(a[0], a[1]), pb = P(b[0], b[1]);
      ctx.lineTo(pa[0] + (pb[0] - pa[0]) * fr, pa[1] + (pb[1] - pa[1]) * fr);
    }
    ctx.stroke();
    // 城垛短线
    ctx.lineWidth = 1.6 * view.s;
    ctx.beginPath();
    for (let i = 0; i < segs * finalT; i += 0.45) {
      const i0 = Math.floor(i), f = i - i0;
      const a = WALL[i0], b = WALL[Math.min(i0 + 1, segs)];
      const lon = a[0] + (b[0] - a[0]) * f, lat = a[1] + (b[1] - a[1]) * f;
      const pa = P(a[0], a[1]), pb = P(b[0], b[1]);
      const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
      const p = P(lon, lat);
      ctx.moveTo(p[0] + Math.cos(ang) * 4 * view.s, p[1] + Math.sin(ang) * 4 * view.s);
      ctx.lineTo(p[0] - Math.cos(ang) * 4 * view.s, p[1] - Math.sin(ang) * 4 * view.s);
    }
    ctx.stroke();

    // 长城两端与灵渠标注
    ctx.font = `${17 * fontF}px ${FONT}`;
    const marks = [
      ['临洮', 103.6, 33.7], ['辽东', 124.9, 41.85], ['灵渠', 110.7, 25.1], ['长城', 114.3, 40.55],
    ];
    for (const [n, lo, la] of marks) {
      const p = P(lo, la);
      labelBG(n, p[0], p[1], 6 * fontF, 0.34);
      ctx.fillStyle = th.gold;
      ctx.fillText(n, p[0], p[1]);
    }
    const lq = P(110.65, 25.6);
    ctx.beginPath();
    ctx.arc(lq[0], lq[1], 3 * view.s, 0, Math.PI * 2);
    ctx.fillStyle = th.gold;
    ctx.fill();
  }

  // 都城：点 + 名（文字用所在色块同色的晕圈，保证跨出块边也可读）
  for (const st of STATES) {
    const c = conqOf(st.id);
    const p = P(st.cap[0], st.cap[1]);
    const isCap = st.id === 'qin';
    const r = (isCap ? 5 : 3.6) * view.s;
    ctx.fillStyle = isCap && finalT > 0.3 ? th.gold : '#241a33';
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = finalT > 0.3 && isCap ? '#241a33' : th.gold;
    ctx.lineWidth = 1.6 * view.s;
    ctx.stroke();
    ctx.font = `${(isCap ? 18 : 17) * fontF}px ${FONT}`;
    ctx.textBaseline = 'middle';
    const name = isCap && finalT > 0.3 ? '咸阳（都城）' : st.cap[2];
    const w = ctx.measureText(name).width;
    const dir = st.capDir || 'right';
    let px;
    if (dir === 'left') {
      ctx.textAlign = 'right';
      px = clamp(p[0] - 7 * view.s, w + 6, W - 6);
    } else {
      ctx.textAlign = 'left';
      px = clamp(p[0] + 7 * view.s, 6, W - w - 6);
    }
    ctx.lineWidth = 4 * fontF;
    ctx.strokeStyle = mix(st.color, th.gold, c);
    ctx.lineJoin = 'round';
    ctx.strokeText(name, px, p[1]);
    ctx.fillStyle = '#241a33';
    ctx.fillText(name, px, p[1]);
    ctx.textAlign = 'center';
  }

  // 国名（被灭后随兼并渐隐）
  ctx.font = `700 ${23 * fontF}px ${FONT}`;
  for (const st of STATES) {
    const c = conqOf(st.id);
    if (st.id === 'qin') continue;
    if (c > 0.9) continue;
    const p = P(st.label[0], st.label[1]);
    ctx.globalAlpha = 1 - c;
    ctx.fillStyle = '#241a33';
    ctx.fillText(st.name, p[0], p[1]);
    ctx.globalAlpha = 1;
  }

  // 进攻路线箭头（当前步）
  drawArrow(STEPS[stepI].kill ? ease(animT) : 0);

  // 末步：秦字、咸阳星、四至
  if (finalT > 0) {
    const fade = clamp((finalT - 0.45) / 0.55, 0, 1);
    if (fade > 0) {
      ctx.globalAlpha = fade;
      const p = P(112.6, 33.6);
      ctx.font = `700 ${46 * fontF * view.s}px ${FONT}`;
      labelBG('秦', p[0], p[1], 10 * fontF * view.s, 0.22);
      ctx.fillStyle = th.gold;
      ctx.fillText('秦', p[0], p[1]);
      const xy = P(108.7, 34.35);
      star(xy[0], xy[1], 9 * view.s, th.gold);

      // 四至
      ctx.font = `700 ${20 * fontF}px ${FONT}`;
      const reach = [
        { n: '东至东海', p: [124.7, 31.6] },
        { n: '西到陇西', p: [98.6, 33.0], tip: [[100.4, 33.2], [103.4, 34.2]] },
        { n: '南达南海', p: [110.6, 20.4] },
        { n: '北至长城一带', p: [109.5, 43.2], tip: [[110.6, 42.75], [111.4, 41.0]] },
      ];
      for (const r of reach) {
        const p = P(r.p[0], r.p[1]);
        labelBG(r.n, p[0], p[1], 8 * fontF, 0.4);
        ctx.fillStyle = th.gold;
        ctx.fillText(r.n, p[0], p[1]);
        if (r.tip) {
          const a = P(r.tip[0][0], r.tip[0][1]), b = P(r.tip[1][0], r.tip[1][1]);
          ctx.strokeStyle = th.gold;
          ctx.lineWidth = 2 * view.s;
          ctx.setLineDash([5 * view.s, 4 * view.s]);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // 图幅边框
  const a = P(LON0, LAT1), b = P(LON1, LAT0);
  ctx.strokeStyle = th.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
}

// ———— UI ————
let els = {};
function buildPanel(stage) {
  const st = document.createElement('style');
  st.textContent = `
    #qp{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;
      background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:10px 16px 12px;max-width:min(780px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3)}
    #qp .r1{display:flex;align-items:baseline;gap:10px;justify-content:center;flex-wrap:wrap}
    #qp .yr{color:var(--gold);font-weight:700;font-size:20px}
    #qp .tt{font-weight:700;font-size:19px}
    #qp .tx{font-size:16px;color:var(--muted);margin:6px 0 10px;text-align:center;line-height:1.5}
    #qp .r3{display:flex;align-items:center;justify-content:center;gap:14px}
    #qp button{font:inherit;touch-action:manipulation}
    .qb{font-size:17px;line-height:1;padding:9px 16px;border-radius:6px;border:1px solid var(--line);
      background:var(--panel2);color:var(--text);cursor:pointer}
    .qb:hover:not(:disabled){border-color:var(--gold)}
    .qb:disabled{opacity:.35;cursor:default}
    #qdots{display:flex;gap:8px}
    .qdot{width:12px;height:12px;border-radius:50%;border:1px solid var(--line);background:transparent;
      padding:0;cursor:pointer}
    .qdot.done{background:var(--muted);border-color:transparent}
    .qdot.cur{background:var(--gold);border-color:transparent;transform:scale(1.25)}
  `;
  stage.appendChild(st);
  const panel = document.createElement('div');
  panel.id = 'qp';
  panel.innerHTML = `
    <div class="r1"><span class="yr"></span><span class="tt"></span></div>
    <div class="tx"></div>
    <div class="r3">
      <button class="qb" id="qprev" type="button">上个</button>
      <div id="qdots"></div>
      <button class="qb" id="qnext" type="button">下个</button>
    </div>`;
  stage.appendChild(panel);
  const dots = panel.querySelector('#qdots');
  STEPS.forEach((s, i) => {
    const d = document.createElement('button');
    d.className = 'qdot';
    d.type = 'button';
    d.setAttribute('aria-label', `第${i + 1}步`);
    d.addEventListener('click', () => goStep(i));
    dots.appendChild(d);
  });
  els = {
    yr: panel.querySelector('.yr'), tt: panel.querySelector('.tt'), tx: panel.querySelector('.tx'),
    prev: panel.querySelector('#qprev'), next: panel.querySelector('#qnext'),
    dots: [...dots.children],
  };
  els.prev.addEventListener('click', () => goStep(stepI - 1, true));
  els.next.addEventListener('click', () => goStep(stepI + 1));
  updatePanel();
}
function updatePanel() {
  const s = STEPS[stepI];
  els.yr.textContent = s.year;
  els.tt.textContent = s.title;
  els.tx.textContent = s.text;
  els.prev.disabled = stepI === 0;
  els.next.disabled = stepI === STEPS.length - 1;
  els.dots.forEach((d, i) => {
    d.className = 'qdot' + (i === stepI ? ' cur' : i < stepI ? ' done' : '');
  });
}

let raf = 0;
function goStep(i, instant) {
  const n = clamp(i, 0, STEPS.length - 1);
  if (n === stepI && !instant && animT >= 1 && n !== 0) { /* 重复点击当前步：重播 */ }
  stepI = n;
  updatePanel();
  cancelAnimationFrame(raf);
  if (instant) {
    animT = 1;
    draw();
  } else {
    animT = 0;
    animStart = performance.now();
    const tick = (now) => {
      animT = clamp((now - animStart) / 1400, 0, 1);
      draw();
      if (animT < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
}

// 教研员契约四标记：定位行（进顶栏）、环节按钮、引导语（未激活 display:none 留 DOM）、小结浮层
let teachBarEl = null, sumEl = null;
function placeTeachBar() {
  // 环节条贴在顶栏下方（顶栏窄屏会换行变高，需动态跟随）；小结浮层再挂其下
  const bar = document.getElementById('bar');
  if (!teachBarEl || !bar) return;
  teachBarEl.style.top = bar.offsetHeight + 2 + 'px';
  if (sumEl) sumEl.style.top = teachBarEl.offsetTop + teachBarEl.offsetHeight + 8 + 'px';
}
// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '历史·七年级｜统编版七年级上册第三单元第9课《秦统一中国》',
  steps: TEACH.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => goStep(TEACH[i].mapStep, true) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '战国七雄中，地处最西面的是？',
      opts: ['齐国', '楚国', '秦国', '燕国'],
      a: 2,
      why: '秦据西方关中，齐在东、楚在南、燕在北，韩赵魏居中。认清方位，「远交近攻」的地缘逻辑才看得懂。',
    },
    {
      q: '「远交近攻」的策略意图是？',
      opts: ['先攻最远的国家', '结好远国、逐个攻取邻国', '与所有国家结盟', '放弃攻伐专守关中'],
      a: 1,
      why: '对齐燕等远国交好使其观望，对韩赵魏等近邻逐个吞并，每灭一国地盘兵力都滚雪球——近邻先亡正由此来。',
    },
    {
      q: '秦灭六国的正确顺序是？',
      opts: ['赵、韩、魏、楚、燕、齐', '韩、赵、魏、楚、燕、齐', '韩、魏、赵、燕、楚、齐', '齐、燕、楚、魏、赵、韩'],
      a: 1,
      why: '前 230 年起依次为韩、赵、魏、楚、燕、齐，至前 221 年完成。顺序与距秦远近高度相关，齐最后不战而降。',
    },
    {
      q: '秦朝疆域「四至」中，北面到达？',
      opts: ['阴山一带', '长城一带', '辽东', '河套'],
      a: 1,
      why: '教材表述为「北至长城一带」。长城西起临洮、东到辽东，是为抵御匈奴而修；辽东只是长城东端，不是疆域北界的完整表述。',
    },
    {
      q: '灵渠的开凿主要为了？',
      opts: ['灌溉关中平原', '沟通湘江与漓江水系，便利南下用兵与运输', '防御匈奴南下', '引渭水入黄河'],
      a: 1,
      why: '灵渠沟通长江与珠江两大水系，是为南平百越转运粮草而开凿——交通线是政权向南方伸张的抓手，与长城一南一北各司其职。',
    },
  ],
};



init({
  teaching: TEACHING,
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');

    buildPanel(stage);

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeBase();
      draw();
    };
    resize();
    api.onResize = () => { resize(); placeTeachBar(); };
    api.onTheme = draw;

    // 拖动平移 + 双指捏合缩放（鼠标/触摸统一 pointer 通道）
    const pointers = new Map();
    let pinch0 = 0, scale0 = 1, mid0 = null, moved = 0;
    const zoomAt = (mx, my, f) => {
      const s1 = clamp(view.s * f, 1, 5);
      view.tx = mx - base.cx - (mx - base.cx - view.tx) * (s1 / view.s);
      view.ty = my - base.cy - (my - base.cy - view.ty) * (s1 / view.s);
      view.s = s1;
      draw();
    };
    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
        mid0 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        scale0 = view.s;
      }
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (d > 10 && pinch0 > 10) {
          view.s = clamp(scale0 * d / pinch0, 1, 5);
          if (mid0) { view.tx += mid[0] - mid0[0]; view.ty += mid[1] - mid0[1]; }
          mid0 = mid;
          draw();
        }
        return;
      }
      const dx = e.clientX - pointers.get(e.pointerId)[0];
      const dy = e.clientY - pointers.get(e.pointerId)[1];
      moved += Math.abs(dx) + Math.abs(dy);
      view.tx += dx; view.ty += dy;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      draw();
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) mid0 = null; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goStep(stepI + 1);
      else if (e.key === 'ArrowLeft') goStep(stepI - 1, true);
    });

    // 支持 ?step=n 直达某步（备课试放用）
    const sp = new URLSearchParams(location.search).get('step');
    const sn = parseInt(sp, 10);
    if (!Number.isNaN(sn) && sn >= 0 && sn < STEPS.length && sn !== 0) goStep(sn, true);
  },
});
