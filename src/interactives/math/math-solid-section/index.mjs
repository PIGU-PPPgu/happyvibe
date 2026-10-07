import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';

// 立体几何截面演示：方位角/倾角/平移三滑杆定平面，切开滑杆分离两半
// 截面多边形由「离散面与平面求交 + 平面内角度排序」生成；圆柱/圆锥按轴面夹角解析分类
// 颜色读 CSS 变量：截面金 var(--gold)，实体面板色，蓝为站内色板常量
const D2R = Math.PI / 180;

let renderer, scene, camera;
let solidA, solidB, faceMatA, faceMatB, edgeMats = [];
let planeMesh, planeGrid, planeFill;
let sectionGroup, sectionMesh, sectionLine;
let chip = null, chipTex = null;
let chipHost;

const par = { solid: 'cube', az: 30, el: 45, k: 0, gap: 0.3 };
const SOLIDS = {
  cube: { name: '正方体', r: 0, h: 0 },
  cyl: { name: '圆柱', r: 1.15, h: 2.6 },
  cone: { name: '圆锥', r: 1.35, h: 2.6 },
};
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clipPlaneNeg = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const spherical = { theta: 0.85, phi: 1.08, radius: 6.8 };
const target = new THREE.Vector3(0, 0, 0);

function css(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function palette() {
  return {
    bg: css('--bg', '#150e22'), text: css('--text', '#f2ecf8'), muted: css('--muted', '#a99cc0'),
    line: css('--line', 'rgba(180,130,210,.16)'), panel: css('--panel', '#1e1433'),
    gold: css('--gold', '#E8B04B'),
  };
}
function planeDef() {
  const az = par.az * D2R, el = par.el * D2R;
  return {
    n: new THREE.Vector3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az)),
    k: par.k,
  };
}

// ---------- 几何体离散面（cap=true 为底/顶面圆盘） ----------
function solidFaces(id) {
  const faces = [];
  const push = (pts, cap) => faces.push({ pts, cap });
  if (id === 'cube') {
    const V = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
    const idx = (x, y, z) => V.findIndex((p) => p[0] === x && p[1] === y && p[2] === z);
    for (const [a, b, c2, d] of [
      [idx(-1, -1, 1), idx(1, -1, 1), idx(1, 1, 1), idx(-1, 1, 1)],
      [idx(1, -1, -1), idx(-1, -1, -1), idx(-1, 1, -1), idx(1, 1, -1)],
      [idx(-1, -1, -1), idx(-1, -1, 1), idx(-1, 1, 1), idx(-1, 1, -1)],
      [idx(1, -1, 1), idx(1, -1, -1), idx(1, 1, -1), idx(1, 1, 1)],
      [idx(-1, 1, 1), idx(1, 1, 1), idx(1, 1, -1), idx(-1, 1, -1)],
      [idx(-1, -1, -1), idx(1, -1, -1), idx(1, -1, 1), idx(-1, -1, 1)],
    ]) push([a, b, c2, d].map((i) => V[i]), false);
  } else if (id === 'cyl') {
    const { r, h } = SOLIDS.cyl, SEG = 72;
    const pt = (i, y) => [r * Math.cos((i / SEG) * 2 * Math.PI), y, r * Math.sin((i / SEG) * 2 * Math.PI)];
    for (let i = 0; i < SEG; i++) push([pt(i, h / 2), pt(i + 1, h / 2), pt(i + 1, -h / 2), pt(i, -h / 2)], false);
    for (const y of [h / 2, -h / 2]) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 2 * Math.PI, b = ((i + 1) / 24) * 2 * Math.PI;
        push([[0, y, 0], [r * Math.cos(a), y, r * Math.sin(a)], [r * Math.cos(b), y, r * Math.sin(b)]], true);
      }
    }
  } else {
    const { r, h } = SOLIDS.cone, SEG = 72, apex = [0, h / 2, 0], yb = -h / 2;
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * 2 * Math.PI, b = ((i + 1) / SEG) * 2 * Math.PI;
      push([apex, [r * Math.cos(a), yb, r * Math.sin(a)], [r * Math.cos(b), yb, r * Math.sin(b)]], false);
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI, b = ((i + 1) / 24) * 2 * Math.PI;
      push([[0, yb, 0], [r * Math.cos(a), yb, r * Math.sin(a)], [r * Math.cos(b), yb, r * Math.sin(b)]], true);
    }
  }
  return faces;
}

