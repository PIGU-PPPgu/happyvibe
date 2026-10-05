import { init } from '../../_shared/runtime.mjs';

// 新航路开辟：迪亚士/达伽马/哥伦布/麦哲伦四条航线动态航行 + 分步人物卡
// 坐标为经纬度近似（教学示意），等距圆柱投影；图幅 -185..145 保证跨太平洋航线完整

const LON0 = -185, LON1 = 145, LAT0 = -60, LAT1 = 75;
const KX = Math.cos((((LAT0 + LAT1) / 2) * Math.PI) / 180);
const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;

// ———— 大陆轮廓（[lon,lat] 数组，教学示意） ————
const EURASIA = [
  [-9.5, 37], [-6.3, 36.2], [-2.2, 36.7], [0.8, 41], [3.2, 43], [8, 44.2], [12.5, 45.5], [15, 44],
  [18, 42.3], [20, 40.2], [22, 38.8], [24, 37], [26.5, 38.5], [29, 41], [36, 36.6], [35.5, 34],
  [34.5, 31.5], [34.5, 28], [35.5, 27.5], [38, 21], [40, 16], [43, 12.6], [45, 12.9], [50, 15],
  [55, 17.3], [59, 22.3], [58.5, 23.8], [56.3, 24.4], [52, 24], [50, 28.5], [48, 29.8], [51, 29.3],
  [56, 26.7], [59.5, 25.3], [64, 25.2], [68.5, 23], [72.6, 19], [74.6, 14.5], [76.2, 10.5],
  [77.6, 8.1], [79.8, 10.3], [80.3, 13.6], [80.2, 15.8], [82.5, 16.5], [85.5, 19.4], [87.5, 21],
  [89.5, 21.7], [91.5, 22.5], [92.3, 20.5], [94, 17.5], [97.6, 15.8], [98.5, 10], [98.2, 8.5],
  [100.5, 7], [103.5, 1.4], [100.3, 5.5], [98.3, 8.3], [98.8, 13], [100.5, 13.5], [103, 10.5],
  [105, 9], [106.7, 10.5], [109, 11], [109.5, 13], [108, 16], [105.8, 19.5], [108, 21.5],
  [110, 21.3], [113.5, 22.2], [116.5, 23.2], [119.5, 25.5], [121, 28], [121.9, 31.2], [120.3, 34.1],
  [119.4, 34.8], [120.5, 36.1], [122.5, 37.3], [121, 37.5], [118, 38.8], [121.5, 39], [121.2, 40.8],
  [124.3, 39.8], [125.5, 38.5], [126.5, 34.5], [129.4, 35.3], [129.6, 38], [128, 40], [130, 42.5],
  [135.5, 45], [140, 48], [140, 55], [137, 57], [142, 59], [142, 68], [138, 70], [130, 71],
  [120, 73], [100, 74], [80, 73], [60, 70], [40, 68], [20, 70], [12, 66], [5, 62], [5, 58],
  [8, 57], [8, 55], [4, 52], [-1.5, 49.7], [-4.8, 48.4], [-2, 47], [-1.2, 46], [-1.5, 43.9],
  [-9.5, 43],
];
const AFRICA = [
  [-6, 35.8], [-10, 31], [-16, 21], [-17.5, 14.7], [-16, 12], [-13.5, 9], [-10, 7], [-7, 4.3],
  [-3, 5], [2, 6.3], [8.5, 4.4], [9.5, 2], [9.2, -1], [11.8, -5], [13, -10], [12, -15],
  [13.5, -20], [15, -25], [17, -29], [18.3, -33.9], [20, -34.8], [25, -34], [27, -33], [30, -31],
  [32.5, -28.5], [33, -25.5], [35, -22], [35.5, -18], [40, -15], [40.5, -11], [41.5, -3], [44, 0],
  [47.5, 4], [51.3, 10.5], [51.4, 11.8], [48, 11.3], [43.5, 11.5], [42.7, 13], [43.3, 14.5],
  [39, 18], [37, 22], [34.5, 28], [32.6, 29.9], [32, 31.2], [30, 31.5], [25, 31.8], [20, 31],
  [15, 32.5], [10, 34], [10, 37], [5, 36.8], [0, 36],
];
const AMERICA_N = [
  [-77.2, 7.5], [-79.5, 9], [-82.5, 9.5], [-84.5, 10.5], [-87.5, 13], [-90.5, 14], [-94, 18.2],
  [-97.5, 21], [-97, 26], [-94, 29.5], [-89, 29.2], [-85.5, 29.8], [-83, 29], [-82, 26.5],
  [-80.5, 25], [-80.1, 26.5], [-81.5, 31], [-78, 33.5], [-75.5, 35.2], [-74, 40.5], [-70, 41.5],
  [-66, 44.5], [-60, 46], [-56, 47], [-53, 47.5], [-55.5, 51.5], [-58, 54], [-61, 56], [-68, 60],
  [-78, 62], [-85, 66], [-90, 68], [-100, 68], [-110, 68], [-120, 69], [-128, 70], [-130, 70],
  [-130, 55], [-128, 50], [-124.5, 48], [-124, 42], [-124.5, 40], [-122, 37], [-119, 34.5],
  [-117.2, 32.8], [-114, 30], [-112, 27], [-110, 24], [-107, 22], [-105, 20], [-102, 18],
  [-98, 16.5], [-95, 16], [-92, 14.5], [-88, 13.5], [-85, 11.5], [-83, 9], [-80, 8.5],
];
const AMERICA_S = [
  [-77.2, 7.5], [-75.5, 10.5], [-71.5, 12.2], [-68, 11.5], [-63, 10.5], [-60, 8.5], [-55, 6],
  [-51, 4], [-50, 0], [-44.5, -2.8], [-38.5, -4], [-35, -5.5], [-34.8, -8], [-37, -11], [-39, -15],
  [-39, -18], [-40.9, -22], [-45, -23.5], [-48.5, -25.5], [-52, -31.5], [-56, -34.5], [-58, -34],
  [-57, -36.5], [-62, -39], [-65, -40.8], [-63, -43], [-65, -45.5], [-67.5, -49], [-68.2, -52.5],
  [-70, -53.8], [-72.5, -53.8], [-74, -50], [-73.5, -46], [-73.5, -42], [-73.5, -37], [-71.5, -32],
  [-70.5, -25], [-70.3, -20], [-72, -17.5], [-75.5, -14.5], [-78, -9], [-81, -6], [-81, -4],
  [-80.5, -2.5], [-80, 0], [-78.5, 1.5], [-77.4, 4],
];
const GREENLAND = [[-45, 60], [-52, 64], [-56, 68], [-50, 72], [-40, 72], [-28, 70], [-22, 66], [-32, 62]];
const BRITAIN = [[-5.2, 50], [-4, 53], [-5.8, 56], [-4, 58.5], [-1.5, 57.5], [0, 54], [1.6, 52.5], [0.7, 50.8]];
const CUBA = [[-84.9, 21.9], [-80, 23.2], [-74.2, 20.2], [-77.5, 19.9], [-84, 21.5]];
const HISPANIOLA = [[-74.4, 19.9], [-71, 19.9], [-68.6, 18.3], [-72, 18], [-74.4, 18.3]];
const MADAGASCAR = [[49.3, -12.2], [50.4, -15.5], [47.5, -24.5], [44.5, -25.3], [43.5, -21], [46.5, -13.9]];
const LANDS = [EURASIA, AFRICA, AMERICA_N, AMERICA_S, GREENLAND, BRITAIN, CUBA, HISPANIOLA, MADAGASCAR];

