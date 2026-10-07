import { init } from '../../_shared/runtime.mjs';

// 等宽朝代尺：20 个朝代带，缩放放大后显示大事圆点，点击看大事列表
const DYNASTIES = [
  { name: '夏', s: '约前2070', e: '约前1600', events: [['约前2070', '禹建立夏朝，世袭制代替禅让制']] },
  { name: '商', s: '约前1600', e: '约前1046', events: [['约前1600', '汤灭夏建商'], ['', '甲骨文是现存较成熟的汉字']] },
  { name: '西周', s: '前1046', e: '前771', events: [['前1046', '牧野之战，周武王灭商'], ['前841', '国人暴动']] },
  { name: '春秋', s: '前770', e: '前476', events: [['前770', '周平王东迁洛邑'], ['', '孔子创办私学，儒家学派形成']] },
  { name: '战国', s: '前475', e: '前221', events: [['前356', '商鞅变法'], ['', '都江堰建成']] },
  { name: '秦', s: '前221', e: '前207', events: [['前221', '秦统一六国，建立中央集权'], ['前209', '陈胜吴广起义']] },
  { name: '西汉', s: '前202', e: '公元9年', events: [['前202', '刘邦建立汉朝'], ['', '张骞两次出使西域'], ['', '罢黜百家，独尊儒术']] },
  { name: '东汉', s: '25年', e: '220年', events: [['105年', '蔡伦改进造纸术'], ['', '张仲景著伤寒杂病论']] },
  { name: '三国', s: '220年', e: '280年', events: [['200年', '官渡之战'], ['208年', '赤壁之战']] },
  { name: '西晋', s: '266年', e: '316年', events: [['266年', '司马炎建晋'], ['280年', '西晋统一全国']] },
  { name: '东晋', s: '317年', e: '420年', events: [['317年', '司马睿建东晋'], ['383年', '淝水之战']] },
  { name: '南北朝', s: '420年', e: '589年', events: [['', '北魏孝文帝改革，迁都洛阳']] },
  { name: '隋', s: '581年', e: '618年', events: [['581年', '杨坚建隋'], ['', '开凿大运河'], ['', '创立科举制']] },
  { name: '唐', s: '618年', e: '907年', events: [['618年', '李渊建唐'], ['', '贞观之治'], ['755年', '安史之乱']] },
  { name: '五代十国', s: '907年', e: '960年', events: [['907年', '朱温建后梁，唐亡']] },
  { name: '北宋', s: '960年', e: '1127年', events: [['960年', '陈桥驿兵变'], ['1005年', '澶渊之盟'], ['', '毕昇发明活字印刷术']] },
  { name: '南宋', s: '1127年', e: '1276年', events: [['1127年', '赵构建立南宋'], ['', '岳飞抗金']] },
  { name: '元', s: '1271年', e: '1368年', events: [['1271年', '忽必烈定国号元'], ['', '创立行省制度']] },
  { name: '明', s: '1368年', e: '1644年', events: [['1368年', '朱元璋建明'], ['1405年', '郑和首次下西洋']] },
  { name: '清', s: '1644年', e: '1911年', events: [['1644年', '清军入关'], ['', '康乾盛世'], ['1840年', '鸦片战争']] },
];

const BAND_COLORS = ['#E8B04B', '#A66BA6', '#6FA8C9', '#7FBF9E', '#D99A6C', '#9D8FD1'];

