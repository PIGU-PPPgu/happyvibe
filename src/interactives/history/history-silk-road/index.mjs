import { init } from '../../_shared/runtime.mjs';

// 丝绸之路：陆上/海上路线分步点亮，途经地与交流物产标注
// 坐标为经纬度近似（教学示意），等距圆柱投影（中纬度余弦校正）
// 图幅：东起华南海岸，西至罗马（大秦）

const LON0 = 5, LON1 = 125, LAT0 = 5, LAT1 = 48;
const KX = Math.cos((((LAT0 + LAT1) / 2) * Math.PI) / 180);
const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;

// ———— 水域（陆地作底，画海） ————
// 南部海洋：红海—阿拉伯海—波斯湾—孟加拉湾—马来半岛两侧
const OCEAN = [
  [32.6, 29.9], [34, 28], [35.5, 25], [37.5, 22], [39, 18], [41, 14], [42.5, 10.5], [43, 6], [46, 5],
  [100, 5], [100.5, 6.5], [98.5, 8.5], [98.2, 10], [97.5, 16], [94, 18], [92, 21.5], [88, 21.6],
  [85, 19.5], [82, 17], [80, 15.8], [80.3, 13.4], [79.8, 10], [77.5, 8.1], [76, 10], [74.8, 15],
  [72.8, 19], [70, 20.8], [67, 24], [64, 25.2], [61, 25.2], [57, 25.7], [56.5, 27], [54, 27.2],
  [50, 29.5], [48.5, 30], [47, 29.8], [51, 27.5], [55, 25], [56.2, 25.5], [59.8, 22.4], [58.5, 20.5],
  [55, 17], [52, 15.5], [48, 14], [45, 12.8], [43.3, 12.6], [39.5, 16], [38, 20], [36.5, 24],
  [34.8, 28], [32.9, 29.7],
];
// 地中海（北岸含意大利、希腊、安纳托利亚半岛示意）
const MED = [
  [5, 36], [5, 43.5], [8, 43.8], [10, 44.2], [11, 43.5], [10.5, 42.8], [11.8, 42.2], [13, 41.3],
  [14.5, 40.5], [15.8, 38.2], [16.2, 38.9], [17.2, 40.3], [18.5, 40.2], [16, 43], [13.5, 45.5],
  [15, 44], [17, 42.8], [19, 41.5], [19.4, 40.3], [20.8, 39], [21.5, 38.2], [23, 36.5], [24, 37.5],
  [23, 38.5], [22.5, 39.5], [24, 40.5], [26, 40.5], [26.2, 39], [27, 37], [26.5, 36.8], [29, 36.2],
  [32, 36.2], [35, 36], [36, 36.6], [35.5, 34], [34.5, 31.5], [32, 31.2], [25, 31.8], [20, 31],
  [15, 31.5], [11, 32], [9.5, 34], [7, 35],
];
const BLACK = [[28.3, 43], [28.8, 41.5], [33, 41.2], [37, 41.2], [41.2, 41.5], [41.5, 43.2], [39.5, 44.5], [36.5, 45.2], [33, 45.5], [30, 45.8], [28.5, 44.5]];
const CASPIAN = [[50, 45.5], [53, 44.5], [54, 42], [53.5, 39.5], [51.5, 37.5], [49, 38.5], [47.5, 41], [48, 43.5]];
const ARAL = [[58.5, 44.8], [61, 45], [61.5, 43.2], [59.5, 42.6]];
// 中国东部海域（渤海、黄海、东海、南海）
const EAST = [
  [124.3, 39.85], [125, 40], [125, 20], [105, 5], [105.7, 18.9], [109.3, 13], [108.8, 15.5], [106, 18.8],
  [105.7, 20], [108, 21.5], [109.2, 21.7], [110.2, 20.3], [110.5, 21.3], [113.5, 22.2], [116.6, 23.3],
  [118.2, 24.6], [119.9, 26.1], [121, 28], [121.8, 30], [121, 30.5], [121.9, 31.4], [120.3, 34.1],
  [119.4, 34.8], [120.3, 36.1], [122.6, 37.3], [121.4, 37.6], [120.7, 37.9], [117.9, 39.1], [119.9, 40.05],
  [122, 40.9], [121.7, 38.9],
];
const ISLANDS = [
  [[79.9, 8.5], [80.5, 9.8], [81.5, 8.5], [81.8, 7], [81.2, 5.9], [80.2, 6.2]], // 斯里兰卡（已程不）
  [[108.7, 19.9], [109.5, 20.1], [110.6, 19.9], [111, 19.2], [110.5, 18.2], [109.3, 18.2], [108.6, 18.9]], // 海南岛
];