// ---------- 平面与离散面求交 → 截面多边形（排序成环） ----------
function sectionPolygon(id, n, k) {
  const faces = solidFaces(id);
  const raw = [];
  let capHit = false;
  for (const f of faces) {
    const s = f.pts.map((p) => n.x * p[0] + n.y * p[1] + n.z * p[2] - k);
    let prev = s[s.length - 1];
    let prevP = f.pts[f.pts.length - 1];
    for (let i = 0; i < f.pts.length; i++) {
      const cur = s[i], curP = f.pts[i];
      if (prev * cur < 0) {
        const t = prev / (prev - cur);
        raw.push([
          prevP[0] + (curP[0] - prevP[0]) * t,
          prevP[1] + (curP[1] - prevP[1]) * t,
          prevP[2] + (curP[2] - prevP[2]) * t,
        ]);
        if (f.cap) capHit = true;
      }
      prev = cur;
      prevP = curP;
    }
  }
  // 去重
  const pts = [];
  for (const p of raw) if (!pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-5)) pts.push(p);
  if (pts.length < 3) return { pts: null, capHit };
  // 平面内基与角度排序
  const c = [0, 0, 0];
  for (const p of pts) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; }
  const ref = Math.abs(n.y) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [n.y * ref[2] - n.z * ref[1], n.z * ref[0] - n.x * ref[2], n.x * ref[1] - n.y * ref[0]];
  const ul = Math.hypot(...u);
  u = [u[0] / ul, u[1] / ul, u[2] / ul];
  const v = [n.y * u[2] - n.z * u[1], n.z * u[0] - n.x * u[2], n.x * u[1] - n.y * u[0]];
  pts.sort((p, q) => {
    const pa = Math.atan2((p[0] - c[0]) * v[0] + (p[1] - c[1]) * v[1] + (p[2] - c[2]) * v[2], (p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1] + (p[2] - c[2]) * u[2]);
    const qa = Math.atan2((q[0] - c[0]) * v[0] + (q[1] - c[1]) * v[1] + (q[2] - c[2]) * v[2], (q[0] - c[0]) * u[0] + (q[1] - c[1]) * u[1] + (q[2] - c[2]) * u[2]);
    return pa - qa;
  });
  return { pts, c, capHit };
}

// ---------- 形状分类 ----------
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
function classify(id, sec) {
  if (!sec.pts) return '平面与几何体不相交';
  const { n } = planeDef();
  if (id === 'cube') {
    const m = sec.pts.length;
    if (m === 3) {
      const e = [dist(sec.pts[0], sec.pts[1]), dist(sec.pts[1], sec.pts[2]), dist(sec.pts[2], sec.pts[0])];
      return Math.max(...e) / Math.min(...e) < 1.06 ? '等边三角形' : '三角形';
    }
    if (m === 4) {
      const P = sec.pts;
      const e = () => [dist(P[0], P[1]), dist(P[1], P[2]), dist(P[2], P[3]), dist(P[3], P[0])];
      const [e0, e1, e2, e3] = e();
      const dir = (a, b) => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const d0 = dir(P[0], P[1]), d1 = dir(P[1], P[2]), d2 = dir(P[2], P[3]), d3 = dir(P[3], P[0]);
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const cr = (a, b) => Math.hypot(...cross(a, b));
      const par01 = cr(d0, d2) < 0.05, par12 = cr(d1, d3) < 0.05;
      const perp = Math.abs(d0[0] * d1[0] + d0[1] * d1[1] + d0[2] * d1[2]) < 0.06;
      const eq = Math.max(e0, e1, e2, e3) / Math.min(e0, e1, e2, e3) < 1.06;
      if (eq && par01 && par12 && perp) return '正方形';
      if (par01 && par12 && perp) return '矩形';
      if (par01 && par12) return '平行四边形';
      if (par01 !== par12) return '梯形';
      return '四边形';
    }
    if (m === 5) return '五边形';
    return '六边形';
  }
  if (id === 'cyl') {
    if (par.el < 2) return sec.pts ? '圆' : '平面与几何体不相交';
    return sec.capHit ? '矩形（截到底面）' : '椭圆';
  }
  // 圆锥：β 为截面与轴的交角，α 为母线与轴的交角
  const { r, h } = SOLIDS.cone;
  const apex = new THREE.Vector3(0, h / 2, 0);
  const apexOn = Math.abs(n.dot(apex) - par.k) < 0.03;
  if (apexOn && par.el >= 2) return '三角形（过顶点）';
  if (par.el < 2) return '圆';
  const alpha = Math.atan(r / h) / D2R;
  const beta = 90 - par.el;
  if (beta > alpha + 2) return '椭圆';
  if (Math.abs(beta - alpha) <= 2) return '抛物线（弓形）';
  return '双曲线（弓形）';
}

