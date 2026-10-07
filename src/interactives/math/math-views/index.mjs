import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';

// 三视图与直观图：3D 几何体拖转，三个方向的彩色箭头对应三张视图卡片；卡片默认遮罩，点击揭晓
// 色板来自 skills/teaching-interactives/SKILL.md：金 #E8B04B 紫 #A66BA6 蓝 #6FA8C9（方向色）
const AXES = {
  front: { color: 0xe8b04b, css: '#E8B04B', label: '正面', dir: new THREE.Vector3(0, 0, -1) },
  left: { color: 0xa66ba6, css: '#A66BA6', label: '左面', dir: new THREE.Vector3(-1, 0, 0) },
  top: { color: 0x6fa8c9, css: '#6FA8C9', label: '上面', dir: new THREE.Vector3(0, 1, 0) },
};
const ORDER = ['front', 'left', 'top'];

// 视图形状（单位坐标，y 向上）：r 矩形(x,y 为左下角) / c 圆 / t 三角形(底边在 y，顶点向上)
const R = (x, y, w, h) => ({ t: 'r', x, y, w, h });
const C = (x, y, r, dot) => ({ t: 'c', x, y, r, dot });
const T = (x, y, w, h) => ({ t: 't', x, y, w, h });

const SOLIDS = {
  cube: {
    name: '正方体',
    views: { front: [R(-1, 0, 2, 2)], left: [R(-1, 0, 2, 2)], top: [R(-1, -1, 2, 2)] },
  },
  cyl: {
    name: '圆柱',
    views: { front: [R(-1, 0, 2, 2)], left: [R(-1, 0, 2, 2)], top: [C(0, 0, 1)] },
  },
  cone: {
    name: '圆锥',
    views: { front: [T(-1, 0, 2, 2)], left: [T(-1, 0, 2, 2)], top: [C(0, 0, 1, true)] },
  },
  combo: {
    name: '组合体',
    views: {
      front: [R(-1, 0, 2, 2), R(-0.7, 2, 1.4, 1.2)],
      left: [R(-1, 0, 2, 2), R(-0.7, 2, 1.4, 1.2)],
      top: [R(-1, -1, 2, 2), C(0, 0, 0.7)],
    },
  },
};
const SOLID_ORDER = ['cube', 'cyl', 'cone', 'combo'];

let renderer, scene, camera;
let solid = null;
let faceMat = null;
let lineMats = [];
let chips = [];
let arrowObjs = {};
let current = 'cube';
const spherical = { theta: 0.785, phi: 1.05, radius: 6 };
const target = new THREE.Vector3(0, -0.1, 0);

function palette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (k, f) => cs.getPropertyValue(k).trim() || f;
  return { bg: g('--bg', '#150e22'), panel: g('--panel', '#1e1433'), text: g('--text', '#f2ecf8'), line: g('--line', 'rgba(180,130,210,.16)') };
}

// ---------- 3D 几何体（面板色面 + 文字色管状线框，教材线框风） ----------
// 线框用细管/圆环网格而非 1px 线：小屏与缩略采样下都保持清晰
function tube(a, b, mat, r = 0.022) {
  const d = b.clone().sub(a);
  const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

function edgeTubes(geo, mat, r = 0.022) {
  const g = new THREE.Group();
  const pos = new THREE.EdgesGeometry(geo).attributes.position.array;
  for (let i = 0; i < pos.length; i += 6) {
    g.add(tube(
      new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]),
      new THREE.Vector3(pos[i + 3], pos[i + 4], pos[i + 5]),
      mat, r
    ));
  }
  return g;
}

function ring(r, y, mat) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 6, 72), mat);
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}

