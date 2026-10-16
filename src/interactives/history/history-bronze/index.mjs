import { init } from '../../_shared/runtime.mjs';
import GLB_B64 from './ding.glb.b64.mjs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';

// 青铜器与甲骨文：程序化后母戊方鼎（3D 可旋转）+ 纹饰热点 + 甲骨文翻面卡片
// 字形为甲骨文常见形的教学摹绘，说明见资源条目

// ———— 甲骨文卡片数据（120×120 画布内的笔画） ————
const ORACLE = [
  { h: '日', py: 'rì', type: '象形', desc: '摹绘太阳轮廓，中加一点表示日体',
    draw(c) { c.beginPath(); c.ellipse(60, 60, 30, 33, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(47, 60); c.lineTo(73, 60); c.stroke(); } },
  { h: '月', py: 'yuè', type: '象形', desc: '摹绘月牙之形，中间加点与夕字相别',
    draw(c) { c.beginPath(); c.moveTo(72, 18); c.bezierCurveTo(28, 34, 28, 86, 72, 102); c.stroke(); c.beginPath(); c.moveTo(72, 18); c.bezierCurveTo(52, 38, 52, 82, 72, 102); c.stroke(); c.beginPath(); c.moveTo(58, 52); c.lineTo(58, 68); c.stroke(); } },
  { h: '山', py: 'shān', type: '象形', desc: '三峰并立，底部相连之形',
    draw(c) { c.beginPath(); c.moveTo(34, 86); c.lineTo(34, 34); c.moveTo(60, 86); c.lineTo(60, 20); c.moveTo(86, 86); c.lineTo(86, 34); c.moveTo(20, 86); c.lineTo(100, 86); c.stroke(); } },
  { h: '水', py: 'shuǐ', type: '象形', desc: '中为主流，两侧为支流与水点',
    draw(c) { c.beginPath(); c.moveTo(60, 12); c.bezierCurveTo(44, 38, 76, 52, 60, 76); c.bezierCurveTo(48, 96, 74, 100, 60, 108); c.stroke(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(60 + s * 26, 28); c.bezierCurveTo(60 + s * 18, 40, 60 + s * 18, 46, 60 + s * 12, 54); c.stroke(); c.beginPath(); c.moveTo(60 + s * 26, 60); c.bezierCurveTo(60 + s * 18, 72, 60 + s * 18, 78, 60 + s * 12, 86); c.stroke(); } } },
  { h: '人', py: 'rén', type: '象形', desc: '侧立之人，垂臂躬身之形',
    draw(c) { c.beginPath(); c.moveTo(74, 12); c.bezierCurveTo(46, 32, 52, 58, 44, 78); c.lineTo(62, 106); c.stroke(); c.beginPath(); c.moveTo(70, 42); c.lineTo(36, 60); c.stroke(); } },
  { h: '鱼', py: 'yú', type: '象形', desc: '鱼头、鱼身、鳍与分尾俱全',
    draw(c) { c.beginPath(); c.moveTo(16, 60); c.lineTo(40, 42); c.lineTo(80, 42); c.lineTo(98, 52); c.lineTo(98, 68); c.lineTo(80, 78); c.lineTo(40, 78); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(40, 42); c.lineTo(40, 78); c.moveTo(60, 42); c.lineTo(60, 30); c.moveTo(60, 78); c.lineTo(60, 90); c.moveTo(98, 52); c.lineTo(112, 38); c.moveTo(98, 68); c.lineTo(112, 82); c.stroke(); } },
  { h: '田', py: 'tián', type: '象形', desc: '田畴经界纵横之形',
    draw(c) { c.strokeRect(24, 24, 72, 72); c.beginPath(); c.moveTo(60, 24); c.lineTo(60, 96); c.moveTo(24, 60); c.lineTo(96, 60); c.stroke(); } },
  { h: '明', py: 'míng', type: '会意', desc: '日与月相合，会光照为明之意',
    draw(c) { c.beginPath(); c.arc(38, 60, 24, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(29, 60); c.lineTo(47, 60); c.stroke(); c.beginPath(); c.moveTo(92, 30); c.bezierCurveTo(72, 44, 72, 76, 92, 90); c.stroke(); c.beginPath(); c.moveTo(92, 30); c.bezierCurveTo(82, 44, 82, 76, 92, 90); c.stroke(); } },
];

const SPOTS = [
  { name: '立耳', pos: [0.66, 1.12, 0],
    text: '口沿上双耳竖立，用于穿杠抬举。耳与鼎身合铸一体，对铸造工艺要求极高。' },
  { name: '兽面纹', pos: [0, 0.05, 0.98], zoom: true,
    text: '腹部饰兽面纹（饕餮纹）：双目凸出、云雷纹衬底，威严神秘，是商代青铜器的典型纹饰。' },
  { name: '铭文', pos: [0.38, 0.18, 0.45],
    text: '腹内壁常铸铭文，记录祭祀、征伐、赏赐等大事，是研究商周历史的第一手材料。' },
  { name: '柱足', pos: [0, -0.92, -1.18],
    text: '三条实心柱足承托鼎身，与双耳同样需陶范合铸一体成型，对铸造工艺要求极高。' },
];
const DEFAULT_SPOT = {
  name: '三足圆鼎',
  text: '圆鼎三足双耳，是商周最常见的炊食与祭祀礼器；同类的后母戊鼎重 832.84 千克，是现存最重的青铜器。拖动旋转，点击金色热点查看部位。',
};

// ———— 青铜纹饰：彩色图（绿锈底+纹带）与浮雕图（灰度凸纹）共用同一套纹样几何 ————
function makeBronzeTexture(plain = false) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#37544a'); g.addColorStop(0.45, '#2e4a3e'); g.addColorStop(1, '#24382f');
  c.fillStyle = g; c.fillRect(0, 0, 512, 256);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 200; i++) {
    const verd = rnd() > 0.45;
    c.fillStyle = verd ? `rgba(88,142,116,${0.05 + rnd() * 0.1})` : `rgba(14,24,18,${0.05 + rnd() * 0.1})`;
    c.beginPath(); c.arc(rnd() * 512, rnd() * 256, 3 + rnd() * 12, 0, Math.PI * 2); c.fill();
  }
  if (!plain) drawPattern(c, '#0d1913', 1);
  return cv;
}
function makeBronzeBump() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#bcbcbc'; c.fillRect(0, 0, 512, 256);
  let seed = 23;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 900; i++) {
    c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)';
    c.beginPath(); c.arc(rnd() * 512, rnd() * 256, 1 + rnd() * 3, 0, Math.PI * 2); c.fill();
  }
  drawPattern(c, '#f4f4f4', 1, true);
  return cv;
}
// 纹带几何：颈回纹带 / 主带弦纹框 / 兽面（目眉鼻口角）/ 云雷底纹 / 夔龙 / 下带弦纹
function drawPattern(c, stroke, alpha, bump = false) {
  c.strokeStyle = stroke; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = alpha;
  c.lineWidth = 6;
  for (let x = 0; x < 512; x += 64) {
    c.beginPath();
    c.moveTo(x + 6, 24); c.lineTo(x + 46, 24); c.lineTo(x + 46, 52); c.lineTo(x + 18, 52);
    c.lineTo(x + 18, 38); c.lineTo(x + 34, 38);
    c.stroke();
  }
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(0, 66); c.lineTo(512, 66); c.moveTo(0, 226); c.lineTo(512, 226); c.stroke();
  c.lineWidth = 7;
  const eye = (cx) => {
    c.beginPath(); c.arc(cx, 138, 27, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, 138, 11, 0, Math.PI * 2); c.stroke();
  };
  eye(176); eye(336);
  c.beginPath(); c.moveTo(140, 104); c.quadraticCurveTo(176, 88, 212, 104); c.stroke();
  c.beginPath(); c.moveTo(300, 104); c.quadraticCurveTo(336, 88, 372, 104); c.stroke();
  c.lineWidth = 9;
  c.beginPath(); c.moveTo(256, 96); c.lineTo(256, 176); c.stroke();
  c.lineWidth = 6;
  c.beginPath(); c.moveTo(216, 190); c.quadraticCurveTo(256, 208, 296, 190); c.stroke();
  c.lineWidth = 2.4; c.globalAlpha = alpha * (bump ? 0.45 : 0.28);
  for (let y = 82; y < 216; y += 22) {
    for (let x = 24; x < 480; x += 26) {
      c.beginPath();
      c.moveTo(x, y + 12); c.lineTo(x + 12, y + 12); c.lineTo(x + 12, y); c.lineTo(x + 4, y); c.lineTo(x + 4, y + 7);
      c.stroke();
    }
  }
  c.globalAlpha = alpha; c.lineWidth = 5;
  for (const s of [0, 1]) {
    const x0 = s ? 470 : 42;
    c.beginPath();
    c.moveTo(x0, 96); c.lineTo(x0 + (s ? -22 : 22), 96); c.lineTo(x0 + (s ? -22 : 22), 150);
    c.lineTo(x0 + (s ? -6 : 6), 150); c.lineTo(x0 + (s ? -6 : 6), 124); c.lineTo(x0 + (s ? -16 : 16), 124);
    c.stroke();
  }
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(0, 238); c.lineTo(512, 238); c.stroke();
  c.globalAlpha = 1;
}