// ---------- 实体（两半 + clipping） ----------
function edgeLines(geo, mat) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), mat);
}
function buildSolid(id) {
  for (const g of [solidA, solidB]) {
    if (g) {
      g.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && !Array.isArray(o.material)) o.material.dispose();
      });
      scene.remove(g);
    }
  }
  edgeMats = [];
  const p = palette();
  const mkEdge = () => {
    const m = new THREE.LineBasicMaterial({ color: p.text, transparent: true, opacity: 0.4, clippingPlanes: [clipPlane] });
    edgeMats.push(m);
    return m;
  };
  const mkFace = (plane) => new THREE.MeshStandardMaterial({
    color: p.panel, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.1,
    clippingPlanes: [plane], clipShadows: false,
  });
  faceMatA = mkFace(clipPlane);
  faceMatB = mkFace(clipPlaneNeg);

  let geo;
  if (id === 'cube') geo = new THREE.BoxGeometry(2, 2, 2);
  else if (id === 'cyl') geo = new THREE.CylinderGeometry(SOLIDS.cyl.r, SOLIDS.cyl.r, SOLIDS.cyl.h, 48);
  else geo = new THREE.ConeGeometry(SOLIDS.cone.r, SOLIDS.cone.h, 48);

  solidA = new THREE.Group();
  const mA = new THREE.Mesh(geo, faceMatA);
  const eA = edgeLines(geo, new THREE.LineBasicMaterial({ color: p.text, transparent: true, opacity: 0.4, clippingPlanes: [clipPlane] }));
  edgeMats.push(eA.material);
  mA.add(eA);
  solidA.add(mA);
  scene.add(solidA);

  solidB = new THREE.Group();
  const mB = new THREE.Mesh(geo.clone(), faceMatB);
  const eB = edgeLines(geo.clone(), new THREE.LineBasicMaterial({ color: p.text, transparent: true, opacity: 0.4, clippingPlanes: [clipPlaneNeg] }));
  edgeMats.push(eB.material);
  mB.add(eB);
  solidB.add(mB);
  scene.add(solidB);
}

// ---------- 切平面指示框 ----------
function buildPlaneIndicator() {
  const p = palette();
  const verts = [];
  const S = 2.7, step = 0.675;
  for (let t = -S; t <= S + 1e-6; t += step) {
    verts.push(t, -S, 0, t, S, 0);
    verts.push(-S, t, 0, S, t, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  planeGrid = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: p.muted, transparent: true, opacity: 0.45 }));
  scene.add(planeGrid);
  planeFill = new THREE.Mesh(
    new THREE.PlaneGeometry(S * 2, S * 2),
    new THREE.MeshBasicMaterial({ color: p.muted, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })
  );
  scene.add(planeFill);
}

// ---------- 截面高亮 + 名称标注 ----------
function buildSectionGroup() {
  sectionGroup = new THREE.Group();
  scene.add(sectionGroup);
}

