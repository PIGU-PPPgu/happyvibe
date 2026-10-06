import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';

// 长方体表面积/体积：滑杆改长宽高，展开滑杆摊平六面，算式面板与 3D 面颜色联动
// 色板来自 skills/teaching-interactives/SKILL.md：金 #FEB300 紫 #A63D97 蓝 #4FC3F7（对面同色）
const BLUE = 0x4fc3f7;
const CW = 360, CH = 220; // 标注贴片画布尺寸

const FACES = [
  { id: 'top', name: '上面', terms: '长×宽', color: 0xfeb300 },
  { id: 'bottom', name: '下面', terms: '长×宽', color: 0xfeb300 },
  { id: 'front', name: '前面', terms: '长×高', color: 0xa63d97 },
  { id: 'back', name: '后面', terms: '长×高', color: 0xa63d97 },
  { id: 'right', name: '右面', terms: '宽×高', color: BLUE },
  { id: 'left', name: '左面', terms: '宽×高', color: BLUE },
];

let renderer, scene, camera, root, hinges;
let meshes = {};      // id -> Mesh
let sprites = [];     // { sprite, mesh }
let edgeMats = [];
let chipH = 0.6;      // 标注贴片世界高度（refit 时随相机距离更新，保证投屏可读）
let glowPair = null;  // 面板点选锁定的高亮组
let panelEl, ctrlBar, unfoldEl;

const dims = { a: 5, b: 3, h: 4 };
let unfold = 0.14; // 0 折成盒 → 1 完全摊平；默认微开，提示可展开
const spherical = { theta: 0.45, phi: 1.02, radius: 10 }; // 默认视角：前墙近正面+右墙+顶面，三面可见且轮廓方正
const target = new THREE.Vector3(0, 0, 0);

function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: new THREE.Color(cs.getPropertyValue('--bg').trim() || '#150e22'),
    line: new THREE.Color(cs.getPropertyValue('--text').trim() || '#f2ecf8'),
  };
}

function dimsOf(id) {
  const { a, b, h } = dims;
  if (id === 'top' || id === 'bottom') return [a, b];
  if (id === 'front' || id === 'back') return [a, h];
  return [b, h];
}

// ---------- 标注贴片：canvas 绘制，颜色全部读 CSS 变量 ----------
function roundRect(x, m, w, h, r) {
  x.beginPath();
  x.moveTo(m + r, m);
  x.arcTo(m + w, m, m + w, m + h, r);
  x.arcTo(m + w, m + h, m, m + h, r);
  x.arcTo(m, m + h, m, m, r);
  x.arcTo(m, m, m + w, m, r);
  x.closePath();
}