let renderer, scene, camera, ding, spotSprites = [], texCanvas;
let spinning = false, spinEl;
const spherical = { theta: 0.7, phi: 1.2, radius: 4.2 };
const target = new THREE.Vector3(0, -0.18, 0);
let spotState = -2; // -2 默认（未选），-1 无，>=0 热点
let els = {};
let cardRedraws = [];
let defaultMode = '3d';

function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => cs.getPropertyValue(k).trim() || f;
  return { bg: v('--panel2', '#271a42'), text: v('--text', '#f2ecf8'), muted: v('--muted', '#a99cc0'), gold: v('--gold', '#E8B04B'), panel: v('--panel', '#1e1433'), line: v('--line', 'rgba(180,130,210,.16)') };
}

function makeSpotTexture(color) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const c = cv.getContext('2d');
  c.beginPath(); c.arc(32, 32, 26, 0, Math.PI * 2);
  c.fillStyle = color; c.fill();
  c.beginPath(); c.arc(32, 32, 26, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 4; c.stroke();
  c.beginPath(); c.arc(32, 32, 10, 0, Math.PI * 2);
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
  return new THREE.CanvasTexture(cv);
}

function buildDing() {
  // Blender 程序化建模 → GLB（回转鼎身/蹄形柱足/矩形立耳），构建期 base64 内嵌；
  // 青铜绿锈 + 饕餮纹带回纹由 CanvasTexture 提供（colorMap×bumpMap，柱面 UV 环绕 4 次）
  const ding = new THREE.Group();
  const tex = new THREE.CanvasTexture(makeBronzeTexture());
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(4, 1);
  tex.anisotropy = 4;
  const plainTex = new THREE.CanvasTexture(makeBronzeTexture(true));
  const bump = new THREE.CanvasTexture(makeBronzeBump());
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.ClampToEdgeWrapping;
  bump.repeat.set(4, 1);
  new GLTFLoader().load(GLB_B64, (gltf) => {
    const m = gltf.scene;
    m.scale.setScalar(0.85);
    m.position.y = -0.22;
    m.traverse((o) => {
      if (o.isMesh && o.material) {
        o.castShadow = true;
        const isEar = /^ear/.test(o.name);   // 耳：素面绿锈（纹带在小构件上挤成迷宫）
        o.material.map = isEar ? plainTex : tex;
        o.material.bumpMap = bump;
        o.material.bumpScale = isEar ? 0.3 : 1.2;
        o.material.color.set(0xffffff);
        o.material.metalness = 0.25;   // 铜锈层基本是非金属，金属度低才压得住绿底色
        o.material.roughness = 0.62;
      }
    });
    ding.add(m);
  });
  return ding;
}

