// 数轴动点实验室 · 北师大版七上第二章《有理数及其运算》
// 交互：拖金点 / 方向键微调半格；读数板实时显示 数 / 相反数 / 到原点距离
import { init } from '../../_shared/runtime.mjs';

let stageEl, cv, ctx, W = 0, H = 0, dpr = 1;
let mode = 'sanys'; // sanys=三要素标注 | free=自由拖动 | mirror=对称演示
let p = 2;          // 金点表示的数（0.5 步进）
let drag = false;

const RANGE = 6; // 数轴 -6..6
const STYLE = `
#nl-ui{position:absolute;top:64px;left:14px;z-index:6;display:flex;flex-direction:column;gap:10px;
  background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;min-width:230px}
#nl-read{display:flex;flex-direction:column;gap:6px;font-size:16px}
#nl-read .row{display:flex;justify-content:space-between;gap:14px}
#nl-read .row b{font-family:Georgia,'Times New Roman',serif;font-size:18px}
#nl-read .pos{color:var(--gold)}
#nl-read .opp{color:#9D8FD1}
#nl-read .abs{color:#7FBF9E}
#nl-tip{font-size:13.5px;color:var(--text-faint);line-height:1.6}
@media (max-width:760px){#nl-ui{left:10px;right:10px;flex-direction:row;flex-wrap:wrap;min-width:0}}
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
    gold: v('--gold', '#E8B04B'), purple: v('--purple', '#A66BA6'), green: v('--ok', '#7FBF9E'),
    line: v('--line', 'rgba(180,130,210,.3)'), panel2: v('--panel2', '#271a42'),
  };
}

function draw() {
  const t = theme();
  const axisY = H * 0.62;
  const x = (v) => W / 2 + (v / RANGE) * (W * 0.42);
  ctx.clearRect(0, 0, W, H);
  ctx.font = '14px "Noto Sans SC","PingFang SC",sans-serif';

  // 正数区 / 负数区半透明分区带（纵向撑起画面，也是"右正左负"的教学要点）
  const topY = H * 0.12;
  ctx.fillStyle = 'rgba(232,176,75,.05)';
  ctx.fillRect(x(0), topY, x(RANGE + 0.2) - x(0), axisY - topY);
  ctx.fillStyle = 'rgba(166,107,166,.06)';
  ctx.fillRect(x(-RANGE - 0.2), topY, x(0) - x(-RANGE - 0.2), axisY - topY);
  ctx.strokeStyle = t.line; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(x(0), topY); ctx.lineTo(x(0), axisY - 10); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 16px "Noto Sans SC","PingFang SC",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = t.gold; ctx.fillText('正数区（大于 0）', (x(0) + x(RANGE)) / 2, topY + 8);
  ctx.fillStyle = t.purple; ctx.fillText('负数区（小于 0）', (x(0) + x(-RANGE)) / 2, topY + 8);

  // 数轴
  ctx.strokeStyle = t.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x(-RANGE - 0.4), axisY); ctx.lineTo(x(RANGE + 0.4), axisY); ctx.stroke();
  // 正方向箭头
  ctx.beginPath();
  ctx.moveTo(x(RANGE + 0.4), axisY);
  ctx.lineTo(x(RANGE + 0.4) - 12, axisY - 6);
  ctx.lineTo(x(RANGE + 0.4) - 12, axisY + 6);
  ctx.closePath(); ctx.fillStyle = t.text; ctx.fill();
  // 刻度与数字
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let v = -RANGE; v <= RANGE; v += 1) {
    ctx.strokeStyle = t.text; ctx.lineWidth = v === 0 ? 2.5 : 1.5;
    ctx.beginPath(); ctx.moveTo(x(v), axisY - (v === 0 ? 9 : 6)); ctx.lineTo(x(v), axisY + (v === 0 ? 9 : 6)); ctx.stroke();
    if (v !== 0) { ctx.fillStyle = t.muted; ctx.fillText(String(v), x(v), axisY + 13); }
    // 半格小刻度
    ctx.strokeStyle = t.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x(v + 0.5), axisY - 3); ctx.lineTo(x(v + 0.5), axisY + 3); ctx.stroke();
  }
  ctx.fillStyle = t.text; ctx.fillText('0', x(0), axisY + 13);

  // 想一想：三要素标注
  if (mode === 'sanys') {
    ctx.fillStyle = t.gold; ctx.font = '600 15px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('原点', x(0) + 6, axisY - 34);
    ctx.fillText('单位长度（每格相等）', x(2.6), axisY + 44);
    ctx.fillText('正方向', x(RANGE - 0.2), axisY - 34);
    ctx.strokeStyle = t.gold; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x(0), axisY - 26); ctx.lineTo(x(0), axisY - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x(2.6), axisY + 38); ctx.lineTo(x(2.6), axisY + 10); ctx.stroke();
  }

  // 议一议：对称点 + 等距弧线
  if (mode === 'mirror') {
    const r = Math.abs(p) || 0.5;
    // 镜像点 -p
    dot(x(-p), axisY, 9, t.purple);
    ctx.fillStyle = t.purple; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '600 15px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.fillText(fmt(-p), x(-p), axisY + 13);
    // 等距弧线（原点两侧）
    ctx.strokeStyle = t.green; ctx.lineWidth = 3;
    arc(x(0), axisY, x(p), r, true);
    arc(x(0), axisY, x(-p), r, false);
    ctx.fillStyle = t.green; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('|' + fmt(p) + '| = ' + fmt(Math.abs(p)), x(p / 2), axisY - 30);
    ctx.fillText('|' + fmt(-p) + '| = ' + fmt(Math.abs(p)), x(-p / 2), axisY - 30);
  }

  // 金点 P
  dot(x(p), axisY, 11, t.gold);
  ctx.fillStyle = t.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = '700 16px "Noto Sans SC","PingFang SC",sans-serif';
  ctx.fillText(fmt(p), x(p), axisY - 34);
}

function dot(px, py, r, color) {
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
}
function arc(cx, cy, tx, r, upper) {
  ctx.beginPath();
  ctx.arc(cx, cy, Math.abs(tx - cx), upper ? Math.PI * 1.5 : Math.PI * 0.5, upper ? Math.PI * 2 : Math.PI * 1.5, upper);
  ctx.stroke();
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
  cmp.textContent = p > 0 ? '> 0（原点右侧）' : p < 0 ? '< 0（原点左侧）' : '= 0（在原点上）';
}

function buildUI(stage) {
  const style = document.createElement('style');
  style.textContent = STYLE;
  stage.appendChild(style);
  const ui = document.createElement('div');
  ui.id = 'nl-ui';
  ui.innerHTML = `
    <div id="nl-read">
      <div class="row"><span>点表示的数</span><b class="pos" id="nl-p"></b></div>
      <div class="row"><span>相反数</span><b class="opp" id="nl-opp"></b></div>
      <div class="row"><span>到原点距离 |数|</span><b class="abs" id="nl-abs"></b></div>
      <div class="row"><span>与 0 比较</span><b class="pos" id="nl-cmp"></b></div>
    </div>
    <div id="nl-tip">拖动金点改变位置；键盘 ←/→ 半格微调。</div>`;
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
    const toVal = (sx) => Math.max(-RANGE, Math.min(RANGE, Math.round(((sx - W / 2) / (W * 0.42)) * 2) / 2));
    cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); p = toVal(e.offsetX); readout(); draw(); });
    cv.addEventListener('pointermove', (e) => { if (drag) { p = toVal(e.offsetX); readout(); draw(); } });
    cv.addEventListener('pointerup', () => { drag = false; });
    // 方向键半格微调（翻页笔可用）
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
      if (e.key === 'ArrowRight') { p = Math.min(RANGE, p + 0.5); readout(); draw(); }
      else if (e.key === 'ArrowLeft') { p = Math.max(-RANGE, p - 0.5); readout(); draw(); }
    });

    api.onResize = resize;
    api.onTheme = draw;
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
  },
});
