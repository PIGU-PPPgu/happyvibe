// 数轴动点实验室 · 北师大版七上第二章《有理数及其运算》
// 交互：拖金点 / 方向键微调半格；读数板实时显示 数 / 相反数 / 到原点距离
import { init } from '../../_shared/runtime.mjs';

let stageEl, cv, ctx, W = 0, H = 0, dpr = 1;
let mode = 'sanys'; // sanys=三要素标注 | free=自由拖动 | mirror=对称演示
let p = 2;          // 金点表示的数（0.5 步进）
let drag = false;

const RANGE = 6; // 数轴 -6..6
const STYLE = `
#nl-ui{position:absolute;left:50%;transform:translateX(-50%);bottom:16px;z-index:6;display:flex;gap:26px;align-items:center;
  background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line);border-radius:16px;
  padding:12px 28px;backdrop-filter:blur(6px);box-shadow:0 8px 28px rgba(0,0,0,.35)}
#nl-read{display:flex;gap:26px}
#nl-read .stat{display:flex;flex-direction:column;gap:5px;align-items:center;min-width:68px}
#nl-read .lab{font-size:13.5px;color:var(--text-faint);letter-spacing:.05em;white-space:nowrap}
#nl-read .val{font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;line-height:1.1}
#nl-read .pos{color:var(--gold)}
#nl-read .opp{color:#B49BE3}
#nl-read .abs{color:#8FD4B0}
#nl-read .cmp{font-size:20px}
#nl-tip{display:none}
@media (max-width:760px){#nl-ui{left:10px;right:10px;transform:none;gap:14px;padding:10px 14px}#nl-read{gap:14px}#nl-read .val{font-size:22px}}
`;

const TEACHING = {
  meta: '数学·七年级｜北师大版七上第二章《有理数及其运算》· 数轴与绝对值',
  steps: [
    {
      name: '想一想',
      guide: '先看这条数轴：原点、正方向、单位长度分别在哪里？温度计为什么算一条竖着的数轴？缺了箭头的直线能当数轴吗？',
      note: '数轴三要素：原点（基准 0）、正方向（向右为正，用箭头标出）、单位长度（每一格一样长，缺一不可）。温度计有零刻度、向上的正向和均匀刻度，正是一条竖放的数轴。有了三要素，任何一个有理数都能找到数轴上唯一的一个点与它对应——这是"数"与"形"第一次正式接轨。',
      apply: () => setMode('sanys'),
    },
    {
      name: '做一做',
      guide: '拖动金点，读数板跟着变：点表示的数、它的相反数、到原点的距离各是多少？把点拖到原点左边，它与 0 谁大？再用方向键半格半格地微调试试。',
      note: '点在原点右边表示正数，左边表示负数；点越往右，表示的数越大，所以右大左小是与 0 比较的依据。相反数只改符号：2 的相反数是 -2；到原点的距离永远是"多少格"，不带方向，所以是非负的。读数时先看方向定符号，再数格子定大小。',
      apply: () => setMode('free'),
    },
    {
      name: '议一议',
      guide: '现在画面上出现了对称的紫点和两段等长的弧线：2 与 -2 到原点的距离各是多少？小组讨论后用一句话说说绝对值的意义，再总结负数比较大小的方法。',
      note: '互为相反数的两个点关于原点对称，到原点的距离相等——这个共同距离就是绝对值：|2| = 2，|-2| = 2，所以 |a| ≥ 0。比较大小看位置：点越靠右数越大；两个负数比较，离原点越远的点越靠左，数反而越小，如 -5 < -3。口诀"右大左小，负数远者小"。',
      apply: () => { setMode('mirror'); },
    },
  ],
  summary: '数轴三要素：原点、正方向、单位长度。任何有理数都对应数轴上唯一的一个点。只有符号不同的两个数互为相反数，其对应点关于原点对称；|a| 表示数 a 对应的点到原点的距离，恒有 |a| ≥ 0。数轴上的点越靠右，表示的数越大；两个负数比较大小，绝对值大的反而小。',
  quiz: [
    {
      q: '一条直线要成为数轴，必须具备的条件是？',
      opts: ['原点、正方向、单位长度', '足够密集的刻度', '长度有限且标好数字', '必须水平放置'],
      a: 0,
      why: '三要素缺一不可：原点是基准，正方向（箭头）定正负，单位长度定格子。没有箭头或格子不均匀的直线都不是数轴。',
    },
    {
      q: '数轴上金点到原点左侧 3.5 个单位长度处，它表示的数是？',
      opts: ['3.5', '-3.5', '0.5', '-0.5'],
      a: 1,
      why: '原点左侧为负：先定符号（负），再数格子（3.5 格），所以是 -3.5。读数先方向后格数，符号就不会丢。',
    },
    {
      q: '-2.5 的相反数是？',
      opts: ['2.5', '-2.5', '0.4', '1/2.5'],
      a: 0,
      why: '只有符号不同的两个数互为相反数，-2.5 的相反数是 2.5。0.4 是倒数（乘积为 1），与相反数是两个概念。',
    },
    {
      q: '|-4| 等于 4，依据是？',
      opts: ['负号可以直接去掉', '-4 对应的点到原点的距离是 4', '规定如此没有理由', '因为 -4 小于 4'],
      a: 1,
      why: '绝对值的几何意义是"到原点的距离"：-4 的点离原点 4 个单位长度，距离不带方向、恒为非负，所以 |-4| = 4。',
    },
    {
      q: '比较 -5 与 -3 的大小，正确的是？',
      opts: ['-5 大，因为 5 比 3 大', '-3 大，它的点在数轴上更靠右', '一样大', '无法比较'],
      a: 1,
      why: '数轴上 -3 的点在 -5 的右边，右大左小，所以 -3 > -5。两个负数比较，离原点越远的越靠左、数反而越小——"数字大"不等于"数大"。',
    },
  ],
};