function setSpot(i) {
  spotState = i;
  const s = i >= 0 ? SPOTS[i] : DEFAULT_SPOT;
  els.spotName.textContent = s.name;
  els.spotText.textContent = s.text;
  els.zoomWrap.style.display = s.zoom ? 'block' : 'none';
  if (s.zoom && texCanvas) {
    const zc = els.zoomCv, zctx = zc.getContext('2d');
    zctx.imageSmoothingEnabled = false;
    zctx.clearRect(0, 0, zc.width, zc.height);
    zctx.drawImage(texCanvas, 120, 60, 272, 172, 0, 0, zc.width, zc.height);
  }
}

function setMode(m) {
  const is3d = m === '3d';
  els.tab3d.classList.toggle('on', is3d);
  els.tabCard.classList.toggle('on', !is3d);
  els.bpanel.style.display = is3d ? 'flex' : 'none';
  els.cbar.style.display = is3d ? 'none' : 'flex';
  els.cards.style.display = is3d ? 'none' : 'grid';
  renderer.domElement.style.display = is3d ? 'block' : 'none';
}

function setSpin(v) {
  spinning = v;
  els.spin.textContent = v ? '停转' : '转动';
}

function resetCards() {
  [...els.cards.children].forEach((f) => f.classList.remove('on'));
}

