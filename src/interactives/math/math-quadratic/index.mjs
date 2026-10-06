import { init } from '../../_shared/runtime.mjs';

// 二次函数的图像与系数：a、b、c 滑杆联动开口、对称轴、顶点、与 y 轴交点、判别式；面板给顶点式配方推导
// 曲线颜色读 CSS 变量：金 var(--gold) 抛物线，紫 var(--purple) 对称轴，蓝为站内色板常量
const BLUE = '#4FC3F7';

let cv, ctx, stageEl, W = 0, H = 0;
const view = { cx: 0, cy: 0, span: 8 };
const st = { a: 1, b: -2, c: -3 };

function css(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function palette() {
  return {
    bg: css('--bg', '#150e22'), text: css('--text', '#f2ecf8'), muted: css('--muted', '#a99cc0'),
    line: css('--line', 'rgba(180,130,210,.16)'), panel: css('--panel', '#1e1433'),
    gold: css('--gold', '#feb300'), purple: css('--purple', '#a63d97'),
  };
}

const narrow = () => W < 760;
const pcx = () => (narrow() ? W / 2 : (W - 320) / 2);
const pcy = () => (narrow() ? (H - 400) / 2 : H / 2);
const unit = () => W / (2 * view.span);

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function fracStr(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}
// h = -b/(2a)，整数系数下用分数精确显示
const hOf = () => fracStr(-st.b, 2 * st.a);
// k = (4ac - b²)/(4a)
const kOf = () => fracStr(4 * st.a * st.c - st.b * st.b, 4 * st.a);
const kNum = () => (4 * st.a * st.c - st.b * st.b) / (4 * st.a);
const disc = () => st.b * st.b - 4 * st.a * st.c;

const S = (n) => (n < 0 ? ` - ${-n}` : ` + ${n}`);

function generalStr() {
  const { a, b, c } = st;
  if (a === 0) {
    if (b === 0) return c === 0 ? 'y = 0' : `y = ${c}`;
    const bs = b === 1 ? '' : b === -1 ? '-' : `${b}`;
    return `y = ${bs}x${c === 0 ? '' : S(c)}`;
  }
  const as = a === 1 ? '' : a === -1 ? '-' : `${a}`;
  const bs = b === 0 ? '' : b > 0 ? ` + ${b === 1 ? '' : b}x` : ` - ${b === -1 ? '' : -b}x`;
  return `y = ${as}x²${bs}${c === 0 ? '' : S(c)}`;
}

// (x - h) 中 h 的显示：b=0 → x；a、b 同号 → h<0 → x + |h|；异号 → x - |h|
function squareTerm() {
  const { a, b } = st;
  if (b === 0) return 'x';
  const hAbs = fracStr(Math.abs(b), Math.abs(2 * a));
  return a * b < 0 ? `x - ${hAbs}` : `x + ${hAbs}`;
}

function vertexStr() {
  const { a, b } = st;
  const as = a === 1 ? '' : a === -1 ? '-' : `${a}`;
  const kS = kOf();
  const ks = kS === '0' ? '' : kS.startsWith('-') ? ` - ${kS.slice(1)}` : ` + ${kS}`;
  return `y = ${as}(${squareTerm()})²${ks}`;
}

function niceStep(v) {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const s of [1, 2, 5, 10]) if (s * pow >= v) return s * pow;
  return 10 * pow;
}

