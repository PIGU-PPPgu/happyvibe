// 场景原型 · 数轴（harness v2 场景库）
// 模式：sanys 三要素标注 | free 自由拖点 | mirror 相反数对称 | add 加法行程（两次移动）
// 数值同源：读数卡的每个值都由 fmt()/求值函数唯一产出，selftest 以「同源-」断言绑定。
export function mountNumberLine(stage, api, SPEC) {
  const CFG = Object.assign({ range: 6, step: 0.5, modes: ['sanys', 'free', 'mirror'], readouts: ['p', 'opp', 'abs', 'cmp'], bands: true, grid: true, labels: {} }, SPEC);
  const RANGE = CFG.range;
  let cv, ctx, W = 0, H = 0;
  let mode = CFG.modes[0];
  let p = 2;                 // free/mirror/sanys：金点表示的数
  let a = 3, b = -5;         // add：两次移动
  let drag = null;           // 'p' | 'a' | 'b'
  let pulseT = 0;

  const STYLE = `
#nl-ui{position:absolute;left:50%;transform:translateX(-50%);bottom:16px;z-index:6;display:flex;gap:26px;align-items:center;
  background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line);border-radius:16px;
  padding:12px 28px;backdrop-filter:blur(6px);box-shadow:0 8px 28px rgba(0,0,0,.35)}
#nl-read{display:flex;gap:26px}
#nl-read .stat{display:flex;flex-direction:column;gap:5px;align-items:center;min-width:68px}
#nl-read .lab{font-size:13.5px;color:var(--text-faint);letter-spacing:.05em;white-space:nowrap}
#nl-read .val{font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;line-height:1.1}
#nl-read .c1{color:var(--gold)}
#nl-read .c2{color:#B49BE3}
#nl-read .c3{color:#8FD4B0}
@media (max-width:760px){#nl-ui{left:10px;right:10px;transform:none;gap:14px;padding:10px 14px}#nl-read{gap:14px}#nl-read .val{font-size:22px}}
`;
  const READOUTS = {
    p:   { lab: '点表示的数', cls: 'c1', id: 'nl-p' },
    opp: { lab: '相反数',     cls: 'c2', id: 'nl-opp' },
    abs: { lab: '到原点距离', cls: 'c3', id: 'nl-abs' },
    cmp: { lab: '与 0 比较',  cls: 'c1', id: 'nl-cmp' },
    a:   { lab: '第一步',     cls: 'c1', id: 'nl-a' },
    b:   { lab: '第二步',     cls: 'c2', id: 'nl-b' },
    sum: { lab: '和（终点）', cls: 'c3', id: 'nl-sum' },
  };

  function theme() {
    const cs = getComputedStyle(document.documentElement);
    const v = (k, f) => cs.getPropertyValue(k).trim() || f;
    const light = document.documentElement.dataset.theme === 'light';
    return {
      text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'),
      gold: v('--gold', '#E8B04B'), purple: v('--purple', '#A66BA6'),
      line: v('--line', 'rgba(180,130,210,.3)'), back: v('--bg', '#140b20'),
      purpleHi: light ? '#8A4FB0' : '#C9A0E8', goldHi: light ? '#A66E10' : '#E8B04B',
      greenHi: light ? '#2E7D52' : '#7FBF9E', light,
    };
  }
  const fmt = (v) => {
    const s = Math.abs(v % 1) < 1e-9 ? String(Math.round(v)) : v.toFixed(1);
    return s === '-0' ? '0' : s;
  };
  const sum = () => Math.round((a + b) * 100) / 100;

  function draw() {
    const t = theme();
    const axisY = H * 0.63;
    const SCALE = W * 0.44;
    const x = (v) => W / 2 + v / RANGE * SCALE;
    ctx.clearRect(0, 0, W, H);
    const F = (w, px) => `${w} ${px}px "Noto Sans SC","PingFang SC",sans-serif`;

    if (CFG.bands) {
      const topY = H * 0.075, bandH = axisY - topY;
      const pa = t.light ? 0.32 : 0.16, pb = t.light ? 0.10 : 0.04;
      const gp = ctx.createLinearGradient(0, topY, 0, axisY);
      gp.addColorStop(0, `rgba(232,176,75,${pa})`); gp.addColorStop(1, `rgba(232,176,75,${pb})`);
      ctx.fillStyle = gp; ctx.fillRect(x(0), topY, x(RANGE + 0.25) - x(0), bandH);
      const na = t.light ? 0.28 : 0.17, nb = t.light ? 0.09 : 0.04;
      const gn = ctx.createLinearGradient(0, topY, 0, axisY);
      gn.addColorStop(0, `rgba(150,90,180,${na})`); gn.addColorStop(1, `rgba(150,90,180,${nb})`);
      ctx.fillStyle = gn; ctx.fillRect(x(-RANGE - 0.25), topY, x(0) - x(-RANGE - 0.25), bandH);
      if (CFG.grid) {
        ctx.strokeStyle = t.line; ctx.lineWidth = 1; ctx.globalAlpha = 0.38;
        for (let v = -RANGE; v <= RANGE; v += 1) {
          if (v === 0) continue;
          ctx.beginPath(); ctx.moveTo(x(v), topY + 4); ctx.lineTo(x(v), axisY - 8); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = F(700, 24);
      ctx.strokeStyle = t.back; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      const posLab = '正数区 · 大于 0', negLab = '负数区 · 小于 0';
      ctx.strokeText(posLab, (x(0) + x(RANGE)) / 2, topY + bandH * 0.26);
      ctx.strokeText(negLab, (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26);
      ctx.fillStyle = t.goldHi; ctx.fillText(posLab, (x(0) + x(RANGE)) / 2, topY + bandH * 0.26);
      ctx.fillStyle = t.purpleHi; ctx.fillText(negLab, (x(0) + x(-RANGE)) / 2, topY + bandH * 0.26);
      ctx.strokeStyle = t.line; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(x(0), topY); ctx.lineTo(x(0), axisY - 12); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = t.text; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x(-RANGE - 0.35), axisY); ctx.lineTo(x(RANGE + 0.35), axisY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x(RANGE + 0.35) + 2, axisY);
    ctx.lineTo(x(RANGE + 0.35) - 16, axisY - 9);
    ctx.lineTo(x(RANGE + 0.35) - 16, axisY + 9);
    ctx.closePath(); ctx.fillStyle = t.text; ctx.fill();

    const cur = mode === 'add' ? sum() : p;
    for (let v = -RANGE; v <= RANGE; v += 1) {
      const major = v === 0;
      ctx.strokeStyle = t.text; ctx.lineWidth = major ? 3.5 : 2.5;
      const th = major ? 15 : 10;
      ctx.beginPath(); ctx.moveTo(x(v), axisY - th); ctx.lineTo(x(v), axisY + th); ctx.stroke();
      ctx.strokeStyle = t.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x(v + 0.5), axisY - 5); ctx.lineTo(x(v + 0.5), axisY + 5); ctx.stroke();
      const near = v !== 0 && v === Math.round(cur);
      ctx.font = F(near || major ? 700 : 600, near ? 21 : 19);
      ctx.fillStyle = major ? '#7fbf9e' : near ? t.goldHi : t.muted;
      ctx.textBaseline = 'top'; ctx.textAlign = 'center';
      ctx.fillText(String(v), x(v), axisY + 20);
    }

    if (mode === 'sanys') {
      ctx.strokeStyle = t.goldHi; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x(0), axisY - 15); ctx.lineTo(x(0), axisY - 44); ctx.stroke();
      callout('原点 · 0', x(0), axisY - 62, t.goldHi, t.back);
      callout('正方向（向右为正）', x(RANGE - 0.55), axisY + 76, t.goldHi, t.back);
      ctx.beginPath(); ctx.moveTo(x(RANGE - 0.55), axisY + 64); ctx.lineTo(x(RANGE - 0.55), axisY + 15); ctx.stroke();
      const sy = axisY - 96;
      ctx.beginPath(); ctx.moveTo(x(1), sy + 10); ctx.lineTo(x(1), sy); ctx.lineTo(x(2), sy); ctx.lineTo(x(2), sy + 10); ctx.stroke();
      callout('单位长度 · 每格相等', x(1.5), sy - 16, t.goldHi, t.back);
    }

    if (mode === 'mirror') {
      const r = Math.abs(p) || 0.5;
      glowDot(x(-p), axisY, 13, t.purple, 12);
      pill(fmt(-p), x(-p), axisY + 56, t.purple, '#1c0f2a');
      spanMark(x(0), x(p), axisY - 100, t.greenHi, '|' + fmt(p) + '| = ' + fmt(r));
      spanMark(x(0), x(-p), axisY - 100, t.greenHi, '|' + fmt(-p) + '| = ' + fmt(r));
      ctx.strokeStyle = t.purple; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(x(p), axisY - 16); ctx.lineTo(x(-p), axisY - 16); ctx.stroke();
      ctx.setLineDash([]);
    }

    if (mode === 'add') {
      // 第一次移动：0 → a（金）；第二次移动：a → a+b（紫）；行者停在 a+b
      arrow(x(0), x(a), axisY - 26, t.goldHi, fmt(a));
      arrow(x(a), x(sum()), axisY - 26, t.purpleHi, fmt(b));
      glowDot(x(a), axisY, 12, t.gold, 10);
      glowDot(x(sum()), axisY, 15, t.purple, 22);
      pill(fmt(sum()), x(sum()), axisY - 58, t.purple, '#1c0f2a');
      if (a !== 0) pill(fmt(a), x(a), axisY + 44, t.gold, '#221430');
    }

    if (mode !== 'add') {
      const px = x(p);
      const breathe = 6 + 3 * Math.sin(pulseT / 480);
      ctx.beginPath(); ctx.arc(px, axisY, 22 + breathe, 0, Math.PI * 2);
      ctx.strokeStyle = t.light ? 'rgba(166,110,16,.45)' : 'rgba(232,176,75,.35)'; ctx.lineWidth = 2.5; ctx.stroke();
      glowDot(px, axisY, 15, t.gold, 22);
      ctx.strokeStyle = t.goldHi; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, axisY - 15); ctx.lineTo(px, axisY - 40); ctx.stroke();
      pill(fmt(p), px, axisY - 58, t.gold, '#221430');
    }
  }

  function glowDot(px, py, r, color, blur) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(px, py, r - 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.stroke();
  }
  function pill(text, cx, cy, bg, fg) {
    ctx.font = '700 20px "Noto Sans SC","PingFang SC",sans-serif';
    const w = ctx.measureText(text).width + 30, h = 34;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 1);
  }
  function callout(text, cx, cy, color, back) {
    ctx.font = '700 16px "Noto Sans SC","PingFang SC",sans-serif';
    const w = ctx.measureText(text).width + 22, h = 30;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 8);
    ctx.fillStyle = back; ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 1);
  }
  function spanMark(x1, x2, y, color, label) {
    const L = Math.min(x1, x2), R = Math.max(x1, x2);
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(L, y + 8); ctx.lineTo(L, y); ctx.lineTo(R, y); ctx.lineTo(R, y + 8); ctx.stroke();
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
  // 加法行程箭头：数值标在箭头中点上方
  function arrow(x1, x2, y, color, label) {
    const dir = Math.sign(x2 - x1) || 1;
    ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - dir * 14, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * 16, y - 8); ctx.lineTo(x2 - dir * 16, y + 8); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1, y + 6); ctx.lineTo(x1, y + 14); ctx.stroke();
    ctx.font = '700 21px "Noto Sans SC","PingFang SC",sans-serif';
    const ly = y - 14;
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.strokeText(label, (x1 + x2) / 2, ly);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, (x1 + x2) / 2, ly);
  }

  function readout() {
    const q = (id) => document.getElementById(id);
    if (!q('nl-read')) return;
    if (mode === 'add') {
      if (q('nl-a')) q('nl-a').textContent = fmt(a);
      if (q('nl-b')) q('nl-b').textContent = fmt(b);
      if (q('nl-sum')) q('nl-sum').textContent = fmt(sum());
      if (q('nl-cmp')) q('nl-cmp').textContent = sum() > 0 ? '> 0 · 右侧' : sum() < 0 ? '< 0 · 左侧' : '= 0 · 原点';
    } else {
      if (q('nl-p')) q('nl-p').textContent = fmt(p);
      if (q('nl-opp')) q('nl-opp').textContent = fmt(-p);
      if (q('nl-abs')) q('nl-abs').textContent = fmt(Math.abs(p));
      if (q('nl-cmp')) q('nl-cmp').textContent = p > 0 ? '> 0 · 右侧' : p < 0 ? '< 0 · 左侧' : '= 0 · 原点';
    }
  }

  function buildUI() {
    const style = document.createElement('style');
    style.textContent = STYLE;
    stage.appendChild(style);
    const ui = document.createElement('div');
    ui.id = 'nl-ui';
    ui.innerHTML = `<div id="nl-read">${CFG.readouts.map((k) => {
      const r = READOUTS[k];
      const lab = CFG.labels[k] || r.lab;   // 课题可覆盖读数标签（如减法课显示「差」）
      return `<div class="stat"><span class="lab">${lab}</span><b class="val ${r.cls}" id="${r.id}"></b></div>`;
    }).join('')}</div>`;
    stage.appendChild(ui);
    readout();
  }

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  const toVal = (sx) => Math.max(-RANGE, Math.min(RANGE, Math.round(((sx - W / 2) / (W * 0.44)) / CFG.step) * CFG.step));
  const snap = (v) => Math.max(-RANGE, Math.min(RANGE, Math.round(v / CFG.step) * CFG.step));

  cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
  stage.appendChild(cv);
  ctx = cv.getContext('2d');
  buildUI();
  resize();

  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    if (mode === 'add') {
      const axisY = H * 0.63, sy = axisY - 26;
      drag = Math.abs(e.offsetY - sy) < 46 ? (Math.abs(e.offsetX - (W / 2 + a / RANGE * W * 0.44)) < Math.abs(e.offsetX - (W / 2 + sum() / RANGE * W * 0.44)) ? 'a' : 'b') : 'b';
      if (drag === 'a') a = snap(toVal(e.offsetX));
      else b = snap(Math.round((toVal(e.offsetX) - a) / CFG.step) * CFG.step);
    } else {
      drag = 'p';
      p = toVal(e.offsetX);
    }
    readout(); draw();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (drag === 'p') p = toVal(e.offsetX);
    else if (drag === 'a') a = snap(toVal(e.offsetX));
    else b = snap(Math.round((toVal(e.offsetX) - a) / CFG.step) * CFG.step);
    readout(); draw();
  });
  cv.addEventListener('pointerup', () => { drag = null; });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
    if (mode === 'add') {
      if (e.key === 'ArrowRight') b = snap(b + CFG.step);
      else if (e.key === 'ArrowLeft') b = snap(b - CFG.step);
      else return;
    } else {
      if (e.key === 'ArrowRight') p = toVal(W / 2 + (p + CFG.step) / RANGE * W * 0.44);
      else if (e.key === 'ArrowLeft') p = toVal(W / 2 + (p - CFG.step) / RANGE * W * 0.44);
      else return;
    }
    readout(); draw();
  });

  const loop = (t) => { pulseT = t; if (!document.hidden) draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  api.onResize = resize;
  api.onTheme = draw;
  api.setNlMode = (m) => { if (CFG.modes.includes(m)) { mode = m; readout(); draw(); } };
  // 环节预设：设置两次移动的值（供「议一议」等环节做换序/对比演示）
  api.setNlAdd = (x, y) => { a = Math.round(x / CFG.step) * CFG.step; b = Math.round(y / CFG.step) * CFG.step; readout(); draw(); };

  // 数值同源断言：读数卡全部值必须与 fmt/求值函数一致（edulab 原则）
  if (new URLSearchParams(location.search).has('selftest')) {
    const push = window.__hvPushCheck;
    if (push) {
      const bad = [];
      const txt = (id) => { const el = document.getElementById(id); return el ? el.textContent : null; };
      if (CFG.modes.includes('add')) {
        api.setNlMode('add');
        for (const [x, y] of [[3, -5], [-2, 4], [1.5, 1.5], [-4, -1.5], [0, 2.5]]) {
          a = x; b = y; readout();
          if (txt('nl-a') !== fmt(a)) bad.push(`a=${x} 读 ${txt('nl-a')}`);
          if (txt('nl-b') !== fmt(b)) bad.push(`b=${y} 读 ${txt('nl-b')}`);
          if (txt('nl-sum') !== fmt(a + b)) bad.push(`${x}+${y} 读 ${txt('nl-sum')} 应 ${fmt(a + b)}`);
        }
        push('同源-加法读数', bad.length === 0, bad.join('；') || '5 组移动：第一步、第二步、和均与计算函数同源');
        a = 3; b = -5; api.setNlMode('add');
      } else {
        for (const v of [3.5, -4, 0, 2.5, -0.5]) {
          p = v; readout();
          if (txt('nl-p') !== fmt(v)) bad.push(`p=${v} 读 ${txt('nl-p')}`);
          if (txt('nl-opp') !== fmt(-v)) bad.push(`p=${v} 相反数 ${txt('nl-opp')}`);
          if (txt('nl-abs') !== fmt(Math.abs(v))) bad.push(`p=${v} 距离 ${txt('nl-abs')}`);
        }
        push('同源-读数板', bad.length === 0, bad.join('；') || '5 组位置：数、相反数、距离全部同源');
        p = 2;
      }
      const modes = [];
      for (const m of CFG.modes) { api.setNlMode(m); modes.push(m === mode); }
      api.setNlMode(CFG.modes[0]);
      push('环节模式切换', modes.every(Boolean), `${CFG.modes.join('/')} 随环节生效`);
      readout(); draw();
    }
  }
}