function makeChip(text) {
  const p = palette();
  const c = document.createElement('canvas');
  c.width = 300; c.height = 110;
  const x = c.getContext('2d');
  x.fillStyle = p.panel;
  x.strokeStyle = p.line;
  x.lineWidth = 4;
  x.beginPath();
  const m = 6, rr = 22;
  x.moveTo(m + rr, m);
  x.arcTo(294, m, 294, 104, rr);
  x.arcTo(294, 104, m, 104, rr);
  x.arcTo(m, 104, m, m, rr);
  x.arcTo(m, m, 294, m, rr);
  x.closePath();
  x.fill(); x.stroke();
  x.fillStyle = p.gold;
  x.font = 'bold 44px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 150, 58);
  if (chipTex) chipTex.dispose();
  chipTex = new THREE.CanvasTexture(c);
  chipTex.colorSpace = THREE.SRGBColorSpace;
  return chipTex;
}

function updateScene() {
  const { n, k } = planeDef();
  clipPlane.normal.copy(n);
  clipPlane.constant = -k;
  clipPlaneNeg.normal.copy(n).negate();
  clipPlaneNeg.constant = k;

  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  planeGrid.quaternion.copy(q);
  planeGrid.position.copy(n).multiplyScalar(k);
  planeFill.quaternion.copy(q);
  planeFill.position.copy(n).multiplyScalar(k);

  solidA.position.copy(n).multiplyScalar(par.gap);
  solidB.position.copy(n).multiplyScalar(-par.gap);

  // 截面重算
  if (sectionMesh) {
    sectionMesh.geometry.dispose();
    sectionGroup.remove(sectionMesh);
  }
  if (sectionLine) {
    sectionLine.geometry.dispose();
    sectionGroup.remove(sectionLine);
  }
  const sec = sectionPolygon(par.solid, n, k);
  const shape = classify(par.solid, sec);
  if (chip) {
    chip.material.map = makeChip(shape);
    chip.material.needsUpdate = true;
  }
  chipHost.dataset.shape = shape;
  const label = document.getElementById('shape');
  if (label) label.textContent = `截面：${shape}`;

  if (sec.pts) {
    const p = palette();
    const pos = [];
    const c = sec.c;
    for (let i = 0; i < sec.pts.length; i++) {
      const a = sec.pts[i], b = sec.pts[(i + 1) % sec.pts.length];
      pos.push(...c, ...a, ...b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    sectionMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: p.gold, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false,
    }));
    sectionGroup.add(sectionMesh);

    const lp = [];
    for (let i = 0; i <= sec.pts.length; i++) lp.push(...sec.pts[i % sec.pts.length]);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    sectionLine = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: p.gold }));
    sectionGroup.add(sectionLine);

    if (chip) chip.position.set(c[0], c[1], c[2]).addScaledVector(n, 0.42);
    chip.visible = true;
  } else {
    chip.visible = false;
  }
}

function updateCamera() {
  camera.position.set(
    target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
    target.y + spherical.radius * Math.cos(spherical.phi),
    target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
  );
  camera.lookAt(target);
}

// ---------- UI ----------
const STYLE = `
#ctrl{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:10px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:94vw}
#ctrl .btn.on{border-color:var(--gold);color:var(--gold)}
#ctrl .dim{display:flex;align-items:center;gap:7px;font-size:17px}
#ctrl input[type=range]{width:110px;accent-color:var(--gold)}
#ctrl b{min-width:2.6em;text-align:center;font-size:17px;font-weight:600}
#shape{position:fixed;top:64px;left:16px;z-index:15;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-size:21px;font-weight:700;color:var(--gold)}
@media (max-width:760px){#ctrl{gap:8px;padding:8px 10px;bottom:10px}#ctrl input[type=range]{width:84px}#shape{font-size:18px;top:60px;left:10px;padding:6px 10px}}
@media (max-width:1180px){#hint{display:none}}
`;