// ---------- 面板 ----------
function renderPanel() {
  const { a, b, c } = st;
  const gen = document.getElementById('gen');
  const vtx = document.getElementById('vtx');
  const derive = document.getElementById('derive');
  const props = document.getElementById('props');
  gen.textContent = generalStr();
  const rows = [];
  const add = (k2, v) => rows.push(`<div class="row"><span class="k">${k2}</span><span class="v">${v}</span></div>`);

  if (a === 0) {
    vtx.textContent = '';
    derive.innerHTML = '';
    add('说明', 'a = 0，不是二次函数，图像退化为直线');
    if (b === 0) add('图像', `y = ${c}，水平线`);
    else add('图像', `一次函数 y = ${generalStr().slice(4)}`);
  } else {
    vtx.textContent = vertexStr();
    // 配方三步：一般式 → 提 a → 完全平方
    const baAbs = fracStr(Math.abs(b), Math.abs(a));
    const baCoef = baAbs === '1' ? '' : Math.abs(b) % Math.abs(a) === 0 ? baAbs : `(${baAbs})`;
    const inner = b === 0 ? 'x²' : `${b > 0 ? 'x² + ' : 'x² - '}${baCoef}x`;
    const as = a === 1 ? '' : a === -1 ? '-' : `${a}`;
    const kS = kOf();
    const ks = kS === '0' ? '' : kS.startsWith('-') ? ` - ${kS.slice(1)}` : ` + ${kS}`;
    derive.innerHTML = b === 0
      ? '<div>b = 0，对称轴就是 y 轴，顶点在 y 轴上</div>'
      : [
        `<div>${generalStr().slice(4)}</div>`,
        `<div>= ${as}(${inner})${c === 0 ? '' : S(c)}</div>`,
        `<div>= ${as}(${squareTerm()})²${ks}</div>`,
      ].join('');
    add('开口方向', a > 0 ? 'a > 0，开口向上' : 'a < 0，开口向下');
    add('开口大小', `|a| = ${Math.abs(a)}，|a| 越大开口越小`);
    add('对称轴', `x = -b/(2a) = ${hOf()}`);
    add('顶点', `(${hOf()}, ${kOf()})`);
    add('最值', `x = ${hOf()} 时，${a > 0 ? `最小值 ${kOf()}` : `最大值 ${kOf()}`}`);
    add('与 y 轴交点', `(0, ${c})`);
    const d = disc();
    const rootTxt = d > 0 ? (Number.isInteger(Math.sqrt(d)) ? `两个：(${fracStr(-st.b - Math.sqrt(d), 2 * a)}, 0)、(${fracStr(-st.b + Math.sqrt(d), 2 * a)}, 0)` : '两个交点') : d === 0 ? `一个：(${hOf()}, 0)` : '没有';
    add('与 x 轴交点', `Δ = ${d} ${d > 0 ? '>' : d === 0 ? '=' : '<'} 0，${rootTxt}`);
  }
  props.innerHTML = rows.join('');
}

