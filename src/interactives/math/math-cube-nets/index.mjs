import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';
import { NETS, foldGeometry } from './nets.mjs';

const PAIR_COLORS = { y: 0xfeb300, x: 0xa63d97, z: 0x4fc3f7 }; // 对面同色：金/紫/蓝

let renderer, scene, camera, root;
let hinges = []; // { node, axis, sign }
let carriers = [];
let netIndex = 0;
let fold = 0.22; // 0 展开 → 1 折起；默认微折，让「这是会折叠的展开图」一眼可见
const spherical = { theta: 0.7, phi: 1.12, radius: 4.1 };
const target = new THREE.Vector3(0, 0.5, 0);

function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: new THREE.Color(cs.getPropertyValue('--bg').trim() || '#150e22'),
    line: new THREE.Color(cs.getPropertyValue('--text').trim() || '#f2ecf8'),
  };
}

function buildNet(cells) {
  if (root) scene.remove(root);
  root = new THREE.Group();
  scene.add(root);

  // 网格居中
  const xs = cells.map((c) => c[0]);
  const zs = cells.map((c) => c[1]);
  root.position.set(-(Math.min(...xs) + Math.max(...xs)) / 2, 0, -(Math.min(...zs) + Math.max(...zs)) / 2);

  const geo = foldGeometry(cells);
  carriers = [];
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);

  const colors = themeColors();
  const edgeGeo = new THREE.EdgesGeometry(plane);

  for (let i = 0; i < cells.length; i++) {
    const carrier = new THREE.Group();
    carrier.position.set(cells[i][0], 0, cells[i][1]);

    // 面颜色：按折叠后法向所在轴配对（对面同色）
    const n = geo.normals[i];
    const axis = Math.abs(n[1]) > 0 ? 'y' : Math.abs(n[0]) > 0 ? 'x' : 'z';
    const mat = new THREE.MeshStandardMaterial({
      color: PAIR_COLORS[axis], side: THREE.DoubleSide, roughness: 0.55, metalness: 0.08,
    });
    const mesh = new THREE.Mesh(plane, mat);
    const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.55 }));
    mesh.add(edges);
    carrier.add(mesh);
    carriers.push(carrier);
  }

  // 铰链层级：hinge 挂在 parent carrier 内（位于共享边），child carrier 在 hinge 内
  // 以共享边原点定位（子面坐标 = 子格中心 - 边位置），否则绝对坐标会被双重计算
  hinges = [];
  for (let j = 1; j < cells.length; j++) {
    const h = geo.hinge[j];
    const p = geo.parent[j];
    const hingeNode = new THREE.Group();
    if (h.axis === 'z') {
      hingeNode.position.set(h.line / 2 - cells[p][0], 0, 0);
      carriers[j].position.set(cells[j][0] - h.line / 2, 0, cells[j][1] - cells[p][1]);
    } else {
      hingeNode.position.set(0, 0, h.line / 2 - cells[p][1]);
      carriers[j].position.set(cells[j][0] - cells[p][0], 0, cells[j][1] - h.line / 2);
    }
    carriers[p].add(hingeNode);
    hingeNode.add(carriers[j]);
    hinges.push({ node: hingeNode, axis: h.axis, sign: h.sign });
  }
  root.add(carriers[0]);
  // 相机距离随网大小自适应：网占满视野，投屏可读
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) + 1;
  spherical.radius = Math.min(7.5, Math.max(3.2, span * 1.0));
  applyFold();
}

function applyFold() {
  for (const h of hinges) {
    const a = h.sign * fold * Math.PI / 2;
    if (h.axis === 'z') h.node.rotation.z = a;
    else h.node.rotation.x = a;
  }
}

function updateCamera() {
  const { theta, phi, radius } = spherical;
  camera.position.set(
    target.x + radius * Math.sin(phi) * Math.sin(theta),
    target.y + radius * Math.cos(phi),
    target.z + radius * Math.sin(phi) * Math.cos(theta)
  );
  camera.lookAt(target);
}

function setNet(i) {
  netIndex = (i + NETS.length) % NETS.length;
  buildNet(NETS[netIndex].cells);
  nameEl.textContent = `${netIndex + 1}/${NETS.length} ${NETS[netIndex].name}`;
}

