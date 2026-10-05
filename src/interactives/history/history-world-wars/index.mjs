import { init } from '../../_shared/runtime.mjs';

// 两次世界大战时间线：一战/战间期/二战三行泳道，凡尔赛-华盛顿体系标注，因果连线
const Y0 = 1913, Y1 = 1946.5;
const LANES = [
  { name: '一战', sub: '1914-1918', color: '#9d8cff' },
  { name: '战间期', sub: '1919-1938', color: '#feb300' },
  { name: '二战', sub: '1931/1939-1945', color: '#e26a6a' },
];

const EVENTS = [
  { y: 1914.48, t: '萨拉热窝事件', lane: 0, d: '1914 年 6 月 28 日，奥匈帝国皇储斐迪南大公夫妇在萨拉热窝遇刺，成为第一次世界大战的导火线。' },
  { y: 1914.55, t: '一战爆发', lane: 0, d: '1914 年 7 月底奥匈帝国向塞尔维亚宣战，德、俄、法、英相继参战。交战一方为同盟国（德国、奥匈帝国等），另一方为协约国（英、法、俄等）。' },
  { y: 1916.1, t: '凡尔登战役', lane: 0, d: '1916 年德法双方在凡尔登展开血战，伤亡七十多万，被称为「绞肉机」「屠场」「地狱」，是一战中最残酷的战役之一。' },
  { y: 1917.4, t: '美国参战', lane: 0, d: '1917 年美国对德宣战，加入协约国一方参战；中国也于同年参加协约国一方。' },
  { y: 1917.85, t: '俄国退出', lane: 0, d: '1917 年 11 月俄国十月革命胜利，新生的苏维埃政权提出退出战争，1918 年 3 月正式退出大战。' },
  { y: 1918.85, t: '一战结束', lane: 0, d: '1918 年 11 月 11 日德国签署停战协定，第一次世界大战以同盟国的失败而告终。大战历时四年多，给各国人民带来深重灾难。' },
  { y: 1919.4, t: '巴黎和会', lane: 1, d: '1919 年 1-6 月战胜国在巴黎召开和会，签订处置德国的《凡尔赛条约》。中国代表提出的正当要求遭到拒绝，引发五四运动。' },
  { y: 1921.9, y2: 1922.15, t: '华盛顿会议', lane: 1, d: '1921-1922 年美、英、日等九国召开华盛顿会议，签订《九国公约》等，使中国回复到几个帝国主义国家共同支配的局面。' },
  { y: 1929.7, y2: 1933.2, t: '经济大危机', lane: 1, d: '1929-1933 年从美国开始的经济危机席卷整个资本主义世界，特点为波及范围特别广、持续时间比较长、破坏性特别大。' },
  { y: 1933.2, t: '罗斯福新政', lane: 1, d: '1933 年罗斯福就任美国总统，宣布实施新政，采用国家干预手段扭转经济形势。美国经济缓慢复苏，资本主义制度得到调整。' },
  { y: 1933.9, t: '希特勒上台', lane: 1, d: '经济危机沉重打击德国，以希特勒为首的纳粹党趁机扩张势力。1933 年希特勒出任德国总理，建立法西斯专政，第二次世界大战的欧洲战争策源地形成。' },
  { y: 1936.6, t: '日本军部法西斯', lane: 1, d: '1936 年广田弘毅内阁上台，以军部为核心的日本法西斯专政建立，亚洲战争策源地形成。' },
  { y: 1938.7, t: '慕尼黑阴谋', lane: 1, d: '1938 年 9 月英、法与德、意签订慕尼黑协定，把捷克斯洛伐克的苏台德区割让给德国，绥靖政策达到顶峰，法西斯侵略气焰被大大助长。' },
  { y: 1931.7, t: '九一八事变', lane: 2, d: '1931 年 9 月 18 日日本侵占中国东北。九一八事变成为中国人民抗日战争的起点，揭开了世界反法西斯战争的序幕。' },
  { y: 1937.55, t: '七七事变', lane: 2, d: '1937 年 7 月 7 日日本发动全面侵华战争，中国开始全民族抗战，开辟了世界反法西斯战争的东方主战场。' },
  { y: 1939.68, t: '德国闪击波兰', lane: 2, d: '1939 年 9 月 1 日德国以「闪电战」突袭波兰，英法对德宣战，第二次世界大战全面爆发。' },
  { y: 1942.02, t: '联合国家宣言', lane: 2, d: '1942 年 1 月 1 日美、英、苏、中等 26 国签署《联合国家宣言》，世界反法西斯同盟正式形成。' },
  { y: 1942.55, y2: 1943.15, t: '斯大林格勒保卫战', lane: 2, d: '1942 年 7 月-1943 年 2 月苏军取得斯大林格勒保卫战胜利，成为第二次世界大战的重要转折点。' },
  { y: 1944.45, t: '诺曼底登陆', lane: 2, d: '1944 年 6 月美英盟军在法国诺曼底登陆，开辟了欧洲第二战场，德国陷入东西两线作战。' },
  { y: 1945.08, t: '雅尔塔会议', lane: 2, d: '1945 年 2 月美、英、苏三国首脑在雅尔塔会商战后安排，决定战后成立联合国。' },
  { y: 1945.36, t: '德国投降', lane: 2, d: '1945 年 5 月 8 日德国正式签署无条件投降书，欧洲战事结束。' },
  { y: 1945.7, t: '日本投降 二战结束', lane: 2, d: '1945 年 8 月 15 日日本宣布无条件投降，9 月 2 日签署投降书，第二次世界大战结束。同年 10 月联合国正式成立。' },
];