let canvas, ctx, view = { scale: 1, offset: 0 }; // offset：视口左缘对应的带索引坐标
let selected = -1;
let W = 0, H = 0, dpr = 1;

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return { bg: v('--bg', '#150e22'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'), line: v('--line', 'rgba(180,130,210,.16)'), gold: v('--gold', '#E8B04B'), panel: v('--panel', '#1e1433') };
}

const BAND_H_MIN = 150;
function bandH() { return Math.max(BAND_H_MIN, Math.round(H * 0.46)); }
function bandTop() { return H * 0.5 - bandH() / 2; }
const PAD = 60;

function draw() {
  const t = theme();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const n = DYNASTIES.length;
  const totalW = n * 140 * view.scale;
  const visibleW = Math.max(W - PAD * 2, 0);
  // 限制平移范围
  view.offset = Math.max(0, Math.min(Math.max(0, totalW - visibleW), view.offset));
  const bandW = 140 * view.scale;
  const BH = bandH();
  const top = bandTop();

  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const x = PAD + i * bandW - view.offset;
    if (x + bandW < -50 || x > W + 50) continue;
    const d = DYNASTIES[i];
    const hovered = selected === i;
    ctx.fillStyle = BAND_COLORS[i % BAND_COLORS.length];
    ctx.globalAlpha = hovered ? 1 : 0.88;
    const r = Math.min(10, bandW * 0.12);
    roundRect(x + 4, top, bandW - 8, BH, r);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 朝代名：随缩放增大
    const nameSize = Math.max(17, Math.min(34, bandW * 0.2));
    ctx.fillStyle = t.bg;
    ctx.font = `700 ${nameSize}px 'Noto Sans SC','PingFang SC',sans-serif`;
    const name = d.name.length > 4 && bandW < 110 ? d.name.slice(0, 3) + '…' : d.name;
    ctx.fillText(name, x + bandW / 2, top + BH * 0.42, bandW - 14);

    // 起止年：放大后显示
    if (bandW > 95) {
      ctx.fillStyle = t.bg;
      ctx.globalAlpha = 0.8;
      ctx.font = `13px 'Noto Sans SC','PingFang SC',sans-serif`;
      ctx.fillText(d.s, x + bandW / 2, top + BH * 0.62, bandW - 10);
      ctx.fillText('至 ' + d.e, x + bandW / 2, top + BH * 0.76, bandW - 10);
      ctx.globalAlpha = 1;
    }

    // 大事圆点：进一步放大后
    if (bandW > 150) {
      for (let k = 0; k < d.events.length; k++) {
        ctx.beginPath();
        ctx.arc(x + bandW / 2, top + BH + 18 + k * 16, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = t.gold;
        ctx.fill();
      }
    }
  }

  // 选中信息面板
  if (selected >= 0) {
    const d = DYNASTIES[selected];
    const lines = d.events.map(([y, e]) => (y ? `${y}　${e}` : e));
    const pw = Math.min(460, W - 40);
    const ph = 64 + lines.length * 26;
    const px = Math.min(Math.max(20, W / 2 - pw / 2), W - pw - 20);
    const py = H - ph - 86;
    ctx.fillStyle = t.panel;
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 1;
    roundRect(px, py, pw, ph, 10);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = t.gold;
    ctx.font = `700 18px 'Noto Sans SC','PingFang SC',sans-serif`;
    ctx.fillText(`${d.name}（${d.s} 至 ${d.e}）`, px + 18, py + 32);
    ctx.fillStyle = t.text;
    ctx.font = `15px 'Noto Sans SC','PingFang SC',sans-serif`;
    lines.forEach((l, i) => ctx.fillText(l, px + 18, py + 60 + i * 26, pw - 36));
  }

  // 缩放提示
  ctx.textAlign = 'left';
  ctx.fillStyle = t.muted;
  ctx.font = `13px 'Noto Sans SC','PingFang SC',sans-serif`;
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

function hitBand(mx) {
  const bandW = 140 * view.scale;
  const i = Math.floor((mx - PAD + view.offset) / bandW);
  return i >= 0 && i < DYNASTIES.length ? i : -1;
}

// 教学环节预设：缩放平移到指定朝代带区间（i0..i1），show 为取景带宽（含两侧余量）
function focusBands(i0, i1, show) {
  const span = show || i1 - i0 + 1;
  const visibleW = Math.max(W - PAD * 2, 1);
  const s = Math.max(1, Math.min(9, (visibleW * 0.8) / (span * 140)));
  const bandW = 140 * s;
  view.scale = s;
  view.offset = Math.max(0, Math.min(Math.max(0, DYNASTIES.length * bandW - visibleW), ((i0 + i1 + 1) / 2) * bandW - (W / 2 - PAD)));
  draw();
}

// 教学环节：预设状态 + 教师引导语（每步一条，激活的显示，其余隐藏但保留在 DOM 中供自测统计）
// 环节对应条目「课堂用法」三步：整体浏览 → 分段辨析 → 大事核对
const STEPS = [
  {
    name: '通览排序',
    preset: () => { view.scale = 1; view.offset = 0; selected = -1; draw(); },
    guide: '先整体读一遍：从夏到清二十格按时间排开。全班接龙朝代歌「夏商与西周，东周分两段，春秋和战国，一统秦两汉」，每念到一朝就在尺上指出来，先记住更替的顺序。',
    note: '中国古代史的主线可以压缩成一句话：统一—并立—再统一，循环上升。真正的全国统一王朝只有秦、汉、西晋、隋、唐、元、明、清八个；春秋战国、三国、东晋十六国、南北朝、五代十国、辽宋夏金属于政权并立时期。记顺序先抓「统一王朝」这根骨架，并立政权再挂上去，朝代歌念熟只是第一步。',
  },
  {
    name: '辨析并立',
    preset: () => { selected = -1; focusBands(8, 11); },
    guide: '放大到三国两晋南北朝：这近四百年不是一朝接一朝，而是几个政权同时并立。问一问：这四格的先后顺序是什么？西晋短暂统一之后，天下又是怎样变成东晋与南北朝并立的？',
    note: '三国（魏、蜀、吴）并立始于 220 年，西晋 280 年短暂统一；八王之乱后 316 年西晋亡，东晋偏安江南，北方进入十六国，之后演变为南北朝对峙——南朝宋齐梁陈更替，北朝北魏分裂为东西。这近四百年里「正统」不止一个，读史要看政权并立的格局，而不是硬排一条单线。',
  },
  {
    name: '核对大事',
    preset: () => { selected = 13; focusBands(11, 15, 5); },
    guide: '已经点开唐的大事年表，对照核对：618 年李渊建唐，755 年安史之乱。练一练世纪换算——618 年读作几世纪？再翻回头去，约前 2070 年又读作公元前几世纪？',
    note: '世纪换算口诀：百年一世纪，取百位以上数字加一——618 年在 600 至 699 之间，属 7 世纪；755 年属 8 世纪。公元前的年份越往前越早，约前 2070 年（夏朝建立）属公元前 21 世纪。大事年表是核对的工具：先记标志性事件（建朝、统一、大乱），再用世纪给它们定位。',
  },
];
const SUMMARY =
  '朝代更替主线：夏—商—西周—东周（春秋、战国）—秦—汉—三国两晋南北朝—隋—唐—五代十国—宋—元—明—清。' +
  '秦、汉、西晋、隋、唐、元、明、清出现过全国统一；春秋战国、三国、东晋十六国、南北朝、五代十国、辽宋夏金是政权并立时期。' +
  '读时间线三步：先记顺序，再分「统一」与「并立」，最后点开朝代格子用大事年表核对年代。';

function setStep(i) {
  STEPS[i].preset();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
  });
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => {
    el.style.display = k === i ? '' : 'none';
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '历史·七年级｜统编版七年级上、下册 · 中国古代史 · 朝代更替',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '中国古代史上，下列哪组全部出现过全国统一王朝？',
      opts: ['秦、汉、唐、宋', '秦、隋、唐、元', '春秋、战国、三国', '东晋、十六国、南北朝'],
      a: 1,
      why: '全国统一王朝是秦、汉、西晋、隋、唐、元、明、清。宋代与辽夏金并立，不算全国统一；春秋战国、三国、东晋十六国、南北朝都是并立时期。',
    },
    {
      q: '「东周分两段」指的是哪两个时期？',
      opts: ['西周和东周', '春秋和战国', '西汉和东汉', '五代和十国'],
      a: 1,
      why: '东周前期为春秋（诸侯争霸），后期为战国（七雄并立），朝代歌「东周分两段」说的就是这两段。西周与东周才是前后两个朝代段。',
    },
    {
      q: '三国两晋南北朝近四百年的格局是？',
      opts: ['一朝接一朝顺序更替', '始终只有一个政权', '多个政权同时并立', '秦汉的延续'],
      a: 2,
      why: '这近四百年是三国并立、西晋短暂统一、东晋十六国与南北朝对峙的并立时期，「正统」不止一个，不能硬排成一条单线。',
    },
    {
      q: '618 年属于哪个世纪？',
      opts: ['6 世纪', '7 世纪', '17 世纪', '公元前 7 世纪'],
      a: 1,
      why: '百年一世纪，618 年在 601 至 700 之间属 7 世纪——百位以上数字加一。公元后如此，公元前同理但越往前越早。',
    },
    {
      q: '安史之乱发生在唐朝哪个阶段，影响是？',
      opts: ['开国初期，巩固统治', '755 年，唐朝由盛转衰', '唐末，直接灭亡唐朝', '与唐朝无关'],
      a: 1,
      why: '安史之乱 755 年爆发，是唐朝由盛转衰的转折点；唐朝此后又延续约一个半世纪，直到 907 年才亡。',
    },
  ],
};



init({
  teaching: TEACHING,
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
    api.onTheme = draw;

    let dragging = false, lastX = 0, moved = 0;
    const pointers = new Map();
    let pinch0 = 0, scale0 = 1;

    const zoomAt = (mx, factor) => {
      const s0 = view.scale;
      const s1 = Math.max(1, Math.min(9, s0 * factor));
      const c = (view.offset + (mx - PAD)) / s0; // 指针下的内容坐标（缩放前）
      view.scale = s1;
      view.offset = Math.max(0, c * s1 - (mx - PAD));
      draw();
    };

    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 1) { dragging = true; lastX = e.clientX; moved = 0; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.abs(a - b); scale0 = view.scale;
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
          view.scale = Math.max(1, Math.min(9, scale0 * d / pinch0));
          draw();
        }
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lastX;
      moved += Math.abs(dx);
      view.offset = Math.max(0, view.offset - dx);
      lastX = e.clientX;
      draw();
    });
    const release = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) dragging = false;
    };
    canvas.addEventListener('pointerup', (e) => {
      release(e);
      if (moved < 6) {
        const i = hitBand(e.clientX);
        selected = i === selected ? -1 : i;
        draw();
      }
    });
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });
  },
});