// ———— 地理色块 ————
const TARIM = [[75.5, 37], [80, 36.7], [85, 36.5], [89, 36.8], [91, 38], [90, 40.5], [86, 41.3], [81, 41.5], [77, 41.2], [75, 39]];
const PLATEAU = [[78, 35.5], [84, 34], [90, 33.5], [96, 33], [102, 32], [103, 28], [98, 26.5], [92, 26.5], [85, 28], [79, 29.5], [75, 33]];
const PAMIR = [[72.5, 39.5], [75, 40.2], [76, 38.8], [74.5, 37], [72.2, 37.8]];
const TIANS = [[74, 43.5], [80, 43.2], [86, 43.8], [92, 43.5]];
const KUNL = [[76, 36.5], [82, 36.2], [88, 36.6]];

// ———— 匈奴控制区 ————
const HUN1 = [[103.5, 34.8], [107.5, 39], [105, 42.8], [100, 44.8], [90, 45], [85, 44.3], [83.5, 41.5], [85.5, 36.8], [92, 35.3], [99, 34.3]];
const HUN2 = [[100, 41.5], [104, 44], [97, 45.5], [88, 45.3], [84.5, 43.3], [86, 39], [95, 38.5]];

// ———— 路线 ————
const CHANGAN = [108.9, 34.3];
const ZQ1_GO = [[108.9, 34.3], [104.2, 34.9], [103.8, 36.1], [102, 37.5], [99.5, 39.8], [93.5, 42.5], [89, 42.7], [83, 42.2], [77, 41], [71.5, 40.4], [66.9, 39.6], [67, 36.7]];
const ZQ1_BACK = [[67, 36.7], [73, 36.5], [79.9, 37.1], [85, 37.3], [90, 40.4], [95, 40.2], [99.5, 39.8], [103, 36.5], [108.9, 34.3]];
const ZQ2 = [[108.9, 34.3], [104, 35.2], [101, 37.5], [98.5, 39.7], [94.7, 40.1], [91, 41.5], [86, 42.5], [81.2, 43.4]];
const ENVOYS = [
  [[81.2, 43.4], [76, 41.5], [71.5, 40.4]],
  [[81.2, 43.4], [74, 41.8], [66.9, 39.6]],
  [[81.2, 43.4], [70, 40], [67, 36.7]],
  [[81.2, 43.4], [66, 38.5], [58, 34.5], [50, 32.5]],
];
const SILK = [
  [108.9, 34.3], [104.2, 34.9], [103.8, 36.1], [102.6, 37.9], [100.4, 38.9], [98.5, 39.7], [94.7, 40.1],
  [90, 40.4], [79.9, 37.1], [77.2, 38.4], [73.8, 38.6], [71.5, 40.4], [66.9, 39.6], [64, 37], [50, 32.5],
  [47.5, 29.8], [36.2, 36.2], [12.5, 41.9],
];
const NORTH = [[94.7, 40.1], [93.4, 42.8], [89, 42.8], [82.9, 41.7], [75.9, 39.5], [73.8, 38.7]];
const SEA = [
  [109.2, 21.7], [110.2, 20.2], [109.4, 18.5], [108.2, 15.8], [106.5, 10.5], [103.8, 5.8], [101.2, 6.4],
  [98.2, 9.5], [96.8, 13.5], [93, 17.5], [89, 19.3], [85.5, 17.5], [82.5, 15.2], [79.8, 13.4], [80.6, 9],
];

