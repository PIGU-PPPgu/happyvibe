import { init } from '../../_shared/runtime.mjs';

// 单位圆与三角函数：拖动圆上动点或播放扫角，投影线段与右侧图像同步描点；特殊角吸附显示根式
// 颜色读 CSS 变量：金 var(--gold) sin，紫 var(--purple) cos，蓝为站内色板常量 tan
const BLUE = '#4FC3F7';

let cv, ctx, stageEl, W = 0, H = 0;
let theta = 60;          // 角度（吸附后为整数）
let playing = false;
let mode = 'sin';        // sin | cos | tan
let dragTheta = false;

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

const SPECIALS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
const isSpecial = (d) => SPECIALS.includes(d);
// sin 档位表（0,±1/2,±√2/2,±√3/2,±1）
const SIN_LV = { 0: 0, 30: 1, 45: 2, 60: 3, 90: 4, 120: 3, 135: 2, 150: 1, 180: 0, 210: -1, 225: -2, 240: -3, 270: -4, 300: -3, 315: -2, 330: -1, 360: 0 };
const LV_TXT = { 0: '0', 1: '1/2', 2: '√2/2', 3: '√3/2', 4: '1', [-1]: '-1/2', [-2]: '-√2/2', [-3]: '-√3/2', [-4]: '-1' };
const TAN_TXT = { 0: '0', 30: '√3/3', 45: '1', 60: '√3', 90: null, 120: '-√3', 135: '-1', 150: '-√3/3', 180: '0', 210: '√3/3', 225: '1', 240: '√3', 270: null, 300: '-√3', 315: '-1', 330: '-√3/3', 360: '0' };

const D2R = Math.PI / 180;
const sinV = (d) => Math.sin(d * D2R);
const cosV = (d) => Math.cos(d * D2R);
const tanV = (d) => Math.tan(d * D2R);

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function fracPi(d) {
  if (d === 0) return '0';
  const g = gcd(d, 180);
  const n = d / g, q = 180 / g;
  if (q === 1) return n === 1 ? 'π' : `${n}π`;
  return n === 1 ? `π/${q}` : `${n}π/${q}`;
}
function nearSpecial(d) {
  for (const s of SPECIALS) if (Math.abs(d - s) <= 4) return s;
  return null;
}
const snap = (d) => nearSpecial(d) ?? Math.round(d);

function fmtVal(fn, d) {
  if (fn === 'sin') {
    if (isSpecial(d)) return { exact: LV_TXT[SIN_LV[d]], approx: sinV(d) };
    return { approx: sinV(d) };
  }
  if (fn === 'cos') {
    if (isSpecial(d)) {
      const lv = SIN_LV[((90 - d) % 360 + 360) % 360];
      return { exact: LV_TXT[lv], approx: cosV(d) };
    }
    return { approx: cosV(d) };
  }
  if (isSpecial(d)) {
    const t = TAN_TXT[d];
    return t === null ? { none: true } : { exact: t, approx: tanV(d) };
  }
  return { approx: tanV(d) };
}
const fmtNum = (v) => (v >= 0 ? v.toFixed(2) : v.toFixed(2));

// ---------- 布局 ----------
function layout() {
  const panelW = W < 900 ? 0 : 280;
  const graphW = W < 900 ? 0 : Math.min(430, (W - panelW) * 0.42);
  const circleBox = W - panelW - graphW - 40;
  const R = Math.max(110, Math.min(circleBox, H - 130) / 2 - 30);
  return {
    R,
    cx: 30 + circleBox / 2,
    cy: H / 2,
    gx0: 30 + circleBox + 30,           // 图像区左
    gx1: W - panelW - 24,               // 图像区右
    gy0: 70,
    gy1: H - 46,
    panelW,
  };
}