function buildUI(stage) {
  const s = document.createElement('style');
  s.textContent = STYLE;
  stage.appendChild(s);

  const ctrl = document.createElement('div');
  ctrl.id = 'ctrl';
  ctrl.innerHTML = [
    ...Object.entries(SOLIDS).map(([id, v]) => `<button class="btn${id === 'cube' ? ' on' : ''}" data-solid="${id}" type="button" aria-label="${v.name}">${v.name}</button>`),
    '<label class="dim">方位<input id="raz" type="range" min="0" max="180" step="5" value="30" aria-label="方位角"><b id="vaz">30°</b></label>',
    '<label class="dim">倾角<input id="rel" type="range" min="0" max="90" step="2" value="45" aria-label="倾角"><b id="vel">45°</b></label>',
    '<label class="dim">平移<input id="rk" type="range" min="-1.5" max="1.5" step="0.05" value="0" aria-label="平移"><b id="vk">0.00</b></label>',
    '<label class="dim">切开<input id="rg" type="range" min="0" max="0.8" step="0.05" value="0.3" aria-label="切开距离"><b id="vg">0.30</b></label>',
    '<button class="btn" id="reset" type="button" aria-label="复位">复位</button>',
  ].join('');
  stage.appendChild(ctrl);

  const shape = document.createElement('div');
  shape.id = 'shape';
  stage.appendChild(shape);
  chipHost = shape;

  const bind = (rid, key, vid, fmt) => {
    const el = ctrl.querySelector(rid), out = ctrl.querySelector(vid);
    el.addEventListener('input', () => {
      par[key] = +el.value;
      out.textContent = fmt(+el.value);
      updateScene();
    });
    return el;
  };
  bind('#raz', 'az', '#vaz', (v) => `${v}°`);
  bind('#rel', 'el', '#vel', (v) => `${v}°`);
  bind('#rk', 'k', '#vk', (v) => v.toFixed(2));
  bind('#rg', 'gap', '#vg', (v) => v.toFixed(2));
  ctrl.querySelectorAll('[data-solid]').forEach((b) => b.addEventListener('click', () => {
    par.solid = b.dataset.solid;
    ctrl.querySelectorAll('[data-solid]').forEach((x) => x.classList.toggle('on', x === b));
    buildSolid(par.solid);
    updateScene();
  }));
  ctrl.querySelector('#reset').addEventListener('click', () => {
    Object.assign(par, { az: 30, el: 45, k: 0, gap: 0.3 });
    ctrl.querySelector('#raz').value = 30; ctrl.querySelector('#vaz').textContent = '30°';
    ctrl.querySelector('#rel').value = 45; ctrl.querySelector('#vel').textContent = '45°';
    ctrl.querySelector('#rk').value = 0; ctrl.querySelector('#vk').textContent = '0.00';
    ctrl.querySelector('#rg').value = 0.3; ctrl.querySelector('#vg').textContent = '0.30';
    updateScene();
  });
}

