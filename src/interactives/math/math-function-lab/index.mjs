import { init } from '../../_shared/runtime.mjs';

// 一次函数 / 反比例函数图像实验室：k、b 滑杆联动图像、坐标轴交点与性质表
// 曲线颜色读 CSS 变量：金 var(--gold) 一次函数，紫 var(--purple) 反比例，蓝为站内色板常量
const BLUE = '#6FA8C9';

let cv, ctx, stageEl, W = 0, H = 0;
let ui = null; // 控制面板元素引用（sk/sb/vk/vb/sync），供教学环节预设复用
const view = { cx: 0, cy: 0, span: 8 };
const state = { type: 'linear', linK: 2, linB: 1, invK: 6 };

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

const cur = () => (state.type === 'linear' ? state.linK : state.invK);
function narrow() { return W < 760; }
function pcx() { return narrow() ? W / 2 : (W - 320) / 2; }
function pcy() { return narrow() ? (H - 380) / 2 : H / 2; }
function unit() { return W / (2 * view.span); }

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function fracStr(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

function formulaStr() {
  if (state.type === 'linear') {
    const k = state.linK, b = state.linB;
    if (k === 0) return b === 0 ? 'y = 0' : `y = ${b}`;
    const ks = k === 1 ? '' : k === -1 ? '-' : `${k}`;
    const bs = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`;
    return `y = ${ks}x${bs}`;
  }
  const k = state.invK;
  return `y = ${k}/x`;
}

function niceStep(v) {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const s of [1, 2, 5, 10]) if (s * pow >= v) return s * pow;
  return 10 * pow;
}

// ---------- 性质表 ----------
function renderProps() {
  const el = document.getElementById('props');
  const f = document.getElementById('formula');
  f.textContent = formulaStr();
  f.style.color = state.type === 'linear' ? 'var(--gold)' : 'var(--purple)';
  const rows = [];
  const add = (k, v) => rows.push(`<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`);
  if (state.type === 'linear') {
    const { linK: k, linB: b } = state;
    if (k === 0) {
      add('说明', 'k = 0，此时 y = b 是常函数，不是一次函数');
      add('图像', `过 (0, ${b}) 的水平线${b === 0 ? '，即 x 轴' : ''}`);
    } else {
      add('增减性', k > 0 ? 'k > 0，y 随 x 增大而增大' : 'k < 0，y 随 x 增大而减小');
      if (b === 0) {
        add('图像', '过原点，是正比例函数');
        add('经过象限', k > 0 ? '第一、三象限' : '第二、四象限');
      } else {
        const q = k > 0 ? (b > 0 ? '第一、二、三象限' : '第一、三、四象限') : (b > 0 ? '第一、二、四象限' : '第二、三、四象限');
        add('经过象限', q);
      }
      add('与 y 轴交点', `(0, ${b})`);
      add('与 x 轴交点', `(${fracStr(-b, k)}, 0)`);
    }
  } else {
    const k = state.invK;
    if (k === 0) {
      add('说明', 'k = 0 时 y = k/x 无意义，没有图像');
    } else {
      add('图像位置', k > 0 ? 'k > 0，两支分别在第一、三象限' : 'k < 0，两支分别在第二、四象限');
      add('增减性', k > 0 ? '每一支上 y 随 x 增大而减小' : '每一支上 y 随 x 增大而增大');
      add('对称性', '关于原点中心对称，也关于直线 y = x、y = -x 对称');
      add('k 的影响', `|k| = ${Math.abs(k)}，|k| 越大，两支离原点越远`);
    }
  }
  el.innerHTML = rows.join('');
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

  // 网格
  const step = niceStep(view.span / 5);
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let gx = Math.ceil(wx(0) / step) * step; px(gx) <= W; gx += step) { const s = px(gx); ctx.moveTo(s, 0); ctx.lineTo(s, H); }
  for (let gy = Math.ceil(wy(H) / step) * step; py(gy) >= 0; gy += step) { const s = py(gy); ctx.moveTo(0, s); ctx.lineTo(W, s); }
  ctx.stroke();

  // 坐标轴与箭头
  ctx.strokeStyle = p.text;
  ctx.fillStyle = p.text;
  ctx.lineWidth = 2;
  const ax = px(0), ay = py(0);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, ay); ctx.lineTo(W, ay);
  ctx.moveTo(ax, 0); ctx.lineTo(ax, H);
  ctx.stroke();
  // 四个象限的大字标注（淡而醒目，撑起构图也服务"经过象限"性质）
  if (!narrow()) {
    ctx.save();
    ctx.font = '700 36px Georgia,serif';
    ctx.fillStyle = p.muted; ctx.globalAlpha = .32;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const quads = [['Ⅰ', (ax + W) / 2, ay / 2], ['Ⅱ', ax / 2, ay / 2], ['Ⅲ', ax / 2, (ay + H) / 2], ['Ⅳ', (ax + W) / 2, (ay + H) / 2]];
    for (const [t, qx, qy] of quads) {
      if (qx > 40 && qx < W - 40 && qy > 40 && qy < H - 40) ctx.fillText(t, qx, qy);
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(W - 14, ay); ctx.lineTo(W - 2, ay); ctx.lineTo(W - 14, ay - 5); ctx.lineTo(W - 14, ay + 5); ctx.closePath();
  ctx.moveTo(ax, 12); ctx.lineTo(ax, 2); ctx.moveTo(ax, 2); ctx.lineTo(ax - 5, 13); ctx.lineTo(ax + 5, 13); ctx.closePath();
  ctx.fill();
  ctx.font = 'italic bold 19px serif';
  ctx.textAlign = 'left';
  ctx.fillText('x', W - 20, ay + 22);
  ctx.fillText('y', ax + 10, 16);

  // 刻度数字（跳过 0）
  ctx.font = '600 18px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  ctx.fillStyle = p.muted;
  ctx.textAlign = 'center';
  for (let gx = Math.ceil(wx(0) / step) * step; px(gx) <= W; gx += step) {
    if (gx === 0 || Math.abs(gx) < 1e-9) continue;
    ctx.fillText(`${+gx.toFixed(6)}`, px(gx), Math.min(Math.max(ay + 20, 20), H - 8));
  }
  ctx.textAlign = 'right';
  for (let gy = Math.ceil(wy(H) / step) * step; py(gy) >= 0; gy += step) {
    if (gy === 0 || Math.abs(gy) < 1e-9) continue;
    ctx.fillText(`${+gy.toFixed(6)}`, Math.min(Math.max(ax - 10, 34), W - 8), py(gy) + 5);
  }

  const label = (tx, ty, txt, alignRight) => {
    ctx.font = 'bold 20px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = alignRight ? 'right' : 'left';
    ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.strokeStyle = p.bg;
    ctx.strokeText(txt, tx, ty);
    ctx.fillStyle = BLUE;
    ctx.fillText(txt, tx, ty);
  };

  if (state.type === 'linear') {
    const { linK: k, linB: b } = state;
    // 直线
    ctx.save();
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = 5;
    ctx.shadowColor = p.gold; ctx.shadowBlur = 14;
    ctx.beginPath();
    const xa = view.cx - view.span - 2, xb = view.cx + view.span + 2;
    ctx.moveTo(px(xa), py(k * xa + b));
    ctx.lineTo(px(xb), py(k * xb + b));
    ctx.stroke();
    ctx.restore();
    // 与两轴交点
    if (k !== 0) {
      const mark = (x, y, txt) => {
        const sx0 = px(x), sy0 = py(y);
        if (sx0 < -30 || sx0 > W + 30 || sy0 < -30 || sy0 > H + 30) return;
        ctx.save();
        ctx.shadowColor = BLUE; ctx.shadowBlur = 12;
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(sx0, sy0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(sx0, sy0, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.stroke();
        const right = sx0 < W - 110;
        label(sx0 + (right ? 12 : -12), sy0 - 12, txt, !right);
      };
      if (b === 0) mark(0, 0, '(0, 0)');
      else {
        mark(0, b, `(0, ${b})`);
        mark(-b / k, 0, `(${fracStr(-b, k)}, 0)`);
      }
    }
  } else {
    const k = state.invK;
    if (k === 0) {
      ctx.font = '18px "Noto Sans SC","PingFang SC",sans-serif';
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'center';
      ctx.fillText('k = 0 时 y = k/x 无意义', ox, oy - 20);
    } else {
      // 双曲线两支：按像素采样，超出视野断开
      ctx.save();
      ctx.strokeStyle = p.purple;
      ctx.lineWidth = 5;
      ctx.shadowColor = p.purple; ctx.shadowBlur = 14;
      ctx.beginPath();
      let pen = false;
      for (let s = 0; s <= W; s += 2) {
        const x = wx(s);
        if (x === 0) { pen = false; continue; }
        const y = k / x;
        const t = py(y);
        if (t < -80 || t > H + 80) { pen = false; continue; }
        if (!pen) { ctx.moveTo(s, t); pen = true; } else ctx.lineTo(s, t);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 左上角解析式贴片
  const fs = formulaStr();
  ctx.font = 'bold 26px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  const tw = ctx.measureText(fs).width;
  ctx.fillStyle = p.panel;
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1.5;
  // 解析式贴片放在教学环节条（页面顶部 fixed）下方，避免被遮挡
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(16, 56, tw + 34, 48, 12) : ctx.rect(16, 56, tw + 34, 48);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = state.type === 'linear' ? p.gold : p.purple;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fs, 33, 81);
  ctx.textBaseline = 'alphabetic';
}

// ---------- UI ----------
const STYLE = `
#panel{position:fixed;top:116px;right:14px;z-index:15;width:296px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:11px}
.types{display:flex;gap:8px}
.types .btn{flex:1}
.btn.on{border-color:var(--gold);color:var(--gold)}
.slider-row{display:flex;align-items:center;gap:10px;font-size:18px}
.slider-row .sym{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;width:1.1em}
.slider-row input{flex:1;accent-color:var(--gold)}
.slider-row b{min-width:2.4em;text-align:center;font-size:19px}
.slider-row.off{display:none}
#formula{font-size:23px;font-weight:700;text-align:center;padding:7px 6px;background:var(--panel2);border-radius:8px;font-family:Georgia,'Times New Roman',serif}
#props{display:flex;flex-direction:column;gap:7px;font-size:16.5px;line-height:1.5}
#props .row{display:flex;gap:8px}
#props .k{color:var(--muted);flex:none;width:6em}
#props .v{font-weight:600}
#reset{align-self:stretch}
@media (max-width:760px){#panel{left:10px;right:10px;top:auto;bottom:10px;width:auto;padding:10px 12px;gap:8px}#props{font-size:15.5px}#props .row{line-height:1.4}}
`;

function buildUI(stage) {
  const st = document.createElement('style');
  st.textContent = STYLE;
  stage.appendChild(st);

  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = [
    '<div class="types">',
    '<button class="btn on" id="t-lin" type="button" aria-label="一次函数">一次函数</button>',
    '<button class="btn" id="t-inv" type="button" aria-label="反比例函数">反比例函数</button>',
    '</div>',
    '<label class="slider-row" id="row-k"><span class="sym">k</span><input id="sk" type="range" min="-5" max="5" step="1" value="2" aria-label="k 值"><b id="vk">2</b></label>',
    '<label class="slider-row off" id="row-b"><span class="sym">b</span><input id="sb" type="range" min="-6" max="6" step="1" value="1" aria-label="b 值"><b id="vb">1</b></label>',
    '<div id="formula"></div>',
    '<div id="props"></div>',
    '<button class="btn" id="reset" type="button" aria-label="复位视图">复位</button>',
  ].join('');
  stage.appendChild(panel);

  const sk = panel.querySelector('#sk'), sb = panel.querySelector('#sb');
  const vk = panel.querySelector('#vk'), vb = panel.querySelector('#vb');
  ui = { panel, sk, sb, vk, vb };
  ui.sync = () => {
    const inv = state.type === 'inverse';
    sk.min = inv ? -12 : -5;
    sk.max = inv ? 12 : 5;
    sk.value = cur();
    vk.textContent = cur();
    sb.value = state.linB;
    vb.textContent = state.linB;
    panel.querySelector('#row-b').classList.toggle('off', inv);
  };
  panel.querySelector('#t-lin').addEventListener('click', () => setType('linear'));
  panel.querySelector('#t-inv').addEventListener('click', () => setType('inverse'));
  sk.addEventListener('input', () => {
    if (state.type === 'linear') state.linK = +sk.value; else state.invK = +sk.value;
    vk.textContent = sk.value;
    renderProps();
    draw();
  });
  sb.addEventListener('input', () => {
    state.linB = +sb.value;
    vb.textContent = sb.value;
    renderProps();
    draw();
  });
  panel.querySelector('#reset').addEventListener('click', resetView);
}

// 切换函数类型并同步按钮态、滑杆量程、解析式与性质表
function setType(type) {
  state.type = type;
  ui.panel.querySelector('#t-lin').classList.toggle('on', type === 'linear');
  ui.panel.querySelector('#t-inv').classList.toggle('on', type === 'inverse');
  ui.sync();
  renderProps();
  draw();
}

function resetView() {
  view.cx = 0; view.cy = 0; view.span = 8;
  draw();
}

// ---------- 教学环节：预设状态 + 教师引导语（激活的显示，其余留在 DOM） ----------
// 环节设计对应课堂用法：读图识 b → 变 k 看转向与增减性 → 变 b 看平移 → 迁移到反比例函数
const STEPS = [
  {
    name: '读一读',
    type: 'linear', k: 2, b: 1, invK: 6,
    guide: '先看这条直线 y = 2x + 1。谁来说出它与 y 轴、x 轴的交点？式子里的 1 写到了图像的哪个位置？',
    note: '一次函数 y = kx + b 的图像是一条直线。b 就是直线与 y 轴交点的纵坐标——y = 2x + 1 与 y 轴交于 (0, 1)，式子里的 1 直接「写」在图像上；与 x 轴的交点令 y = 0 解出，是 (-1/2, 0)。读图先找这两个交点，直线的位置就定了。',
  },
  {
    name: '变 k',
    type: 'linear', k: -2, b: 1, invK: 6,
    guide: '这条 y = -2x + 1 和刚才的 y = 2x + 1 相比哪里变了？拖 k 在 2 与 -2 之间来回，直线怎么转？性质表的增减性换了什么说法？',
    note: 'k 的符号决定直线的倾斜方向：k > 0 时直线从左下到右上，y 随 x 增大而增大；k < 0 时直线从左上到右下，y 随 x 增大而减小。|k| 越大直线越陡。增减性说的是 y 与 x 的变化关系，不是说图像「下降」——直线本身没有方向。',
  },
  {
    name: '变 b',
    type: 'linear', k: 2, b: -3, invK: 6,
    guide: '回到 k = 2，把 b 从 1 拖到 -3。直线往哪边平移？两个蓝点交点怎么走？用自己的话说说 b 的几何意义。',
    note: '改变 b，直线上下平移，倾斜方向不变：b 从 1 变 -3，直线向下平移 4 个单位，与 y 轴交点从 (0, 1) 走到 (0, -3)。b 的几何意义就是与 y 轴交点的纵坐标，它与交点的横坐标无关。b = 0 时 y = kx 是正比例函数，直线过原点。',
  },
  {
    name: '反比例',
    type: 'inverse', k: 2, b: 1, invK: 6,
    guide: '换成 y = 6/x。k 为正时两支各在哪个象限？把 k 拖到负数，两支怎么换位置？再拖到 0——图像不见了，谁能解释为什么？',
    note: '反比例函数 y = k/x（k ≠ 0）的图像是双曲线：k > 0 时两支分别在第一、三象限，k < 0 时在第二、四象限，象限由 k 的符号决定。k = 0 时 y = k/x 分母无意义，函数没有定义，所以没有图像——不是「看不见」，是式子本身不成立。|k| 越大，双曲线离原点越远。',
  },
];
const SUMMARY =
  '一次函数 y = kx + b（k ≠ 0）的图像是一条直线：k > 0 时 y 随 x 增大而增大，k < 0 时 y 随 x 增大而减小；' +
  'b 是直线与 y 轴交点的纵坐标，改变 b，直线上下平移；b = 0 时是正比例函数，图像过原点。' +
  '反比例函数 y = k/x（k ≠ 0）的图像是双曲线：k > 0 时两支分别在第一、三象限，k < 0 时在第二、四象限；' +
  'k > 0 时每一支上 y 随 x 增大而减小，k < 0 时每一支上 y 随 x 增大而增大；k = 0 时 y = k/x 无意义，没有图像。';

function applyStep(i) {
  const s = STEPS[i];
  state.linK = s.k; state.linB = s.b; state.invK = s.invK;
  setType(s.type); // 同步类型按钮、滑杆量程与数值、解析式、性质表
  resetView();
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '数学·八年级｜人教版八年级下册第十九章《一次函数》· 图像与性质',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => applyStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '直线 y = -2x + 1 经过哪几个象限？',
      opts: ['第一、二、三象限', '第一、二、四象限', '第二、三、四象限', '第一、三、四象限'],
      a: 1,
      why: 'k = -2 < 0，直线从左上到右下；b = 1 > 0，与 y 轴交于正半轴。合起来过第一、二、四象限，不过第三象限。',
    },
    {
      q: 'k、b 满足什么条件时，y = kx + b 是正比例函数？',
      opts: ['b = 0', 'k = 0', 'b = 1', 'k = b'],
      a: 0,
      why: 'b = 0 时 y = kx，图像过原点，是正比例函数。k = 0 时一次函数退化为常数函数，反比例函数则无意义，都不是正比例函数。',
    },
    {
      q: '把 y = 2x + 1 的 b 从 1 拖到 -3，图像怎么变？',
      opts: ['直线向下平移 4 个单位', '直线绕原点旋转', '直线变得更陡', '直线向左平移 4 个单位'],
      a: 0,
      why: 'b 是与 y 轴交点的纵坐标，从 1 变 -3，交点下移 4 个单位，整条直线随之向下平移；倾斜方向由 k 决定，保持不变。',
    },
    {
      q: '反比例函数 y = -6/x 的两支在哪些象限？',
      opts: ['第一、三象限', '第二、四象限', '第一、四象限', '第二、三象限'],
      a: 1,
      why: '双曲线所在象限只看 k 的符号：k = -6 < 0 在第二、四象限；k 为正才在第一、三象限，与 |k| 大小无关。',
    },
    {
      q: '把反比例函数的 k 拖到 0，图像消失，原因是？',
      opts: ['图像缩小到看不见', 'y = k/x 分母无意义，函数没有定义', '软件渲染出错', '图像跑到坐标系外'],
      a: 1,
      why: 'k = 0 时 y = 0/x，除数为零没有意义，任何 x 都算不出对应的 y，函数不存在，所以没有图像——是式子不成立，不是显示问题。',
    },
  ],
};

// 自测断言：验证每个环节按钮真的把场景切到预设状态（解析式、滑杆、性质表联动）
function runSelfChecks() {
  const push = (n, p, d) => window.__hvPushCheck(n, p, d);
  const formula = () => document.getElementById('formula').textContent;
  push('初始预设', state.type === 'linear' && state.linK === 2 && state.linB === 1 && formula() === 'y = 2x + 1', formula());
  const expect = ['y = 2x + 1', 'y = -2x + 1', 'y = 2x - 3', 'y = 6/x'];
  const bad = [];
  STEPS.forEach((s, i) => {
    applyStep(i);
    if (state.type !== s.type || formula() !== expect[i]) bad.push(`环节${i + 1}解析式=${formula()}`);
    const want = s.type === 'linear' ? s.k : s.invK;
    if (!Number.isFinite(+ui.sk.value) || +ui.sk.value !== want) bad.push(`环节${i + 1}滑杆=${ui.sk.value}≠${want}`);
  });
  applyStep(0);
  push('环节预设切换', bad.length === 0, bad.join(' ') || '四个环节的类型、解析式、k 滑杆均切换到位');
  applyStep(1);
  const p1 = document.getElementById('props').textContent;
  push('性质表联动(k<0)', p1.includes('减小') && p1.includes('(0, 1)'), p1.slice(0, 50));
  applyStep(3);
  state.invK = 0; ui.sync(); renderProps(); draw();
  const p3 = document.getElementById('props').textContent;
  push('反比例k=0无图像', p3.includes('无意义'), p3.slice(0, 30));
  applyStep(0);
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
    cv.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(cv);
    ctx = cv.getContext('2d');

    buildUI(stage);
    renderProps();
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