// 自测：展开态六面世界坐标 === 网格坐标；折叠态 === 立方体六面中心（能抓住铰链挂载坐标系错误）
function runSelfChecks() {
  const cells = NETS[netIndex].cells;
  const geo = foldGeometry(cells);
  const push = window.__hvPushCheck;
  if (!push) return;
  const base = new THREE.Vector3();
  const checkAt = (t, expect) => {
    fold = t;
    applyFold();
    root.updateMatrixWorld(true);
    carriers[0].getWorldPosition(base);
    const bad = [];
    carriers.forEach((c, i) => {
      const p = new THREE.Vector3();
      c.getWorldPosition(p);
      const e = expect(i);
      if (
        !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) ||
        Math.abs(p.x - base.x - e[0]) > 1e-6 || Math.abs(p.y - base.y - e[1]) > 1e-6 || Math.abs(p.z - base.z - e[2]) > 1e-6
      ) {
        bad.push(`${i}:(${p.x - base.x},${p.y - base.y},${p.z - base.z})≠(${e})`);
      }
    });
    return bad;
  };
  let bad = checkAt(0, (i) => [cells[i][0] - cells[0][0], 0, cells[i][1] - cells[0][1]]);
  push('t0-展开态=网格', bad.length === 0, bad.join(' '));
  bad = checkAt(1, (i) => [
    (geo.centers[i][0] - geo.centers[0][0]) / 2,
    (geo.centers[i][1] - geo.centers[0][1]) / 2,
    (geo.centers[i][2] - geo.centers[0][2]) / 2,
  ]);
  push('t1-折叠态=立方体', bad.length === 0, bad.join(' '));
  fold = 0.22;
  applyFold();
  updateCamera();
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  root.updateMatrixWorld(true);
  const proj = carriers.map((c, i) => {
    const p = new THREE.Vector3();
    c.getWorldPosition(p);
    p.project(camera);
    return `${i}:(${Math.round((p.x * 0.5 + 0.5) * 100)}%,${Math.round((0.5 - p.y * 0.5) * 100)}%,z=${p.z.toFixed(3)})`;
  });
  push('屏幕投影', true, proj.join(' '));
  const box = new THREE.Box3().setFromObject(root);
  push('相机与场景数值', true,
    `r=${spherical.radius} phi=${spherical.phi} fov=${camera.fov} pos=${camera.position.toArray().map((v) => v.toFixed(2))} size=${box.getSize(new THREE.Vector3()).toArray().map((v) => v.toFixed(2))} canvas=${renderer.domElement.width}x${renderer.domElement.height}`);
}

let nameEl;

function buildUI(stage) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:92vw';
  bar.innerHTML = [
    '<button class="btn" id="prev" type="button" aria-label="上一个">上个</button>',
    '<strong id="netname" style="font-size:16px;min-width:7em;text-align:center"></strong>',
    '<button class="btn" id="next" type="button" aria-label="下一个">下个</button>',
    '<input id="fold" type="range" min="0" max="100" value="22" step="1" aria-label="折叠程度" style="width:180px;accent-color:var(--gold)">',
    '<span style="font-size:15px;color:var(--muted)">展开 ← → 折叠</span>',
  ].join('');
  stage.appendChild(bar);
  nameEl = bar.querySelector('#netname');
  bar.querySelector('#prev').addEventListener('click', () => setNet(netIndex - 1));
  bar.querySelector('#next').addEventListener('click', () => setNet(netIndex + 1));
  bar.querySelector('#fold').addEventListener('input', (e) => {
    fold = e.target.value / 100;
    applyFold();
  });
}

init({
  mount(stage, api) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
    stage.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    scene = new THREE.Scene();
    const colors = themeColors();
    scene.background = colors.bg;
    camera = new THREE.PerspectiveCamera(40, document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight, 0.1, 50);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(3, 6, 4);
    scene.add(dir);

    buildUI(stage);
    setNet(0);
    if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();

    // 拖拽旋转 + 滚轮/双指缩放
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
        spherical.radius = Math.min(12, Math.max(3.2, spherical.radius * pinchDist / Math.max(d, 1)));
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
      spherical.radius = Math.min(12, Math.max(3.2, spherical.radius * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') setNet(netIndex - 1);
      if (e.key === 'ArrowRight') setNet(netIndex + 1);
    });

    api.onResize = () => {
      renderer.setSize(document.getElementById('stage').clientWidth, document.getElementById('stage').clientHeight);
      camera.aspect = document.getElementById('stage').clientWidth / document.getElementById('stage').clientHeight;
      camera.updateProjectionMatrix();
    };
    api.onTheme = () => {
      const c = themeColors();
      scene.background = c.bg;
      scene.traverse((o) => {
        if (o.isLineSegments) o.material.color.copy(c.line);
      });
    };

    updateCamera();
    (function loop() {
      requestAnimationFrame(loop);
      updateCamera();
      renderer.render(scene, camera);
    })();
  },
});