// ———— 地名（step 为出现的最早步骤） ————
const PLACES = [
  { n: '长安', p: [108.9, 34.3], step: 0, star: 'gold', size: 19, dir: 'right' },
  { n: '匈奴', p: [104, 46.4], step: 0, tribe: true },
  { n: '匈奴控制区', p: [93.5, 44.3], step: 0, note: true, until: 1 },
  { n: '被匈奴扣留', p: [99.5, 41.4], step: 1, note: true },
  { n: '大月氏', p: [65.5, 35.3], step: 1, size: 17 },
  { n: '康居', p: [66.9, 40.6], step: 1, size: 17, dir: 'left' },
  { n: '大宛', p: [72.3, 41.7], step: 1, size: 17, dir: 'up' },
  { n: '乌孙', p: [81.2, 44.3], step: 2, size: 17 },
  { n: '武威', p: [102.6, 37], step: 2, size: 16, dir: 'up' },
  { n: '张掖', p: [100.4, 38.1], step: 2, size: 16, dir: 'up' },
  { n: '酒泉', p: [98.5, 38.9], step: 2, size: 16, dir: 'up' },
  { n: '敦煌', p: [94.7, 39.2], step: 2, size: 16, dir: 'up' },
  { n: '西域都护府', p: [84.3, 41.8], step: 3, star: 'purple', size: 18, dir: 'left' },
  { n: '前60年设', p: [84.3, 43.5], step: 3, note: true },
  { n: '玉门关', p: [93.7, 40.9], step: 4, size: 16, dir: 'left' },
  { n: '楼兰', p: [90, 40.4], step: 4, size: 17, dir: 'up' },
  { n: '于阗', p: [79.9, 37.1], step: 4, size: 17, dir: 'down' },
  { n: '疏勒', p: [75.9, 39.5], step: 4, size: 17 },
  { n: '葱岭', p: [73.8, 38.6], step: 4, size: 17, dir: 'down' },
  { n: '安息', p: [50, 32.5], step: 4, size: 18 },
  { n: '条支', p: [47.5, 29.8], step: 4, size: 17 },
  { n: '大秦', p: [12.5, 41.9], step: 4, size: 19, dir: 'up' },
  { n: '罗马帝国', p: [12.5, 44.8], step: 4, note: true },
  { n: '徐闻', p: [110.4, 20.7], step: 5, size: 17, dir: 'left' },
  { n: '合浦', p: [109.2, 21.7], step: 5, size: 17, dir: 'left' },
  { n: '黄支', p: [79.8, 13.4], step: 5, size: 17 },
  { n: '已程不', p: [81.8, 7.2], step: 5, size: 17 },
];
const GOODS = [
  { n: '西去：丝绸 漆器 凿井技术', p: [88, 34.2], step: 4 },
  { n: '东来：葡萄 苜蓿 核桃 石榴 良马 佛教', p: [88, 31.4], step: 4 },
  { n: '汉：丝绸 黄金', p: [88.5, 10.5], step: 5 },
  { n: '唐宋：瓷器', p: [95, 8.5], step: 5 },
];
// 海域名（帮助读图，常显）
const SEAS = [
  { n: '地中海', p: [19, 34.3] }, { n: '黑海', p: [35, 43.3] }, { n: '里海', p: [51, 42] },
  { n: '咸海', p: [60, 44] }, { n: '波斯湾', p: [51.3, 26.6] }, { n: '阿拉伯海', p: [62, 13] },
  { n: '孟加拉湾', p: [92, 20.8] }, { n: '南海', p: [112, 16] },
];