// ———— 教学环节：每步把场景切到预设状态，配一句教师引导语（教研员契约） ————
const STEPS = [
  {
    name: '观其器',
    apply() {
      setMode(defaultMode);
      setSpin(false);
      setSpot(-1);
      Object.assign(spherical, { theta: 0.7, phi: 1.12, radius: 4.4 });
    },
    guide: '先整体看这尊鼎：数一数它有几只耳、几条足，通体是什么颜色。再猜一猜，三千多年前没有机器，工匠怎么把八百多千克的大家伙铸出来？',
    note: '后母戊鼎重 832.84 千克，是迄今出土最重的青铜器。商代工匠用「块范法」：先塑出泥模，翻制多块陶范，几块范合拢留出浇口，把上千摄氏度的铜液一次浇成——鼎腹与鼎足分范又合铸，欠一点火候整器报废。鼎在商代是礼器与王权象征，「鼎」的字形本身就是对这种器物的描画。',
  },
  {
    name: '认其纹',
    apply() {
      setMode('3d');
      setSpot(1);
      setSpin(true);
    },
    guide: '看兽面纹放大图：找一找它的双眼、眉毛和鼻梁，说说这样的纹饰给人什么感受。鼎正在慢转，等它转过一圈，再想想祭祀用的鼎为什么要铸这种纹。',
    note: '兽面纹（饕餮纹）是商代青铜器的标志性纹样：以鼻梁为中轴，双眼、眉、角左右对称铺开，狞厉而庄严。它多铸在祭祀礼器上——商人尚鬼神、重祭祀，纹饰的威慑感正是沟通人与神灵的视觉语言。看纹饰不只看「像不像」，要看它替主人说了什么。',
  },
  {
    name: '识其字',
    apply() {
      setMode('card');
      resetCards();
    },
    guide: '先别翻面。看字形猜它今天是哪个字，说清你看的是哪个部位；翻面核对后，把八张卡分成两类：照着实物描画出来的，和把两三个字合起来表示新意思的。',
    note: '甲骨文刻在龟甲兽骨上，已具备汉字的基本结构：象形照实物描画（日、月、山），会意把两三个部件合成新意（休是人在树旁）。今天的方块字与三千多年前的甲骨文一脉相承，我国有文字可考的历史从商朝开始——分类的过程就是在亲身使用象形、会意两条造字法。',
  },
];
const SUMMARY =
  '后母戊鼎重 832.84 千克，是迄今出土最重的青铜器，全器用多块陶范合铸而成，立耳、柱足与兽面纹体现商代青铜铸造工艺的高超水平。商朝人把文字刻在龟甲、兽骨上，称为甲骨文；它已具备汉字的基本结构，象形、会意等造字方法沿用至今，我国有文字可考的历史从商朝开始。';

function setStep(i) {
  STEPS[i].apply();
  document.querySelectorAll('[data-hv-step]').forEach((el, k) => {
    el.setAttribute('aria-pressed', String(k === i));
  });
}

