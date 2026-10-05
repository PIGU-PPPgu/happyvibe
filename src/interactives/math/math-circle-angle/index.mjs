import { init } from '../../_shared/runtime.mjs';

// 圆周角动态演示：拖 A、B 定弧，拖 P、Q 沿圆移动
// 同弧上 ∠APB = ∠AQB = 圆心角一半；P、Q 异弧时两角互补；AB 为直径时恒 90°
// 颜色读 CSS 变量：金 var(--gold) P 与所对弧，紫 var(--purple) 圆心角，蓝为站内色板常量
const BLUE = '#4FC3F7';

let cv, ctx, stageEl, W = 0, H = 0;
const pts = { A: 190, B: 350, P: 80, Q: 120 }; // 圆上角度（数学角，逆时针，度）
let dragKey = null;

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

const norm = (x) => ((x % 360) + 360) % 360;
const rad = (d) => (d * Math.PI) / 180;
const fmtDeg = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? `${Math.round(v)}°` : `${v.toFixed(1)}°`);
// 点是否在 A→B 逆时针弧上
const onArc = (p, a, b) => norm(p - a) < norm(b - a);
// 某圆周角点所对的弧（不含该点的 A-B 弧）
function oppositeArc(k) {
  return onArc(pts[k], pts.A, pts.B) ? { from: pts.B, to: pts.A } : { from: pts.A, to: pts.B };
}
const arcDeg = (arc) => norm(arc.to - arc.from);

function geom() {
  // 主体铺满画布：径向预算 = 顶部点标签字高（P 最靠上，sin80≈.985）+ 底部蓝环外缘（R+20+线宽半 4.5）
  const topPad = 6, botPad = 6, glyph = 16, labelR = 34, ringOut = 24.5;
  const RByH = (H - topPad - botPad - glyph - ringOut - labelR * 0.985) / 1.985;
  const RByW = (narrow() ? W / 2 : (W - 280) / 2) - labelR - 14;
  const R = Math.max(80, Math.min(RByW, RByH));
  const cx = narrow() ? W / 2 : (W - 280) / 2;
  const cy = topPad + (R + labelR) * 0.985 + glyph; // 顶部对齐，圆下方留足蓝环与标签
  const pos = {};
  for (const k of ['A', 'B', 'P', 'Q']) pos[k] = [cx + R * Math.cos(rad(pts[k])), cy - R * Math.sin(rad(pts[k]))];
  return { R, cx, cy, pos };
}
const narrow = () => W < 760;

// 圆周角 ∠APB / ∠AQB：屏幕坐标向量夹角
function inscribedDeg(pk) {
  const { pos } = geom();
  const p = pos[pk];
  const ang = (q) => Math.atan2(pos[q][1] - p[1], pos[q][0] - p[0]);
  let d = Math.abs(ang('A') - ang('B')) * 180 / Math.PI;
  if (d > 180) d = 360 - d;
  return d;
}

function renderPanel() {
  const pAng = inscribedDeg('P');
  const qAng = inscribedDeg('Q');
  const pArc = arcDeg(oppositeArc('P'));
  const qArc = arcDeg(oppositeArc('Q'));
  const sameArc = pArc === qArc;
  const isDia = Math.abs(norm(pts.B - pts.A) - 180) < 0.5;
  const rows = [
    `<div class="ang gold">∠APB = ${fmtDeg(pAng)}</div>`,
    `<div class="ang blue">∠AQB = ${fmtDeg(qAng)}</div>`,
    `<div class="ang purple">∠AOB = ${fmtDeg(pArc)}<span class="note">（P 所对弧的圆心角）</span></div>`,
  ];
  let concl;
  if (isDia) concl = 'AB 是直径：∠APB = ∠AQB = 90°，直径所对的圆周角是直角';
  else if (sameArc) concl = 'P、Q 在同一段弧上：∠APB = ∠AQB，且都等于所对弧圆心角的一半';
  else concl = `P、Q 在两段弧上：∠APB + ∠AQB = 180°（此时 ∠AOB 的另一段弧是 ${fmtDeg(qArc)}）`;
  document.getElementById('angles').innerHTML = rows.join('');
  const c = document.getElementById('concl');
  c.textContent = concl;
  document.getElementById('rel').textContent = sameArc && !isDia
    ? `${fmtDeg(pAng)} × 2 = ${fmtDeg(pAng * 2)} = ∠AOB`
    : isDia ? '90° × 2 = 180°，AB 恰为平角' : `${fmtDeg(pAng)} + ${fmtDeg(qAng)} = ${fmtDeg(pAng + qAng)}`;
}