const STEPS = [
  { year: '西汉初年', title: '匈奴阻路',
    text: '匈奴控制河西走廊与西域，中西道路被阻隔。汉武帝欲联合西迁的大月氏夹击匈奴，招募出使西域的使者。' },
  { year: '前138年', title: '张骞第一次出使',
    text: '张骞率百余人出长安，途中被匈奴扣留十余年，抵大月氏后东归，前126年返回长安。此行了解到西域各国实况。' },
  { year: '前119年', title: '张骞第二次出使',
    text: '前121年汉取河西，先后设武威、张掖、酒泉、敦煌四郡。张骞再使西域联络乌孙，副使分赴大宛、康居、大月氏、安息，诸国与汉往来渐密。' },
  { year: '前60年', title: '西域都护府设立',
    text: '西汉设西域都护，总管西域事务，标志着今新疆地区正式归属中央政权管辖，为丝路畅通提供保障。' },
  { year: '汉代', title: '陆上丝路贯通',
    text: '商队自长安经河西走廊、西域、葱岭通往安息，直达大秦。丝绸、漆器、凿井技术西去，葡萄、苜蓿、核桃、石榴、良种马和佛教东来。' },
  { year: '汉武帝时期', title: '海上丝绸之路',
    text: '从徐闻、合浦出海，沿海岸经中南半岛、绕马来半岛、渡孟加拉湾，最远抵达印度半岛南端和斯里兰卡。唐宋以后瓷器成为大宗商品。' },
];