// 教学面板配置（模板渲染；环节设计见条目 md「教学设计」）
const TEACHING = {
  meta: '历史·七年级｜统编版七年级上册第二单元第5课《青铜器与甲骨文》',
  steps: STEPS.map((s, i) => ({ name: s.name, guide: s.guide, note: s.note, apply: () => setStep(i) })),
  summary: SUMMARY,
  quiz: [
    {
      q: '后母戊鼎是迄今出土的什么之最？',
      opts: ['最早的青铜器', '最重的青铜器', '最高的青铜器', '纹饰最多的青铜器'],
      a: 1,
      why: '重 832.84 千克，是迄今出土最重的青铜器。商代青铜铸造业高度发达，但「最早」另有其器，别混。',
    },
    {
      q: '铸造后母戊鼎用的工艺是？',
      opts: ['失蜡法', '多块陶范合铸', '锻打成型', '3D 打印'],
      a: 1,
      why: '塑泥模、翻陶范、合范浇铸，全器一次浇成——块范法是商代大型铜器的成器方式。失蜡法与锻打都不是它的主工艺。',
    },
    {
      q: '兽面纹多铸在祭祀礼器上，反映了商朝人什么观念？',
      opts: ['尚鬼神、重祭祀', '重视农桑', '推崇武功', '崇尚自然山水'],
      a: 0,
      why: '狞厉庄严的纹饰是沟通神灵的视觉语言，与商代尚鬼、事事占卜的风气一致——纹饰是观念的载体，不是单纯装饰。',
    },
    {
      q: '「休」字由「人」与「木」合成表示人在树旁歇息，这种造字法叫？',
      opts: ['象形', '会意', '指事', '形声'],
      a: 1,
      why: '把两三个部件合起来表示新意是会意；照实物描画（日、山）才是象形。分清这两条，甲骨文卡片就能自己归类。',
    },
    {
      q: '我国有文字可考的历史从哪个朝代开始？',
      opts: ['夏朝', '商朝', '西周', '秦朝'],
      a: 1,
      why: '商朝甲骨文已具备汉字基本结构且成熟使用，是可直接与文献互证的字证；夏朝目前尚无公认的自证文字。',
    },
  ],
};



// 自测断言：验证环节按钮真的把场景切到预设状态（selftest 下 harness 采集）
function runSelfChecks() {
  const ok = (name, pass, detail) => window.__hvPushCheck && window.__hvPushCheck(name, pass, detail);
  const snap = () => ({
    canvasShown: renderer.domElement.style.display !== 'none',
    cardsShown: els.cards.style.display === 'grid',
    zoomShown: els.zoomWrap.style.display !== 'none',
    spot: els.spotName.textContent,
    spin: spinning,
    flipped: els.cards.querySelectorAll('.flip.on').length,
    pressed: [...document.querySelectorAll('[data-hv-step]')].map((b) => b.getAttribute('aria-pressed')),
  });
  setStep(1);
  const s1 = snap();
  ok('step2-认其纹', s1.spot === '兽面纹' && s1.spin === true && s1.zoomShown && s1.canvasShown && !s1.cardsShown, JSON.stringify(s1));
  setStep(2);
  const s2 = snap();
  ok('step3-识其字', s2.cardsShown && !s2.canvasShown && s2.flipped === 0 && s2.pressed[2] === 'true', JSON.stringify(s2));
  setStep(0);
  const s0 = snap();
  ok('step1-观其器', s0.canvasShown && !s0.cardsShown && s0.spin === false && s0.spot === '三足圆鼎' && s0.pressed[0] === 'true', JSON.stringify(s0));
}

function drawCards() {
  const t = themeColors();
  for (const rd of cardRedraws) rd(t);
}

