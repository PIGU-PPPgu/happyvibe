// 截一个几何体 · 北师大版七上第一章《丰富的图形世界》1.3
// wedulab-craft 首验案例：同源截面计算（逐面裁剪→交线链环→鞋带面积）驱动 3D 截面发光面与面板数字；
// 自研着色器（边缘金→中心琥珀梯度 + 微脉冲）；HUD 仪器读数；引线注释锚定截面质心。
import { init } from '../../_shared/runtime.mjs';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';

// ———— 几何模型（数学与渲染同源：48 边棱面近似圆柱/圆锥）————
const NF = 48; // 棱面数：圆的近似精度
function buildSolid(kind) {
  const verts = [], faces = [];
  const push = (x, y, z) => (verts.push(new THREE.Vector3(x, y, z)), verts.length - 1);
  if (kind === 'cube') {
    const h = 0.8;
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) for (const sx of [-1, 1]) push(sx * h, sy * h, sz * h);
    // 六个面（顶点逆时针朝外）
    faces.push([0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]);
  } else if (kind === 'cylinder') {
    const r = 0.8, hh = 0.85;
    for (let i = 0; i < NF; i++) {
      const a = i / NF * Math.PI * 2;
      push(Math.cos(a) * r, -hh, Math.sin(a) * r);
      push(Math.cos(a) * r, hh, Math.sin(a) * r);
    }
    for (let i = 0; i < NF; i++) {
      const b = (i + 1) % NF;
      faces.push([i * 2, b * 2, b * 2 + 1, i * 2 + 1]); // 侧面
      faces.push([0, 0, 0]); // 占位，下面替换为整多边形
      faces.pop();
    }
    faces.push([...Array(NF).keys()].map(i => i * 2 + 1));          // 顶面
    faces.push([...Array(NF).keys()].map(i => (NF - i) % NF * 2));  // 底面
  } else { // cone：顶点在 +h，底面在 -h
    const r = 0.85, h = 0.9;
    const apex = push(0, h, 0);
    for (let i = 0; i < NF; i++) {
      const a = i / NF * Math.PI * 2;
      push(Math.cos(a) * r, -h, Math.sin(a) * r);
    }
    for (let i = 0; i < NF; i++) faces.push([apex, i + 1, (i + 1) % NF + 1]);
    faces.push([...Array(NF).keys()].map(i => NF - i).map(v => v % NF + 1)); // 底面（逆时针朝下）
  }
  return { kind, verts, faces };
}

// BufferGeometry（渲染用）：三角剖分（朝向自检：中心在原点的凸体，外法线必与三角形重心同向）+ 平滑法线
function solidGeometry(solid) {
  const pos = [];
  const addTri = (a, b, c) => {
    // 凸体朝向自检：法线背离原点才是外表面
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    const cen = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    if (n.dot(cen) < 0) { const t = b; b = c; c = t; }
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (const f of solid.faces) {
    for (let i = 1; i + 1 < f.length; i++) addTri(solid.verts[f[0]], solid.verts[f[i]], solid.verts[f[i + 1]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  if (solid.kind !== 'cube') {
    // 平滑法线：按位置合并求平均（保底/顶面靠材质双面+光照兜底，视觉差异可忽略）
    const map = new Map();
    const p = g.getAttribute('position'), n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      const k = [p.getX(i).toFixed(4), p.getY(i).toFixed(4), p.getZ(i).toFixed(4)].join(',');
      const v = map.get(k) || new THREE.Vector3();
      v.add(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).normalize());
      map.set(k, v);
    }
    for (let i = 0; i < p.count; i++) {
      const k = [p.getX(i).toFixed(4), p.getY(i).toFixed(4), p.getZ(i).toFixed(4)].join(',');
      const v = map.get(k).normalize();
      n.setXYZ(i, v.x, v.y, v.z);
    }
  }
  return g;
}

// ———— 同源截面计算：Sutherland-Hodgman 逐面裁剪 → 交线段 → 链成环 ————
function computeSection(solid, n, d) {
  // 平面 n·x = d，保留 n·x ≤ d 一侧；收集 n·x = d 上的交线段
  const segs = [];
  const dist = (v) => n.dot(v) - d;
  for (const f of solid.faces) {
    const poly = f.map(i => solid.verts[i]);
    const out = [];
    let enter = null, exit = null;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = dist(a), db = dist(b);
      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        const p = a.clone().lerp(b, t);
        out.push(p);
        if (da <= 0) exit = p; else enter = p; // 出面/入面交点
      }
    }
    if (enter && exit) segs.push([enter, exit]); // 有向段：面内保留侧的边界
  }
  // 链环：按端点重合串成闭合多边形（凸体只会有一环）
  const loops = [];
  const key = (p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;
  const byStart = new Map();
  segs.forEach(([a, b]) => { const k = key(a); if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(b); });
  while (segs.length) {
    const [a0, b0] = segs.pop();
    const loop = [a0];
    let cur = b0, guard = 0, closed = false;
    while (guard++ < 500) {
      if (key(cur) === key(a0)) { closed = true; break; }
      loop.push(cur);
      const k = key(cur);
      const nexts = byStart.get(k);
      if (!nexts || !nexts.length) break;
      const nxt = nexts.shift();
      const idx = segs.findIndex(([a]) => key(a) === k);
      if (idx >= 0) segs.splice(idx, 1);
      cur = nxt;
    }
    // 凸体的截面必为闭合环；开环=平面过顶点的退化，丢弃交给 ε 探测
    if (closed && loop.length >= 3) loops.push(loop);
  }
  if (!loops.length) return null;
  const loop = loops[0];
  // 面积（鞋带，3D）：area = ½ |Σ vi × vi+1|
  const acc = new THREE.Vector3();
  for (let i = 0; i < loop.length; i++) acc.add(new THREE.Vector3().crossVectors(loop[i], loop[(i + 1) % loop.length]));
  const area = acc.length() / 2;
  const centroid = loop.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / loop.length);
  return { loop, area, centroid, n: n.clone() };
}

