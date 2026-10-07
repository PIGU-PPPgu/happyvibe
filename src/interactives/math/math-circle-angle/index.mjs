import { init } from '../../_shared/runtime.mjs';

// 圆周角动态演示：拖 A、B 定弧，拖 P、Q 沿圆移动
// 同弧上 ∠APB = ∠AQB = 圆心角一半；P、Q 异弧时两角互补；AB 为直径时恒 90°
// 颜色读 CSS 变量：金 var(--gold) P 与所对弧，紫 var(--purple) 圆心角，蓝为站内色板常量
const BLUE = '#6FA8C9';

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
    gold: css('--gold', '#E8B04B'), purple: css('--purple', '#A66BA6'),
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

// ---------- 教学环节：预设状态 + 教师引导语（激活的显示，其余留在 DOM） ----------
// 定位（条目 frontmatter + 正文教材版本）：数学·九年级｜人教版九上第二十四章《圆》· 圆周角
const META = '数学·九年级｜人教版九上第二十四章《圆》· 圆周角';
// 三环节对应课堂流程：猜一猜（引入：同弧变不变）→ 验一验（探究：等于圆心角一半）→ 用一用（推论：直径对直角）
const STEPS = [
  {
    name: '猜一猜',
    pts: { A: 200, B: 340, P: 60, Q: 130 }, // P、Q 同在优弧，相距很远，∠APB = ∠AQB = 70°
    guide: 'P、Q 同在一条弧上，位置却一左一右。先别量：猜一猜 ∠APB 和 ∠AQB 谁大谁小？P 沿弧拖动时度数变不变？说说理由，再动手验证。',
    note: '圆周角是顶点在圆上、两边都与圆相交的角。同一条弧 AB 对着无数个圆周角，它们的度数都相同——因为每个圆周角都只「看」同一段弧，弧不变、角就不变。这是猜想环节的直观基础：位置可以一左一右，度数却由弧唯一决定。',
  },
  {
    name: '验一验',
    pts: { A: 190, B: 350, P: 70, Q: 110 }, // 同弧：两圆周角相等，且为 ∠AOB=160° 的一半
    guide: '读一读面板上的三个角：∠APB、∠AQB 和紫色的 ∠AOB。同弧上的两个圆周角有什么关系？圆心角是谁的两倍？换一组 A、B 再试一次。',
    note: '圆周角定理：同弧或等弧所对的圆周角相等，都等于这条弧所对的圆心角的一半。证明思路是按圆心 O 与圆周角的位置分三类讨论：O 在角内、角外、边上，连接 OA、OB 利用等腰三角形底角相等与外角定理推出。记忆时抓「同弧所对、周角是心角一半」两层关系。',
  },
  {
    name: '用一用',
    pts: { A: 180, B: 0, P: 90, Q: 270 }, // AB 为直径，P、Q 分居两个半圆，两角恒 90°
    guide: 'AB 变成了直径。无论 P 拖到圆上哪个位置，∠APB 都是多少度？把 P 拖进另一个半圆再确认。谁能用一句话说出直径所对圆周角的结论？',
    note: '推论：直径所对的圆周角是直角——直径对的弧是半圆 180°，圆周角取一半恰为 90°。反过来也成立：90° 的圆周角所对的弦是直径（判定直角或找直径的常用手段）。这一条在几何计算里出现频率最高：见到直径，就找它对的圆周角；见到 90° 圆周角，就连出直径。',
  },
];
const SUMMARY =
  '圆周角定理：同弧或等弧所对的圆周角相等，都等于这条弧所对的圆心角的一半。' +
  '推论一：直径所对的圆周角是直角；反过来，90° 的圆周角所对的弦是直径。' +
  '推论二：圆内接四边形的对角互补。';

function setStep(i) {
  Object.assign(pts, STEPS[i].pts);
  renderPanel();
  draw();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}

