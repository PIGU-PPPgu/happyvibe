import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';
import { NETS, foldGeometry } from './nets.mjs';

const PAIR_COLORS = { y: 0xe8b04b, x: 0xa66ba6, z: 0x6fa8c9 }; // 对面同色（降饱和）：金/紫/蓝

let renderer, scene, camera, root;
let hinges = []; // { node, axis, sign }
let carriers = [];
let netIndex = 0;
const FOLD0 = 0.18; // 默认折叠度（铰链角约 16°）：微折可见，且高机位下画面双轴占满
let fold = FOLD0; // 0 展开 → 1 折起
const spherical = { theta: 0.7, phi: 0.65, radius: 4.1 }; // phi 小 = 俯视角高，展平的网不压扁
const FILL = 0.88; // 自适应取景目标：内容占画布约 88%
const target = new THREE.Vector3(0, 0.5, 0);

function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: new THREE.Color(cs.getPropertyValue('--bg').trim() || '#150e22'),
    line: new THREE.Color(cs.getPropertyValue('--text').trim() || '#f2ecf8'),
  };
}

const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// 当前折叠度下每面四角的世界坐标（×2 网格系），供取景拟合
function netCorners(cells, geo, f) {
  const pts = [];
  for (let i = 0; i < cells.length; i++) {
    const path = [];
    for (let j = i; j !== 0; j = geo.parent[j]) path.push(j);
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        let p = [2 * cells[i][0] + dx, 0, 2 * cells[i][1] + dz];
        for (const j of path) {
          const h = geo.hinge[j];
          const a = f * h.sign * Math.PI / 2;
          if (h.axis === 'z') {
            const lx = p[0] - h.line, ly = p[1];
            p = [h.line + lx * Math.cos(a) - ly * Math.sin(a), lx * Math.sin(a) + ly * Math.cos(a), p[2]];
          } else {
            const ly = p[1], lz = p[2] - h.line;
            p = [p[0], ly * Math.cos(a) - lz * Math.sin(a), h.line + ly * Math.sin(a) + lz * Math.cos(a)];
          }
        }
        pts.push(p);
      }
    }
  }
  return pts;
}

// 相机距离拟合：二分找半径，让投影包围盒双轴都不超画布 FILL 比例（切网/改尺寸时算一次）
function fitRadius(cells, geo, f) {
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  const ox = -(Math.min(...xs) + Math.max(...xs)) / 2, oz = -(Math.min(...zs) + Math.max(...zs)) / 2;
  const pts = netCorners(cells, geo, f).map((p) => [(p[0] + 2 * ox) / 2, p[1] / 2, (p[2] + 2 * oz) / 2]);
  const tanV = Math.tan((camera.fov * Math.PI) / 360), tanH = tanV * camera.aspect;
  const { theta, phi } = spherical;
  const overflow = (r) => {
    const pos = [r * Math.sin(phi) * Math.sin(theta), target.y + r * Math.cos(phi), r * Math.sin(phi) * Math.cos(theta)];
    const fwd = norm3([target.x - pos[0], target.y - pos[1], target.z - pos[2]]);
    const right = norm3([-fwd[2], 0, fwd[0]]);
    const up = cross3(right, fwd);
    let m = 0;
    for (const p of pts) {
      const d = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]];
      const zc = d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2];
      m = Math.max(
        m,
        Math.abs((d[0] * right[0] + d[1] * right[1] + d[2] * right[2]) / (zc * tanH)) / FILL,
        Math.abs((d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / (zc * tanV)) / FILL
      );
    }
    return m;
  };
  let lo = 1.5, hi = 20;
  for (let k = 0; k < 36; k++) {
    const mid = (lo + hi) / 2;
    if (overflow(mid) > 1) lo = mid;
    else hi = mid;
  }
  return Math.min(7.5, Math.max(3.2, (lo + hi) / 2));
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
  // 相机距离按当前折叠度的投影包围盒拟合：任一张网双轴都约占画布 88%，投屏可读
  spherical.radius = fitRadius(cells, geo, fold);
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
  fold = FOLD0;
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

let nameEl, foldInput;

function buildUI(stage) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:92vw';
  bar.innerHTML = [
    '<button class="btn" id="prev" type="button" aria-label="上一个">上个</button>',
    '<strong id="netname" style="font-size:16px;min-width:7em;text-align:center"></strong>',
    '<button class="btn" id="next" type="button" aria-label="下一个">下个</button>',
    '<input id="fold" type="range" min="0" max="100" value="' + Math.round(FOLD0 * 100) + '" step="1" aria-label="折叠程度" style="width:180px;accent-color:var(--gold)">',
    '<span style="font-size:15px;color:var(--muted)">展开 ← → 折叠</span>',
  ].join('');
  stage.appendChild(bar);
  nameEl = bar.querySelector('#netname');
  foldInput = bar.querySelector('#fold');
  bar.querySelector('#prev').addEventListener('click', () => setNet(netIndex - 1));
  bar.querySelector('#next').addEventListener('click', () => setNet(netIndex + 1));
  bar.querySelector('#fold').addEventListener('input', (e) => {
    setFold(e.target.value / 100);
  });
}