// ---------- 绘制 ----------
function draw() {
  const p = palette();
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const u = unit(), ox = pcx(), oy = pcy();
  const px = (x) => ox + (x - view.cx) * u;
  const py = (y) => oy - (y - view.cy) * u;
  const wx = (sx) => view.cx + (sx - ox) / u;
  const wy = (sy) => view.cy - (sy - oy) / u;

  const step = niceStep(view.span / 5);
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = Math.ceil(wx(0) / step) * step; px(gx) <= W; gx += step) { const s = px(gx); ctx.moveTo(s, 0); ctx.lineTo(s, H); }
  for (let gy = Math.ceil(wy(H) / step) * step; py(gy) >= 0; gy += step) { const s = py(gy); ctx.moveTo(0, s); ctx.lineTo(W, s); }
  ctx.stroke();

  ctx.strokeStyle = p.text;
  ctx.fillStyle = p.text;
  ctx.lineWidth = 2;
  const ax = px(0), ay = py(0);
  ctx.beginPath();
  ctx.moveTo(0, ay); ctx.lineTo(W, ay);
  ctx.moveTo(ax, 0); ctx.lineTo(ax, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 14, ay); ctx.lineTo(W - 2, ay); ctx.lineTo(W - 14, ay - 5); ctx.lineTo(W - 14, ay + 5); ctx.closePath();
  ctx.moveTo(ax, 12); ctx.lineTo(ax, 2); ctx.lineTo(ax - 5, 13); ctx.lineTo(ax + 5, 13); ctx.closePath();
  ctx.fill();
  ctx.font = 'italic bold 19px serif';
  ctx.textAlign = 'left';
  ctx.fillText('x', W - 20, ay + 22);
  ctx.fillText('y', ax + 10, 16);

  ctx.font = '16px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  ctx.fillStyle = p.muted;
  ctx.textAlign = 'center';
  for (let gx = Math.ceil(wx(0) / step) * step; px(gx) <= W; gx += step) {
    if (Math.abs(gx) < 1e-9) continue;
    ctx.fillText(`${+gx.toFixed(6)}`, px(gx), Math.min(Math.max(ay + 20, 20), H - 8));
  }
  ctx.textAlign = 'right';
  for (let gy = Math.ceil(wy(H) / step) * step; py(gy) >= 0; gy += step) {
    if (Math.abs(gy) < 1e-9) continue;
    ctx.fillText(`${+gy.toFixed(6)}`, Math.min(Math.max(ax - 10, 34), W - 8), py(gy) + 5);
  }

  const { a, b, c } = st;
  const f = (x) => a * x * x + b * x + c;
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let s = 0; s <= W; s += 2) {
    const t = py(f(wx(s)));
    if (s === 0) ctx.moveTo(s, t); else ctx.lineTo(s, t);
  }
  ctx.stroke();

  const mark = (x, y, txt) => {
    const sx0 = px(x), sy0 = py(y);
    if (sx0 < 10 || sx0 > W - 10 || sy0 < 10 || sy0 > H - 10) return;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(sx0, sy0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 17px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = sx0 < W - 120 ? 'left' : 'right';
    ctx.fillText(txt, sx0 + (sx0 < W - 120 ? 12 : -12), sy0 - 12);
  };

  if (a !== 0) {
    const h = -b / (2 * a);
    const k = kNum();
    // 对称轴虚线与标注
    ctx.strokeStyle = p.purple;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(px(h), 0);
    ctx.lineTo(px(h), H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = p.purple;
    ctx.font = 'bold 17px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = px(h) < W - 80 ? 'left' : 'right';
    ctx.fillText(`x = ${hOf()}`, px(h) + (px(h) < W - 80 ? 8 : -8), 30);
    mark(h, k, `顶点 (${hOf()}, ${kOf()})`);
    if (b !== 0) mark(0, c, `(0, ${c})`);
    // Δ 为完全平方数时标出两个根
    const d = disc();
    if (d > 0 && Number.isInteger(Math.sqrt(d))) {
      const r = Math.sqrt(d);
      mark((-b - r) / (2 * a), 0, `(${fracStr(-b - r, 2 * a)}, 0)`);
      mark((-b + r) / (2 * a), 0, `(${fracStr(-b + r, 2 * a)}, 0)`);
    }
  }

  const fs = generalStr();
  ctx.font = 'bold 23px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  const tw = ctx.measureText(fs).width;
  ctx.fillStyle = p.panel;
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(16, 14, tw + 30, 42, 10) : ctx.rect(16, 14, tw + 30, 42);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = p.gold;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fs, 31, 36);
  ctx.textBaseline = 'alphabetic';
}

// ---------- UI ----------
const STYLE = `
#stage.pad{top:106px}
@media (max-width:1120px){#hint{display:none}}
#panel{position:fixed;top:114px;right:14px;z-index:15;width:300px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.slider-row{display:flex;align-items:center;gap:10px;font-size:18px}
.slider-row .sym{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;width:1.1em}
.slider-row input{flex:1;accent-color:var(--gold)}
.slider-row b{min-width:2em;text-align:center;font-size:19px}
#gen{font-size:22px;font-weight:700;text-align:center;padding:7px 6px;background:var(--panel2);border-radius:8px;color:var(--gold);font-family:Georgia,'Times New Roman',serif}
#vtx{font-size:19px;font-weight:700;text-align:center;color:var(--purple);font-family:Georgia,'Times New Roman',serif;min-height:1.2em}
#derive{font-size:16px;line-height:1.7;color:var(--text);background:var(--panel2);border-radius:8px;padding:8px 10px;font-family:Georgia,'Times New Roman',serif}
#derive div{white-space:nowrap;overflow-x:auto}
#props{display:flex;flex-direction:column;gap:7px;font-size:16.5px;line-height:1.5}
#props .row{display:flex;gap:8px}
#props .k{color:var(--muted);flex:none;width:6em}
#props .v{font-weight:600}
#reset{align-self:stretch}
@media (max-width:760px){#panel{left:10px;right:10px;top:auto;bottom:10px;width:auto;padding:10px 12px;gap:8px}#props{font-size:15.5px}#derive{display:none}}
`;