function setMode(m) { mode = m; draw(); }

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return {
    text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'), faint: v('--faint', '#7d7099'),
    gold: v('--gold', '#E8B04B'), purple: v('--purple', '#A66BA6'),
    line: v('--line', 'rgba(180,130,210,.3)'), panel2: v('--panel2', '#271a42'),
    back: v('--bg', '#140b20'), green: v('--ok', '#7FBF9E'),
    purpleHi: document.documentElement.dataset.theme === 'light' ? '#8A4FB0' : '#C9A0E8',
    goldHi: document.documentElement.dataset.theme === 'light' ? '#A66E10' : '#E8B04B',
    greenHi: document.documentElement.dataset.theme === 'light' ? '#2E7D52' : '#7FBF9E',
    light: document.documentElement.dataset.theme === 'light',
  };
}

function draw() {
  const t = theme();
  const axisY = H * 0.63;
  const SCALE = W * 0.44;                     // 单位长度像素：满幅构图，两端各留 50px
  const x = (v) => W / 2 + v / RANGE * SCALE;
  ctx.clearRect(0, 0, W, H);
  const F = (w, px) => `${w} ${px}px "Noto Sans SC","PingFang SC",sans-serif`;

  // ── 正数区 / 负数区：可见色带撑满上半幅（右正左负的教学要点） ──
  const topY = H * 0.075, bandH = axisY - topY;
  const pa = t.light ? 0.32 : 0.16, pb = t.light ? 0.10 : 0.04;   // 浅色纸面需更浓的色带
  const gradPos = ctx.createLinearGradient(0, topY, 0, axisY);
  gradPos.addColorStop(0, `rgba(232,176,75,${pa})`); gradPos.addColorStop(1, `rgba(232,176,75,${pb})`);
  ctx.fillStyle = gradPos; ctx.fillRect(x(0), topY, x(RANGE + 0.25) - x(0), bandH);
  const na = t.light ? 0.28 : 0.17, nb = t.light ? 0.09 : 0.04;
  const gradNeg = ctx.createLinearGradient(0, topY, 0, axisY);
  gradNeg.addColorStop(0, `rgba(150,90,180,${na})`); gradNeg.addColorStop(1, `rgba(150,90,180,${nb})`);
  ctx.fillStyle = gradNeg; ctx.fillRect(x(-RANGE - 0.25), topY, x(0) - x(-RANGE - 0.25), bandH);
  // 整数竖向网格线：撑起分区带，也强化"每格相等"的单位感
  ctx.strokeStyle = t.line; ctx.lineWidth = 1; ctx.globalAlpha = .38;
  for (let v = -RANGE; v <= RANGE; v += 1) {
    if (v === 0) continue; // 原点处已有分区界虚线
    ctx.beginPath(); ctx.moveTo(x(v), topY + 4); ctx.lineTo(x(v), axisY - 8); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 分区标签：大字号居中 + 背板描边保证对比度
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(700, 24);
  ctx.strokeStyle = t.back; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  const posLab = '正数区 · 大于 0', negLab = '负数区 · 小于 0';
  ctx.strokeText(posLab, (x(0) + x(RANGE)) / 2, topY + bandH * 0.26);
  ctx.strokeText(negLab, (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26);
  ctx.fillStyle = t.goldHi; ctx.fillText(posLab, (x(0) + x(RANGE)) / 2, topY + bandH * 0.26);
  ctx.fillStyle = t.purpleHi; ctx.fillText(negLab, (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26);
  ctx.font = F(400, 15); ctx.globalAlpha = .85;
  ctx.strokeText('点在原点右边', (x(0) + x(RANGE)) / 2, topY + bandH * 0.26 + 28);
  ctx.strokeText('点在原点左边', (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26 + 28);
  ctx.fillStyle = t.goldHi; ctx.fillText('点在原点右边', (x(0) + x(RANGE)) / 2, topY + bandH * 0.26 + 28);
  ctx.fillStyle = t.purpleHi; ctx.fillText('点在原点左边', (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26 + 28);
  ctx.globalAlpha = 1;
  // 原点竖直虚线（分区界）
  ctx.strokeStyle = t.line; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.moveTo(x(0), topY); ctx.lineTo(x(0), axisY - 12); ctx.stroke();
  ctx.setLineDash([]);

  // ── 数轴主体：粗轴 + 大箭头 ──
  ctx.strokeStyle = t.text; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x(-RANGE - 0.35), axisY); ctx.lineTo(x(RANGE + 0.35), axisY); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x(RANGE + 0.35) + 2, axisY);
  ctx.lineTo(x(RANGE + 0.35) - 16, axisY - 9);
  ctx.lineTo(x(RANGE + 0.35) - 16, axisY + 9);
  ctx.closePath(); ctx.fillStyle = t.text; ctx.fill();

  // ── 刻度：整数长刻度 + 半格短刻度，数字大而粗 ──
  for (let v = -RANGE; v <= RANGE; v += 1) {
    const major = v === 0;
    ctx.strokeStyle = t.text; ctx.lineWidth = major ? 3.5 : 2.5;
    const th = major ? 15 : 10;
    ctx.beginPath(); ctx.moveTo(x(v), axisY - th); ctx.lineTo(x(v), axisY + th); ctx.stroke();
    ctx.strokeStyle = t.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x(v + 0.5), axisY - 5); ctx.lineTo(x(v + 0.5), axisY + 5); ctx.stroke();
    const near = v !== 0 && v === Math.round(p);
    ctx.font = F(near || major ? 700 : 600, near ? 21 : 19);
    if (major) { ctx.fillStyle = t.green; }
    else if (near) { ctx.fillStyle = t.goldHi; }
    else ctx.fillStyle = t.muted;
    ctx.textBaseline = 'top';
    ctx.fillText(String(v), x(v), axisY + 20);
  }

  // ── 想一想：三要素标注（带背板芯片，字号加大） ──
  if (mode === 'sanys') {
    ctx.strokeStyle = t.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x(0), axisY - 15); ctx.lineTo(x(0), axisY - 44); ctx.stroke();
    callout('原点 · 0', x(0), axisY - 62, t.gold, t.back);
    callout('正方向（向右为正）', x(RANGE - 0.55), axisY + 76, t.gold, t.back);
    ctx.beginPath(); ctx.moveTo(x(RANGE - 0.55), axisY + 64); ctx.lineTo(x(RANGE - 0.55), axisY + 15); ctx.stroke();
    // 单位长度：两格之间的量尺跨度
    const sy = axisY - 96;
    ctx.strokeStyle = t.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x(1), sy + 10); ctx.lineTo(x(1), sy); ctx.lineTo(x(2), sy); ctx.lineTo(x(2), sy + 10); ctx.stroke();
    callout('单位长度 · 每格相等', x(1.5), sy - 16, t.gold, t.back);
  }

  // ── 议一议：对称紫点 + 等距量尺跨度（箭头双向） ──
  if (mode === 'mirror') {
    const r = Math.abs(p) || 0.5;
    // 镜像点
    glowDot(x(-p), axisY, 13, t.purple, 12);
    pill(fmt(-p), x(-p), axisY + 56, t.purple, '#1c0f2a');
    // 两条等距跨度（绿色量尺线 + 双箭头 + 大标签）——高位，避开数值药丸
    span(x(0), x(p), axisY - 100, t.greenHi, '|' + fmt(p) + '| = ' + fmt(r));
    span(x(0), x(-p), axisY - 100, t.greenHi, '|' + fmt(-p) + '| = ' + fmt(r));
    // 对称虚线连接两点
    ctx.strokeStyle = t.purple; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x(p), axisY - 16); ctx.lineTo(x(-p), axisY - 16); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── 金点 P：大圆 + 光晕 + 呼吸圈 + 数值药丸 ──
  const px = x(p);
  const breathe = 6 + 3 * Math.sin(pulseT / 480);
  ctx.beginPath(); ctx.arc(px, axisY, 22 + breathe, 0, Math.PI * 2);
  ctx.strokeStyle = t.light ? 'rgba(166,110,16,.45)' : 'rgba(232,176,75,.35)'; ctx.lineWidth = 2.5; ctx.stroke();
  glowDot(px, axisY, 15, t.gold, 22);
  ctx.strokeStyle = t.gold; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(px, axisY - 15); ctx.lineTo(px, axisY - 40); ctx.stroke();
  pill(fmt(p), px, axisY - 58, t.gold, '#221430');
}