// 折叠度设置：教学环节预设与滑杆共用，双向同步，相机随之重新取景
function setFold(v) {
  fold = v;
  applyFold();
  if (camera) spherical.radius = fitRadius(NETS[netIndex].cells, foldGeometry(NETS[netIndex].cells), v);
  if (foldInput) foldInput.value = String(Math.round(v * 100));
}

// 教学设计 → 交互状态：三环节预设见条目 md 的「教学设计」
const TEACHING = {
  meta: '数学·七年级｜北师大版七上第一章《丰富的图形世界》· 1.2 展开与折叠',
  steps: [
    {
      name: '想一想',
      guide: '先不折。观察 11 种展开图，猜一猜：它们都能折成正方体吗？按每行面数 1-4-1、2-3-1、2-2-2、3-3 分分类，每一类的共同特征是什么？',
      note: '把正方体沿棱剪开铺平，得到的平面图形叫展开图。北师大教材 1.2 节先从正方体入手：11 种形态按每行面数分四类——1-4-1 型 6 种、2-3-1 型 3 种、2-2-2 型 1 种（阶梯状）、3-3 型 1 种。本节随后还要认识棱柱、圆柱、圆锥的侧面展开图（侧面展开分别是长方形、扇形），展开与折叠是同一个过程的两个方向。',
      apply: () => setFold(0),
    },
    {
      name: '做一做',
      guide: '拖动滑杆亲手折：先预测这个展开图能不能折成正方体，再折到一半停下来看哪些面立起来了。为什么「田」字形、「凹」字形折不回去？',
      note: '折叠时每个面绕棱转动 90°。折不回去的图形有共同特征：「田」字形中间 4 个面围成一圈，折起来必有两面重叠；「凹」字形凹口两侧的面在折叠中撞在一起；一行超过 4 个面也不行——正方体同一方向最多 4 个面串联。动手前先预测、动手后对照，是「做一做」栏目的价值所在。',
      apply: () => setFold(0.35),
    },
    {
      name: '议一议',
      guide: '折满后看颜色：相对的面同色。回到展开态数一数，相对的两个面之间隔着几个面？小组总结「对面不相邻」的判断口诀，再互相出题验证。',
      note: '判断口诀「对面不相邻，隔一才相对」：展开图上同一行（列）里相隔一个面的两个面，折叠后正好相对；直接相邻的两个面一定不相对。按这条口诀，任给一个展开图，先找出一个面的位置，再数「隔一」的位置，就能确定它的对面，不必动手折——这正是「议一议」要从操作上升到结论的地方。',
      apply: () => setFold(1),
    },
  ],
  summary: '正方体的展开图共 11 种：1-4-1 型 6 种、2-3-1 型 3 种、2-2-2 型 1 种、3-3 型 1 种。判断规律：对面不相邻——展开图上相对的两个面之间至少隔一个面；「田」字形、「凹」字形折不成正方体。',
  quiz: [
    {
      q: '下面哪种形态不是正方体的展开图？',
      opts: ['1-4-1 型', '2-3-1 型', '2-2-2 型', '「田」字形'],
      a: 3,
      why: '「田」字形中间 4 个面围成一圈，折叠时必然有两面重叠，折不成正方体。11 种展开图里没有「田」字形和「凹」字形。',
    },
    {
      q: '正方体的展开图共有多少种？',
      opts: ['8 种', '10 种', '11 种', '12 种'],
      a: 2,
      why: '把 35 种六连方形逐一验证，能折成正方体的只有 11 种：1-4-1 型 6 种、2-3-1 型 3 种、2-2-2 型 1 种、3-3 型 1 种。',
    },
    {
      q: '展开图上与某个面相对的面，位置有什么规律？',
      opts: ['一定紧挨着它', '同一行（列）里与它相隔一个面', '一定在图形的最边上', '一定在它的正下方'],
      a: 1,
      why: '口诀「对面不相邻，隔一才相对」：直接相邻的面不可能相对；同一行（列）里隔一个面的两个面，折叠后正好相对。',
    },
    {
      q: '一个 1-4-1 型展开图中间一行有 4 个面，从左数第 1 个面的对面是哪个？',
      opts: ['第 2 个面', '第 3 个面', '第 4 个面', '上下两行的面'],
      a: 1,
      why: '同一行里隔一个面才相对：第 1 个面隔着第 2 个面，与第 3 个面相对；第 2 个面则与第 4 个面相对。',
    },
    {
      q: '为什么一行有 5 个面的图形折不成正方体？',
      opts: ['面数太多了', '折叠后必有面重叠，正方体同一方向最多 4 个面串联', '棱的长度不对', '缺少相对的面'],
      a: 1,
      why: '沿一个方向最多只能串 4 个面（前、下、后、上），第 5 个面折过去必然与第 1 个面重叠，所以 11 种展开图里最长的行只有 4 个面。',
    },
  ],
};

init({
  teaching: TEACHING,
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

    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.3));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(4, 7, 3);
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
      // 画布比例变化（如切全屏）后重新取景
      const cells = NETS[netIndex].cells;
      spherical.radius = fitRadius(cells, foldGeometry(cells), fold);
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