// 定位行进顶栏（提示语过长时省略号收缩，窄屏隐藏提示语、缩小定位行）
// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: META,
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '下列说法与「圆周角」定义相符的是？',
      opts: ['顶点在圆上，两边都与圆相交的角', '顶点在圆心的角', '两边都是弦的任意角', '顶点在圆外的角'],
      a: 0,
      why: '圆周角的定义有两个要点：顶点在圆上、两边都与圆相交。顶点在圆心的是圆心角，顶点在圆外或两边不相交的都不算。',
    },
    {
      q: '同一条弧所对的圆周角与圆心角的度数关系是？',
      opts: ['相等', '圆周角是圆心角的一半', '圆心角是圆周角的一半', '互余'],
      a: 1,
      why: '圆周角定理：同弧或等弧所对的圆周角相等，都等于所对圆心角的一半。如 ∠AOB = 160°，同弧圆周角恒为 80°。',
    },
    {
      q: 'P 在圆上移动（弦 AB 不动），∠APB 的度数？',
      opts: ['一直变大', '一直变小', '在同弧上不变', '随位置任意变化'],
      a: 2,
      why: '弧 AB 不变，它对的圆周角就不变——度数由弧唯一决定，与 P 在弧上的位置无关。这正是「同弧等角」的应用。',
    },
    {
      q: '弦 AB 是直径，点 P 在圆上（不与 A、B 重合），∠APB 等于？',
      opts: ['45°', '60°', '90°', '随 P 位置变化'],
      a: 2,
      why: '直径所对的弧是半圆 180°，圆周角取一半恰为 90°。反过来，90° 圆周角所对的弦也是直径，两个方向都常用。',
    },
    {
      q: '要证一条弦是直径，只需证？',
      opts: ['它是圆中最长的弦', '它对的圆周角是 90°', '它平分一条直径', '它垂直于另一条弦'],
      a: 1,
      why: '90° 圆周角所对的弦是直径——这是直径的判定定理。「最长」是直径的性质而非判定依据，垂直与平分都不充分。',
    },
  ],
};

// ---------- UI ----------
const STYLE = `
#panel{position:fixed;top:64px;right:14px;z-index:15;width:260px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.steps .btn{font-size:14px;padding:7px 2px;text-align:center}
.steps .btn[aria-pressed="true"]{border-color:var(--gold);background:var(--panel2)}
.guide{font-size:15px;line-height:1.6;color:var(--text)}
#hvsum{font-size:14px;line-height:1.75;color:var(--text);padding:10px 12px;background:var(--panel2);border:1px solid var(--gold);border-radius:8px;max-height:42vh;overflow:auto}
#angles{display:flex;flex-direction:column;gap:6px;font-size:19px;font-weight:700;font-family:Georgia,'Times New Roman',serif}
#angles .gold{color:var(--gold)}
#angles .blue{color:#6FA8C9}
#angles .purple{color:var(--purple)}
#angles .note{font-size:15px;font-weight:400;color:var(--muted);font-family:"Noto Sans SC","PingFang SC",sans-serif}
#rel{font-size:17px;font-weight:600;text-align:center;padding:6px;background:var(--panel2);border-radius:8px;font-family:Georgia,serif}
#concl{font-size:15.5px;line-height:1.6;color:var(--text)}
.tip{font-size:14px;color:var(--muted)}
.btns{display:flex;gap:8px}
.btns .btn{flex:1}
@media (max-width:760px){#panel{left:10px;right:10px;top:auto;bottom:10px;width:auto;padding:10px 12px;gap:7px}#angles{font-size:18px;flex-direction:row;flex-wrap:wrap;gap:4px 12px}#concl{font-size:15px}.tip,.guide{display:none}}
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

// 自检：逐环节核对预设的几何关系——同弧两圆周角相等且为圆心角一半、直径所对圆周角 90°（比较前先判有限性）
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  const bad = [];
  STEPS.forEach((t, i) => {
    setStep(i);
    const pAng = inscribedDeg('P');
    const qAng = inscribedDeg('Q');
    const arc = arcDeg(oppositeArc('P'));
    if (![pAng, qAng, arc].every(Number.isFinite)) {
      bad.push(`环节${i + 1} 角度非有限值 p=${pAng} q=${qAng} arc=${arc}`);
      return;
    }
    const dia = Math.abs(norm(pts.B - pts.A) - 180) < 0.5;
    if (dia) {
      if (Math.abs(pAng - 90) > 0.5 || Math.abs(qAng - 90) > 0.5) bad.push(`环节${i + 1} 直径圆周角 ${fmtDeg(pAng)}/${fmtDeg(qAng)} ≠ 90°`);
    } else {
      if (Math.abs(pAng - qAng) > 0.5) bad.push(`环节${i + 1} 同弧圆周角不相等 ${fmtDeg(pAng)} ≠ ${fmtDeg(qAng)}`);
      if (Math.abs(pAng * 2 - arc) > 0.5) bad.push(`环节${i + 1} 圆周角 ≠ 圆心角一半 ${fmtDeg(pAng)}×2 ≠ ${fmtDeg(arc)}`);
    }
  });
  setStep(0);
  push('环节预设几何关系', bad.length === 0, bad.join(' ') || '猜一猜/验一验：同弧两角相等且为圆心角一半；用一用：直径所对圆周角 90°');
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
  teaching: TEACHING,
  mount(stage, api) {
    stageEl = stage;
    cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;touch-action:none';
    stage.appendChild(cv);
    ctx = cv.getContext('2d');

    buildUI(stage);
    renderPanel();
    resize();
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

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