// ---------- 教研员契约：定位行 / 教学环节 / 引导语 / 知识小结 ----------
// 环节预设 = 真实场景状态（几何体 + 方位/倾角/平移/切开），expect 供自测断言对照
const STEPS = [
  {
    name: '认一认', solid: 'cube', az: 30, el: 45, k: 0, gap: 0.3, expect: '六边形',
    guide: '画面里平面正斜着切过正方体，左上角显示截面是六边形。请拖动画面旋转，从不同角度确认金色截面确实在正方体内部，再数一数它有几条边、每个顶点分别落在哪条棱上。',
    note: '截面是「一个平面切立体，与立体表面的交线围成的图形」。截面的每条边都落在正方体的一个面上，正方体只有 6 个面，所以截面边数最多是 6——从三角形、四边形到六边形都可能，但不可能有七边形。判断截面形状的基本功：数截面与几个面相交，再逐面看交线段怎么连。',
  },
  {
    name: '切一切', solid: 'cube', az: 30, el: 0, k: 0, gap: 0.3, expect: '正方形',
    guide: '现在平面水平放置，截面是正方形。只动倾角滑杆慢慢加大，先猜一猜截面会依次出现什么形状，每次说出预测后，再对照左上角的形状名验证，注意边数怎样变化。',
    note: '水平切过正方体中段，截面是与底面全等的正方形；倾角加大，平面开始斜着穿过，截面拉长为长方形、再变菱形等四边形；当平面与六个面都相交时出现六边形。倾角变化不改变「最多六边」的结论，只改变与哪几个面相交——边数跟着相交面数走。',
  },
  {
    name: '换圆锥', solid: 'cone', az: 30, el: 40, k: 0, gap: 0.3, expect: '椭圆',
    guide: '换成圆锥再斜切，截面是椭圆。继续加大倾角，截面会依次出现抛物线、双曲线的一段；平面放平又变回圆。圆、椭圆、抛物线、双曲线统称圆锥曲线，这个名字就从圆锥的截面来。',
    note: '设母线与轴夹角 α、截面与轴夹角 β：β > α 截面是椭圆（β = 90° 是圆），β = α 是抛物线的一段，β < α 是双曲线的一段。三种曲线由同一个圆锥、只靠角度变化依次登场——这正是「圆锥曲线」统称的来历，高中解析里研究的曲线在此一次看全。',
  },
];
const SUMMARY =
  '平面截正方体：截面可能是三角形、四边形、五边形或六边形。截面每一条边都落在正方体的一个面上，所以边数最多为六；水平切得正方形，斜切且与六个面都相交时得六边形。' +
  '平面截圆锥：设母线与轴的夹角为 α、截面与轴的夹角为 β，则 β 大于 α 时截面为椭圆，等于 α 时为抛物线的一段，小于 α 时为双曲线的一段，β 等于 90 度时为圆。' +
  '圆、椭圆、抛物线、双曲线统称圆锥曲线。';
const META_TEXT = '数学·高一｜人教A版必修第二册第八章 · 截面';

let teachPanel = null;

function syncControls() {
  const set = (id, vid, v, fmt) => {
    const input = document.querySelector(id), out = document.querySelector(vid);
    if (input) input.value = String(v);
    if (out) out.textContent = fmt(v);
  };
  set('#raz', '#vaz', par.az, (v) => `${v}°`);
  set('#rel', '#vel', par.el, (v) => `${v}°`);
  set('#rk', '#vk', par.k, (v) => v.toFixed(2));
  set('#rg', '#vg', par.gap, (v) => v.toFixed(2));
  document.querySelectorAll('#ctrl [data-solid]').forEach((b) => b.classList.toggle('on', b.dataset.solid === par.solid));
}

function setStep(i) {
  const s = STEPS[i];
  if (s.solid !== par.solid) {
    par.solid = s.solid;
    buildSolid(par.solid);
  }
  par.az = s.az; par.el = s.el; par.k = s.k; par.gap = s.gap;
  syncControls();
  updateScene();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
  document.querySelectorAll('[data-hv-guide]').forEach((el, k) => { el.style.display = k === i ? '' : 'none'; });
}