function buildUI(stage) {
  const s = document.createElement('style');
  s.textContent = STYLE;
  stage.appendChild(s);

  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = [
    '<label class="slider-row"><span class="sym">a</span><input id="sa" type="range" min="-3" max="3" step="1" value="1" aria-label="a 值"><b id="va">1</b></label>',
    '<label class="slider-row"><span class="sym">b</span><input id="sb" type="range" min="-6" max="6" step="1" value="-2" aria-label="b 值"><b id="vb">-2</b></label>',
    '<label class="slider-row"><span class="sym">c</span><input id="sc" type="range" min="-6" max="6" step="1" value="-3" aria-label="c 值"><b id="vc">-3</b></label>',
    '<div id="gen"></div>',
    '<div id="vtx"></div>',
    '<div id="derive"></div>',
    '<div id="props"></div>',
    '<button class="btn" id="reset" type="button" aria-label="复位视图">复位</button>',
  ].join('');
  stage.appendChild(panel);

  for (const [id, key, vid] of [['#sa', 'a', '#va'], ['#sb', 'b', '#vb'], ['#sc', 'c', '#vc']]) {
    const el = panel.querySelector(id), out = panel.querySelector(vid);
    el.addEventListener('input', () => {
      st[key] = +el.value;
      out.textContent = el.value;
      renderPanel();
      draw();
    });
  }
  panel.querySelector('#reset').addEventListener('click', () => {
    view.cx = 0; view.cy = 0; view.span = 8;
    draw();
  });
}

// 教研员契约：定位行 + 教学环节（预设真实参数状态）+ 教师引导语 + 知识小结
const META = '数学·九年级｜人教版九上 · 二次函数的图像与系数';
const STEPS = [
  {
    name: '看开口',
    abc: { a: 1, b: -2, c: -3 },
    guide: '先别动滑杆，看这条 y = x² - 2x - 3。预测一下：把 a 拖到 -1，开口会怎样翻？把 a 拖到 3，开口变宽还是变窄？说完再动手验证。',
  },
  {
    name: '找顶点',
    abc: { a: 1, b: 2, c: -3 },
    guide: '对照右侧三行配方推导，读出顶点和对称轴。再把 b 从 -2 拖到 2，紫色虚线对称轴移到了哪边？用 x = -b/(2a) 解释这个移动规律。',
  },
  {
    name: '数交点',
    abc: { a: 1, b: -2, c: 1 },
    guide: '现在抛物线与 x 轴只有一个公共点，顶点恰好落在 x 轴上，因为 Δ = b² - 4ac = 0。只拖 c 滑杆到 -3 再到 3，数一数交点个数，用 Δ 的符号总结三种情况。',
  },
];
const SUMMARY =
  '二次函数 y = ax² + bx + c（a ≠ 0）的图像是抛物线：a 定开口方向，a > 0 开口向上，a < 0 开口向下，|a| 越大开口越小；' +
  '对称轴是直线 x = -b/(2a)，顶点为 (-b/(2a), (4ac - b²)/(4a))，把一般式配方成 y = a(x - h)² + k 就能直接读出顶点；' +
  'c 决定图像与 y 轴的交点 (0, c)；判别式 Δ = b² - 4ac 决定与 x 轴交点个数：Δ > 0 有两个交点，Δ = 0 只有一个（顶点在 x 轴上），Δ < 0 没有。';

function setStep(i) {
  Object.assign(st, STEPS[i].abc);
  for (const [sid, key, vid] of [['#sa', 'a', '#va'], ['#sb', 'b', '#vb'], ['#sc', 'c', '#vc']]) {
    const el = document.querySelector(sid);
    const out = document.querySelector(vid);
    if (el) el.value = String(st[key]);
    if (out) out.textContent = String(st[key]);
  }
  renderPanel();
  draw();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}