// ———— 形状判定（诚实命名：棱面近似出的光滑形状带"近似"）————
function classify(sec, kind) {
  const L = sec.loop, m = L.length;
  const seg = (a, b) => a.distanceTo(b);
  const dir = (a, b) => b.clone().sub(a).normalize();
  const cross = (u, v) => u.cross(v).length();
  const ang90 = (u, v) => Math.abs(u.dot(v)) < 0.03;
  const par = (u, v) => Math.abs(u.dot(v)) > 0.985;
  if (m === 3) {
    const s = [seg(L[0], L[1]), seg(L[1], L[2]), seg(L[2], L[0])].sort((a, b) => b - a);
    return Math.abs(s[0] - s[1]) < 0.015 ? '等腰三角形' : '三角形';
  }
  if (m === 4) {
    const d1 = dir(L[0], L[1]), d2 = dir(L[1], L[2]), d3 = dir(L[2], L[3]), d4 = dir(L[3], L[0]);
    const s = [seg(L[0], L[1]), seg(L[1], L[2]), seg(L[2], L[3]), seg(L[3], L[0])];
    const p12 = par(d1, d3), p23 = par(d2, d4);
    if (p12 && p23) {
      const right = ang90(d1, d2);
      const eq = Math.abs(s[0] - s[1]) < 0.015 && Math.abs(s[1] - s[2]) < 0.015;
      return right ? (eq ? '正方形' : '矩形') : (Math.abs(s[0] - s[2]) < 0.015 && Math.abs(s[1] - s[3]) < 0.015 ? '菱形' : '平行四边形');
    }
    if (p12 || p23) return '梯形';
    return '四边形';
  }
  if (m <= 8) return ['', '', '', '', '', '五边形', '六边形', '七边形', '八边形'][m];
  // 光滑近似：平面内主轴（协方差特征）求长短轴 + 直边占比（弓形判定）
  const u = new THREE.Vector3(1, 0, 0).cross(sec.n);
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0); else u.normalize();
  const w = new THREE.Vector3().crossVectors(sec.n, u).normalize();
  let sxx = 0, syy = 0, sxy = 0;
  const c2 = [];
  for (const v of L) {
    const p = v.clone().sub(sec.centroid);
    const x = p.dot(u), y = p.dot(w);
    c2.push([x, y]); sxx += x * x; syy += y * y; sxy += x * y;
  }
  const tr = sxx + syy, det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const ratio = Math.sqrt(Math.max(l2, 1e-9) / Math.max(l1, 1e-9));
  const aLong = Math.sqrt(l1 / L.length) * 2, bShort = Math.sqrt(l2 / L.length) * 2;
  // 直边长游程（圆锥斜截经底面时有一段直边）
  let straightRun = 0, perim = 0;
  for (let i = 0; i < m; i++) {
    const a = c2[i], b = c2[(i + 1) % m];
    perim += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  for (let i = 0; i < m; i++) {
    const a = c2[i], b = c2[(i + 1) % m];
    const e = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (e < 0.05) continue;
    const dA = c2[(i - 1 + m) % m], dB = c2[(i + 2) % m];
    const v1 = [a[0] - dA[0], a[1] - dA[1]], v2 = [dB[0] - b[0], dB[1] - b[1]];
    const dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) + 1e-9);
    if (dot > 0.995) straightRun += e;
  }
  if (straightRun > perim * 0.22) return '弓形（近似抛物线）';
  if (ratio > 0.93) return '圆（近似）';
  if (ratio > 0.55) return '椭圆（近似）';
  return '扁椭圆（近似）';
  void aLong; void bShort;
}

// ———— 场景与状态 ————
let renderer, scene, camera, solidMesh, capMesh, planeMesh, planeEdge, clipPlane, ground;
let solid = buildSolid('cube');
let uiBgStars = null;
let theta = 0, dd = 0;                 // θ（度）：平面与水平面夹角；d：沿法向位置
let autoSpin = true, lastT = 0;
let spherical = { az: 0.9, pol: 1.12, r: 4.6, vaz: 0, vpol: 0 };
let sec = null, ui = {}, leaderLine, leaderDot, leaderTag;