// ———— 航线 ————
const LISBOA = [-9.1, 38.7];
const ROUTES = {
  dias: [[-9.1, 38.7], [-9.8, 34], [-13, 28], [-17.5, 14.7], [-13, 8], [-5, 5], [2, 6.3], [9, 3],
    [12, -6], [13.5, -20], [17, -29], [18.4, -34.7]],
  columbus: [[-6.9, 37.2], [-15.5, 28], [-28, 27], [-45, 28], [-60, 27], [-70, 26], [-74.1, 24.1],
    [-79.5, 21.8], [-84.5, 22], [-80, 19.5], [-74, 19.2]],
  gama: [[-9.1, 38.7], [-16, 24], [-19, 5], [-12, -12], [4, -20], [14, -28], [18.4, -34.7],
    [24, -34], [33, -27], [38, -17], [40.1, -3.5], [48, -8], [58, -8], [68, 0], [75.8, 11]],
  magellan: [[-6, 36.8], [-15.5, 28], [-30, 20], [-40, 0], [-35, -8], [-45, -23], [-56, -34.5],
    [-62, -39], [-66, -47], [-70.5, -54], [-75, -50], [-80, -40], [-90, -30], [-105, -20],
    [-120, -12], [-135, -7], [-150, -3], [-165, 0], [-180, 2], [-172, 4], [-165, 6], [-158, 9],
    [-150, 11], [-144.8, 13.5], [-135, 11], [-124, 10.3], [127.5, -2.5], [110, -8], [95, -14],
    [80, -22], [60, -32], [40, -36], [18.4, -34.7], [0, -10], [-9.5, 30], [-6.2, 36.5]],
};

