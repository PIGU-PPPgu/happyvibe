/* math-bs-7a-2-2 契约断言（library-v2-spec §3.2）——node 直跑，零依赖
   跑法：node src/interactives/math/math-bs-7a-2-2/tests/math.test.cjs */
global.window = globalThis;
require('../js/mathengine.js');
var M = window.MathEngine, assert = require('assert');
var fs = require('fs'), path = require('path');
var src = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
var sb = { window: {} }; new Function('window', src)(sb.window);
var L = sb.window.LESSON;

/* ———— 1. 引擎硬算（operate/quantify/judge/quiz 每页 ≥2 条公式断言） ———— */
// P6 糖豆匀速跑（quantify）：位置 = 起点 + 速度 × 时间
assert.strictEqual(M.pos(-4, 2, 3), 2, 'P6：t=3 秒到 +2');
assert.strictEqual(M.pos(-4, 2, 0), -4, 'P6：出发在 −4');
assert.strictEqual(M.pos(-4, 2, 6), 8, 'P6：t=6 秒到 +8');
assert.strictEqual(M.pos(0, 2, 2), 4, 'P6：从原点 2 秒到 4');
// P5/P9 描点与拖拽（operate·有反向交互）：换算往返一致
assert.strictEqual(M.fromX(M.toX(2.5, 6, 900, 80), 6, 900, 80), 2.5, 'P5：toX/fromX 往返 2.5');
assert.strictEqual(M.fromX(M.toX(-3, 6, 900, 80), 6, 900, 80), -3, 'P5：toX/fromX 往返 −3');
assert.strictEqual(M.fromX(M.toX(-4, 6, 900, 80), 6, 900, 80), -4, 'P9：A 点往返 −4');
assert.strictEqual(M.fromX(M.toX(-1, 6, 900, 80), 6, 900, 80), -1, 'P9：B 点往返 −1');
// P8 相反数（operate·步进型，无反向交互）：正向输出定点核
assert.strictEqual(M.toX(0, 6, 900, 80), 450, 'P8：原点像素在正中');
assert.strictEqual(M.toX(3, 6, 900, 80), 635, 'P8：+3 像素 635');
assert.strictEqual(M.toX(-3, 6, 900, 80), 265, 'P8：−3 像素 265（与 +3 关于 450 对称）');
assert.strictEqual(M.dist(-3), 3, 'P8：−3 到原点距离 3');
assert.strictEqual(M.dist(3), 3, 'P8：+3 到原点距离 3（相反数等距）');
// P9 比大小
assert.strictEqual(M.cmp(-1, -4), '>', 'P9：−1 > −4');
assert.strictEqual(M.cmp(-4, -1), '<', 'P9：−4 < −1');
// P7 记录时刻（judge·量化逆推）：题库数据与引擎一致
assert.strictEqual((2 - L.dog.start) / L.dog.speed, 3, 'P7：从 −4 到 +2 用 3 秒');
assert.strictEqual(M.pos(L.dog.start, L.dog.speed, 3), 2, 'P7：3 秒时糖豆在 +2（与 accepts 同源）');
// P10 当堂检测（quiz）：选择题答案可由引擎复核
assert.strictEqual(M.pos(2, -5, 1), -3, 'P10 第4题：+2 向左 5 格落 −3');
assert.strictEqual(-1 - (-3), 2, 'P10 第3题：−3 与 −1 相隔 2');
assert.strictEqual(M.cmp(-1, -2), '>', 'P10 第5题：−1 比 −2 大');

/* ———— 2. normalize 封闭映射表（§3.3：全角逐对、删前导 + 在转半角之后） ———— */
assert.strictEqual(M.normalize('＋１５０，３'), '150,3', 'normalize：全角加号数字逗号');
assert.strictEqual(M.normalize('－3、－2'), '-3,-2', 'normalize：全角减号 + 顿号');
assert.strictEqual(M.normalize('−5'), '-5', 'normalize：数学减号 U+2212');
assert.strictEqual(M.normalize('＋4'), '4', 'normalize：删前导 +（半角化之后）');
assert.strictEqual(M.normalize(' 4 '), '4', 'normalize：删空白');
assert.strictEqual(M.normalize('：'), ':', 'normalize：全角冒号');