function buildSolid(id) {
  const p = palette();
  const g = new THREE.Group();
  faceMat = new THREE.MeshStandardMaterial({ color: p.panel, roughness: 0.55, metalness: 0.08 });
  const lm = () => new THREE.MeshBasicMaterial({ color: p.text });
  const line = () => { const m = lm(); lineMats.push(m); return m; };
  const mesh = (geo) => new THREE.Mesh(geo, faceMat);

  if (id === 'cube') {
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const m = mesh(geo);
    m.add(edgeTubes(geo, line()));
    g.add(m);
  } else if (id === 'cyl') {
    const m = mesh(new THREE.CylinderGeometry(1, 1, 2, 48));
    g.add(m);
    g.add(ring(1, 1, line()));
    g.add(ring(1, -1, line()));
  } else if (id === 'cone') {
    const m = mesh(new THREE.ConeGeometry(1, 2, 48));
    g.add(m);
    g.add(ring(1, -1, line()));
    // 两条素线，直观图惯例
    for (const sx of [1, -1]) {
      g.add(tube(new THREE.Vector3(0, 1, 0), new THREE.Vector3(sx, -1, 0), line()));
    }
  } else {
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const box = mesh(boxGeo);
    box.position.y = 1;
    box.add(edgeTubes(boxGeo, line()));
    g.add(box);
    const cyl = mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 48));
    cyl.position.y = 2.6;
    g.add(cyl);
    g.add(ring(0.7, 3.2, line()));
    g.add(ring(0.7, 2, line()));
    g.position.y = -1.6; // 整体居中
  }
  return g;
}

function switchSolid(id) {
  current = id;
  spherical.radius = RADIUS[id];
  if (solid) {
    solid.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    scene.remove(solid);
  }
  lineMats = [];
  solid = buildSolid(id);
  solid.position.y = 0.3; // 整体上移，压低纵向跨度（上方留给方向箭头与贴片）
  scene.add(solid);
  updateAnchors();
  document.querySelectorAll('#ctrl [data-solid]').forEach((b) => b.classList.toggle('on', b.dataset.solid === id));
  redrawViews();
}

// ---------- 方向箭头 + 标签贴片 ----------
function chipSprite(text, colorCss) {
  const p = palette();
  const c = document.createElement('canvas');
  c.width = 176; c.height = 80;
  const x = c.getContext('2d');
  x.fillStyle = p.panel;
  x.strokeStyle = p.line;
  x.lineWidth = 4;
  x.beginPath();
  const m = 5, r = 16;
  x.moveTo(m + r, m);
  x.arcTo(171, m, 171, 75, r);
  x.arcTo(171, 75, m, 75, r);
  x.arcTo(m, 75, m, m, r);
  x.arcTo(m, m, 171, m, r);
  x.closePath();
  x.fill(); x.stroke();
  x.fillStyle = colorCss;
  x.font = 'bold 40px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 88, 44);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
}

function makeChips() {
  for (const s of chips) { s.material.map.dispose(); s.material.dispose(); scene.remove(s); }
  chips = [];
  for (const key of ORDER) {
    const a = AXES[key];
    const sp = chipSprite(a.label, a.css);
    sp.scale.set(0.74, 0.34, 1);
    sp.renderOrder = 5;
    scene.add(sp);
    chips.push(sp);
  }
  updateAnchors();
}

function makeArrows() {
  const LEN = 0.42, HEAD = 0.2;
  for (const key of ORDER) {
    const a = AXES[key];
    const arrow = new THREE.ArrowHelper(a.dir, new THREE.Vector3(), LEN, a.color, HEAD, 0.12);
    arrow.line.visible = false; // 1px 线在缩放下不可见，改用细管箭杆
    const shaftLen = LEN - HEAD;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, shaftLen, 6),
      new THREE.MeshBasicMaterial({ color: a.color })
    );
    shaft.position.copy(a.dir).multiplyScalar(shaftLen / 2);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.dir);
    arrow.add(shaft);
    scene.add(arrow);
    arrowObjs[key] = arrow;
  }
}

// 方向箭头与贴片的锚点随几何体顶面联动；箭头推到几何体轮廓之外保证可见，
// 「上面」贴片放箭头旁侧，压低整体纵向跨度
function updateAnchors() {
  const topY = current === 'combo' ? 1.9 : 1.3; // 几何体顶面高度（含整体上移 0.3）
  // 屏幕横向单位向量（随方位角）：侧面箭头沿它外推，避开几何体轮廓
  const rt = new THREE.Vector3(Math.cos(spherical.theta), 0, -Math.sin(spherical.theta));
  for (const key of ORDER) {
    if (key === 'top') {
      arrowObjs.top.position.set(0, topY + 0.1, 0);
      continue;
    }
    const side = key === 'front' ? 0.9 : -0.9;
    arrowObjs[key].position.copy(AXES[key].dir).multiplyScalar(2.2).addScaledVector(rt, side);
  }
  for (let i = 0; i < ORDER.length; i++) {
    const key = ORDER[i];
    const sp = chips[i];
    if (!sp) continue;
    if (key === 'top') sp.position.set(0.62, topY + 0.45, 0);
    else sp.position.copy(AXES[key].dir).multiplyScalar(3.05);
  }
}