function draw() {
  const p = palette();
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const { R, cx, cy, pos } = geom();

  // 圆与半径
  ctx.strokeStyle = p.text;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy); ctx.lineTo(pos.A[0], pos.A[1]);
  ctx.moveTo(cx, cy); ctx.lineTo(pos.B[0], pos.B[1]);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // P、Q 所对弧高亮（外圈两环）。canvas 角 = -数学角：数学逆时针 = canvas 角减小 = anticlockwise true
  const arcPath = (arc, rr) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, -rad(arc.from), -rad(arc.from + arcDeg(arc)), true);
  };
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.gold;
  ctx.globalAlpha = 0.85;
  arcPath(oppositeArc('P'), R + 7);
  ctx.stroke();
  ctx.strokeStyle = BLUE;
  arcPath(oppositeArc('Q'), R + 20);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 弦 PA、PB 与 QA、QB
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = p.gold;
  ctx.beginPath();
  ctx.moveTo(pos.P[0], pos.P[1]); ctx.lineTo(pos.A[0], pos.A[1]);
  ctx.moveTo(pos.P[0], pos.P[1]); ctx.lineTo(pos.B[0], pos.B[1]);
  ctx.stroke();
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(pos.Q[0], pos.Q[1]); ctx.lineTo(pos.A[0], pos.A[1]);
  ctx.moveTo(pos.Q[0], pos.Q[1]); ctx.lineTo(pos.B[0], pos.B[1]);
  ctx.stroke();

  // 圆心角标记（紫）
  const pArc = oppositeArc('P');
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, -rad(pArc.from), -rad(pArc.from + arcDeg(pArc)), true);
  ctx.stroke();
  // 圆心角度数：平分线方向
  const om = pArc.from + arcDeg(pArc) / 2;
  ctx.fillStyle = p.purple;
  ctx.font = 'bold 18px "Noto Sans SC","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fmtDeg(arcDeg(pArc)), cx + 74 * Math.cos(rad(om)), cy - 74 * Math.sin(rad(om)));

  // 圆周角标记与度数
  const markAngle = (pk, color) => {
    const pv = pos[pk];
    const dirA = Math.atan2(pos.A[1] - pv[1], pos.A[0] - pv[0]);
    const dirB = Math.atan2(pos.B[1] - pv[1], pos.B[0] - pv[0]);
    let d = dirB - dirA;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const mid = dirA + d / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(pv[0], pv[1], 26, dirA, dirB, d < 0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 18px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fmtDeg(inscribedDeg(pk)), pv[0] + 52 * Math.cos(mid), pv[1] + 52 * Math.sin(mid) + 5);
  };
  markAngle('P', p.gold);
  markAngle('Q', BLUE);

  // 点与标签
  const dot = (k, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos[k][0], pos[k][1], 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.text;
    ctx.font = 'bold 19px Georgia,serif';
    ctx.textAlign = 'center';
    ctx.fillText(k === 'O' ? 'O' : k, cx + (R + 34) * Math.cos(rad(pts[k])), cy - (R + 34) * Math.sin(rad(pts[k])));
  };
  dot('A', p.text);
  dot('B', p.text);
  dot('P', p.gold);
  dot('Q', BLUE);
  ctx.fillStyle = p.text;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('O', cx + 14, cy + 22);
}

// ---------- UI ----------
const STYLE = `
#panel{position:fixed;top:64px;right:14px;z-index:15;width:240px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
#angles{display:flex;flex-direction:column;gap:6px;font-size:19px;font-weight:700;font-family:Georgia,'Times New Roman',serif}
#angles .gold{color:var(--gold)}
#angles .blue{color:#4FC3F7}
#angles .purple{color:var(--purple)}
#angles .note{font-size:15px;font-weight:400;color:var(--muted);font-family:"Noto Sans SC","PingFang SC",sans-serif}
#rel{font-size:17px;font-weight:600;text-align:center;padding:6px;background:var(--panel2);border-radius:8px;font-family:Georgia,serif}
#concl{font-size:15.5px;line-height:1.6;color:var(--text)}
.tip{font-size:14px;color:var(--muted)}
.btns{display:flex;gap:8px}
.btns .btn{flex:1}
@media (max-width:760px){#panel{left:10px;right:10px;top:auto;bottom:10px;width:auto;padding:10px 12px;gap:7px}#angles{font-size:18px;flex-direction:row;flex-wrap:wrap;gap:4px 12px}#concl{font-size:15px}.tip{display:none}}
`;

function buildUI(stage) {
  const s = document.createElement('style');
  s.textContent = STYLE;
  stage.appendChild(s);
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = [
    '<div id="angles"></div>',
    '<div id="rel"></div>',
    '<div id="concl"></div>',
    '<div class="tip">拖 A、B 改变弧，拖 P、Q 沿圆移动比较两个圆周角。</div>',
    '<div class="btns">',
    '<button class="btn" id="dia" type="button" aria-label="AB 设为直径">直径</button>',
    '<button class="btn" id="reset" type="button" aria-label="复位">复位</button>',
    '</div>',
  ].join('');
  stage.appendChild(panel);
  panel.querySelector('#dia').addEventListener('click', () => {
    pts.A = 180; pts.B = 0;
    renderPanel(); draw();
  });
  panel.querySelector('#reset').addEventListener('click', () => {
    Object.assign(pts, { A: 190, B: 350, P: 80, Q: 120 });
    renderPanel(); draw();
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

    // 拖点：鼠标与触摸统一 pointer 通道，命中 22px 内的 A/B/P/Q
    const hit = (x, y) => {
      const { pos } = geom();
      for (const k of ['A', 'B', 'P', 'Q']) {
        if (Math.hypot(pos[k][0] - x, pos[k][1] - y) < 22) return k;
      }
      return null;
    };
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const k = hit(e.clientX - r.left, e.clientY - r.top);
      if (k) {
        dragKey = k;
        cv.setPointerCapture(e.pointerId);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!dragKey) return;
      const r = cv.getBoundingClientRect();
      const { cx, cy } = geom();
      const dx = e.clientX - r.left - cx;
      const dy = -(e.clientY - r.top - cy);
      let a = Math.atan2(dy, dx) * 180 / Math.PI;
      a = norm(Math.round(a));
      if (a !== pts[dragKey]) {
        pts[dragKey] = a;
        renderPanel();
        draw();
      }
    });
    const up = () => { dragKey = null; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    api.onResize = resize;
    api.onTheme = draw;
  },
});