const SOLIDS = [
  { key: 'cube', cn: '正方体', en: 'CUBE', presets: [['水平截', 0, 0], ['体对角线截', 54.7356, 0], ['垂直对角截', 90, 0]] },
  { key: 'cylinder', cn: '圆柱', en: 'CYLINDER', presets: [['垂直于轴', 0, 0], ['斜截', 35, 0], ['过轴垂直', 90, 0]] },
  { key: 'cone', cn: '圆锥', en: 'CONE', presets: [['平行于底', 0, -0.4], ['斜截', 32, 0.08], ['过顶点', 90, 0]] },
];

const planeNormal = () => {
  const t = THREE.MathUtils.degToRad(theta);
  const h = Math.cos(t), s = Math.sin(t) / Math.SQRT2;
  return new THREE.Vector3(s, h, s).normalize();
};
const planeDMax = () => { // d 滑杆范围（按几何体半径留裕量）
  let m = 0;
  for (const v of solid.verts) m = Math.max(m, planeNormal().dot(v));
  return Math.min(1.15, m + 0.35);
};

// 细磨砂凹凸贴图（128 细颗粒噪声，无外链零文件）
function makeFrostBump() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#808080'; c.fillRect(0, 0, 128, 128);
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)';
    c.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}
const frostBump = makeFrostBump();

let solidBornAt = -9;
function rebuildSolid() {
  if (solidMesh) { scene.remove(solidMesh); solidMesh.geometry.dispose(); }
  solidBornAt = performance.now() / 1000;
  solidMesh = new THREE.Mesh(solidGeometry(solid), new THREE.MeshStandardMaterial({
    color: 0xdfe3ee, metalness: 0.04, roughness: 0.5,
    bumpMap: frostBump, bumpScale: 0.012,
    clippingPlanes: [clipPlane], side: THREE.DoubleSide,
  }));
  solidMesh.castShadow = true;
  scene.add(solidMesh);
  ground.position.y = solid.kind === 'cube' ? -0.84 : solid.kind === 'cylinder' ? -0.89 : -0.94;
}

// 截面发光面：自研着色器（边缘亮金 → 中心深琥珀，1.6Hz 微脉冲）
const CAP_VERT = `
attribute float aEdge; varying float vE; varying vec3 vN; varying vec3 vV;
void main(){
  vE = aEdge;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const CAP_FRAG = `