const STEPS = [
  { year: '15 世纪末', title: '探寻新航路的动因', route: null,
    text: '欧洲商品经济发展，对东方丝绸、香料需求日增；《马可·波罗行纪》激起对东方的向往；奥斯曼帝国控制传统商路；罗盘与帆船改进、地圆说流行；葡萄牙、西班牙王室支持远航。' },
  { year: '1487-1488', title: '迪亚士 · 抵达好望角', route: 'dias',
    text: '葡萄牙航海家迪亚士率船队沿非洲西海岸南下，首次到达非洲西南端的好望角，为绕非洲前往东方打开了通道。' },
  { year: '1492', title: '哥伦布 · 横渡大西洋', route: 'columbus',
    text: '意大利人哥伦布在西班牙王室支持下西航，到达巴哈马群岛、古巴和伊斯帕尼奥拉岛，他把当地居民称为「印第安人」，此航「发现」了美洲新大陆。' },
  { year: '1497-1499', title: '达·伽马 · 直达印度', route: 'gama',
    text: '葡萄牙人达·伽马绕过好望角进入印度洋，经马林迪横渡印度洋，到达印度西海岸的卡利卡特，开通了欧洲直通印度与阿拉伯海的新航路。' },
  { year: '1519-1522', title: '麦哲伦船队 · 环球航行', route: 'magellan',
    text: '葡萄牙人麦哲伦率西班牙船队经麦哲伦海峡进入「太平洋」，麦哲伦死于菲律宾，余部经香料群岛、印度洋、好望角于 1522 年回到西班牙，完成人类首次环球航行，证明了地圆说。' },
  { year: '影响', title: '世界开始连成一个整体', route: null, final: true,
    text: '欧洲与亚洲、非洲、美洲建立起直接的商业联系，往来日益密切；世界观念逐步确立；欧洲大西洋沿岸工商业经济繁荣起来；随之而来的殖民扩张也给亚非拉人民带来深重灾难。' },
];
const ROUTE_COLOR = { dias: '#4fc3f7', columbus: '#ef7d57', gama: '#66d9a8', magellan: '#feb300' };
const ROUTE_ORDER = ['dias', 'columbus', 'gama', 'magellan'];