// ———— 教研契约：教学环节（点击切到资源既有步骤的预设状态）/ 教师引导语 / 知识小结 ————
const TEACH = [
  { name: '引入·阻路', step: 0,
    guide: '请到图上指认长安的位置，再说出匈奴控制了哪一段道路。想一想：汉武帝为什么要急着派人往西走？' ,
    note: '西汉初年，匈奴控制河套与河西走廊，西北道路被隔断，汉王朝被动和亲数十年。汉武帝即位时国力已足，听说大月氏与匈奴有世仇，决意联合它夹击匈奴——出使西域首先是军事外交行动，经济文化交流是后来长出来的果实。看地图先看「路通不通」，是理解这一课的起点。' },
  { name: '探究·凿空', step: 1,
    guide: '金色是去程、紫色是归程。请沿线复述张骞第一次出使：途中被扣在哪里、最远到了哪国？联合大月氏没有成功，为什么这一趟仍被称为凿空？' ,
    note: '公元前 138 年张骞首次出使，途中被匈奴扣留十余年，最远抵达大月氏、大夏。原定的联盟落空，但他把西域各国的地理、物产、兵力带回中原，汉人第一次对西方有了系统了解——像在封闭的墙上凿开一个孔，史称「凿空」。评价一次出使要看它打开了什么，不必只盯原定目标。' },
  { name: '探究·贯通', step: 4,
    guide: '沿金色主线，从长安一站一站说到大秦：河西走廊、玉门关、葱岭、安息各在哪里？再对照两条标签，说一说西去、东来各有什么物产。' ,
    note: '陆上丝路主线：长安—河西走廊—玉门关/阳关—西域（今新疆）—葱岭—安息（波斯），再转运大秦（罗马）。西去的是丝绸、漆器、凿井技术；东来的是葡萄、苜蓿、核桃、石榴、良种马与佛教。物种与技术的双向流动才是「大动脉」的含义——路不是为丝绸一条商品开的。' },
  { name: '归纳·海陆并举', step: 5,
    guide: '再看蓝色航线：船从徐闻、合浦出海，最远到了哪里？对比陆海两路的起点与走向，说一说西域都护府为丝路畅通提供了什么保障。' ,
    note: '公元前 60 年西汉设西域都护，今新疆地区正式归属中央政权管辖，驿站烽燧沿线布置，商旅往来有了军事与行政保障——制度先行，商路才可持续。海上丝路从徐闻、合浦出海，绕行中南半岛，最远抵达印度半岛南端和斯里兰卡。陆海并举，中国从此同时向大陆与海洋两个方向打开门户。' },
];
const TEACH_SUMMARY = '张骞于公元前138年、前119年两次出使西域，开辟了沟通中西的道路，史称凿空。公元前60年，西汉设西域都护，今新疆地区正式归属中央政权管辖。陆上丝绸之路从长安出发，经河西走廊、西域、葱岭到安息，再转运到大秦；海上丝绸之路从徐闻、合浦出海，最远抵达印度半岛南端和斯里兰卡。丝绸、漆器、凿井技术西传，葡萄、苜蓿、核桃、石榴、良种马和佛教等传入中原，丝绸之路成为古代东西方经济文化交流的大动脉。';

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
    purple: v('--purple', '#A66BA6'), panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'),
  };
}
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function computeBase() {
  // 顶部让位给教学环节条，底部让位给步骤演示面板
  const top = 112, bottom = Math.max(120, H - 158);
  const uW = (LON1 - LON0) * KX, uH = LAT1 - LAT0;
  base.k = Math.min((W - 16) / uW, (bottom - top) / uH);
  base.cx = W / 2;
  base.cy = (top + bottom) / 2;
}
const uW2 = ((LON1 - LON0) * KX) / 2, uH2 = (LAT1 - LAT0) / 2;
function P(lon, lat) {
  const ux = (lon - LON0) * KX, uy = LAT1 - lat;
  return [
    base.cx + (ux - uW2) * base.k * view.s + view.tx,
    base.cy + (uy - uH2) * base.k * view.s + view.ty,
  ];
}
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
let TH = null;
function labelBG(text, x, y, padX, alpha) {
  const w = ctx.measureText(text).width;
  const rgb = hex2rgb(TH ? TH.bg : '#150e22');
  ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  ctx.fillRect(x - w / 2 - padX, y - 13 * fontF, w + padX * 2, 26 * fontF);
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
function zigzag(pts, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8 * view.s;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 1; i < pts.length; i++) {
    const a = P(pts[i - 1][0], pts[i - 1][1]), b = P(pts[i][0], pts[i][1]);
    const n = 7, dx = (b[0] - a[0]) / n, dy = (b[1] - a[1]) / n;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 5 * view.s, ny = (dx / len) * 5 * view.s;
    for (let j = 0; j < n; j++) {
      const x0 = a[0] + dx * j, y0 = a[1] + dy * j;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + dx / 2 + nx, y0 + dy / 2 + ny);
      ctx.lineTo(x0 + dx, y0 + dy);
    }
  }
  ctx.stroke();
}
// 路线生长绘制：画折线的前 t 段
function route(pts, t, color, width, dash) {
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
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  ctx.moveTo(scr[0][0], scr[0][1]);
  let end = scr[0];
  for (let i = 1; i < scr.length; i++) {
    const l = seg[i - 1];
    if (remain >= l) {
      ctx.lineTo(scr[i][0], scr[i][1]);
      end = scr[i];
      remain -= l;
    } else {
      const f = remain / l;
      const x = scr[i - 1][0] + (scr[i][0] - scr[i - 1][0]) * f;
      const y = scr[i - 1][1] + (scr[i][1] - scr[i - 1][1]) * f;
      ctx.lineTo(x, y);
      end = [x, y];
      remain = 0;
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
  return end;
}

function draw() {
  const th = theme();
  TH = th;
  fontF = clamp(Math.min(W, H) / 820, 0.95, 1.15);
  clampPan();
  ctx.clearRect(0, 0, W, H);
  const t = ease(animT);

  // 陆地底
  ctx.fillStyle = th.panel2;
  ctx.fillRect(0, 0, W, H);

  // 地理色块
  poly(PLATEAU);
  ctx.fillStyle = th.panel;
  ctx.fill();
  poly(PAMIR);
  ctx.fill();
  poly(TARIM);
  ctx.fillStyle = 'rgba(224,169,109,0.18)';
  ctx.fill();

  // 水域（岛屿最后挖回陆地色）
  for (const w of [OCEAN, MED, EAST, BLACK, CASPIAN, ARAL]) {
    poly(w);
    ctx.fillStyle = mix2(th.bg, '#6FA8C9', 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,195,247,0.6)';
    ctx.lineWidth = 1.6 * view.s;
    ctx.stroke();
  }
  for (const isl of ISLANDS) {
    poly(isl);
    ctx.fillStyle = th.panel2;
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,195,247,0.6)';
    ctx.lineWidth = 1.6 * view.s;
    ctx.stroke();
  }

  // 海域名
  ctx.font = `${16 * fontF}px ${FONT}`;
  for (const s of SEAS) {
    const p = P(s.p[0], s.p[1]);
    labelBG(s.n, p[0], p[1], 6 * fontF, 0.4);
    ctx.fillStyle = th.muted;
    ctx.fillText(s.n, p[0], p[1]);
  }

  // 山脉
  zigzag(TIANS, th.muted);
  zigzag(KUNL, th.muted);

  // 匈奴控制区：步0-1 覆盖河西与西域，步2 起退回西域北部，步4 起消失
  const aH1 = stepI <= 1 ? 1 : stepI === 2 ? 1 - Math.min(1, t * 1.6) : 0;
  const aH2 = stepI >= 4 ? 1 - t : stepI >= 2 ? t : 0;
  if (aH1 > 0.02) {
    poly(HUN1);
    ctx.fillStyle = `rgba(226,106,106,${0.12 * aH1})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(226,106,106,${0.5 * aH1})`;
    ctx.lineWidth = 1.4 * view.s;
    ctx.setLineDash([6 * view.s, 5 * view.s]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (aH2 > 0.02) {
    poly(HUN2);
    ctx.fillStyle = `rgba(226,106,106,${0.12 * aH2})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(226,106,106,${0.5 * aH2})`;
    ctx.lineWidth = 1.4 * view.s;
    ctx.setLineDash([6 * view.s, 5 * view.s]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 步1：张骞第一次出使（去程金、回程紫）
  if (stepI >= 1) {
    const p1 = stepI === 1 ? clamp(t / 0.72, 0, 1) : 1;
    const p2 = stepI === 1 ? clamp((t - 0.72) / 0.28, 0, 1) : 1;
    const end1 = route(ZQ1_GO, p1, th.gold, 3.4);
    const end2 = route(ZQ1_BACK, p2, '#9D8FD1', 2.6);
    if (end1 && p1 < 1) {
      ctx.beginPath();
      ctx.arc(end1[0], end1[1], 4.5 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = th.gold;
      ctx.fill();
    }
    if (end2 && p2 > 0 && p2 < 1) {
      ctx.beginPath();
      ctx.arc(end2[0], end2[1], 4.5 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = '#9D8FD1';
      ctx.fill();
    }
  }
  // 步2：第二次出使 + 副使虚线
  if (stepI >= 2) {
    const p = stepI === 2 ? t : 1;
    const end = route(ZQ2, p, th.gold, 3.4);
    if (end && p < 1) {
      ctx.beginPath();
      ctx.arc(end[0], end[1], 4.5 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = th.gold;
      ctx.fill();
    }
    if (t > 0.5) {
      ctx.globalAlpha = clamp((t - 0.5) / 0.5, 0, 1) * (stepI === 2 ? 1 : 1);
      for (const e of ENVOYS) route(e, 1, '#9D8FD1', 2, [7 * view.s, 6 * view.s]);
      ctx.globalAlpha = 1;
    }
  }
  // 步4：陆上丝路主线 + 北道
  if (stepI >= 4) {
    const p = stepI === 4 ? t : 1;
    const end = route(SILK, p, th.gold, 4);
    if (t > 0.55) {
      ctx.globalAlpha = clamp((t - 0.55) / 0.45, 0, 1);
      route(NORTH, 1, th.gold, 2.2, [8 * view.s, 7 * view.s]);
      ctx.globalAlpha = 1;
    }
    if (end && p < 1) {
      ctx.beginPath();
      ctx.arc(end[0], end[1], 5 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = th.gold;
      ctx.fill();
    }
  }
  // 步5：海上丝路
  if (stepI >= 5) {
    const p = stepI === 5 ? t : 1;
    const end = route(SEA, p, '#6FA8C9', 3.4);
    if (end && p < 1) {
      ctx.beginPath();
      ctx.arc(end[0], end[1], 4.5 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = '#6FA8C9';
      ctx.fill();
    }
  }

  // 地名
  for (const pl of PLACES) {
    if (pl.until !== undefined && stepI > pl.until) continue;
    const appear = stepI > pl.step ? 1 : stepI === pl.step ? t : 0;
    if (appear <= 0.02) continue;
    ctx.globalAlpha = appear;
    const p = P(pl.p[0], pl.p[1]);
    const size = (pl.size || 17) * fontF;
    ctx.font = `${pl.star ? 700 : 500} ${size}px ${FONT}`;
    if (pl.star) {
      star(p[0], p[1], 8 * view.s, pl.star === 'gold' ? th.gold : th.purple);
    } else if (pl.tribe) {
      ctx.fillStyle = 'rgba(226,106,106,0.9)';
      ctx.fillRect(p[0] - 3 * view.s, p[1] - 3 * view.s, 6 * view.s, 6 * view.s);
    } else if (!pl.note) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.8 * view.s, 0, Math.PI * 2);
      ctx.fillStyle = th.text;
      ctx.fill();
    }
    const dir = pl.dir || 'right';
    let tx = p[0], align;
    if (dir === 'left') { ctx.textAlign = 'right'; tx = p[0] - 8 * view.s; align = -1; }
    else if (dir === 'down') { ctx.textAlign = 'center'; tx = p[0]; }
    else if (dir === 'up') { ctx.textAlign = 'center'; tx = p[0]; }
    else { ctx.textAlign = 'left'; tx = p[0] + 8 * view.s; }
    const ty = dir === 'down' ? p[1] + 13 * fontF : dir === 'up' ? p[1] - 13 * fontF : p[1];
    const w = ctx.measureText(pl.n).width;
    const cx = dir === 'left' ? tx - w / 2 : dir === 'right' ? tx + w / 2 : tx;
    labelBG(pl.n, cx, ty, 5 * fontF, pl.note || pl.tribe ? 0.5 : 0.42);
    ctx.fillStyle = pl.note ? th.muted : th.text;
    ctx.fillText(pl.n, dir === 'left' || dir === 'right' ? tx : cx, ty);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
  }

  // 物产标签
  for (const g of GOODS) {
    const appear = stepI > g.step ? 1 : stepI === g.step ? clamp((t - 0.5) / 0.5, 0, 1) : 0;
    if (appear <= 0.02) continue;
    ctx.globalAlpha = appear;
    const p = P(g.p[0], g.p[1]);
    ctx.font = `700 ${17 * fontF}px ${FONT}`;
    labelBG(g.n, p[0], p[1], 8 * fontF, 0.55);
    ctx.fillStyle = th.gold;
    ctx.fillText(g.n, p[0], p[1]);
    ctx.globalAlpha = 1;
  }

  // 大字标注
  const bigs = [
    { n: '丝绸之路', p: [96.5, 44.8], step: 4 },
    { n: '海上丝绸之路', p: [88, 14.6], step: 5 },
  ];
  for (const b of bigs) {
    const appear = stepI > b.step ? 1 : stepI === b.step ? clamp((t - 0.35) / 0.65, 0, 1) : 0;
    if (appear <= 0.02) continue;
    ctx.globalAlpha = appear;
    const p = P(b.p[0], b.p[1]);
    ctx.font = `700 ${26 * fontF}px ${FONT}`;
    labelBG(b.n, p[0], p[1], 10 * fontF, 0.5);
    ctx.fillStyle = b.step === 4 ? th.gold : '#6FA8C9';
    ctx.fillText(b.n, p[0], p[1]);
    ctx.globalAlpha = 1;
  }

  // 图幅边框
  const a = P(LON0, LAT1), b = P(LON1, LAT0);
  ctx.strokeStyle = th.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
}

function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix2(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
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

// ———— 教学面板：定位行进顶栏，环节条压顶栏下方（地图绘图区已下移让位），小结浮层按钮唤出 ————
let teachBtns = [], teachGuides = [];
function syncTeachActive() {
  const i = TEACH.findIndex((t) => t.step === stepI);
  teachBtns.forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
    el.style.borderColor = k === i ? 'var(--gold)' : '';
  });
  teachGuides.forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}
function setTeachStep(i, instant) {
  goStep(TEACH[i].step, instant);
  syncTeachActive();
}
// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '历史·初中七年级｜统编版七年级上册第三单元第14课《丝绸之路的开通与经营西域》',
  steps: TEACH.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setTeachStep(i) })),
  summary: TEACH_SUMMARY,
  quiz: [
    {
      q: '汉武帝派张骞第一次出使西域的直接目的是？',
      opts: ['经营西域物产贸易', '联络大月氏夹击匈奴', '求取佛教经典', '开辟海上航线'],
      a: 1,
      why: '首次出使是军事外交行动：联合与大月氏有世仇的势力夹击匈奴。贸易与文化往来是使团打通道路之后生长出来的结果。',
    },
    {
      q: '张骞第一次出使被称为「凿空」，理由是？',
      opts: ['打通了入海航道', '首次系统带回西域信息，打开中西交流的通道', '凿通了灵渠', '平定了匈奴'],
      a: 1,
      why: '联盟虽未成，但汉人第一次对西域有了系统了解，像在封闭之墙上凿开一个孔——评价看它打开了什么，不盯原定目标。',
    },
    {
      q: '陆上丝绸之路的正确走向是？',
      opts: ['长安—河西走廊—西域—葱岭—安息—大秦', '长安—灵渠—南海—印度', '洛阳—辽东—朝鲜', '成都—吐蕃—天竺'],
      a: 0,
      why: '主线自长安经河西走廊出玉门关，穿西域、越葱岭到安息再转运大秦。记住「河西—西域—葱岭」三段就不会乱。',
    },
    {
      q: '下列哪组是经丝绸之路传入中原的？',
      opts: ['丝绸、漆器', '凿井技术', '葡萄、苜蓿、核桃', '瓷器'],
      a: 2,
      why: '西去的是丝绸、漆器、凿井技术，东来的才是葡萄、苜蓿、核桃、石榴、良种马与佛教。方向记反是最常见的错误。',
    },
    {
      q: '西域都护府设立（公元前 60 年）最重要的意义是？',
      opts: ['垄断丝路贸易', '今新疆地区正式归属中央政权管辖，保障丝路畅通', '战胜大月氏', '修筑长城西段'],
      a: 1,
      why: '都护府把西域纳入行政管辖，驿站烽燧保障商旅，是制度层面的经营；商路的可持续靠政权落地，不靠一时战胜。',
    },
  ],
};



// 自测：环节按钮/引导语/小结齐备，且每个环节点击后真的切到预设步骤、引导语单条显示
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  const nBtn = document.querySelectorAll('[data-hv-step]').length;
  push('环节按钮数量', nBtn === TEACH.length, `data-hv-step=${nBtn}`);
  const sumEl = document.querySelector('[data-hv-summary]');
  const sumLen = sumEl ? sumEl.textContent.length : 0;
  push('小结字数', sumLen >= 30, `summary=${sumLen}字`);
  const bad = [];
  TEACH.forEach((t, i) => {
    setTeachStep(i, true);
    if (stepI !== t.step || animT !== 1) bad.push(`环节${i}:${stepI}≠${t.step}`);
  });
  push('环节切换到预设步骤', bad.length === 0,
    bad.join(' ') || TEACH.map((t) => `${t.name}→第${t.step + 1}步`).join('、'));
  setTeachStep(0, true);
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
    const tick = (now) => {
      animT = clamp((now - animStart) / 1600, 0, 1);
      draw();
      if (animT < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');
    buildPanel(stage);
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

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
      const s1 = clamp(view.s * f, 1, 5);
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

    const sp = new URLSearchParams(location.search).get('step');
    const sn = parseInt(sp, 10);
    if (!Number.isNaN(sn) && sn >= 0 && sn < STEPS.length && sn !== 0) goStep(sn, true);
    syncTeachActive();
  },
});