uniform float uT; varying float vE; varying vec3 vN; varying vec3 vV;
void main(){
  float pulse = .84 + .16 * sin(uT * 1.6);
  vec3 deep = vec3(.42,.27,.08), edge = vec3(.98,.72,.24);
  // 菲涅尔：正对截面时边缘收敛、掠射视角才亮起（大气边缘光式克制）
  float fres = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.2);
  float rim = smoothstep(.20, .02, vE) * (.35 + .65 * fres);
  vec3 col = mix(deep, edge * .72, vE * .5) + rim * edge * (.35 + .5 * pulse);
  gl_FragColor = vec4(col, 1.);
}`;

function rebuildCap() {
  if (capMesh) { scene.remove(capMesh); capMesh.geometry.dispose(); }
  if (!sec) return;
  const { loop, centroid } = sec;
  const pos = [], edge = [];
  for (let i = 0; i + 1 < loop.length; i++) {
    pos.push(loop[i].x, loop[i].y, loop[i].z, loop[i + 1].x, loop[i + 1].y, loop[i + 1].z, centroid.x, centroid.y, centroid.z);
    edge.push(0, 0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  g.computeVertexNormals();
  capMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    vertexShader: CAP_VERT, fragmentShader: CAP_FRAG, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 } },
  }));
  scene.add(capMesh);
}

function rebuildPlane() {
  if (planeMesh) { scene.remove(planeMesh); planeMesh.geometry.dispose(); planeEdge.geometry.dispose(); }
  const n = planeNormal();
  planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 3.1),
    new THREE.MeshBasicMaterial({ color: 0xE8B04B, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false })
  );
  planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  planeMesh.position.copy(n.clone().multiplyScalar(dd));
  scene.add(planeMesh);
  planeEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(planeMesh.geometry),
    new THREE.LineBasicMaterial({ color: 0xE8B04B, transparent: true, opacity: 0.4 })
  );
  planeEdge.quaternion.copy(planeMesh.quaternion);
  planeEdge.position.copy(planeMesh.position);
  scene.add(planeEdge);
  clipPlane = new THREE.Plane(n.clone(), -dd); // distance = n·x − d > 0 的片段被裁掉
  if (solidMesh) solidMesh.material.clippingPlanes = [clipPlane];
}

function updateSection() {
  const n = planeNormal();
  const dMax = planeDMax();
  dd = Math.max(-dMax, Math.min(dMax, dd));
  // 平面恰好过顶点时交线退化：ε 探测兜底（视觉上不可分辨）
  sec = computeSection(solid, n, dd) || computeSection(solid, n, dd + 2e-4) || computeSection(solid, n, dd - 2e-4);
  rebuildCap();
  rebuildPlane();
  // HUD + 形状卡（全部来自同一份 sec）
  const shape = sec ? classify(sec, solid.kind) : '无（平面未截到几何体）';
  const vcount = sec ? sec.loop.length : 0;
  const area = sec ? sec.area : 0;
  ui.hud.textContent = `θ ${theta.toFixed(1)}°  ·  d ${dd.toFixed(2)}  ·  SECTION ${vcount ? shape : '—'}  ·  S ${area.toFixed(2)}`;
  if (ui.tag) ui.tag.textContent = `截面 · ${shape.replace(/（近似.*/, '')}`;
  ui.shape.textContent = shape;
  ui.vcount.textContent = vcount || '—';
  ui.area.textContent = area ? area.toFixed(2) : '—';
  // 椭圆近似时给长短轴
  if (/椭圆|圆（/.test(shape) && sec) {
    const u = new THREE.Vector3(1, 0, 0).cross(n);
    if (u.lengthSq() < 1e-6) u.set(1, 0, 0); else u.normalize();
    const w = new THREE.Vector3().crossVectors(n, u).normalize();
    let lo = 1e9, hi = -1e9;
    for (const v of sec.loop) { const t = v.clone().sub(sec.centroid).dot(u); lo = Math.min(lo, t); hi = Math.max(hi, t); }
    let lo2 = 1e9, hi2 = -1e9;
    for (const v of sec.loop) { const t = v.clone().sub(sec.centroid).dot(w); lo2 = Math.min(lo2, t); hi2 = Math.max(hi2, t); }
    const A = hi - lo, B = hi2 - lo2;
    ui.axes.parentElement.style.display = '';
    ui.axes.textContent = `长轴 ${(Math.max(A, B)).toFixed(2)} · 短轴 ${(Math.min(A, B)).toFixed(2)}`;
  } else ui.axes.parentElement.style.display = 'none';
}

function setSolid(kind, presetIdx = -1) {
  solid = buildSolid(kind);
  rebuildSolid();
  ui.segBtns.forEach(b => b.classList.toggle('on', b.dataset.k === kind));
  renderPresets();
  if (presetIdx >= 0) {
    const [name, t, d] = SOLIDS.find(s => s.key === kind).presets[presetIdx];
    theta = t; dd = d;
    ui.th.value = t; ui.dv.value = d;
    ui.thOut.textContent = t.toFixed(1) + '°'; ui.dvOut.textContent = (+d).toFixed(2);
    markPreset(kind, presetIdx);
  }
  updateSection();
}

// ———— UI ————
const STYLE = document.createElement('style');
STYLE.textContent = `
#sec-ui{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;z-index:6;width:min(680px,calc(100% - 20px));
  background:color-mix(in srgb,var(--panel) 90%,transparent);border:1px solid var(--line);border-radius:16px;
  padding:12px 18px 10px;backdrop-filter:blur(8px);box-shadow:0 10px 34px rgba(0,0,0,.4);display:flex;flex-direction:column;gap:8px}