// 形状读出框跟随教学面板下缘，避免被环节条遮挡
function positionShape() {
  const shape = document.getElementById('shape');
  if (shape && teachPanel) shape.style.top = `${teachPanel.offsetTop + teachPanel.offsetHeight + 12}px`;
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '数学·高一｜人教A版必修第二册第八章《立体几何初步》· 立体的截面',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '平面截正方体，截面边数最多是？',
      opts: ['4', '5', '6', '8'],
      a: 2,
      why: '截面的每条边都落在正方体的一个面上，正方体只有 6 个面，边数最多为 6。8 是顶点数，不是面数，别混。',
    },
    {
      q: '水平切过正方体（不过棱），截面形状是？',
      opts: ['长方形', '正方形', '六边形', '三角形'],
      a: 1,
      why: '水平面与上下方向的面平行地相交，截面与底面全等，是正方形。斜切才会拉长成长方形或出现更多边数。',
    },
    {
      q: '要使正方体的截面是六边形，平面必须？',
      opts: ['过一条棱', '只与四个面相交', '与六个面都相交', '过一对顶点'],
      a: 2,
      why: '边数等于相交的面数，六边形需要与全部六个面都相交——平面斜着穿过、每面贡献一条交线段。',
    },
    {
      q: '圆锥截面是椭圆时，截面与轴的夹角 β 与母线与轴夹角 α 的关系是？',
      opts: ['β < α', 'β = α', 'β > α（β ≠ 90°）', '与 α 无关'],
      a: 2,
      why: 'β > α 时截面是椭圆（β = 90° 退化为圆）；β = α 是抛物线，β < α 是双曲线——三种曲线由一个不等号分界。',
    },
    {
      q: '圆、椭圆、抛物线、双曲线统称圆锥曲线，理由是？',
      opts: ['都由圆压缩得到', '都能用圆规画出', '都是平面截圆锥面得到的截线', '方程都含平方项'],
      a: 2,
      why: '改变平面与圆锥轴的角度，四种曲线可从同一圆锥上依次截出，「圆锥曲线」因此得名。这也是解析法研究它们之前的几何本源。',
    },
  ],
};



// 自测断言：每个环节预设的截面顶点必须全是有限数，且形状分类与预期一致
function runSelfChecks() {
  const push = (name, pass, detail) => window.__hvPushCheck(name, pass, detail);
  for (const s of STEPS) {
    const az = s.az * D2R, el = s.el * D2R;
    const n = new THREE.Vector3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az));
    const sec = sectionPolygon(s.solid, n, s.k);
    const finite = !!sec.pts && sec.pts.every((p) => p.every(Number.isFinite));
    push(`环节-${s.name}-顶点有限`, finite, `pts=${sec.pts ? sec.pts.length : 0}`);
    const shape = classify(s.solid, sec);
    push(`环节-${s.name}-形状${s.expect}`, shape === s.expect, `实际=${shape}`);
  }
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
    renderer.localClippingEnabled = true;
    stage.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(palette().bg);
    camera = new THREE.PerspectiveCamera(40, document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight, 0.1, 60);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.15));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(3, 6, 4);
    scene.add(dir);

    buildUI(stage);
    buildSolid('cube');
    buildPlaneIndicator();
    buildSectionGroup();

    chip = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeChip('截面'), transparent: true, depthTest: false }));
    chip.scale.set(1.05, 0.385, 1);
    chip.renderOrder = 10;
    scene.add(chip);
    updateScene();
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

    // 拖拽旋转 + 滚轮/双指缩放（鼠标与触摸统一 pointer 通道）
    let dragging = false, px0 = 0, py0 = 0;
    const pointers = new Map();
    let pinchDist = 0;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) { dragging = true; px0 = e.clientX; py0 = e.clientY; }
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
      spherical.theta -= (e.clientX - px0) * 0.008;
      spherical.phi = Math.min(1.45, Math.max(0.25, spherical.phi - (e.clientY - py0) * 0.006));
      px0 = e.clientX; py0 = e.clientY;
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) dragging = false; };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      spherical.radius = Math.min(14, Math.max(3.2, spherical.radius * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });

    api.onResize = () => {
      renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
      camera.aspect = document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight;
      camera.updateProjectionMatrix();
      positionShape();
    };
    api.onTheme = () => {
      const p = palette();
      scene.background = new THREE.Color(p.bg);
      faceMatA.color.set(p.panel);
      faceMatB.color.set(p.panel);
      for (const m of edgeMats) m.color.set(p.text);
      planeGrid.material.color.set(p.muted);
      planeFill.material.color.set(p.muted);
      if (sectionMesh) sectionMesh.material.color.set(p.gold);
      if (sectionLine) sectionLine.material.color.set(p.gold);
      chip.material.map = makeChip(chipHost.dataset.shape || '截面');
      chip.material.needsUpdate = true;
    };

    updateCamera();
    (function loop() {
      requestAnimationFrame(loop);
      updateCamera();
      renderer.render(scene, camera);
    })();
  },
});
