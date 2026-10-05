import { init } from '../../_shared/runtime.mjs';

// 《天净沙·秋思》意境长卷：横向拖动浏览，点击景物出诗句，滑杆推移暮色
const POEM = [
  ['枯藤老树昏鸦', ['枯藤', '老树', '昏鸦']],
  ['小桥流水人家', ['小桥', '流水', '人家']],
  ['古道西风瘦马', ['古道', '西风', '瘦马']],
  ['夕阳西下，断肠人在天涯', ['夕阳', '断肠人']],
];

// 世界坐标（长 4200，地平线 y=0，向上为负）
const SCENES = [
  { word: '枯藤', x: 380, y: -210, r: 70 },
  { word: '老树', x: 620, y: -120, r: 110 },
  { word: '昏鸦', x: 700, y: -260, r: 55 },
  { word: '小桥', x: 1350, y: -40, r: 90 },
  { word: '流水', x: 1550, y: 10, r: 80 },
  { word: '人家', x: 1880, y: -120, r: 100 },
  { word: '古道', x: 2450, y: 30, r: 100 },
  { word: '西风', x: 2700, y: -200, r: 80 },
  { word: '瘦马', x: 2950, y: -60, r: 90 },
  { word: '夕阳', x: 3560, y: -300, r: 90 },
  { word: '断肠人', x: 3300, y: -50, r: 70 },
];

const WORLD_W = 4200;
let canvas, ctx, cam = { x: 0 }, dusk = 0.35, selected = null, W = 0, H = 0, dpr = 1, groundY = 0;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return { text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'), gold: v('--gold', '#feb300'), panel: v('--panel', '#1e1433'), line: v('--line', 'rgba(180,130,210,.16)') };
}

function toScreen(wx, wy) { return [wx - cam.x, groundY + wy]; }

function draw() {
  const t = theme();
  ctx.clearRect(0, 0, W, H);
  groundY = H * 0.78;

  // 天空：随暮色由暖金转深紫
  const d = dusk;
  const grad = ctx.createLinearGradient(0, 0, 0, groundY);
  const top = mix('#8a5a3a', '#150e22', d);
  const mid = mix('#e8a24a', '#271a42', d);
  const near = mix('#f4c26b', '#1e1433', d);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, near);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, groundY);

  // 远山（两层的剪影，颜色随暮色变深）
  hills(mix('#7a4a3a', '#241a38', d), 0.55, 130);
  hills(mix('#4a2f33', '#1a1230', d), 0.7, 80);

  // 夕阳（暮色越大越低）
  const sunX = 3560, sunY = -300 + d * 90;
  const [sx, sy] = toScreen(sunX, sunY);
  ctx.beginPath();
  ctx.arc(sx, sy, 46, 0, Math.PI * 2);
  ctx.fillStyle = mix('#ffd98a', '#b3542a', d);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(sx, sy, 80, 0, Math.PI * 2);
  ctx.fillStyle = mix('#ffb347', '#8a2f3a', d);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 地面
  ctx.fillStyle = mix('#3a2a2a', '#120c1e', d);
  ctx.fillRect(0, groundY, W, H - groundY);

  ctx.strokeStyle = t.text;
  ctx.fillStyle = t.text;
  ctx.lineCap = 'round';

  drawVine();
  drawTree();
  drawCrows();
  drawBridge();
  drawWater();
  drawHouse();
  drawRoad();
  drawWind();
  drawHorse();
  drawWalker();

  // 选中高亮
  if (selected) {
    const [hx, hy] = toScreen(selected.x, selected.y);
    ctx.beginPath();
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = t.gold;
    ctx.arc(hx, hy, selected.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = t.gold;
    ctx.font = `700 17px 'Noto Sans SC','PingFang SC',sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(selected.word, hx, hy - selected.r - 12);
  }

  // 暮色整体压暗
  if (d > 0) {
    ctx.fillStyle = `rgba(18, 10, 30, ${d * 0.38})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function mix(a, b, k) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hills(color, hFrac, amp) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= W; x += 24) {
    const wx = x + cam.x;
    const y = groundY - amp * (0.5 + 0.5 * Math.sin(wx * 0.0016) * Math.cos(wx * 0.0007 + 2));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawVine() {
  const [x0, y0] = toScreen(380, -210);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 - 60, y0 + 120);
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    ctx.lineTo(x0 - 60 + k * 120, y0 + 120 - k * 190 + Math.sin(k * 9) * 16);
  }
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const k = i / 6;
    const bx = x0 - 60 + k * 120, by = y0 + 120 - k * 190 + Math.sin(k * 9) * 16;
    ctx.beginPath();
    ctx.arc(bx, by, 9 - i * 0.6, 0.4, 4.2);
    ctx.stroke();
  }
}