// 因果连线（按事件标题引用）
const CONNECTS = [
  { a: '一战结束', b: '巴黎和会', label: '处置战败国' },
  { a: '巴黎和会', b: '希特勒上台', label: '对德苛刻埋下复仇种子' },
  { a: '经济大危机', b: '罗斯福新政', label: '国家干预应对' },
  { a: '经济大危机', b: '希特勒上台', label: '危机助长法西斯' },
  { a: '慕尼黑阴谋', b: '德国闪击波兰', label: '绥靖纵容侵略' },
];

const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;
let canvas, ctx, W = 0, H = 0, dpr = 1;
const view = { z: 1, off: 0 };
let sel = -1;
let showLinks = true;
let drawn = [];
let cardW = [];
const PAD = 20, LABEL_W = 100;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return {
    bg: v('--bg', '#150e22'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'),
    line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#feb300'),
    panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'),
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function ppy() { return ((W - PAD * 2 - LABEL_W) / (Y1 - Y0)) * view.z; }
function xOf(y) { return LABEL_W + PAD + (y - Y0) * ppy() - view.off; }

function layout() {
  const top = 16, bottom = H - 150;
  const axisH = 34;
  const laneH = (bottom - top - axisH) / LANES.length;
  return { top, laneY0: top, laneH, axisY: top + laneH * LANES.length, bottom };
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
let TH = null;
function labelBG(text, x, y, padX, alpha) {
  const w = ctx.measureText(text).width;
  const c = [21, 14, 34];
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  ctx.fillRect(x - w / 2 - padX, y - 13, w + padX * 2, 26);
}

function draw() {
  const t = theme();
  TH = t;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  const L = layout();
  drawn = [];

  ctx.save();
  ctx.beginPath();
  ctx.rect(LABEL_W, 0, W - LABEL_W, H);
  ctx.clip();

  // 战争区间底色
  const warBands = [
    { a: 1914.4, b: 1918.95, lane: 0 }, { a: 1931.5, b: 1945.9, lane: 2 },
  ];
  for (const wb of warBands) {
    const cy = L.laneY0 + L.laneH * wb.lane;
    const xa = Math.max(xOf(wb.a), LABEL_W), xb = Math.min(xOf(wb.b), W);
    if (xb > xa) {
      ctx.fillStyle = 'rgba(226,106,106,0.08)';
      ctx.fillRect(xa, cy, xb - xa, L.laneH);
    }
  }

  // 凡尔赛-华盛顿体系标注（战间期带内）
  const sysA = Math.max(xOf(1919.1), LABEL_W + 2), sysB = Math.min(xOf(1922.5), W - 2);
  const sysY = L.laneY0 + L.laneH * 1 + 8;
  if (sysB > sysA + 30) {
    ctx.strokeStyle = t.gold;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(sysA, sysY, sysB - sysA, L.laneH - 16);
    ctx.setLineDash([]);
    const cx = (sysA + sysB) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 17px ${FONT}`;
    labelBG('凡尔赛-华盛顿体系', cx, sysY + L.laneH / 2 - 8, 8, 0.55);
    ctx.fillStyle = t.gold;
    ctx.fillText('凡尔赛-华盛顿体系', cx, sysY + L.laneH / 2 - 8);
    ctx.font = `16px ${FONT}`;
    labelBG('一战后国际秩序', cx, sysY + L.laneH / 2 + 16, 6, 0.5);
    ctx.fillStyle = t.muted;
    ctx.fillText('一战后国际秩序', cx, sysY + L.laneH / 2 + 16);
  }

  // 泳道与事件卡
  for (let li = 0; li < LANES.length; li++) {
    const cy = L.laneY0 + L.laneH * li + L.laneH / 2;
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LABEL_W, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();

    const evs = EVENTS.map((e, i) => ({ e, i })).filter((o) => o.e.lane === li).sort((a, b) => a.e.y - b.e.y);
    const lastX = [-1e9, -1e9];
    for (const { e, i } of evs) {
      const cx = xOf(e.y + (e.y2 ? (e.y2 - e.y) / 2 : 0));
      const w = cardW[i];
      let side = -1;
      if (cx - w / 2 - lastX[0] > 12 && lastX[0] <= lastX[1]) side = 0;
      else if (cx - w / 2 - lastX[1] > 12) side = 1;
      if (side < 0) continue;
      lastX[side] = cx + w / 2;

      if (e.y2) {
        const xa = xOf(e.y), xb = xOf(e.y2);
        ctx.fillStyle = LANES[li].color;
        ctx.globalAlpha = 0.55;
        roundRect(Math.max(xa, LABEL_W + 2), cy - 4, Math.min(xb, W - 4) - Math.max(xa, LABEL_W + 2), 8, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = LANES[li].color;
        ctx.fill();
      }
      const cy2 = side === 0 ? cy - 26 : cy + 26;
      ctx.strokeStyle = LANES[li].color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const ch = 44;
      const cardY = side === 0 ? cy2 - ch : cy2;
      const isSel = sel === i;
      ctx.fillStyle = t.panel;
      roundRect(cx - w / 2, cardY, w, ch, 8);
      ctx.fill();
      ctx.strokeStyle = isSel ? t.gold : LANES[li].color;
      ctx.lineWidth = isSel ? 2.4 : 1.4;
      ctx.stroke();
      ctx.fillStyle = LANES[li].color;
      ctx.font = `700 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const yr = e.y2 ? `${Math.floor(e.y)}-${Math.floor(e.y2)}` : String(Math.floor(e.y));
      ctx.fillText(yr, cx, cardY + 13, w - 14);
      ctx.fillStyle = t.text;
      ctx.font = `700 17px ${FONT}`;
      ctx.fillText(e.t, cx, cardY + 31, w - 14);
      drawn.push({ x: cx - w / 2, y: cardY, w, h: ch, i, cx, cy });
    }
  }

  // 因果连线
  if (showLinks) {
    for (const cn of CONNECTS) {
      const A = drawn.find((d) => EVENTS[d.i].t === cn.a);
      const B = drawn.find((d) => EVENTS[d.i].t === cn.b);
      if (!A || !B) continue;
      const x1 = A.cx, y1 = A.y + A.h / 2, x2 = B.cx, y2 = B.y + B.h / 2;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (Math.abs(y1 - y2) < 30 ? 52 : 0);
      ctx.strokeStyle = t.gold;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      // 箭头
      const ang = Math.atan2(y2 - my, x2 - mx);
      ctx.beginPath();
      ctx.moveTo(x2 + Math.cos(ang) * 8, y2 + Math.sin(ang) * 8);
      ctx.lineTo(x2 + Math.cos(ang + 2.6) * 9, y2 + Math.sin(ang + 2.6) * 9);
      ctx.lineTo(x2 + Math.cos(ang - 2.6) * 9, y2 + Math.sin(ang - 2.6) * 9);
      ctx.closePath();
      ctx.fillStyle = t.gold;
      ctx.fill();
      // 标签
      const lx = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
      const ly = 0.25 * y1 + 0.5 * my + 0.25 * y2;
      ctx.font = `16px ${FONT}`;
      labelBG(cn.label, lx, ly, 6, 0.55);
      ctx.fillStyle = t.gold;
      ctx.textAlign = 'center';
      ctx.fillText(cn.label, lx, ly);
    }
  }

  // 时间刻度
  ctx.strokeStyle = t.muted;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(LABEL_W, L.axisY);
  ctx.lineTo(W, L.axisY);
  ctx.stroke();
  ctx.font = `16px ${FONT}`;
  const step = view.z >= 5 ? 1 : view.z >= 2 ? 5 : 10;
  for (let yr = Math.ceil(Y0); yr <= 1946; yr += step) {
    const x = xOf(yr);
    if (x < LABEL_W || x > W) continue;
    const major = yr % 10 === 0;
    ctx.beginPath();
    ctx.moveTo(x, L.axisY);
    ctx.lineTo(x, L.axisY + (major ? 10 : 6));
    ctx.strokeStyle = t.muted;
    ctx.stroke();
    if (major || view.z >= 2) {
      ctx.fillStyle = major ? t.text : t.muted;
      ctx.textAlign = 'center';
      ctx.fillText(String(yr), x, L.axisY + (major ? 24 : 22));
    }
  }
  ctx.restore();

  // 泳道标签
  for (let li = 0; li < LANES.length; li++) {
    const cy = L.laneY0 + L.laneH * li + L.laneH / 2;
    ctx.fillStyle = t.panel;
    roundRect(10, cy - 34, LABEL_W - 18, 68, 10);
    ctx.fill();
    ctx.strokeStyle = LANES[li].color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = LANES[li].color;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(LANES[li].name, 10 + (LABEL_W - 18) / 2, cy - 10);
    ctx.fillStyle = t.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(LANES[li].sub, 10 + (LABEL_W - 18) / 2, cy + 14);
  }
}

let els = {};
function buildPanel(stage) {
  const st = document.createElement('style');
  st.textContent = `
    #wp{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;
      background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:10px 18px 12px;max-width:min(820px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3);
      text-align:center}
    #wp .r1{display:flex;align-items:baseline;gap:10px;justify-content:center;flex-wrap:wrap}
    #wp .yr{color:var(--gold);font-weight:700;font-size:20px}
    #wp .tt{font-weight:700;font-size:19px}
    #wp .tx{font-size:16px;color:var(--muted);margin-top:4px;line-height:1.5}
    #wp .r3{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:8px}
    #wp button{font:inherit;touch-action:manipulation}
    .qb{font-size:17px;line-height:1;padding:9px 16px;border-radius:6px;border:1px solid var(--line);
      background:var(--panel2);color:var(--text);cursor:pointer}
    .qb:hover{border-color:var(--gold)}
  `;
  stage.appendChild(st);
  const p = document.createElement('div');
  p.id = 'wp';
  p.innerHTML = `
    <div class="r1"><span class="yr"></span><span class="tt"></span></div>
    <div class="tx"></div>
    <div class="r3"><button class="qb" id="links" type="button">连线</button></div>`;
  stage.appendChild(p);
  els = { yr: p.querySelector('.yr'), tt: p.querySelector('.tt'), tx: p.querySelector('.tx') };
  p.querySelector('#links').addEventListener('click', (e) => {
    showLinks = !showLinks;
    e.target.textContent = showLinks ? '连线' : '隐线';
    draw();
  });
  updatePanel();
}
function updatePanel() {
  if (sel >= 0) {
    const e = EVENTS[sel];
    els.yr.textContent = e.y2 ? `${Math.floor(e.y)}-${Math.floor(e.y2)} 年` : `${Math.floor(e.y)} 年`;
    els.tt.textContent = `${e.t}（${LANES[e.lane].name}）`;
    els.tx.textContent = e.d;
  } else {
    els.yr.textContent = '1914-1945';
    els.tt.textContent = '两次世界大战时间线';
    els.tx.textContent = '三行泳道：一战、战间期、二战。金色虚线为因果连线，战间期方框为凡尔赛-华盛顿体系。拖动平移，滚轮缩放，点击卡片看详情。';
  }
}

init({
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');
    buildPanel(stage);

    const measure = () => {
      ctx.font = `700 17px ${FONT}`;
      cardW = EVENTS.map((e) => {
        const yr = e.y2 ? `${Math.floor(e.y)}-${Math.floor(e.y2)}` : String(Math.floor(e.y));
        return Math.max(78, Math.min(160, Math.max(ctx.measureText(e.t).width, ctx.measureText(yr).width * 16 / 17) + 22));
      });
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      draw();
    };
    resize();
    api.onResize = resize;
    api.onTheme = draw;

    const clampOff = () => {
      view.off = clamp(view.off, 0, Math.max(0, (Y1 - Y0) * ppy() - (W - LABEL_W - PAD)));
    };
    const zoomAt = (mx, f) => {
      const yearAt = view.off + (mx - LABEL_W - PAD) / ppy();
      view.z = clamp(view.z * f, 1, 14);
      clampOff();
      view.off = clamp(yearAt - (mx - LABEL_W - PAD) / ppy(), 0, Math.max(0, (Y1 - Y0) * ppy() - (W - LABEL_W - PAD)));
      draw();
    };

    const pointers = new Map();
    let dragging = false, lastX = 0, moved = 0, pinch0 = 0, z0 = 1;
    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 1) { dragging = true; lastX = e.clientX; moved = 0; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.abs(a - b); z0 = view.z;
      }
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.abs(a - b);
        if (d > 10 && pinch0 > 10) {
          view.z = clamp(z0 * d / pinch0, 1, 14);
          clampOff();
          draw();
        }
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lastX;
      moved += Math.abs(dx);
      lastX = e.clientX;
      view.off = clamp(view.off - dx / ppy(), 0, 1e9);
      clampOff();
      draw();
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) dragging = false; };
    canvas.addEventListener('pointerup', (e) => {
      release(e);
      if (moved < 6) {
        let hit = -1;
        for (const c of drawn) {
          if (e.clientX >= c.x && e.clientX <= c.x + c.w && e.clientY >= c.y && e.clientY <= c.y + c.h) { hit = c.i; break; }
        }
        sel = hit === sel ? -1 : hit;
        updatePanel();
        draw();
      }
    });
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.deltaY < 0 ? 1.18 : 1 / 1.18);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const vis = (W - LABEL_W - PAD) / ppy();
      if (e.key === 'ArrowRight') { view.off = clamp(view.off + vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === 'ArrowLeft') { view.off = clamp(view.off - vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === '0') { view.z = 1; view.off = 0; draw(); }
    });
  },
});