function chipTexture(face) {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const x = c.getContext('2d');
  x.fillStyle = v('--panel', '#1e1433');
  x.strokeStyle = v('--line', 'rgba(180,130,210,.16)');
  x.lineWidth = 5;
  roundRect(x, 8, CW - 16, CH - 16, 26);
  x.fill(); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const font = (s) => `bold ${s}px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;
  x.fillStyle = v('--muted', '#a99cc0');
  x.font = font(46);
  x.fillText(`${face.name} ${face.terms}`, CW / 2, 66);
  x.fillStyle = v('--text', '#f2ecf8');
  x.font = font(88);
  const [p, q] = dimsOf(face.id);
  x.fillText(`${p}×${q}`, CW / 2, 154);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeLabels() {
  for (const s of sprites) {
    s.sprite.material.map.dispose();
    s.sprite.material.dispose();
    scene.remove(s.sprite);
  }
  sprites = [];
  for (const f of FACES) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: chipTexture(f), transparent: true, depthWrite: false }));
    scene.add(sp);
    sprites.push({ sprite: sp, mesh: meshes[f.id] });
  }
}

// 贴片始终贴在朝向相机的一侧，背面被盒体自然遮挡
const _q = new THREE.Quaternion(), _n = new THREE.Vector3(), _c = new THREE.Vector3(), _o = new THREE.Vector3();
function updateLabels() {
  const off = Math.max(0.05, chipH * 0.1);
  for (const { sprite: sp, mesh } of sprites) {
    mesh.getWorldQuaternion(_q);
    _n.set(0, 1, 0).applyQuaternion(_q);
    mesh.getWorldPosition(_c);
    _o.copy(camera.position).sub(_c);
    _n.multiplyScalar(_o.dot(_n) >= 0 ? 1 : -1);
    sp.position.copy(_c).addScaledVector(_n, off);
    sp.scale.set(chipH * (CW / CH), chipH, 1);
  }
}

// ---------- 建模：底面为根，四个侧面铰接在底面边上，顶面铰接在前面远端 ----------
function build() {
  if (root) {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    scene.remove(root);
  }
  const { a, b, h } = dims;
  root = new THREE.Group();
  meshes = {};
  edgeMats = [];
  const colors = themeColors();
  const plane = (w, d) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return g; };
  const face = (id, geo, pos, parent) => {
    const f = FACES.find((x) => x.id === id);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: f.color, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.08,
      emissive: f.color, emissiveIntensity: 0,
    }));
    mesh.position.copy(pos);
    const em = new THREE.LineBasicMaterial({ color: colors.line.clone(), transparent: true, opacity: 0.55 });
    edgeMats.push(em);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), em));
    parent.add(mesh);
    meshes[id] = mesh;
    return mesh;
  };

  face('bottom', plane(a, b), new THREE.Vector3(0, 0, 0), root);

  const hingeF = new THREE.Group(); hingeF.position.set(0, 0, b / 2); root.add(hingeF);
  const front = face('front', plane(a, h), new THREE.Vector3(0, 0, h / 2), hingeF);

  // 顶面铰链挂在前面的远端边缘（前几何中心 (0,0,h/2)，边缘在局部 z=h/2）
  const hingeT = new THREE.Group(); hingeT.position.set(0, 0, h / 2); front.add(hingeT);
  face('top', plane(a, b), new THREE.Vector3(0, 0, b / 2), hingeT);

  const hingeB = new THREE.Group(); hingeB.position.set(0, 0, -b / 2); root.add(hingeB);
  face('back', plane(a, h), new THREE.Vector3(0, 0, -h / 2), hingeB);

  const hingeR = new THREE.Group(); hingeR.position.set(a / 2, 0, 0); root.add(hingeR);
  face('right', plane(h, b), new THREE.Vector3(h / 2, 0, 0), hingeR);

  const hingeL = new THREE.Group(); hingeL.position.set(-a / 2, 0, 0); root.add(hingeL);
  face('left', plane(h, b), new THREE.Vector3(-h / 2, 0, 0), hingeL);

  hinges = { F: hingeF, T: hingeT, B: hingeB, R: hingeR, L: hingeL };
  scene.add(root);
  makeLabels();
  applyUnfold();
  refit();
  if (glowPair) setGlow(glowPair, 0.5);
}

function applyUnfold() {
  // unfold=0 折成盒（各面立起 90°）→ 1 完全摊平（各面落平）；root.position 按同一语义做居中
  const t = ((1 - unfold) * Math.PI) / 2;
  hinges.F.rotation.x = -t; // 前面向上立起
  hinges.T.rotation.x = -t; // 顶面随之翻过来盖住盒口
  hinges.B.rotation.x = t;
  hinges.R.rotation.z = t;
  hinges.L.rotation.z = -t;
  // 折起时盒心居中；摊平时展开图居中
  root.position.set(0, (-dims.h / 2) * (1 - unfold), (-dims.b / 2) * unfold);
}

function refit() {
  root.updateMatrixWorld(true);
  const sph = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  target.copy(sph.center);
  const t = Math.tan((camera.fov * Math.PI) / 360);
  // 包围球给初值，再按真实投影轮廓收敛：内容占画布宽 ≤80%、高 ≤88%，尽量拉满且任何展开程度都不裁切
  spherical.radius = THREE.MathUtils.clamp((sph.radius / t) * 1.08, 2.5, 120);
  const verts = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position, w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) verts.push(w.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).clone());
  });
  const q = new THREE.Vector3();
  const extents = () => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const v of verts) {
      q.copy(v).project(camera);
      if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x;
      if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
    }
    return [(x1 - x0) / 2, (y1 - y0) / 2, (x0 + x1) / 2, (y0 + y1) / 2];
  };
  // 收敛半径并把投影轮廓摆正（透视近大远小使内容偏移随深度变化，需迭代）
  const right = new THREE.Vector3(), up = new THREE.Vector3();
  for (let i = 0; i < 5; i++) {
    updateCamera();
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const [ex, ey, mx, my] = extents();
    if (!isFinite(ex) || ex <= 0) break;
    spherical.radius = THREE.MathUtils.clamp(spherical.radius * Math.max(ex / 0.8, ey / 0.88), 2.5, 120);
    // 相机与目标一起平移时画面反向移动：内容在 NDC (mx,my) → 目标点沿 right/up 移动 +(mx,my)×每弧度世界量
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    target.addScaledVector(right, mx * spherical.radius * t * camera.aspect * 0.9);
    target.addScaledVector(up, my * spherical.radius * t * 0.9);
  }
  chipH = 0.17 * spherical.radius * t; // 贴片约占屏高 8.5%，投屏文字不小于 16px
}

function updateCamera() {
  camera.position.set(
    target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
    target.y + spherical.radius * Math.cos(spherical.phi),
    target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
  );
  camera.lookAt(target);
}

// ---------- 高亮联动：面板行 → 对应面发光 ----------
function setGlow(pair, v) {
  const hit = (id) =>
    pair === 'all' ||
    (pair === 'tb' && (id === 'top' || id === 'bottom')) ||
    (pair === 'fb' && (id === 'front' || id === 'back')) ||
    (pair === 'lr' && (id === 'left' || id === 'right'));
  for (const f of FACES) meshes[f.id].material.emissiveIntensity = hit(f.id) ? v : 0;
}

function renderPanel() {
  const { a, b, h } = dims;
  const cube = a === b && b === h;
  const p = ['<div class="sec">表面积 S</div>'];
  if (cube) {
    p.push(`<div class="row" data-pair="all"><i class="sw" style="background:#FEB300"></i><span>六个面都是 ${a}×${a}</span></div>`);
    p.push(`<div class="tot">S = 6×${a}×${a} = ${6 * a * a} 平方厘米</div>`);
  } else {
    p.push(`<div class="row" data-pair="tb"><i class="sw" style="background:#FEB300"></i><span>上下 2×(长×宽) = 2×(${a}×${b}) = ${2 * a * b}</span></div>`);
    p.push(`<div class="row" data-pair="fb"><i class="sw" style="background:#A63D97"></i><span>前后 2×(长×高) = 2×(${a}×${h}) = ${2 * a * h}</span></div>`);
    p.push(`<div class="row" data-pair="lr"><i class="sw" style="background:#4FC3F7"></i><span>左右 2×(宽×高) = 2×(${b}×${h}) = ${2 * b * h}</span></div>`);
    p.push(`<div class="tot">S = ${2 * a * b} + ${2 * a * h} + ${2 * b * h} = ${2 * (a * b + a * h + b * h)} 平方厘米</div>`);
  }
  p.push('<div class="sec">体积 V</div>');
  if (cube) {
    p.push(`<div class="row" data-pair="all"><i class="sw" style="background:#4FC3F7"></i><span>棱长 ${a}</span></div>`);
    p.push(`<div class="tot">V = ${a}×${a}×${a} = ${a * a * a} 立方厘米</div>`);
  } else {
    p.push(`<div class="row" data-pair="tb"><i class="sw" style="background:#FEB300"></i><span>底面 长×宽 = ${a}×${b} = ${a * b}</span></div>`);
    p.push(`<div class="tot">V = 底面积×高 = ${a * b}×${h} = ${a * b * h} 立方厘米</div>`);
  }
  p.push('<div class="unit">单位：厘米</div>');
  panelEl.innerHTML = p.join('');
  panelEl.querySelectorAll('.row').forEach((x) => x.classList.toggle('on', x.dataset.pair === glowPair));
}

// ---------- UI ----------
const STYLE = `
#ctrl{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:10px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:94vw}
#ctrl .dim{display:flex;align-items:center;gap:7px;font-size:17px}
#ctrl input[type=range]{width:120px;accent-color:var(--gold)}
#ctrl b{min-width:1.1em;text-align:center;font-size:18px}
#ctrl .axis{font-size:15px;color:var(--muted)}
#panel{position:fixed;top:150px;right:14px;z-index:15;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:17px;line-height:1.85;max-width:min(440px,46vw)}
@media (max-width:1000px){#panel{top:174px}}
#panel .sec{font-weight:700;font-size:18px;margin-top:4px}
#panel .row{display:flex;align-items:center;gap:9px;padding:2px 8px;border-radius:7px;cursor:pointer}
#panel .row:hover,#panel .row.on{background:var(--panel2)}
#panel .sw{width:13px;height:13px;border-radius:3px;flex:none}
#panel .tot{font-weight:700;padding:3px 8px;border-top:1px dashed var(--line)}
#panel .unit{color:var(--muted);font-size:15px;padding:2px 8px}
@media (max-width:760px){#panel{left:10px;right:10px;top:auto;bottom:128px;max-width:none;font-size:16px;line-height:1.7;padding:8px 12px}#ctrl{gap:10px;padding:8px 12px;bottom:10px}}
`;

function buildUI(stage) {
  const st = document.createElement('style');
  st.textContent = STYLE;
  stage.appendChild(st);

  ctrlBar = document.createElement('div');
  ctrlBar.id = 'ctrl';
  ctrlBar.innerHTML = [
    '<label class="dim">长<input id="ra" type="range" min="1" max="9" step="1" value="5" aria-label="长"><b id="va">5</b></label>',
    '<label class="dim">宽<input id="rb" type="range" min="1" max="9" step="1" value="3" aria-label="宽"><b id="vb">3</b></label>',
    '<label class="dim">高<input id="rh" type="range" min="1" max="9" step="1" value="4" aria-label="高"><b id="vh">4</b></label>',
    '<button class="btn" id="cube" type="button" aria-label="变为正方体">正方体</button>',
    '<label class="dim">展开<input id="ru" type="range" min="0" max="100" step="1" value="14" aria-label="展开程度" style="width:200px"><span class="axis">盒状 → 摊平</span></label>',
  ].join('');
  stage.appendChild(ctrlBar);

  panelEl = document.createElement('div');
  panelEl.id = 'panel';
  stage.appendChild(panelEl);

  const bind = (rid, key, vid) => {
    const el = ctrlBar.querySelector(rid), out = ctrlBar.querySelector(vid);
    el.addEventListener('input', () => {
      dims[key] = +el.value;
      out.textContent = el.value;
      requestBuild();
      renderPanel();
    });
  };
  bind('#ra', 'a', '#va');
  bind('#rb', 'b', '#vb');
  bind('#rh', 'h', '#vh');

  ctrlBar.querySelector('#cube').addEventListener('click', () => {
    dims.b = dims.h = dims.a;
    ctrlBar.querySelector('#rb').value = dims.a;
    ctrlBar.querySelector('#rh').value = dims.a;
    ctrlBar.querySelector('#vb').textContent = dims.a;
    ctrlBar.querySelector('#vh').textContent = dims.a;
    requestBuild();
    renderPanel();
  });

  unfoldEl = ctrlBar.querySelector('#ru');
  unfoldEl.addEventListener('input', () => {
    unfold = unfoldEl.value / 100;
    applyUnfold();
    refit();
  });

  const restyle = () => panelEl.querySelectorAll('.row').forEach((x) => x.classList.toggle('on', x.dataset.pair === glowPair));
  panelEl.addEventListener('pointerover', (e) => {
    const r = e.target.closest('.row');
    if (r) { setGlow(r.dataset.pair, 0.5); restyle(); }
  });
  panelEl.addEventListener('pointerleave', () => { setGlow(null, 0); if (glowPair) setGlow(glowPair, 0.5); restyle(); });
  panelEl.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (!r) return;
    glowPair = glowPair === r.dataset.pair ? null : r.dataset.pair;
    setGlow(null, 0);
    if (glowPair) setGlow(glowPair, 0.5);
    restyle();
  });
}

// 滑杆拖动频繁，合并到每帧一次重建
let pending = false;
function requestBuild() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; build(); });
}

// ---------- 教学环节：点击切到预设场景（尺寸/展开度/高亮组都落参数），未激活引导语留 DOM ----------
const STEPS = [
  {
    name: '认一认',
    dims: [5, 3, 4],
    unfold: 0,
    glow: 'tb',
    guide: '看，上下两个面亮了——它们完全相同。数一数长方体一共有几个面？再找一找还有哪两组面也完全相同，点右侧算式行让对应的两个面亮起来。',
  },
  {
    name: '摊一摊',
    dims: [5, 3, 4],
    unfold: 1,
    glow: null,
    guide: '六个面摊平了。按颜色把三组对面找出来，再对照右侧算式说一说：2×(长×宽) 里的 2 是从哪来的？每一项对应哪两个面？',
  },
  {
    name: '变一变',
    dims: [4, 4, 4],
    unfold: 0,
    glow: null,
    guide: '长、宽、高都变成了 4。看右侧：表面积和体积的公式各变成了什么？说一说长方体和正方体这两条公式之间的联系。',
  },
];
const SUMMARY =
  '长方体有 6 个面，相对的面完全相同，表面积就是 6 个面面积之和：S = 2×(长×宽＋长×高＋宽×高)；体积 V = 长×宽×高 = 底面积×高。长、宽、高都相等时，长方体就成为正方体：S = 6×棱长×棱长，V = 棱长×棱长×棱长。表面积用面积单位，体积用体积单位。';

function syncDimsUI() {
  for (const [rid, key, vid] of [['#ra', 'a', '#va'], ['#rb', 'b', '#vb'], ['#rh', 'h', '#vh']]) {
    ctrlBar.querySelector(rid).value = String(dims[key]);
    ctrlBar.querySelector(vid).textContent = dims[key];
  }
}

function setStep(i) {
  const s = STEPS[i];
  dims.a = s.dims[0]; dims.b = s.dims[1]; dims.h = s.dims[2];
  syncDimsUI();
  requestBuild();
  unfold = s.unfold;
  if (unfoldEl) unfoldEl.value = String(Math.round(unfold * 100));
  applyUnfold();
  refit();
  glowPair = s.glow || null;
  setGlow(null, 0);
  if (glowPair) setGlow(glowPair, 0.5);
  renderPanel();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}

function buildTeachingPanel() {
  // 定位行（顶栏提示前）
  const hintEl = document.getElementById('hint');
  const metaEl = document.createElement('span');
  metaEl.dataset.hvMeta = '';
  metaEl.textContent = '数学·五年级｜人教版五下 · 长方体和正方体';
  metaEl.style.cssText = 'color:var(--gold);font-size:14px;margin-right:10px;white-space:nowrap';
  hintEl.before(metaEl);

  const st = document.createElement('style');
  st.textContent = [
    '#teach{position:fixed;top:56px;left:0;right:0;z-index:15;display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap}',
    '#teach .btn{font-size:15px;padding:7px 16px}',
    '#teach .btn[aria-pressed="true"]{border-color:var(--gold);background:var(--panel2)}',
    '#teach [data-hv-guide]{flex:1 1 100%;font-size:15px;line-height:1.6;color:var(--text)}',
    '#hvsum{position:fixed;left:14px;top:176px;z-index:16;max-width:min(560px,46vw);padding:16px 20px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;font-size:16px;line-height:1.8;display:none}',
    '@media (max-width:760px){#hvsum{right:14px;max-width:none;top:120px}}',
  ].join('');
  document.head.appendChild(st);

  // 环节条：按钮一行，引导语整行铺在其下
  const panel = document.createElement('div');
  panel.id = 'teach';
  panel.innerHTML =
    STEPS.map((s, i) => `<button class="btn" data-hv-step type="button" aria-pressed="false">${i + 1}. ${s.name}</button>`).join('') +
    '<button class="btn" id="hvsum-btn" type="button" style="margin-left:auto">小结</button>' +
    STEPS.map((s, i) => `<span data-hv-guide${i === 0 ? '' : ' style="display:none"'}>${s.guide}</span>`).join('');
  document.body.appendChild(panel);

  const summaryEl = document.createElement('div');
  summaryEl.id = 'hvsum';
  summaryEl.dataset.hvSummary = '';
  summaryEl.textContent = SUMMARY;
  document.body.appendChild(summaryEl);

  panel.querySelectorAll('[data-hv-step]').forEach((el, i) => el.addEventListener('click', () => setStep(i)));
  panel.querySelector('#hvsum-btn').addEventListener('click', () => {
    summaryEl.style.display = summaryEl.style.display === 'none' ? '' : 'none';
  });
  setStep(0);
}

// 自测：折叠态包围盒=长方体尺寸；摊平态六面共面且外扩尺寸符合铰链布局；正方体面板公式正确
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  build(); // 让几何体与当前 dims 严格同步（setStep 走的是下一帧重建）
  const measure = () => {
    root.updateMatrixWorld(true);
    const s = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    return [s.x, s.y, s.z];
  };
  const near = (v, e) => v.map((x, i) => Number.isFinite(x) && Number.isFinite(e[i]) && Math.abs(x - e[i]) < 1e-6).every(Boolean);
  const fmt = (v) => `[${v.map((x) => x.toFixed(4)).join(',')}]`;
  const saved = unfold;
  unfold = 0;
  applyUnfold();
  const folded = measure();
  push('折叠态=长方体', near(folded, [dims.a, dims.h, dims.b]), `bbox=${fmt(folded)} 期望=[${dims.a},${dims.h},${dims.b}]`);
  unfold = 1;
  applyUnfold();
  const flat = measure();
  push('摊平态=共面展开', near(flat, [dims.a + 2 * dims.h, 0, 2 * (dims.b + dims.h)]),
    `bbox=${fmt(flat)} 期望=[${dims.a + 2 * dims.h},0,${2 * (dims.b + dims.h)}]`);
  setStep(2);
  const txt = panelEl.textContent.replace(/\s+/g, '');
  push('正方体面板公式', txt.includes('6×4×4=96') && txt.includes('4×4×4=64'), txt.slice(0, 80));
  setStep(0);
  unfold = saved;
  applyUnfold();
  refit();
}

init({
  mount(stage, api) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
    stage.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    scene = new THREE.Scene();
    scene.background = themeColors().bg;
    camera = new THREE.PerspectiveCamera(40, document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight, 0.1, 400);

    // three r155+ 物理光照：强度需按旧习惯 ×π，否则各面偏暗、深色面融进背景
    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 2.0));
    const dir = new THREE.DirectionalLight(0xffffff, 2.8);
    dir.position.set(3, 6, 4);
    scene.add(dir);

    buildUI(stage);
    build();
    renderPanel();
    buildTeachingPanel();
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

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
        spherical.radius = Math.min(120, Math.max(2.5, spherical.radius * pinchDist / Math.max(d, 1)));
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
      spherical.radius = Math.min(120, Math.max(2.5, spherical.radius * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        unfold = Math.min(1, Math.max(0, unfold + (e.key === 'ArrowRight' ? 0.05 : -0.05)));
        unfoldEl.value = Math.round(unfold * 100);
        applyUnfold();
        refit();
      }
    });

    api.onResize = () => {
      renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
      camera.aspect = document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight;
      camera.updateProjectionMatrix();
    };
    api.onTheme = () => {
      const c = themeColors();
      scene.background = c.bg;
      for (const m of edgeMats) m.color.copy(c.line);
      makeLabels();
    };

    updateCamera();
    (function loop() {
      requestAnimationFrame(loop);
      updateCamera();
      scene.updateMatrixWorld();
      updateLabels();
      renderer.render(scene, camera);
    })();
  },
});