function branch(x, y, ang, len, depth) {
  if (depth === 0 || len < 6) return;
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  ctx.lineWidth = Math.max(1.2, depth * 1.4);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  branch(x2, y2, ang - 0.42 - Math.random() * 0.15, len * 0.72, depth - 1);
  branch(x2, y2, ang + 0.38 + Math.random() * 0.15, len * 0.7, depth - 1);
  if (depth > 3) branch(x2, y2, ang + 0.05, len * 0.5, depth - 2);
}

function drawTree() {
  const [x, y] = toScreen(620, 0);
  branch(x, y, -Math.PI / 2 + 0.06, 62, 6);
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x + 2, y - 40);
  ctx.stroke();
}

function crow(x, y, s) {
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y);
  ctx.quadraticCurveTo(x - 5 * s, y - 7 * s, x, y - 1 * s);
  ctx.quadraticCurveTo(x + 5 * s, y - 7 * s, x + 11 * s, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + 1 * s, 3.2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrows() {
  const [x, y] = toScreen(700, -260);
  crow(x, y, 1);
  crow(x - 34, y - 18, 0.8);
  crow(x + 30, y - 26, 0.7);
}

function drawBridge() {
  const [x, y] = toScreen(1350, -40);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 90, y);
  ctx.quadraticCurveTo(x, y - 78, x + 90, y);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (const dx of [-58, 0, 58]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 30 + Math.abs(dx) * 0.22);
    ctx.lineTo(x + dx, y + 34);
    ctx.stroke();
  }
}

function drawWater() {
  const t = theme();
  const [cx, cy] = toScreen(1550, 10);
  ctx.strokeStyle = t.gold;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 2.2;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      const x = cx - 130 + k * 260;
      const y = cy + 18 + r * 26 + Math.sin(k * 12 + r * 2) * 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = t.text;
}

function drawHouse() {
  const [x, y] = toScreen(1880, 0);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 70, y - 66);
  ctx.lineTo(x, y - 118);
  ctx.lineTo(x + 70, y - 66);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeRect(x - 52, y - 66, 104, 66);
  const t = theme();
  ctx.fillStyle = t.gold;
  ctx.globalAlpha = 0.9 - dusk * 0.35;
  ctx.fillRect(x + 14, y - 46, 24, 22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = t.text;
}

function drawRoad() {
  const t = theme();
  ctx.strokeStyle = mix('#6b5a4a', '#241a33', dusk);
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 66);
  ctx.quadraticCurveTo(W / 2, groundY + 26, W, groundY + 78);
  ctx.stroke();
  ctx.strokeStyle = t.text;
}

function drawWind() {
  const [cx, cy] = toScreen(2700, -200);
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = cx + i * 26, y = cy + Math.sin(i) * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 16, y - 12, x + 30, y - 2);
    ctx.quadraticCurveTo(x + 18, y + 2, x + 34, y + 10);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const x = cx - 60 + i * 34, y = cy + 60 + (i % 3) * 22;
    leaf(x, y, i * 1.7);
  }
}