// ---------- 三视图卡片（2D 正投影线框） ----------
function drawView(cv, shapes) {
  const dpr = Math.min(devicePixelRatio, 2);
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const x = cv.getContext('2d');
  x.scale(dpr, dpr);
  const p = palette();
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const s of shapes) {
    const b = s.t === 'c' ? [s.x - s.r, s.x + s.r, s.y - s.r, s.y + s.r] : [s.x, s.x + s.w, s.y, s.y + s.h];
    x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[1]);
    y0 = Math.min(y0, b[2]); y1 = Math.max(y1, b[3]);
  }
  const pad = 12;
  const sc = Math.min((w - pad * 2) / (x1 - x0), (h - pad * 2) / (y1 - y0));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const mx = (v) => w / 2 + (v - cx) * sc;
  const my = (v) => h / 2 - (v - cy) * sc;
  x.lineWidth = 3; x.lineJoin = 'round';
  x.strokeStyle = p.text; x.fillStyle = p.text;
  for (const s of shapes) {
    x.beginPath();
    if (s.t === 'r') x.rect(mx(s.x), my(s.y + s.h), s.w * sc, s.h * sc);
    else if (s.t === 'c') x.arc(mx(s.x), my(s.y), s.r * sc, 0, Math.PI * 2);
    else {
      x.moveTo(mx(s.x), my(s.y));
      x.lineTo(mx(s.x + s.w), my(s.y));
      x.lineTo(mx(s.x + s.w / 2), my(s.y + s.h));
      x.closePath();
    }
    x.stroke();
    if (s.t === 'c' && s.dot) {
      x.beginPath();
      x.arc(mx(s.x), my(s.y), 4, 0, Math.PI * 2);
      x.fill();
    }
  }
}

function redrawViews() {
  const views = SOLIDS[current].views;
  for (const key of ORDER) drawView(document.querySelector(`.card[data-view="${key}"] canvas`), views[key]);
}

// ---------- UI ----------
const STYLE = `
#vp{position:absolute;inset:0 216px 0 0}
#vp canvas{display:block}
#ctrl{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:max-content;max-width:94vw;display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:12px;z-index:20;flex-wrap:wrap;justify-content:center}
#ctrl .btn.on{border-color:var(--gold);color:var(--gold)}
#panel{position:fixed;top:126px;right:14px;z-index:15;display:flex;flex-direction:column;gap:8px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:4px 8px 6px;width:190px}
.card-head{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:600;padding:2px 2px 3px}
.card .sw{width:12px;height:12px;border-radius:3px;flex:none}
.view-wrap{position:relative;height:92px}
.view-wrap canvas{width:100%;height:100%;display:block}
.mask{position:absolute;inset:0;border-radius:8px;background:var(--panel2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:opacity .25s}
.mask b{font-size:32px;color:var(--muted)}
.mask em{font-style:normal;font-size:14px;color:var(--muted)}
.card.open .mask{opacity:0;pointer-events:none}
@media (max-width:640px){#vp{inset:0 0 224px 0}#panel{flex-direction:row;left:10px;right:10px;top:auto;bottom:96px}.card{flex:1;width:auto;padding:6px 8px 8px}.view-wrap{height:96px}#ctrl{gap:6px;padding:8px 10px;bottom:10px;max-width:94vw}}
`;