// ---------- 面板 ----------
function renderPanel() {
  const el = document.getElementById('vals');
  const d = theta;
  const row = (name, color, fn) => {
    const v = fmtVal(fn, d);
    const val = v.none ? '不存在' : v.exact ? `${v.exact}（≈ ${fmtNum(v.approx)}）` : fmtNum(v.approx);
    return `<div class="val ${color}">${name} = ${val}</div>`;
  };
  el.innerHTML = [
    `<div class="theta">θ = ${d}°<span class="rad">（${fracPi(d)}）</span>${isSpecial(d) ? '<span class="sp">特殊角</span>' : ''}</div>`,
    row('sin θ', 'gold', 'sin'),
    row('cos θ', 'purple', 'cos'),
    row('tan θ', 'blue', 'tan'),
  ].join('');
}

// ---------- 绘制 ----------
function draw() {
  const p = palette();
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const { R, cx, cy, gx0, gx1, gy0, gy1, panelW } = layout();
  const d = theta, r = d * D2R;
  const px = cx + R * Math.cos(r), py = cy - R * Math.sin(r);
  const FONT = '"Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

  // ===== 单位圆区 =====
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = cx - R; gx <= cx + R; gx += R / 4) { ctx.moveTo(gx, cy - R - 14); ctx.lineTo(gx, cy + R + 14); }
  for (let gy = cy - R; gy <= cy + R; gy += R / 4) { ctx.moveTo(cx - R - 14, gy); ctx.lineTo(cx + R + 14, gy); }
  ctx.stroke();

  ctx.strokeStyle = p.text;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - R - 20, cy); ctx.lineTo(cx + R + 26, cy);
  ctx.moveTo(cx, cy + R + 20); ctx.lineTo(cx, cy - R - 26);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.text;
  ctx.font = `italic bold 18px serif`;
  ctx.textAlign = 'left';
  ctx.fillText('x', cx + R + 28, cy + 6);
  ctx.fillText('y', cx + 6, cy - R - 28);

  // 特殊角刻度
  ctx.strokeStyle = p.muted;
  ctx.lineWidth = 1.5;
  for (const s of SPECIALS) {
    if (s % 90 === 0) continue;
    const a = s * D2R;
    const c = Math.cos(a), si = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(cx + (R - 7) * c, cy - (R - 7) * si);
    ctx.lineTo(cx + (R + 5) * c, cy - (R + 5) * si);
    ctx.stroke();
  }
  // 圆
  ctx.strokeStyle = p.text;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // tan 切线段（tan 模式）：过 A(1,0) 的切线与 OP 延长线交点 T
  if (mode === 'tan' && Math.abs(Math.cos(r)) > 1e-4) {
    const T = R / Math.cos(r);
    const tx = cx + T, ty = cy - T * Math.tan(r);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx + R, cy - R * 1.15);
    ctx.lineTo(cx + R, cy + R * 1.15);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + R, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = BLUE;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + R, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('T', tx + 9, ty + 4);
  }

  // cos 横段（紫）与 sin 竖段（金）
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, cy);
  ctx.stroke();
  ctx.strokeStyle = p.gold;
  ctx.beginPath();
  ctx.moveTo(px, cy);
  ctx.lineTo(px, py);
  ctx.stroke();
  // 竖直虚线 P 到垂足
  ctx.strokeStyle = p.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 半径 OP
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // 角弧
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, -r, true);
  ctx.stroke();

  // P 点与标注
  const snapped = isSpecial(d);
  ctx.fillStyle = p.gold;
  ctx.beginPath();
  ctx.arc(px, py, snapped ? 9 : 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.text;
  ctx.font = `bold 19px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('P', px + (px >= cx ? 18 : -18), py + (py <= cy ? -14 : 22));
  ctx.fillStyle = p.text;
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `bold 18px serif`;
  ctx.fillText('O', cx - 16, cy + 20);
  if (mode === 'tan') {
    ctx.fillText('A', cx + R + 14, cy + 20);
  }
  if (snapped) {
    ctx.fillStyle = p.gold;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = px >= cx ? 'left' : 'right';
    ctx.fillText(`${d}° · ${fracPi(d)}`, px + (px >= cx ? 26 : -26), py + (py <= cy ? -20 : 30));
  }

  // ===== 图像区 =====
  if (panelW > 0) {
    const yMax = mode === 'tan' ? 3 : 1.4;
    const mx = (t) => gx0 + (t / 360) * (gx1 - gx0);       // t 为度
    const my = (v) => (gy0 + gy1) / 2 - (v / yMax) * ((gy1 - gy0) / 2);

    // 网格与轴
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let v = -Math.ceil(yMax); v <= Math.ceil(yMax); v++) {
      const y = my(v);
      ctx.moveTo(gx0, y); ctx.lineTo(gx1, y);
    }
    ctx.stroke();
    ctx.strokeStyle = p.text;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(gx0, my(0)); ctx.lineTo(gx1, my(0));
    ctx.moveTo(mx(0), gy0 - 8); ctx.lineTo(mx(0), gy1 + 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.muted;
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'center';
    for (const t of [90, 180, 270, 360]) {
      ctx.fillText(fracPi(t), mx(t), my(0) + 22);
    }
    ctx.textAlign = 'right';
    for (const v of mode === 'tan' ? [-3, -1, 1, 3] : [-1, 1]) {
      ctx.fillText(`${v}`, mx(0) - 8, my(v) + 5);
    }

    const fnV = mode === 'sin' ? sinV : mode === 'cos' ? cosV : tanV;
    const curveColor = mode === 'sin' ? p.gold : mode === 'cos' ? p.purple : BLUE;

    // tan 渐近线
    if (mode === 'tan') {
      ctx.strokeStyle = p.muted;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      for (const t of [90, 270]) {
        ctx.beginPath();
        ctx.moveTo(mx(t), gy0); ctx.lineTo(mx(t), gy1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 全曲线（淡）
    ctx.strokeStyle = curveColor;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let pen = false;
    for (let t = 0; t <= 360; t += 1) {
      const v = fnV(t);
      if (mode === 'tan' && Math.abs(v) > yMax * 1.6) { pen = false; continue; }
      if (!pen) { ctx.moveTo(mx(t), my(v)); pen = true; } else ctx.lineTo(mx(t), my(v));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 已扫过 0..θ 的粗轨迹
    ctx.lineWidth = 4;
    pen = false;
    for (let t = 0; t <= d; t += 1) {
      const v = fnV(t);
      if (mode === 'tan' && Math.abs(v) > yMax * 1.6) { pen = false; continue; }
      if (!pen) { ctx.moveTo(mx(t), my(v)); pen = true; } else ctx.lineTo(mx(t), my(v));
    }
    ctx.stroke();

    // 当前点
    const cv2 = fnV(d);
    if (!(mode === 'tan' && (isSpecial(d) && TAN_TXT[d] === null))) {
      ctx.fillStyle = curveColor;
      ctx.beginPath();
      ctx.arc(mx(d), my(Math.max(-yMax * 1.5, Math.min(yMax * 1.5, cv2))), 8, 0, Math.PI * 2);
      ctx.fill();
      // 图像点到圆的对应虚线（横穿两区）
      ctx.strokeStyle = curveColor;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(mx(d), my(Math.max(-yMax * 1.5, Math.min(yMax * 1.5, cv2))));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // 标题
    ctx.fillStyle = curveColor;
    ctx.font = `bold 21px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`y = ${mode} θ`, gx0 + 6, gy0 - 14);
  }
}