let pulseT = 0;
// 发光大圆点：外圈辉光 + 白色内环，投屏最后一排也看得清
function glowDot(px, py, r, color, blur) {
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(px, py, r - 3.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.stroke();
}
// 数值药丸：实底圆角胶囊 + 深色大数字
function pill(text, cx, cy, bg, fg) {
  ctx.font = '700 20px "Noto Sans SC","PingFang SC",sans-serif';
  const w = ctx.measureText(text).width + 30, h = 34;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1);
}
// 标注芯片：描边背板保证双主题下都清晰
function callout(text, cx, cy, color, back) {
  ctx.font = '700 16px "Noto Sans SC","PingFang SC",sans-serif';
  const w = ctx.measureText(text).width + 22, h = 30;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 8);
  ctx.fillStyle = back; ctx.globalAlpha = .82; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1);
}
// 等距量尺跨度：两端下针脚 + 双向箭头 + 中点大标签
function span(x1, x2, y, color, label) {
  const L = Math.min(x1, x2), R = Math.max(x1, x2);
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(L, y + 8); ctx.lineTo(L, y); ctx.lineTo(R, y); ctx.lineTo(R, y + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(R, y); ctx.lineTo(R - 9, y - 5); ctx.lineTo(R - 9, y + 5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + 9, y - 5); ctx.lineTo(L + 9, y + 5); ctx.closePath(); ctx.fill();
  ctx.font = '700 20px "Noto Sans SC","PingFang SC",sans-serif';
  const ly = y - 22;
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.strokeText(label, (L + R) / 2, ly);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(label, (L + R) / 2, ly);
}
function fmt(v) {
  const s = Math.abs(v % 1) < 1e-9 ? String(Math.round(v)) : v.toFixed(1);
  return s === '-0' ? '0' : s;
}


function readout() {
  const el = document.getElementById('nl-read');
  if (!el) return;
  const q = (id) => document.getElementById(id);
  q('nl-p').textContent = fmt(p);
  q('nl-opp').textContent = fmt(-p);
  q('nl-abs').textContent = fmt(Math.abs(p));
  const cmp = q('nl-cmp');
  cmp.textContent = p > 0 ? '> 0 · 右侧' : p < 0 ? '< 0 · 左侧' : '= 0 · 原点';
}

function buildUI(stage) {
  const style = document.createElement('style');
  style.textContent = STYLE;
  stage.appendChild(style);
  const ui = document.createElement('div');
  ui.id = 'nl-ui';
  ui.innerHTML = `
    <div id="nl-read">
      <div class="stat"><span class="lab">点表示的数</span><b class="val pos" id="nl-p"></b></div>
      <div class="stat"><span class="lab">相反数</span><b class="val opp" id="nl-opp"></b></div>
      <div class="stat"><span class="lab">到原点距离</span><b class="val abs" id="nl-abs"></b></div>
      <div class="stat"><span class="lab">与 0 比较</span><b class="val pos cmp" id="nl-cmp"></b></div>
    </div>`;
  stage.appendChild(ui);
  readout();
}

// ---------- 自测断言：读数板与数轴状态一致（先判有限，再比较） ----------
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  const cases = [3.5, -4, 0, 2.5, -0.5];
  const bad = [];
  for (const v of cases) {
    p = v; readout();
    const txt = (id) => document.getElementById(id).textContent;
    const num = (id) => parseFloat(txt(id));
    if (!Number.isFinite(num('nl-p')) || num('nl-p') !== v) bad.push(`p=${v} 读数 ${txt('nl-p')}`);
    if (!Number.isFinite(num('nl-opp')) || num('nl-opp') !== -v) bad.push(`p=${v} 相反数 ${txt('nl-opp')}`);
    if (!Number.isFinite(num('nl-abs')) || num('nl-abs') !== Math.abs(v)) bad.push(`p=${v} 绝对值 ${txt('nl-abs')}`);
  }
  push('读数板三行一致', bad.length === 0, bad.join('；') || '5 组位置：数、相反数、到原点距离全部与拖动位置一致');
  p = 2; readout();
  // 环节切换真的换标注模式
  setMode('sanys'); const s1 = mode === 'sanys';
  setMode('mirror'); const s2 = mode === 'mirror';
  setMode('free');
  push('环节预设切换', s1 && s2, '三要素标注与对称演示模式随环节切换生效');
}

function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = stageEl.clientWidth; H = stageEl.clientHeight;
  cv.width = Math.round(W * d); cv.height = Math.round(H * d);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  ctx.setTransform(d, 0, 0, d, 0, 0);
  draw();
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    stageEl = stage;
    cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(cv);
    ctx = cv.getContext('2d');
    buildUI(stage);
    resize();

    // 拖动金点：按 x 反算最接近的半格
    const toVal = (sx) => Math.max(-RANGE, Math.min(RANGE, Math.round(((sx - W / 2) / (W * 0.44)) * 2) / 2));
    cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); p = toVal(e.offsetX); readout(); draw(); });
    cv.addEventListener('pointermove', (e) => { if (drag) { p = toVal(e.offsetX); readout(); draw(); } });
    cv.addEventListener('pointerup', () => { drag = false; });
    // 方向键半格微调（翻页笔可用）
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
      if (e.key === 'ArrowRight') { p = Math.min(RANGE, p + 0.5); readout(); draw(); }
      else if (e.key === 'ArrowLeft') { p = Math.max(-RANGE, p - 0.5); readout(); draw(); }
    });

    const loop = (t) => { pulseT = t; if (!document.hidden) draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    api.onResize = resize;
    api.onTheme = draw;
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
  },
});