function leaf(x, y, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHorse() {
  const [x, y] = toScreen(2950, 0);
  ctx.lineWidth = 3;
  ctx.beginPath();
  // 瘦马剪影：身体、颈、头、腿、尾
  ctx.moveTo(x - 60, y - 58);
  ctx.lineTo(x + 34, y - 64);
  ctx.lineTo(x + 58, y - 34);
  ctx.lineTo(x + 44, y - 6);
  ctx.lineTo(x - 52, y - 10);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 34, y - 62);
  ctx.lineTo(x + 66, y - 104);
  ctx.lineTo(x + 88, y - 96);
  ctx.stroke();
  for (const [lx, off] of [[-44, -8], [-24, -6], [26, -8], [44, -2]]) {
    ctx.beginPath();
    ctx.moveTo(x + lx, y - 10);
    ctx.lineTo(x + lx + off, y + 34);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - 60, y - 56);
  ctx.quadraticCurveTo(x - 86, y - 40, x - 78, y - 12);
  ctx.stroke();
}

function drawWalker() {
  const [x, y] = toScreen(3300, 0);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 78, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 70);
  ctx.lineTo(x - 2, y - 34);
  ctx.moveTo(x - 2, y - 34);
  ctx.lineTo(x - 12, y + 2);
  ctx.moveTo(x - 2, y - 34);
  ctx.lineTo(x + 10, y + 2);
  ctx.moveTo(x - 1, y - 62);
  ctx.lineTo(x - 20, y - 44);
  ctx.moveTo(x - 1, y - 60);
  ctx.lineTo(x + 18, y - 50);
  ctx.moveTo(x + 18, y - 50);
  ctx.lineTo(x + 24, y - 66);
  ctx.stroke();
}

// ---------- 诗句面板（HTML） ----------
let verseEl;
function buildUI(stage) {
  const t = theme();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:20;display:flex;flex-direction:column;gap:10px;align-items:center;max-width:94vw';
  verseEl = document.createElement('div');
  verseEl.style.cssText = `padding:12px 20px;background:${t.panel};border:1px solid ${t.line};border-radius:10px;font-size:17px;line-height:1.9;text-align:center`;
  wrap.appendChild(verseEl);
  const ctl = document.createElement('div');
  ctl.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px';
  ctl.innerHTML = '<span style="font-size:15px;color:var(--muted)">晨</span><input id="dusk" type="range" min="0" max="100" value="35" style="width:200px;accent-color:var(--gold)" aria-label="暮色"><span style="font-size:15px;color:var(--muted)">暮</span>';
  wrap.appendChild(ctl);
  stage.appendChild(wrap);
  ctl.querySelector('#dusk').addEventListener('input', (e) => {
    dusk = e.target.value / 100;
    draw();
  });
  renderVerse(null);
}

function renderVerse(word) {
  const html = POEM.map(([line, words]) => {
    const parts = splitLine(line, words, word);
    return parts.map((p) => (p.hl ? `<span style="color:var(--gold);font-weight:700">${p.t}</span>` : p.t)).join('');
  }).join('<br>');
  const title = '<span style="color:var(--muted);font-size:14px">《天净沙·秋思》 马致远</span><br>';
  verseEl.innerHTML = title + html;
}

function splitLine(line, words, hl) {
  // 按词切行：先找所有词的位置，按顺序切
  const segs = [];
  let rest = line;
  for (const w of words) {
    const i = rest.indexOf(w);
    if (i < 0) continue;
    if (i > 0) segs.push({ t: rest.slice(0, i) });
    segs.push({ t: w, hl: w === hl });
    rest = rest.slice(i + w.length);
  }
  if (rest) segs.push({ t: rest });
  return segs.length ? segs : [{ t: line }];
}

init({
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');

    const resize = () => {
      dpr = Math.min(devicePixelRatio, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    resize();
    api.onResize = resize;
    api.onTheme = () => { draw(); };

    buildUI(stage);

    let dragging = false, lastX = 0, moved = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      moved += Math.abs(dx);
      cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x - dx));
      lastX = e.clientX;
      draw();
    });
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      if (moved < 6) {
        const wx = e.clientX + cam.x;
        const hit = SCENES.find((s) => Math.hypot(wx - s.x, groundY + e.clientY - (groundY + s.y)) < s.r);
        selected = hit && hit !== selected ? hit : null;
        renderVerse(selected ? selected.word : null);
        draw();
      }
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x + (e.deltaY + e.deltaX) * 0.8));
      draw();
    }, { passive: false });
  },
});