#sec-ui .row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#sec-ui .seg{font:inherit;font-size:13px;padding:5px 13px;border-radius:999px;border:1px solid var(--line);
  background:transparent;color:var(--muted,#a99cc0);cursor:pointer;transition:all .15s}
#sec-ui .seg:hover{border-color:var(--gold);color:var(--text)}
#sec-ui .seg.on{border-color:var(--gold);color:var(--gold);background:color-mix(in srgb,var(--gold) 12%,transparent);font-weight:600}
#sec-ui .pre{font:inherit;font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid var(--line);
  background:transparent;color:var(--muted,#a99cc0);cursor:pointer;white-space:nowrap}
#sec-ui #sec-presets{overflow-x:auto;scrollbar-width:none}
#sec-ui .pre.on{border-color:var(--gold);color:var(--gold)}
#sec-ui label{font-size:11.5px;letter-spacing:.04em;color:var(--muted,#a99cc0);white-space:nowrap}
#sec-ui input[type=range]{flex:1;min-width:110px;accent-color:var(--gold)}
#sec-ui output{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;color:var(--text);min-width:44px;text-align:right}
#sec-hud{position:absolute;top:10px;right:14px;z-index:6;font-family:ui-monospace,Menlo,monospace;font-size:12px;
  letter-spacing:.04em;color:var(--muted,#a99cc0);background:rgba(8,5,14,.55);padding:5px 12px;border-radius:999px;
  border:1px solid var(--line);pointer-events:none;backdrop-filter:blur(4px)}
#sec-shape{position:absolute;left:14px;top:10px;z-index:6;background:rgba(8,5,14,.55);border:1px solid var(--line);
  border-radius:14px;padding:9px 16px;backdrop-filter:blur(4px);display:flex;flex-direction:column;gap:3px;min-width:132px}
#sec-shape .cap{font-size:10px;letter-spacing:.18em;color:var(--muted,#a99cc0)}
#sec-shape .nm{font-size:18px;font-weight:700;color:var(--gold);line-height:1.25;margin:1px 0 2px}
#sec-shape .kv{display:flex;justify-content:space-between;align-items:baseline;font-size:11.5px;color:var(--muted,#a99cc0);gap:16px;letter-spacing:.02em}
#sec-shape .kv b{color:var(--text);font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:12.5px}
#sec-hud{letter-spacing:.06em}
#sec-svg{position:absolute;inset:0;z-index:5;pointer-events:none}
@media (max-width:760px){#sec-shape{display:none}#sec-ui{gap:6px;padding:9px 12px 8px}}
`;

function buildUI(stage) {
  stage.appendChild(STYLE);
  const hud = document.createElement('div'); hud.id = 'sec-hud'; stage.appendChild(hud);
  const shape = document.createElement('div'); shape.id = 'sec-shape';
  shape.innerHTML = `<span class="cap">SECTION</span><span class="nm">—</span>
    <span class="kv">顶点 <b id="sec-vc">—</b></span>
    <span class="kv">面积 <b id="sec-ar">—</b></span>
    <span class="kv" style="display:none" id="sec-ax-row"><b id="sec-ax"></b></span>`;
  stage.appendChild(shape);
  const uiEl = document.createElement('div'); uiEl.id = 'sec-ui';
  uiEl.innerHTML = `
    <div class="row" id="sec-solids"></div>
    <div class="row" id="sec-presets"></div>
    <div class="row"><label>倾角 θ</label><input type="range" id="sec-th" min="0" max="90" step="0.1" value="0"><output id="sec-tho">0.0°</output></div>
    <div class="row"><label>位置 d</label><input type="range" id="sec-d" min="-1.15" max="1.15" step="0.01" value="0"><output id="sec-do">0.00</output></div>`;
  stage.appendChild(uiEl);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'sec-svg';
  svg.innerHTML = `<line id="sec-ll" x1="0" y1="0" x2="0" y2="0" stroke="#E8B04B" stroke-width="1" opacity=".8"/>
                   <circle id="sec-ld" cx="0" cy="0" r="3" fill="#E8B04B"/>`;
  stage.appendChild(svg);
  const tag = document.createElement('div');
  tag.style.cssText = 'position:absolute;z-index:6;font-size:12px;color:var(--gold);background:rgba(8,5,14,.72);' +
    'border:1px solid color-mix(in srgb,var(--gold) 45%,transparent);border-radius:999px;padding:2px 10px;pointer-events:none';
  tag.dataset.base = '截面';
  stage.appendChild(tag);

  ui = {
    hud, shape: shape.querySelector('.nm'), vcount: shape.querySelector('#sec-vc'), area: shape.querySelector('#sec-ar'),
    axes: shape.querySelector('#sec-ax'), ui: uiEl,
    th: uiEl.querySelector('#sec-th'), dv: uiEl.querySelector('#sec-d'),
    thOut: uiEl.querySelector('#sec-tho'), dvOut: uiEl.querySelector('#sec-do'),
    segRow: uiEl.querySelector('#sec-solids'), preRow: uiEl.querySelector('#sec-presets'),
    svg, ll: svg.querySelector('#sec-ll'), dot: svg.querySelector('#sec-ld'), tag,
  };
  ui.segRow.innerHTML = SOLIDS.map(s => `<button class="seg" data-k="${s.key}">${s.cn}</button>`).join('');
  ui.segBtns = [...ui.segRow.querySelectorAll('.seg')];
  ui.segBtns.forEach(b => b.addEventListener('click', () => setSolid(b.dataset.k, 0)));
  const onSlide = () => {
    theta = parseFloat(ui.th.value); dd = parseFloat(ui.dv.value);
    ui.thOut.textContent = theta.toFixed(1) + '°'; ui.dvOut.textContent = dd.toFixed(2);
    markPreset(null);
    updateSection();
  };
  ui.th.addEventListener('input', onSlide);
  ui.dv.addEventListener('input', onSlide);
  renderPresets();
}

function renderPresets() {
  const cur = SOLIDS.find(s => s.key === solid.kind);
  ui.preRow.innerHTML = `<label>预设</label>` + cur.presets.map((p, i) =>
    `<button class="pre" data-i="${i}">${p[0]}</button>`).join('');
  ui.preRow.querySelectorAll('.pre').forEach(b =>
    b.addEventListener('click', () => {
      const [name, t, d] = cur.presets[+b.dataset.i];
      theta = t; dd = d;
      ui.th.value = t; ui.dv.value = d;
      ui.thOut.textContent = t.toFixed(1) + '°'; ui.dvOut.textContent = (+d).toFixed(2);
      markPreset(solid.kind, +b.dataset.i);
      updateSection();
    }));
}
function markPreset(kind, idx) {
  ui.preRow.querySelectorAll('.pre').forEach(b => b.classList.toggle('on', kind === solid.kind && +b.dataset.i === idx));
}

// ———— 相机（惯性拖拽）与主循环 ————
function updateCamera() {
  const { az, pol, r } = spherical;
  camera.position.set(r * Math.sin(pol) * Math.sin(az), r * Math.cos(pol), r * Math.sin(pol) * Math.cos(az));
  camera.lookAt(0, -0.05, 0);
}
function projectToScreen(v) {
  const p = v.clone().project(camera);
  return { x: (p.x + 1) / 2 * renderer.domElement.clientWidth, y: (1 - p.y) / 2 * renderer.domElement.clientHeight };
}
function animate(t) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  if (autoSpin) spherical.az += dt * 0.12;
  spherical.az += spherical.vaz * dt; spherical.pol += spherical.vpol * dt;
  spherical.vaz *= 0.9; spherical.vpol *= 0.9;
  spherical.pol = Math.max(0.25, Math.min(2.6, spherical.pol));
  updateCamera();
  // 几何体入场：0.4s 缩放回弹，让「换了主体」被看见
  if (solidMesh) {
    const age = t / 1000 - solidBornAt;
    const k = age < 0.45 ? 1 - Math.pow(1 - age / 0.45, 3) * 0.14 : 1;
    const sc = age < 0.45 ? 0.86 + 0.14 * k : 1;
    solidMesh.scale.setScalar(sc);
    solidMesh.position.y = age < 0.45 ? (1 - sc) * 0.9 : 0;
  }
  if (capMesh) capMesh.material.uniforms.uT.value = t / 1000;
  if (uiBgStars) uiBgStars.material.uniforms.uT.value = t / 1000;
  renderer.render(scene, camera);
  // 引线注释：锚定截面质心的屏幕投影
  if (sec && ui.tag) {
    const p = projectToScreen(sec.centroid);
    // 标签默认放右上方；靠近左上形状卡（<230px）时翻到右侧远处，避免重叠
    const flip = p.x < 230;
    const lx = flip ? p.x + 96 : p.x + 42, ly = p.y - 64;
    ui.ll.setAttribute('x1', lx + (flip ? -30 : 0)); ui.ll.setAttribute('y1', ly + 16);
    ui.ll.setAttribute('x2', p.x); ui.ll.setAttribute('y2', p.y - 6);
    ui.dot.setAttribute('cx', p.x); ui.dot.setAttribute('cy', p.y - 6);
    ui.tag.style.left = lx + 'px'; ui.tag.style.top = ly + 'px';
    const vis = p.x > 40 && p.x < renderer.domElement.clientWidth - 130 && p.y > 70;
    ui.tag.style.opacity = vis ? 1 : 0; ui.ll.style.opacity = vis ? .8 : 0; ui.dot.style.opacity = vis ? 1 : 0;
  }
}

// ———— 教学契约 ————
const TEACHING = {
  meta: '数学·七年级｜北师大版七上第一章《丰富的图形世界》· 1.3 截一个几何体',
  steps: [
    {
      name: '想一想',
      guide: '画面里金色发亮的平面正水平切过正方体。生活中的切西瓜、切豆腐也是这样。刀痕围成的图形叫什么？它是由谁相交得到的？',
      note: '用一个平面去截一个几何体，截出的平面图形叫截面（cross section）。截面是平面与几何体表面相交的交线围成的图形：正方体水平截一刀，交线是四个侧面上的四条竖直线段，围成正方形。看形状卡：顶点 4、面积 2.56（边长 1.6 的正方形）。切口在哪儿，截面就跟到哪儿——拖动「位置 d」试试上下平移。',
      apply: () => { setSolid('cube', 0); autoSpin = true; },
    },
    {
      name: '做一做',
      guide: '现在截面是正六边形——平面正好垂直于体对角线。拖动「倾角 θ」从 0° 拉到 90°，再拖「位置 d」：截面能变成几边形？最多几条边？为什么到头了？',
      note: '截面多边形的每条边都是平面与一个面的交线：正方体只有 6 个面，每个面最多贡献一条边，所以截面最多六边形、不可能七边形。θ=0° 水平截得正方形；斜着截（θ 在 20°~70° 之间）常得五边形、六边形；θ=90° 垂直对角截得矩形。形状卡的顶点数与面积随拖动实时变化，凑齐三角形、四边形、五边形、六边形各一个再下课。',
      apply: () => { setSolid('cube', 1); autoSpin = false; },
    },
    {
      name: '议一议',
      guide: '换成圆柱：怎样截出圆？怎样截出矩形？斜着截为什么是椭圆？再换圆锥——过顶点截、平行于底截、斜截，各得什么形状？小组用「截面的边从哪些面来」说理。',
      note: '圆柱垂直于轴截（θ=0°）截面是圆，与底面平行；过轴垂直截（θ=90°）交线来自侧面两条母线加上下底各一条，围成矩形；斜截（不过轴、不平行底）交线是一条光滑闭合曲线——椭圆（近似），看长短轴读数。圆锥过顶点且过轴，交线是两条母线加底面直径，等腰三角形；平行于底得圆；斜截得椭圆或弓形——这些曲线后来统称「圆锥曲线」，名字就是这么来的。',
      apply: () => { setSolid('cylinder', 1); autoSpin = false; },
    },
  ],
  summary: '截面：用一个平面去截几何体，截出的平面图形。截面多边形的边是平面与几何体表面的交线，边数不超过面数——正方体最多截出六边形。圆柱：垂直于轴得圆，过轴得矩形，斜截得椭圆；圆锥：过顶点得等腰三角形，平行于底得圆，斜截得椭圆或弓形。判断截面的关键是想清楚「交线落在哪几个面上」。',
  quiz: [
    {
      q: '用平面去截正方体，不可能得到的截面是？',
      opts: ['三角形', '五边形', '六边形', '七边形'],
      a: 3,
      why: '截面多边形的每条边是平面与一个面的交线，正方体只有 6 个面，最多贡献 6 条边，所以截面最多六边形，不可能七边形。',
    },
    {
      q: '垂直于圆柱的轴去截，截面是？',
      opts: ['矩形', '圆', '椭圆', '等腰三角形'],
      a: 1,
      why: '垂直于轴的截面与底面平行，交线是与底面圆一样大的圆。矩形的两条长边来自侧面母线，只有过轴的竖直平面才截得出。',
    },
    {
      q: '过圆锥顶点并且过轴的平面去截，截面是？',
      opts: ['圆', '椭圆', '等腰三角形', '梯形'],
      a: 2,
      why: '交线是两条母线（侧面）加底面直径（底面），围成等腰三角形——腰是母线，底是直径。可以到画面里切「过顶点」预设核对。',
    },
    {
      q: '正方体被垂直于体对角线、过中心的平面所截，截面是？',
      opts: ['正方形', '正六边形', '矩形', '等边三角形'],
      a: 1,
      why: '垂直体对角线过中心的平面同时经过六条棱的中点，交线围成正六边形——画面「体对角线截」预设就是这个切法，形状卡读数：顶点 6。',
    },
    {
      q: '不平行于底面、也不过轴地斜截圆柱，截面是？',
      opts: ['圆', '矩形', '椭圆', '三角形'],
      a: 2,
      why: '斜截时交线是一条光滑闭合曲线，介于上下两个圆之间过渡，是椭圆（近似）。拖「倾角 θ」到 35° 左右即可在画面看到，并读出长短轴。',
    },
  ],
};

// ———— 自测（同源断言：面板数字 = 裁剪计算）————
function runSelfChecks() {
  const push = window.__hvPushCheck;
  if (!push) return;
  const bad = [];
  const cases = [
    ['cube', 0, 0, '正方形', 4, 2.56, 0.02],
    ['cube', 54.7356, 0, '六边形', 6, null, 0],
    ['cube', 90, 0, '矩形', 4, null, 0],
    ['cylinder', 0, 0, '圆（近似）', null, Math.PI * 0.8 * 0.8, 0.1],
    ['cylinder', 90, 0, '矩形', 4, 1.6 * 1.7, 0.05],
    ['cone', 0, -0.4, '圆（近似）', null, Math.PI * (0.85 * 1.3 / 1.8) ** 2, 0.03],
  ];
  for (const [kind, t, d, want, wantV, wantA, tolA] of cases) {
    solid = buildSolid(kind); rebuildSolid();
    theta = t; dd = d; updateSection();
    const gotName = ui.shape.textContent, gotV = sec ? sec.loop.length : 0;
    if (gotName !== want) bad.push(`${kind} θ=${t}: 形状 ${gotName} ≠ ${want}`);
    if (wantV != null && gotV !== wantV) bad.push(`${kind} θ=${t}: 顶点 ${gotV} ≠ ${wantV}`);
    if (wantA != null && Math.abs(sec.area - wantA) > tolA) bad.push(`${kind} θ=${t}: 面积 ${sec.area.toFixed(3)} ≠ ${wantA.toFixed(3)}`);
  }
  push('同源-截面计算', bad.length === 0, bad.join('；') || '6 组预设：形状/顶点/面积与逐面裁剪计算一致');
  // 面板↔HUD 一致 + 滑杆联动
  setSolid('cube', 1);
  ui.th.value = 30; ui.th.dispatchEvent(new Event('input'));
  const hudHas30 = ui.hud.textContent.includes('30.0');
  const shapeChanged = ui.shape.textContent !== '正六边形';
  push('同源-滑杆联动', hudHas30 && shapeChanged, '拖 θ 后 HUD 与形状卡同步更新');
  setSolid('cube', 1); // 复位到议一议前状态
  window.__hvApplyStep0 && window.__hvApplyStep0();
}

init({
  teaching: TEACHING,
  mount(stage, api) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;touch-action:none;cursor:grab';
    stage.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    // 深空氛围：径向渐变幕布 + 稀疏星点（克制的 40-80 颗，alpha 0.1-0.3）
    {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const c = cv.getContext('2d');
      const g = c.createRadialGradient(32, 32, 4, 32, 32, 44);
      g.addColorStop(0, '#1a2140'); g.addColorStop(0.55, '#121227'); g.addColorStop(1, '#0a0c1a');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      const bgTex = new THREE.CanvasTexture(cv);
      const bgGeo = new THREE.SphereGeometry(28, 32, 16);
      const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, side: THREE.BackSide, fog: false });
      const bg = new THREE.Mesh(bgGeo, bgMat);
      bg.userData.noTheme = true;
      scene.add(bg);
      uiBgStars = (() => {
        // 分层星空：72 微星 + 10 亮星（尺寸/亮度分档，避免均匀白噪声感）
        const n = 82, pos = new Float32Array(n * 3), sz = new Float32Array(n), br = new Float32Array(n);
        let seed = 5;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < n; i++) {
          const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 24;
          const sq = Math.sqrt(1 - u * u);
          pos[i * 3] = r * sq * Math.cos(a); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * sq * Math.sin(a);
          const bright = i < 10;
          sz[i] = bright ? 0.22 + rnd() * 0.1 : 0.06 + rnd() * 0.05;
          br[i] = bright ? 0.95 : 0.25 + rnd() * 0.3;
        }
        const g2 = new THREE.BufferGeometry();
        g2.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g2.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
        g2.setAttribute('aBright', new THREE.BufferAttribute(br, 1));
        const stars = new THREE.Points(g2, new THREE.ShaderMaterial({
          transparent: true, depthWrite: false,
          uniforms: { uT: { value: 0 } },
          vertexShader: 'attribute float aSize; attribute float aBright; uniform float uT; varying float vB;'
            + 'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.);'
            + 'vB = aBright * (.8 + .2 * sin(uT * (.6 + aBright) + position.x * 7.));'
            + 'gl_PointSize = aSize * (760. / -mv.z); gl_Position = projectionMatrix * mv; }',
          fragmentShader: 'varying float vB;'
            + 'void main(){ float r = length(gl_PointCoord - .5) * 2.;'
            + 'float a = exp(-r * r * 4.) + .25 * exp(-r * r * .9); if (r > 1.) discard;'
            + 'gl_FragColor = vec4(vec3(.93,.85,.66) * vB, 1.) * a; }',
        }));
        scene.add(stars);
        return stars;
      })();
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
    scene.environmentIntensity = 0.5;
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const key = new THREE.DirectionalLight(0xfff2dd, 1.5);
    key.position.set(3, 5, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -3;
    key.shadow.camera.right = key.shadow.camera.top = 3;
    key.shadow.bias = -0.0006;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcdd8ef, 0.5);
    fill.position.set(-4.5, 1.6, 2.6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.85);
    rim.position.set(-1, 4.5, -5);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x2a2233, 0.45));

    const aoCv = document.createElement('canvas');
    aoCv.width = aoCv.height = 256;
    const ac = aoCv.getContext('2d');
    const ag = ac.createRadialGradient(128, 128, 10, 128, 128, 124);
    ag.addColorStop(0, 'rgba(0,0,0,.5)'); ag.addColorStop(.55, 'rgba(0,0,0,.26)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ac.fillStyle = ag; ac.fillRect(0, 0, 256, 256);
    ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 40),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(aoCv), transparent: true, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.84;
    scene.add(ground);

    buildUI(stage);
    rebuildSolid();
    clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    rebuildPlane();
    updateSection();
    updateCamera();

    // 拖拽旋转（带惯性）+ 滚轮缩放
    const el = renderer.domElement;
    let dragging = false, px = 0, py = 0;
    el.addEventListener('pointerdown', (e) => { dragging = true; autoSpin = false; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = (e.clientX - px) / el.clientWidth * 3, dy = (e.clientY - py) / el.clientHeight * 3;
      px = e.clientX; py = e.clientY;
      spherical.az -= dx * 0.35; spherical.pol -= dy * 0.35;
      spherical.vaz = -dx * 0.35 / 0.016 * 0.016; spherical.vpol = -dy * 0.35 / 0.016 * 0.016;
    });
    el.addEventListener('pointerup', () => { dragging = false; });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      spherical.r = Math.min(8, Math.max(2.6, spherical.r * (1 + Math.sign(e.deltaY) * 0.07)));
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
      if (e.key === 'ArrowUp') { theta = Math.min(90, theta + 2); ui.th.value = theta; markPreset(null); updateSection(); ui.thOut.textContent = theta.toFixed(1) + '°'; }
      else if (e.key === 'ArrowDown') { theta = Math.max(0, theta - 2); ui.th.value = theta; markPreset(null); updateSection(); ui.thOut.textContent = theta.toFixed(1) + '°'; }
    });

    const resize = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();
    api.onResize = resize;
    new ResizeObserver(resize).observe(stage);
    requestAnimationFrame(animate);
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
  },
});