// 地名（step 为出现的最早步骤）
const PLACES = [
  { n: '大西洋', p: [-35, 25], sea: true }, { n: '太平洋', p: [-150, -15], sea: true },
  { n: '印度洋', p: [70, -22], sea: true },
  { n: '里斯本', p: [-9.1, 38.7], step: 1, size: 17 }, { n: '塞维利亚', p: [-6, 37.2], step: 2, size: 17 },
  { n: '好望角', p: [18.5, -37.5], step: 1, size: 17 },
  { n: '圣萨尔瓦多岛', p: [-74.1, 24.1], step: 2, size: 16 }, { n: '古巴', p: [-81, 24.3], step: 2, size: 16 },
  { n: '伊斯帕尼奥拉岛', p: [-71.5, 16.5], step: 2, size: 16 },
  { n: '马林迪', p: [40.2, -1], step: 3, size: 16 }, { n: '卡利卡特', p: [75.8, 12.5], step: 3, size: 17 },
  { n: '麦哲伦海峡', p: [-73, -57.5], step: 4, size: 16 }, { n: '菲律宾', p: [124.5, 7.5], step: 4, size: 17 },
  { n: '香料群岛', p: [129, -5.5], step: 4, size: 16 },
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
    line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#feb300'),
    panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'),
  };
}
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function computeBase() {
  const top = 10, bottom = Math.max(120, H - 158);
  base.k = Math.min((W - 16) / ((LON1 - LON0) * KX), (bottom - top) / (LAT1 - LAT0));
  base.cx = W / 2;
  base.cy = (top + bottom) / 2;
}
const uW2 = ((LON1 - LON0) * KX) / 2, uH2 = (LAT1 - LAT0) / 2;
function P(lon, lat) {
  return [
    base.cx + ((lon - LON0) * KX - uW2) * base.k * view.s + view.tx,
    base.cy + ((LAT1 - lat) - uH2) * base.k * view.s + view.ty,
  ];
}
function clampPan() {
  const a = P(LON0, LAT1), b = P(LON1, LAT0);
  view.tx = clamp(view.tx, -Math.max(0, (b[0] - a[0] - W) / 2), Math.max(0, (b[0] - a[0] - W) / 2));
  view.ty = clamp(view.ty, -Math.max(0, (b[1] - a[1] - H) / 2), Math.max(0, (b[1] - a[1] - H) / 2));
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
function hex2rgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
let TH = null;
function labelBG(text, x, y, padX, alpha) {
  const w = ctx.measureText(text).width;
  const c = hex2rgb(TH.bg);
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  ctx.fillRect(x - w / 2 - padX, y - 13 * fontF, w + padX * 2, 26 * fontF);
}

// 航线绘制：画折线前 t 段，末端画船
function route(pts, t, color, width) {
  if (t <= 0) return null;
  const scr = pts.map((p) => P(p[0], p[1]));
  const seg = [];
  let total = 0;
  for (let i = 1; i < scr.length; i++) {
    const l = Math.hypot(scr[i][0] - scr[i - 1][0], scr[i][1] - scr[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let remain = total * t;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * view.s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(scr[0][0], scr[0][1]);
  let end = scr[0], ang = 0;
  for (let i = 1; i < scr.length; i++) {
    const l = seg[i - 1];
    const a = Math.atan2(scr[i][1] - scr[i - 1][1], scr[i][0] - scr[i - 1][0]);
    if (remain >= l) {
      ctx.lineTo(scr[i][0], scr[i][1]);
      end = scr[i];
      ang = a;
      remain -= l;
    } else {
      const f = remain / l;
      const x = scr[i - 1][0] + (scr[i][0] - scr[i - 1][0]) * f;
      const y = scr[i - 1][1] + (scr[i][1] - scr[i - 1][1]) * f;
      ctx.lineTo(x, y);
      end = [x, y];
      ang = a;
      remain = 0;
    }
  }
  ctx.stroke();
  return { end, ang };
}
function ship(end, ang, color) {
  const r = 8 * view.s;
  ctx.beginPath();
  ctx.moveTo(end[0] + Math.cos(ang) * r * 1.4, end[1] + Math.sin(ang) * r * 1.4);
  ctx.lineTo(end[0] + Math.cos(ang + 2.6) * r, end[1] + Math.sin(ang + 2.6) * r);
  ctx.lineTo(end[0] + Math.cos(ang - 2.6) * r, end[1] + Math.sin(ang - 2.6) * r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = TH.bg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function draw() {
  const th = theme();
  TH = th;
  fontF = clamp(Math.min(W, H) / 820, 0.95, 1.15);
  clampPan();
  ctx.clearRect(0, 0, W, H);
  const t = ease(animT);

  // 海洋
  ctx.fillStyle = mix(th.bg, '#4fc3f7', 0.15);
  ctx.fillRect(0, 0, W, H);
  // 陆地
  for (const l of LANDS) {
    poly(l);
    ctx.fillStyle = th.panel2;
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,195,247,0.55)';
    ctx.lineWidth = 1.5 * view.s;
    ctx.stroke();
  }

  // 海域名
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${18 * fontF}px ${FONT}`;
  for (const p of PLACES.filter((x) => x.sea)) {
    const pt = P(p.p[0], p.p[1]);
    ctx.fillStyle = th.muted;
    ctx.fillText(p.n, pt[0], pt[1]);
  }

  // 已完成的航线（保留淡显）+ 当前航线动画
  const cur = STEPS[stepI].route;
  const curIdx = ROUTE_ORDER.indexOf(cur);
  for (const r of ROUTE_ORDER) {
    const idx = ROUTE_ORDER.indexOf(r);
    const isCur = r === cur;
    if (isCur) continue;
    const shown = idx < curIdx ? 1 : 0;
    if (!shown) continue;
    ctx.globalAlpha = 0.4;
    const res = route(ROUTES[r], 1, ROUTE_COLOR[r], 2.6);
    if (res) {
      ctx.beginPath();
      ctx.arc(res.end[0], res.end[1], 3 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = ROUTE_COLOR[r];
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (cur) {
    const res = route(ROUTES[cur], t, ROUTE_COLOR[cur], 3.6);
    if (res) ship(res.end, res.ang, ROUTE_COLOR[cur]);
  }

  // 地名
  for (const pl of PLACES) {
    if (pl.sea) continue;
    const appear = stepI > pl.step ? 1 : stepI === pl.step ? t : 0;
    if (appear <= 0.02) continue;
    ctx.globalAlpha = appear;
    const p = P(pl.p[0], pl.p[1]);
    ctx.font = `${(pl.size || 17) * fontF}px ${FONT}`;
    labelBG(pl.n, p[0], p[1], 6 * fontF, 0.5);
    ctx.fillStyle = th.text;
    ctx.fillText(pl.n, p[0], p[1]);
    ctx.globalAlpha = 1;
  }

  // 末步：大字
  if (STEPS[stepI].final && t > 0.4) {
    ctx.globalAlpha = clamp((t - 0.4) / 0.6, 0, 1);
    const p = P(-150, 8);
    ctx.font = `700 ${24 * fontF}px ${FONT}`;
    labelBG('世界开始连成一个整体', p[0], p[1], 10 * fontF, 0.5);
    ctx.fillStyle = th.gold;
    ctx.fillText('世界开始连成一个整体', p[0], p[1]);
    ctx.globalAlpha = 1;
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
      padding:10px 16px 12px;max-width:min(820px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3)}
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
  stepI = clamp(i, 0, STEPS.length - 1);
  updatePanel();
  cancelAnimationFrame(raf);
  if (instant) {
    animT = 1;
    draw();
  } else {
    animT = 0;
    animStart = performance.now();
    const r = STEPS[stepI].route;
    const dur = 1400 + (r ? ROUTES[r].length * 60 : 0);
    const tick = (now) => {
      animT = clamp((now - animStart) / dur, 0, 1);
      draw();
      if (animT < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
}

init({
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
    api.onResize = resize;
    api.onTheme = draw;

    const pointers = new Map();
    let pinch0 = 0, scale0 = 1, mid0 = null;
    const zoomAt = (mx, my, f) => {
      const s1 = clamp(view.s * f, 1, 6);
      view.tx = mx - base.cx - (mx - base.cx - view.tx) * (s1 / view.s);
      view.ty = my - base.cy - (my - base.cy - view.ty) * (s1 / view.s);
      view.s = s1;
      draw();
    };
    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
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
        if (d > 10 && pinch0 > 10) {
          view.s = clamp(scale0 * d / pinch0, 1, 6);
          const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (mid0) { view.tx += mid[0] - mid0[0]; view.ty += mid[1] - mid0[1]; }
          mid0 = mid;
          draw();
        }
        return;
      }
      const p = pointers.get(e.pointerId);
      view.tx += e.clientX - p[0];
      view.ty += e.clientY - p[1];
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

    const sp = new URLSearchParams(location.search).get('step');
    const sn = parseInt(sp, 10);
    if (!Number.isNaN(sn) && sn >= 0 && sn < STEPS.length && sn !== 0) goStep(sn, true);
  },
});