function buildUI(stage) {
  const style = document.createElement('style');
  style.textContent = `
    #tabs{position:absolute;top:8px;left:12px;z-index:6;display:flex;gap:8px}
    .tab{font:inherit;font-size:17px;padding:8px 16px;border-radius:8px;border:1px solid var(--line);
      background:var(--panel);color:var(--text);cursor:pointer;touch-action:manipulation}
    .tab.on{border-color:var(--gold);color:var(--gold);font-weight:700}
    #bpanel{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;
      background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:12px 18px;max-width:min(720px,calc(100% - 20px));box-shadow:0 6px 24px rgba(0,0,0,.3);
      display:flex;gap:16px;align-items:center}
    #bpanel .col{flex:1}
    #spotName{color:var(--gold);font-weight:700;font-size:24px}
    #spotText{font-size:18px;color:var(--muted);line-height:1.5;margin-top:4px}
    #zoomWrap{display:none;flex:0 0 auto}
    #zoomCv{display:block;border:1px solid var(--line);border-radius:8px;width:210px;height:126px}
    #zoomCap{font-size:17px;color:var(--muted);text-align:center;margin-top:4px}
    .qb{font:inherit;font-size:17px;line-height:1;padding:9px 16px;border-radius:6px;border:1px solid var(--line);
      background:var(--panel2);color:var(--text);cursor:pointer;flex:0 0 auto}
    .qb:hover{border-color:var(--gold)}
    .qb[aria-pressed=true]{border-color:var(--gold);color:var(--gold);font-weight:700}
    #teach{position:absolute;left:12px;right:12px;top:56px;z-index:6;display:flex;flex-wrap:wrap;gap:8px 12px;
      align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:9px 14px;box-shadow:0 6px 24px rgba(0,0,0,.25)}
    #teach .guide{flex:1;min-width:240px;font-size:15px;color:var(--text);line-height:1.55}
    #cards{position:absolute;inset:56px 0 96px 0;z-index:4;display:none;
      grid-template-columns:repeat(4,minmax(120px,150px));gap:14px;place-content:center;justify-content:center}
    .flip{aspect-ratio:3/4;perspective:700px;cursor:pointer}
    .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s}
    .flip.on .inner{transform:rotateY(180deg)}
    .face{position:absolute;inset:0;backface-visibility:hidden;border-radius:12px;
      border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center}
    .front{background:var(--panel2)}
    .front canvas{width:86%;height:auto}
    .back{background:var(--panel);transform:rotateY(180deg);gap:4px;padding:8px}
    .back .han{font-size:44px;font-weight:700;color:var(--gold);line-height:1.1}
    .back .py{font-size:16px;color:var(--muted)}
    .back .tp{font-size:16px;color:var(--text);border:1px solid var(--gold);color:var(--gold);
      border-radius:99px;padding:2px 10px;margin:2px 0}
    .back .ds{font-size:15px;color:var(--muted);line-height:1.4;padding:0 6px}
    #cbar{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;z-index:5;display:none;
      align-items:center;gap:14px;background:var(--panel);border:1px solid var(--line);border-radius:12px;
      padding:10px 16px;max-width:min(760px,calc(100% - 20px))}
    #cbar .tx{font-size:16px;color:var(--muted);line-height:1.45}
  `;
  stage.appendChild(style);

  const tabs = document.createElement('div');
  tabs.id = 'tabs';
  tabs.innerHTML = '<button class="tab on" id="tab3d" type="button">青铜鼎</button><button class="tab" id="tabCard" type="button">甲骨文</button>';
  stage.appendChild(tabs);

  const bpanel = document.createElement('div');
  bpanel.id = 'bpanel';
  bpanel.innerHTML = `
    <div class="col">
      <div id="spotName"></div>
      <div id="spotText"></div>
    </div>
    <div id="zoomWrap"><canvas id="zoomCv" width="420" height="252"></canvas><div id="zoomCap">兽面纹放大</div></div>
    <button class="qb" id="spin" type="button">转动</button>`;
  stage.appendChild(bpanel);

  const cards = document.createElement('div');
  cards.id = 'cards';
  ORACLE.forEach((o) => {
    const f = document.createElement('div');
    f.className = 'flip';
    f.innerHTML = `
      <div class="inner">
        <div class="face front"><canvas width="240" height="240"></canvas></div>
        <div class="face back">
          <div class="han"></div><div class="py"></div><div class="tp"></div><div class="ds"></div>
        </div>
      </div>`;
    cards.appendChild(f);
    const cv = f.querySelector('canvas');
    const han = f.querySelector('.han'), py = f.querySelector('.py'), tp = f.querySelector('.tp'), ds = f.querySelector('.ds');
    han.textContent = o.h; py.textContent = o.py; tp.textContent = o.type; ds.textContent = o.desc;
    f.addEventListener('click', () => f.classList.toggle('on'));
    const redraw = (t) => {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, 240, 240);
      c.strokeStyle = t.text;
      c.lineWidth = 15; c.lineCap = 'round'; c.lineJoin = 'round';
      o.draw(c);
    };
    cardRedraws.push(redraw);
  });
  stage.appendChild(cards);

  const cbar = document.createElement('div');
  cbar.id = 'cbar';
  cbar.innerHTML = `
    <div class="tx">甲骨文是刻在龟甲、兽骨上的文字，主要出土于河南安阳殷墟，单字约 4500 个，已释读约三分之一。点击卡片翻面核对。</div>
    <button class="qb" id="reset" type="button">重猜</button>`;
  stage.appendChild(cbar);

  els = { bpanel, cards, cbar, tab3d: tabs.querySelector('#tab3d'), tabCard: tabs.querySelector('#tabCard'),
    spotName: bpanel.querySelector('#spotName'), spotText: bpanel.querySelector('#spotText'),
    zoomWrap: bpanel.querySelector('#zoomWrap'), zoomCv: bpanel.querySelector('#zoomCv'), spin: bpanel.querySelector('#spin') };

  els.spin.addEventListener('click', () => setSpin(!spinning));
  cbar.querySelector('#reset').addEventListener('click', resetCards);
  defaultMode = new URLSearchParams(location.search).get('mode') === 'card' ? 'card' : '3d';
  tabs.querySelector('#tab3d').addEventListener('click', () => setMode('3d'));
  tabs.querySelector('#tabCard').addEventListener('click', () => setMode('card'));
  setMode(defaultMode);
  setSpot(-1);
  setStep(0);
  if (new URLSearchParams(location.search).has('selftest')) runSelfChecks();
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
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest') });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);
    renderer.domElement.style.cssText += 'position:absolute;inset:0;touch-action:none';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(themeColors().bg);
    // 金属材质必须有环境反射才立得住（envMap 提底光，三点布光负责造型）
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
    scene.environmentIntensity = 0.45;
    camera = new THREE.PerspectiveCamera(47, 1, 0.1, 50);

    // 三点布光：主光（前左上，投影）+ 补光（右）+ 轮廓光（后上）
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const key = new THREE.DirectionalLight(0xfff2dd, 1.6);
    key.position.set(3.2, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -3;
    key.shadow.camera.right = key.shadow.camera.top = 3;
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 16;
    key.shadow.bias = -0.0006;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcdd8ef, 0.5);
    fill.position.set(-4.5, 1.6, 2.6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(-1, 4.5, -5);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x2a2233, 0.5));

    // 地面（只接影）：真实投影 + 径向渐变接触暗斑（后者不依赖 shadow map，任何环境都落地）
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 48),
      new THREE.ShadowMaterial({ opacity: 0.42 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.63;
    ground.receiveShadow = true;
    scene.add(ground);
    const aoCv = document.createElement('canvas');
    aoCv.width = aoCv.height = 256;
    const ac = aoCv.getContext('2d');
    const ag = ac.createRadialGradient(128, 128, 12, 128, 128, 126);
    ag.addColorStop(0, 'rgba(0,0,0,.55)'); ag.addColorStop(0.55, 'rgba(0,0,0,.3)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ac.fillStyle = ag; ac.fillRect(0, 0, 256, 256);
    const contact = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 40),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(aoCv), transparent: true, depthWrite: false })
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -1.62;
    scene.add(contact);

    ding = buildDing();
    scene.add(ding);

    buildUI(stage);
    drawCards();

    const resize = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    api.onResize = resize;
    api.onTheme = () => {
      scene.background = new THREE.Color(themeColors().bg);
      const t = themeColors();
      spotSprites.forEach((sp) => { sp.material.map = makeSpotTexture(t.gold); sp.material.needsUpdate = true; });
      drawCards();
    };

    // 拖动旋转 + 滚轮/双指缩放 + 点击热点（鼠标/触摸统一 pointer 通道）
    const ray = new THREE.Raycaster();
    const pointers = new Map();
    let dragging = false, px = 0, py = 0, moved = 0, pinchDist = 0;
    const el = renderer.domElement;
    const ndc = (e) => {
      const r = el.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) { dragging = true; px = e.clientX; py = e.clientY; moved = 0; }
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
        spherical.radius = Math.min(9, Math.max(2.4, spherical.radius * pinchDist / Math.max(d, 1)));
        pinchDist = d;
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.min(1.5, Math.max(0.25, spherical.phi - dy * 0.006));
      px = e.clientX; py = e.clientY;
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) dragging = false; };
    el.addEventListener('pointerup', (e) => {
      release(e);
      if (moved < 7) {
        ray.setFromCamera(ndc(e), camera);
        const hit = ray.intersectObjects(spotSprites, false)[0];
        setSpot(hit ? hit.object.userData.index : -1);
      }
    });
    el.addEventListener('pointercancel', release);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      spherical.radius = Math.min(9, Math.max(2.4, spherical.radius * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });

    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (spinning) ding.rotation.y += dt * 0.5;
      const pulse = 1 + Math.sin(now * 0.004) * 0.12;
      spotSprites.forEach((sp, i) => {
        sp.scale.setScalar(0.19 * (spotState === i ? 1.35 * pulse : pulse));
      });
      updateCamera();
      renderer.render(scene, camera);
    })(last);
  },
});