/* ———— 3. checkInput 判定表全量（accepts 全过、rejects 全拒） ———— */
L.check.forEach(function (c, i) {
  c.accepts.forEach(function (a) { assert.ok(M.checkInput(a, c.accepts), 'check' + i + ' accept: ' + a); });
  c.rejects.forEach(function (r) { assert.ok(!M.checkInput(r, c.accepts), 'check' + i + ' reject: ' + r); });
});
L.judge.accepts.forEach(function (a) { assert.ok(M.checkInput(a, L.judge.accepts), 'judge accept: ' + a); });
L.judge.rejects.forEach(function (r) { assert.ok(!M.checkInput(r, L.judge.accepts), 'judge reject: ' + r); });
// 全角混写也应判对（判定＝归一化后全等）
assert.ok(M.checkInput('＋4', L.check[0].accepts), 'check0：全角 ＋4 判对');
assert.ok(M.checkInput('－3，－2', L.check[1].accepts), 'check1：全角写法判对');
assert.ok(M.checkInput('第3秒', L.judge.accepts) === true, 'judge：带单位的「第3秒」在 accepts 内');

/* ———— 4. slides 契约：页数、handsOn、act 幕序、与资源 md pages 一致 ———— */
assert.strictEqual(L.slides.length, 11, '共 11 页');
var md = fs.readFileSync(path.join(__dirname, '../../../../content/resources/math/math-bs-7a-2-2.md'), 'utf8');
var mdPages = md.match(/^pages:\s*(\d+)\s*$/m);
assert.ok(mdPages, '资源 md frontmatter 含 pages:');
assert.strictEqual(Number(mdPages[1]), L.slides.length, 'md pages 与 slides 数一致');
// 每页 handsOn 非空（§3.2-3）
L.slides.forEach(function (s) { assert.ok(s.handsOn && s.handsOn.trim(), '第' + s.no + '页 handsOn 非空'); });
// act 单调不降且 1-4 各至少一页（幕序硬性）
var acts = L.slides.map(function (s) { return s.act; });
assert.deepStrictEqual(acts, [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 4], 'act 序列＝四幕 1/1/1/2…2/3/4');
[1, 2, 3, 4].forEach(function (a) { assert.ok(acts.indexOf(a) >= 0, '幕 ' + a + ' 至少一页'); });
for (var i = 1; i < acts.length; i++) assert.ok(acts[i] >= acts[i - 1], 'act 单调不降');

/* ———— 5. notes 六项齐全（ask 允许空数组，其余五项非空） ———— */
L.slides.forEach(function (s) {
  var n = L.notes[s.no];
  assert.ok(n, '第' + s.no + '页有备注');
  assert.ok(Array.isArray(n.ask), '第' + s.no + '页 ask 是数组');
  ['goal', 'open', 'clicks', 'difficulty', 'transition'].forEach(function (k) {
    assert.ok(n[k] && String(n[k]).trim(), '第' + s.no + '页 ' + k + ' 非空');
  });
});

/* ———— 6. 检测页题库：输入题 ≥2、why 全非空、选项与答案索引合法 ———— */
assert.ok(L.check.length >= 2, '输入题 ≥2（现 ' + L.check.length + ' 道）');
L.check.forEach(function (c, i) {
  assert.ok(c.q && c.q.trim(), 'check' + i + ' 题干非空');
  assert.ok(Array.isArray(c.accepts) && c.accepts.length, 'check' + i + ' accepts 非空');
  assert.ok(Array.isArray(c.rejects) && c.rejects.length, 'check' + i + ' rejects 非空');
  assert.ok(c.why && c.why.trim(), 'check' + i + ' why 非空');
});
assert.ok(L.judge.why && L.judge.why.trim(), 'judge why 非空');
L.quiz.forEach(function (q, i) {
  assert.ok(q.q && q.q.trim(), 'quiz' + i + ' 题干非空');
  assert.ok(q.a >= 0 && q.a < q.opts.length, 'quiz' + i + ' 答案索引合法');
  assert.ok(q.why && q.why.trim(), 'quiz' + i + ' why 非空');
});

console.log('math-bs-7a-2-2 契约断言全部通过（' + L.slides.length + ' 页四幕 / 输入题 ' + L.check.length + ' 道 / accepts+rejects 全量判定）');