// ---------- UI ----------
const STYLE = `
#panel{position:fixed;top:64px;right:14px;z-index:15;width:264px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.fns{display:flex;gap:8px}
.fns .btn{flex:1;padding:8px 4px}
.btn.on{border-color:var(--gold);color:var(--gold)}
#vals .theta{font-size:22px;font-weight:700;font-family:Georgia,serif}
#vals .rad{font-size:17px;color:var(--muted);font-family:Georgia,serif}
#vals .sp{display:inline-block;font-size:14px;color:var(--gold);border:1px solid var(--gold);border-radius:5px;padding:0 6px;margin-left:8px;font-family:"Noto Sans SC","PingFang SC",sans-serif;vertical-align:3px}
#vals .val{font-size:19px;font-weight:600;font-family:Georgia,serif}
#vals .gold{color:var(--gold)}
#vals .purple{color:var(--purple)}
#vals .blue{color:#4FC3F7}
.ops{display:flex;gap:8px}
.ops .btn{flex:1}
.tip{font-size:15px;color:var(--muted)}
@media (max-width:900px){#panel{left:10px;right:10px;top:auto;bottom:10px;width:auto;padding:10px 12px;gap:7px}#vals{display:flex;flex-wrap:wrap;gap:4px 14px}#vals .theta{font-size:19px}.tip{display:none}}
`;