function buildUI(stage) {
  const st = document.createElement('style');
  st.textContent = STYLE;
  stage.appendChild(st);

  const ctrl = document.createElement('div');
  ctrl.id = 'ctrl';
  ctrl.innerHTML = [
    ...SOLID_ORDER.map((id) => `<button class="btn" type="button" data-solid="${id}" aria-label="${SOLIDS[id].name}">${SOLIDS[id].name}</button>`),
    '<button class="btn" id="ans" type="button" aria-label="全部揭晓或盖上">答案</button>',
  ].join('');
  stage.appendChild(ctrl);

  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = ORDER.map((key) => `
    <div class="card" data-view="${key}">
      <div class="card-head"><i class="sw" style="background:${AXES[key].css}"></i>从${AXES[key].label}看</div>
      <div class="view-wrap"><canvas></canvas><div class="mask"><b>?</b><em>点击揭晓</em></div></div>
    </div>`).join('');
  stage.appendChild(panel);

  const ansBtn = ctrl.querySelector('#ans');
  const cards = [...panel.querySelectorAll('.card')];
  const syncAns = () => ansBtn.classList.toggle('on', cards.every((c) => c.classList.contains('open')));
  cards.forEach((c) => c.querySelector('.view-wrap').addEventListener('click', () => {
    c.classList.toggle('open');
    syncAns();
  }));
  ansBtn.addEventListener('click', () => {
    const open = !cards.every((c) => c.classList.contains('open'));
    cards.forEach((c) => c.classList.toggle('open', open));
    syncAns();
  });
  ctrl.querySelectorAll('[data-solid]').forEach((b) => b.addEventListener('click', () => switchSolid(b.dataset.solid)));
}

// 每个几何体的默认相机距离：组合体更高，退远些才不裁顶
const RADIUS = { cube: 6.5, cyl: 6.5, cone: 6.5, combo: 7.9 };

// ---------- 教学环节：预设状态（几何体 + 卡片揭掩 + 相机位）+ 教师引导语（未激活的留 DOM） ----------
const STEPS = [
  {
    name: '认方向',
    solid: 'cube', open: false, theta: 0.785, phi: 1.05,
    guide: '先认三支箭头：金色从正面看，紫色从左面看，蓝色从上面看。拖动转一转正方体，问一问学生：这三个方向看到的形状一样吗？',
    note: '三视图是从正面、左面、上面正对着物体看，把看到的形状画成三个平面图形（九年级教材称主视图、左视图、俯视图）。观察方向固定「正对」，不随物体转动——是人在动、视线不动。从不同方向看同一个立体，得到的平面图形往往不同，这正是立体与平面互相转化的桥梁。',
  },
  {
    name: '猜视图',
    solid: 'cone', open: false, theta: 0.785, phi: 1.05,
    guide: '换成圆锥，先不揭晓。请学生在纸上画出从正面、左面、上面看到的形状，再点卡片对照：正、左两面为什么都是等腰三角形？俯视图圆心那个点是什么？',
    note: '圆锥从正面、左面看都是等腰三角形——两腰是轮廓母线，底边是底面直径；从上面看是一个圆加一个圆心点，圆心是锥顶的投影。先画后对，学生错得最多的是漏掉俯视图的圆心点或把三角形画成普通三角形——两腰应与锥顶到轮廓的视线一致。',
  },
  {
    name: '说规律',
    solid: 'combo', open: true, theta: 0.62, phi: 0.85,
    guide: '组合体三视图已揭晓。看俯视图：圆落在正方形的哪个位置？从正面看为什么下面是正方形、上面是矩形？让学生试着说出三个视图之间的对应关系。',
    note: '三视图的对应规律「长对正、高平齐、宽相等」：主视图与俯视图长对正，主视图与左视图高平齐，左视图与俯视图宽相等。组合体先拆成简单几何体，分别看三视图再按位置叠合——俯视图里圆的位置就决定了圆柱在正方体上方的哪一处，位置信息全靠视图互相核对。',
  },
];
const SUMMARY = '三视图是从正面、左面、上面正对着物体观察画出的三个平面图形（九年级教材中分别称主视图、左视图、俯视图）。圆柱从正面、左面看都是矩形，从上面看是圆；圆锥从正面、左面看都是等腰三角形，从上面看是带圆心的圆，圆心是锥顶的投影。画三视图时遵循「长对正、高平齐、宽相等」：主视图与俯视图长对正，主视图与左视图高平齐，左视图与俯视图宽相等。';

function setCardsOpen(open) {
  document.querySelectorAll('#panel .card').forEach((c) => {
    if (c.classList.contains('open') !== open) c.querySelector('.view-wrap').click();
  });
}