function buildTeachingPanel() {
  // 定位行进顶栏（标题后）
  const hintEl = document.getElementById('hint');
  const metaEl = document.createElement('span');
  metaEl.dataset.hvMeta = '';
  metaEl.textContent = META;
  metaEl.style.cssText = 'color:var(--gold);font-size:14px;margin-right:10px;white-space:nowrap';
  hintEl.before(metaEl);

  // 环节条：贴在顶栏下方，舞台随之下移，不遮公式框
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;top:56px;left:0;right:0;z-index:15;display:flex;align-items:center;gap:10px;' +
    'padding:8px 14px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap';
  bar.innerHTML =
    STEPS.map((s, i) => `<button class="btn" data-hv-step type="button" style="font-size:15px;padding:7px 16px">${i + 1}. ${s.name}</button>`).join('') +
    STEPS.map((s, i) =>
      `<span data-hv-guide style="flex:1;min-width:260px;font-size:15px;color:var(--text);line-height:1.6;${i === 0 ? '' : 'display:none'}">${s.guide}</span>`
    ).join('') +
    '<button class="btn" id="summary-btn" type="button" style="margin-left:auto">小结</button>';
  document.body.appendChild(bar);

  const summaryEl = document.createElement('div');
  summaryEl.dataset.hvSummary = '';
  summaryEl.textContent = SUMMARY;
  summaryEl.style.cssText =
    'position:fixed;top:124px;left:50%;transform:translateX(-50%);z-index:16;max-width:560px;margin:0 16px;' +
    'padding:16px 20px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;' +
    'font-size:16px;line-height:1.8;display:none';
  document.body.appendChild(summaryEl);

  bar.querySelectorAll('[data-hv-step]').forEach((el, i) => el.addEventListener('click', () => setStep(i)));
  bar.querySelector('#summary-btn').addEventListener('click', () => {
    summaryEl.style.display = summaryEl.style.display === 'none' ? '' : 'none';
  });
  setStep(0);
}

// 自检：逐环节核对预设的解析结果（一般式/对称轴/顶点纵坐标/判别式），比较前先判有限性
function runSelfChecks() {
  const expect = [
    { gen: 'y = x² - 2x - 3', h: '1', k: '-4', d: 16 },
    { gen: 'y = x² + 2x - 3', h: '-1', k: '-4', d: 16 },
    { gen: 'y = x² - 2x + 1', h: '1', k: '0', d: 0 },
  ];
  STEPS.forEach((s, i) => {
    setStep(i);
    const h = -st.b / (2 * st.a);
    const d = disc();
    const ok =
      Number.isFinite(h) && Number.isFinite(kNum()) && Number.isFinite(d) &&
      generalStr() === expect[i].gen && hOf() === expect[i].h && kOf() === expect[i].k && d === expect[i].d;
    window.__hvPushCheck(`环节${i + 1}预设`, ok, `gen=${generalStr()} h=${hOf()} k=${kOf()} Δ=${d}`);
  });
  setStep(0);
}

function resize() {
  const dpr = Math.min(devicePixelRatio, 2);
  W = stageEl.clientWidth;
  H = stageEl.clientHeight;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

init({
  mount(stage, api) {
    stageEl = stage;
    cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(cv);
    ctx = cv.getContext('2d');

    buildUI(stage);
    buildTeachingPanel();
    resize();
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

    // 拖拽平移 + 滚轮/双指缩放（鼠标与触摸统一 pointer 通道，缩放以指针为焦点）
    const zoomAt = (sx, sy, factor) => {
      const u = unit();
      const wxp = view.cx + (sx - pcx()) / u;
      const wyp = view.cy - (sy - pcy()) / u;
      view.span = Math.min(40, Math.max(1.5, view.span * factor));
      const u2 = unit();
      view.cx = wxp - (sx - pcx()) / u2;
      view.cy = wyp + (sy - pcy()) / u2;
      draw();
    };
    let dragging = false, px0 = 0, py0 = 0;
    const pointers = new Map();
    let pinchDist = 0;
    cv.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) { dragging = true; px0 = e.clientX; py0 = e.clientY; cv.style.cursor = 'grabbing'; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (pinchDist > 0) zoomAt(mx, my, pinchDist / Math.max(d, 1));
        pinchDist = d;
        return;
      }
      if (!dragging) return;
      const u = unit();
      view.cx -= (e.clientX - px0) / u;
      view.cy += (e.clientY - py0) / u;
      px0 = e.clientX; py0 = e.clientY;
      draw();
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) { dragging = false; cv.style.cursor = 'grab'; } };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, 1 + Math.sign(e.deltaY) * 0.12);
    }, { passive: false });

    api.onResize = resize;
    api.onTheme = draw;
  },
});