function buildUI(stage) {
  const s = document.createElement('style');
  s.textContent = STYLE;
  stage.appendChild(s);
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = [
    '<div class="fns">',
    '<button class="btn on" id="f-sin" type="button" aria-label="正弦">sin</button>',
    '<button class="btn" id="f-cos" type="button" aria-label="余弦">cos</button>',
    '<button class="btn" id="f-tan" type="button" aria-label="正切">tan</button>',
    '</div>',
    '<div id="vals"></div>',
    '<div class="ops">',
    '<button class="btn" id="play" type="button" aria-label="播放扫角">播放</button>',
    '<button class="btn" id="reset" type="button" aria-label="复位">复位</button>',
    '</div>',
    '<div class="tip">拖动圆上的点扫角，靠近特殊角自动吸附并显示精确值。</div>',
  ].join('');
  stage.appendChild(panel);

  for (const m of ['sin', 'cos', 'tan']) {
    panel.querySelector(`#f-${m}`).addEventListener('click', () => {
      mode = m;
      panel.querySelectorAll('.fns .btn').forEach((b) => b.classList.toggle('on', b.id === `f-${m}`));
      renderPanel();
      draw();
    });
  }
  const playBtn = panel.querySelector('#play');
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? '暂停' : '播放';
  });
  panel.querySelector('#reset').addEventListener('click', () => {
    playing = false;
    playBtn.textContent = '播放';
    theta = 60;
    renderPanel();
    draw();
  });
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
    cv.style.cssText = 'position:absolute;inset:0;touch-action:none';
    stage.appendChild(cv);
    ctx = cv.getContext('2d');

    buildUI(stage);
    renderPanel();
    resize();

    // 拖动圆上动点（鼠标与触摸统一 pointer 通道）
    const angleAt = (x, y) => {
      const { R, cx, cy } = layout();
      const dx = x - cx, dy = -(y - cy);
      return snap((((Math.atan2(dy, dx) / D2R) % 360) + 360) % 360);
    };
    cv.addEventListener('pointerdown', (e) => {
      const rct = cv.getBoundingClientRect();
      const x = e.clientX - rct.left, y = e.clientY - rct.top;
      const { R, cx, cy } = layout();
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d > R - 34 && d < R + 34) {
        dragTheta = true;
        playing = false;
        const pb = document.getElementById('play');
        pb.textContent = '播放';
        theta = angleAt(x, y);
        renderPanel();
        draw();
        cv.setPointerCapture(e.pointerId);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!dragTheta) return;
      const rct = cv.getBoundingClientRect();
      theta = angleAt(e.clientX - rct.left, e.clientY - rct.top);
      renderPanel();
      draw();
    });
    const up = () => { dragTheta = false; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    api.onResize = resize;
    api.onTheme = draw;

    // 播放扫角：0 → 360°，一次完整周期后自动停
    (function loop() {
      requestAnimationFrame(loop);
      if (playing) {
        theta = Math.min(360, theta + 0.7);
        if (theta >= 360) {
          playing = false;
          document.getElementById('play').textContent = '播放';
        }
        renderPanel();
        draw();
      }
    })();
  },
});