function setStep(i) {
  const s = STEPS[i];
  if (current !== s.solid) switchSolid(s.solid); // 初始已是 cube，避免重复重建
  spherical.theta = s.theta;
  spherical.phi = s.phi;
  setCardsOpen(s.open);
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => {
    el.style.display = k === i ? '' : 'none';
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '数学·七年级｜北师大版七上第一章《丰富的图形世界》· 1.4 从三个方向看物体的形状',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '三视图观察时，下列做法正确的是？',
      opts: ['转动物体分别看', '人从三个固定方向正对着物体看', '只画看到的轮廓线', '俯视图从底下往上看'],
      a: 1,
      why: '三视图规定人从正面、左面、上面三个固定方向正对观察，物体不动人动；俯视图是从上往下看，不是从下往上看。',
    },
    {
      q: '圆锥的俯视图是？',
      opts: ['等腰三角形', '一个点', '带圆心的圆', '圆'],
      a: 2,
      why: '从上面看，底面是一个圆，锥顶投影成一个圆心点，所以是带圆心的圆。漏掉圆心点是最常见的错误。',
    },
    {
      q: '圆锥从正面看到的形状是等腰三角形，两腰对应圆锥的？',
      opts: ['高', '底面直径', '轮廓母线', '轴截面斜边'],
      a: 2,
      why: '视线方向上，锥顶到底面轮廓的母线正好构成投影的左右边界，所以两腰是轮廓母线；高在正中间，不落在轮廓上。',
    },
    {
      q: '「主视图与俯视图长对正」说的是？',
      opts: ['两者高度相等', '两者左右方向的长度对齐', '两者宽相等', '两者面积相等'],
      a: 1,
      why: '主、俯视图共享左右方向的长，画图时要上下对齐——「长对正」。高平齐管主左，宽相等管左俯，三句话各管一对视图。',
    },
    {
      q: '画组合体三视图的合理步骤是？',
      opts: ['整体一笔画出', '拆成简单几何体分别看，再按位置叠合', '只画俯视图', '先画最有把握的一面补其他'],
      a: 1,
      why: '组合体先拆解成简单几何体，各自的三视图明确可靠，再按「长对正、高平齐、宽相等」对齐叠合，位置信息靠视图互相核对。',
    },
  ],
};



function vpSize() {
  const vp = document.getElementById('vp');
  return [vp.clientWidth, vp.clientHeight];
}

function updateCamera() {
  camera.position.set(
    target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
    target.y + spherical.radius * Math.cos(spherical.phi),
    target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
  );
  camera.lookAt(target);
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    buildUI(stage); // 先注入样式，#vp 才有布局尺寸
    const vp = document.createElement('div');
    vp.id = 'vp';
    stage.appendChild(vp);
    const [w0, h0] = vpSize();
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w0, h0);
    vp.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(palette().bg);
    camera = new THREE.PerspectiveCamera(40, w0 / h0, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.15));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(3, 6, 4);
    scene.add(dir);

    makeArrows();
    makeChips();
    switchSolid('cube');

    // 拖拽旋转 + 滚轮/双指缩放（鼠标与触摸统一 pointer 通道）
    let dragging = false, px = 0, py = 0;
    const pointers = new Map();
    let pinchDist = 0;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) { dragging = true; px = e.clientX; py = e.clientY; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        spherical.radius = Math.min(14, Math.max(3.2, spherical.radius * pinchDist / Math.max(d, 1)));
        pinchDist = d;
        return;
      }
      if (!dragging) return;
      spherical.theta -= (e.clientX - px) * 0.008;
      spherical.phi = Math.min(1.45, Math.max(0.25, spherical.phi - (e.clientY - py) * 0.006));
      px = e.clientX; py = e.clientY;
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) dragging = false; };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      spherical.radius = Math.min(14, Math.max(3.2, spherical.radius * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const i = SOLID_ORDER.indexOf(current);
      switchSolid(SOLID_ORDER[(i + (e.key === 'ArrowRight' ? 1 : SOLID_ORDER.length - 1)) % SOLID_ORDER.length]);
    });

    api.onResize = () => {
      const [w, h] = vpSize();
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      redrawViews();
    };
    api.onTheme = () => {
      const p = palette();
      scene.background = new THREE.Color(p.bg);
      if (faceMat) faceMat.color.set(p.panel);
      for (const m of lineMats) m.color.set(p.text);
      makeChips();
      redrawViews();
    };

    updateCamera();
    (function loop() {
      requestAnimationFrame(loop);
      updateCamera();
      renderer.render(scene, camera);
    })();
  },
});
