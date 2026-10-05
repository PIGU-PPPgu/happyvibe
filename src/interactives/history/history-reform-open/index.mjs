import { init } from '../../_shared/runtime.mjs';

// 改革开放历程：1978 至今大事时间线（可拖可缩）+ 深圳与全国经济数据增长条
const Y0 = 1977, Y1 = 2024;

const EVENTS = [
  { y: 1978.95, t: '十一届三中全会', d: '1978 年 12 月，作出把党和国家工作中心转移到经济建设上来、实行改革开放的历史性决策，是新中国成立以来党的历史上具有深远意义的伟大转折。' },
  { y: 1978.1, t: '小岗村改革', d: '安徽凤阳小岗村农民实行分田包产到户、自负盈亏，家庭联产承包责任制随后在全国逐步推广，激发了农民劳动热情。' },
  { y: 1980.6, t: '设立经济特区', d: '1980 年 8 月设立深圳、珠海、汕头、厦门经济特区（1988 年增设海南），特区成为对外开放的「窗口」。' },
  { y: 1984.5, t: '开放沿海城市', d: '进一步开放大连、天津、青岛、上海、广州等 14 个沿海城市，随后开辟沿海经济开放区，全方位对外开放格局逐步形成。' },
  { y: 1990.4, t: '开发开放浦东', d: '1990 年建立上海浦东开发区，成为进一步对外开放的重要标志。' },
  { y: 1992.05, t: '南方谈话', d: '1992 年初邓小平视察南方发表谈话，强调发展才是硬道理，进一步解放了人们的思想，推动改革开放和现代化建设进入新阶段。' },
  { y: 1992.8, t: '中共十四大', d: '1992 年 10 月召开，明确提出要建立社会主义市场经济体制。' },
  { y: 1997.55, t: '香港回归', d: '1997 年 7 月 1 日中国政府对香港恢复行使主权，洗雪了百年国耻。' },
  { y: 1997.7, t: '中共十五大', d: '1997 年 9 月召开，邓小平理论被确立为党的指导思想并写入党章。' },
  { y: 1999.96, t: '澳门回归', d: '1999 年 12 月 20 日中国政府对澳门恢复行使主权，标志着中国人民在完成祖国统一大业的道路上迈出重要一步。' },
  { y: 2001.96, t: '加入世贸组织', d: '2001 年 12 月 11 日中国正式加入世界贸易组织，为我国参与经济全球化开辟了新途径。' },
  { y: 2012.85, t: '中共十八大', d: '2012 年 11 月召开，中国特色社会主义进入新时代，开启实现中华民族伟大复兴的新征程。' },
  { y: 2017.8, t: '中共十九大', d: '2017 年 10 月召开，习近平新时代中国特色社会主义思想被确立为党的指导思想。' },
  { y: 2021.1, t: '全面建成小康社会', d: '2021 年宣告脱贫攻坚战取得全面胜利、全面建成小康社会，实现第一个百年奋斗目标。' },
];

const CITIES = [
  { n: '上海', v: 4.72 }, { n: '北京', v: 4.38 }, { n: '深圳', v: 3.46, hot: true },
  { n: '广州', v: 3.04 }, { n: '重庆', v: 3.01 },
];

const FONT = `'Noto Sans SC','PingFang SC','Hiragino Sans GB',sans-serif`;
let canvas, ctx, W = 0, H = 0, dpr = 1;
const view = { z: 1, off: 0 };
let sel = -1;
let drawn = [];
let cardW = [];
const PAD = 20;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return {
    bg: v('--bg', '#150e22'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'),
    line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#feb300'),
    panel: v('--panel', '#1e1433'), panel2: v('--panel2', '#271a42'), purple: v('--purple', '#a63d97'),
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function ppy() { return ((W - PAD * 2) / (Y1 - Y0)) * view.z; }
function xOf(y) { return PAD + (y - Y0) * ppy() - view.off; }

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw() {
  const t = theme();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  drawn = [];
  const cy = H * 0.44;
  const ch = 46;

  // 阶段底色带：酝酿起步 / 深化 / 新时代
  const phases = [
    { a: 1978, b: 1992, n: '起步与探索' },
    { a: 1992, b: 2012, n: '深化改革' },
    { a: 2012, b: 2024, n: '新时代' },
  ];
  const ph = 26;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const xa = Math.max(xOf(p.a), 0), xb = Math.min(xOf(p.b), W);
    if (xb <= xa) continue;
    ctx.fillStyle = i % 2 === 0 ? t.panel2 : t.panel;
    ctx.fillRect(xa, cy + 40, xb - xa, ph);
    ctx.fillStyle = t.muted;
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'center';
    const cx = (xOf(p.a) + xOf(p.b)) / 2;
    if (cx > 30 && cx < W - 30) ctx.fillText(p.n, cx, cy + 40 + ph / 2);
    if (i > 0) {
      ctx.strokeStyle = t.muted;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xOf(p.a), cy - 10);
      ctx.lineTo(xOf(p.a), cy + 40 + ph);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 主轴线
  ctx.strokeStyle = t.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(W, cy);
  ctx.stroke();

  // 年份刻度
  ctx.font = `16px ${FONT}`;
  ctx.textAlign = 'center';
  const step = view.z >= 6 ? 1 : view.z >= 2.5 ? 2 : 5;
  for (let yr = Math.ceil(Y0 / step) * step; yr <= Y1; yr += step) {
    const x = xOf(yr);
    if (x < 0 || x > W) continue;
    const major = yr % 10 === 0;
    ctx.strokeStyle = t.muted;
    ctx.beginPath();
    ctx.moveTo(x, cy - 6);
    ctx.lineTo(x, cy + (major ? 12 : 7));
    ctx.stroke();
    ctx.fillStyle = major ? t.text : t.muted;
    ctx.fillText(String(yr), x, cy - 14);
  }

  // 事件卡（上下交错贪心）
  const lastX = [-1e9, -1e9];
  const evs = EVENTS.map((e, i) => ({ e, i })).sort((a, b) => a.e.y - b.e.y);
  for (const { e, i } of evs) {
    const x = xOf(e.y);
    if (x < -80 || x > W + 80) continue;
    const w = cardW[i];
    let side = -1;
    if (x - w / 2 - lastX[0] > 10 && lastX[0] <= lastX[1]) side = 0;
    else if (x - w / 2 - lastX[1] > 10) side = 1;
    if (side < 0) continue;
    lastX[side] = x + w / 2;
    const y2 = side === 0 ? cy - 28 : cy + 28;
    ctx.strokeStyle = t.gold;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = t.gold;
    ctx.fill();
    const cardY = side === 0 ? y2 - ch : y2;
    const isSel = sel === i;
    ctx.fillStyle = t.panel;
    roundRect(x - w / 2, cardY, w, ch, 8);
    ctx.fill();
    ctx.strokeStyle = isSel ? t.gold : t.line;
    ctx.lineWidth = isSel ? 2.4 : 1.4;
    ctx.stroke();
    ctx.fillStyle = t.gold;
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText(String(Math.floor(e.y)), x, cardY + 14, w - 12);
    ctx.fillStyle = t.text;
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(e.t, x, cardY + 32, w - 12);
    drawn.push({ x: x - w / 2, y: cardY, w, h: ch, i });
  }
}

let els = {};
function buildUI(stage) {
  const st = document.createElement('style');
  st.textContent = `
    #tabs{position:absolute;top:8px;left:12px;z-index:6;display:flex;gap:8px}
    .tab{font:inherit;font-size:17px;padding:8px 16px;border-radius:8px;border:1px solid var(--line);
      background:var(--panel);color:var(--text);cursor:pointer;touch-action:manipulation}
    .tab.on{border-color:var(--gold);color:var(--gold);font-weight:700}
    #rpanel{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;
      background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:10px 18px 12px;max-width:min(820px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3);text-align:center}
    #rpanel .yr{color:var(--gold);font-weight:700;font-size:20px;margin-right:10px}
    #rpanel .tt{font-weight:700;font-size:19px}
    #rpanel .tx{font-size:16px;color:var(--muted);margin-top:4px;line-height:1.5}
    #data{position:absolute;inset:56px 16px 16px 16px;z-index:4;display:none;overflow:auto}
    #data h2{text-align:center;font-size:22px;color:var(--gold);margin:6px 0 14px}
    #dgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1060px;margin:0 auto}
    @media (max-width:860px){#dgrid{grid-template-columns:1fr}}
    .grp{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 18px}
    .grp h3{font-size:18px;margin-bottom:10px}
    .duo{display:flex;align-items:center;gap:10px;margin:12px 0;flex-wrap:wrap}
    .num{font-size:20px;font-weight:700}
    .num.b{color:var(--gold)}
    .num.s{color:var(--muted)}
    .arr{color:var(--muted);font-size:17px}
    .tag{border:1px solid var(--gold);color:var(--gold);border-radius:99px;padding:2px 10px;font-size:16px}
    .dsub{font-size:16px;color:var(--muted);margin-top:4px;line-height:1.5}
    .crow{display:flex;align-items:center;gap:10px;margin:9px 0}
    .crow .cn{font-size:17px;flex:0 0 52px}
    .track{flex:1;background:var(--panel2);border-radius:6px;height:26px;overflow:hidden}
    .bar{height:100%;width:0;border-radius:6px;background:var(--muted);transition:width .9s cubic-bezier(.2,.7,.3,1)}
    .bar.hot{background:var(--gold)}
    .cv{font-size:17px;flex:0 0 76px;text-align:right}
    #dfoot{display:flex;align-items:center;gap:14px;justify-content:center;margin-top:14px;flex-wrap:wrap}
    #dnote{font-size:16px;color:var(--muted);max-width:760px;text-align:center;line-height:1.5}
    .qb{font:inherit;font-size:17px;line-height:1;padding:9px 16px;border-radius:6px;border:1px solid var(--line);
      background:var(--panel2);color:var(--text);cursor:pointer}
    .qb:hover{border-color:var(--gold)}
  `;
  stage.appendChild(st);

  const tabs = document.createElement('div');
  tabs.id = 'tabs';
  tabs.innerHTML = '<button class="tab on" id="tabTl" type="button">大事历程</button><button class="tab" id="tabData" type="button">经济数据</button>';
  stage.appendChild(tabs);

  const panel = document.createElement('div');
  panel.id = 'rpanel';
  panel.innerHTML = '<div><span class="yr"></span><span class="tt"></span></div><div class="tx"></div>';
  stage.appendChild(panel);

  const data = document.createElement('div');
  data.id = 'data';
  const maxV = Math.max(...CITIES.map((c) => c.v));
  data.innerHTML = `
    <h2>从边陲小镇到国际都市</h2>
    <div id="dgrid">
      <div class="grp">
        <h3>深圳 1980 → 2023</h3>
        <div class="duo">
          <span class="num s">约 2.7 亿元</span><span class="arr">→</span>
          <span class="num b">约 3.46 万亿元</span><span class="tag">增长超万倍</span>
        </div>
        <div class="dsub">地区生产总值（GDP）</div>
        <div class="duo">
          <span class="num s">约 30 万</span><span class="arr">→</span>
          <span class="num b">约 1779 万</span><span class="tag">常住人口</span>
        </div>
        <div class="dsub">深圳 1980 年成为经济特区，40 余年从一个边陲小镇发展为国际化大都市，「深圳速度」成为中国改革开放成就的缩影。</div>
      </div>
      <div class="grp">
        <h3>2023 年地区生产总值前五城市（万亿元）</h3>
        ${CITIES.map((c, i) => `
          <div class="crow">
            <span class="cn">${c.n}</span>
            <div class="track"><div class="bar${c.hot ? ' hot' : ''}" style="--w:${(c.v / maxV) * 100}%"></div></div>
            <span class="cv">${c.v.toFixed(2)}</span>
          </div>`).join('')}
        <div class="dsub">深圳于 1980 年与珠海、汕头、厦门同批设立经济特区。</div>
      </div>
    </div>
    <div id="dfoot">
      <div id="dnote">全国对照：国内生产总值 1978 年 3679 亿元 → 2023 年超 126 万亿元；常住人口城镇化率 17.9% → 66.2%。数据据国家统计局及各市统计公报（约数）。</div>
      <button class="qb" id="replay" type="button">重播</button>
    </div>`;
  stage.appendChild(data);

  els = { yr: panel.querySelector('.yr'), tt: panel.querySelector('.tt'), tx: panel.querySelector('.tx') };

  const bars = [...data.querySelectorAll('.bar')];
  const play = () => {
    bars.forEach((b) => { b.style.width = '0'; });
    requestAnimationFrame(() => {
      void data.offsetWidth;
      setTimeout(() => bars.forEach((b, i) => { b.style.width = b.style.getPropertyValue('--w'); }), 30);
    });
  };
  data.querySelector('#replay').addEventListener('click', play);

  const setMode = (m) => {
    const tl = m === 'tl';
    tabs.querySelector('#tabTl').classList.toggle('on', tl);
    tabs.querySelector('#tabData').classList.toggle('on', !tl);
    canvas.style.display = tl ? 'block' : 'none';
    panel.style.display = tl ? 'block' : 'none';
    data.style.display = tl ? 'none' : 'block';
    if (!tl) play();
  };
  tabs.querySelector('#tabTl').addEventListener('click', () => { setMode('tl'); draw(); });
  tabs.querySelector('#tabData').addEventListener('click', () => setMode('data'));
  if (new URLSearchParams(location.search).get('mode') === 'data') setMode('data');

  const updatePanel = () => {
    if (sel >= 0) {
      const e = EVENTS[sel];
      els.yr.textContent = `${Math.floor(e.y)} 年`;
      els.tt.textContent = e.t;
      els.tx.textContent = e.d;
    } else {
      els.yr.textContent = '1978 至今';
      els.tt.textContent = '改革开放大事时间线';
      els.tx.textContent = '拖动平移，滚轮缩放，点击卡片看大事详情；下方色带为阶段：起步与探索、深化改革、新时代。';
    }
  };
  updatePanel();

  return { setMode, updatePanel };
}

init({
  mount(stage, api) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(canvas);
    ctx = canvas.getContext('2d');
    const ui = buildUI(stage);

    const measure = () => {
      ctx.font = `700 17px ${FONT}`;
      cardW = EVENTS.map((e) => Math.max(78, Math.min(160, ctx.measureText(e.t).width + 26)));
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
      view.off = clamp(view.off, 0, Math.max(0, (Y1 - Y0) * ppy() - (W - PAD * 2)));
    };
    const zoomAt = (mx, f) => {
      const yearAt = view.off + (mx - PAD) / ppy();
      view.z = clamp(view.z * f, 1, 12);
      clampOff();
      view.off = clamp(yearAt - (mx - PAD) / ppy(), 0, Math.max(0, (Y1 - Y0) * ppy() - (W - PAD * 2)));
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
          view.z = clamp(z0 * d / pinch0, 1, 12);
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
        ui.updatePanel();
        draw();
      }
    });
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.deltaY < 0 ? 1.18 : 1 / 1.18);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const vis = (W - PAD * 2) / ppy();
      if (e.key === 'ArrowRight') { view.off = clamp(view.off + vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === 'ArrowLeft') { view.off = clamp(view.off - vis * 0.25, 0, 1e9); clampOff(); draw(); }
      if (e.key === '0') { view.z = 1; view.off = 0; draw(); }
    });
  },
});
