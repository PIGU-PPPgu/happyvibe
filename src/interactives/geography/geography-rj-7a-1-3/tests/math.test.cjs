/* 地图的阅读 · 校园寻宝 — 引擎与数据契约断言（node 直跑，不依赖构建）
   断言口径：§3.2 契约清单 + §3.3 输入判定规范（归一化映射表、accepts 全过 rejects 全拒）。 */
global.window = globalThis;
require('../js/engine.js');
var M = window.MapEngine, assert = require('assert');
var fs = require('fs');
var src = fs.readFileSync(require('path').join(__dirname, '../js/data.js'), 'utf8');
var sb = { window: {} }; new Function('window', src)(sb.window);
var L = sb.window.LESSON;

/* ---- 1. 归一化映射表（封闭集合逐对；删前导 + 在转半角之后） ---- */
assert.strictEqual(M.normalize('＋１５０，３'), '150,3', '全角加号/数字/逗号逐对转半角，前导+后删');
assert.strictEqual(M.normalize('１５０米'), '150米', '全角数字转半角，汉字单位保留');
assert.strictEqual(M.normalize('  5 厘米 '), '5厘米', '删空白');
assert.strictEqual(M.normalize('−3、２'), '-3,2', '数学减号与顿号归一');

/* ---- 2. 比例尺换算：实地 ＝ 图上 × 分母（judge 题数据源） ---- */
assert.strictEqual(M.groundCm(3, 5000), 15000, '3cm × 5000 = 15000cm');
assert.strictEqual(M.groundM(3, 5000), 150, '15000cm = 150m（judge 题标准答案）');
assert.strictEqual(M.mapCm(150, 5000), 3, '逆推：实地 150m 回到图上 3cm');
assert.strictEqual(M.groundM(5, 2000), 100, '检测第1题：5×2000=100m');
assert.strictEqual(M.mapCm(600, 12000), 5, '检测第2题：600m ÷ 12000 = 5cm');

/* ---- 3. 输入判定：题库 accepts 全过、rejects 全拒 ---- */
L.check.forEach(function (c, i) {
  c.accepts.forEach(function (a) { assert.ok(M.checkInput(a, c.accepts), 'check' + i + ' accept ' + a); });
  c.rejects.forEach(function (r) { assert.ok(!M.checkInput(r, c.accepts), 'check' + i + ' reject ' + r); });
  assert.ok(c.why && c.why.length > 0, 'check' + i + ' why 非空');
  assert.ok(c.hint && c.hint.length > 0, 'check' + i + ' hint 非空（错答反馈指向第一步）');
});
assert.ok(M.checkInput('１５０', ['150', '150m', '150米']), '全角数字作答判对');
assert.ok(M.checkInput(' 150米 ', ['150', '150m', '150米']), '带空白与单位判对');
assert.ok(!M.checkInput('', ['150']), '空串不判对');
assert.ok(!M.checkInput('1500m', ['150', '150m', '150米']), '典型错答 1500m 判错');

/* ---- 4. 格网：点放换算往返一致 ---- */
assert.strictEqual(M.toCell(350, 195).name, 'C2', '格心像素 → 格名');
assert.strictEqual(M.fromCell('C2').x, 350, '格名 → 格心 x');
assert.strictEqual(M.fromCell('C2').y, 195, '格名 → 格心 y');
['A1', 'B3', 'D2', 'E4', 'C4'].forEach(function (n) {
  var c = M.fromCell(n);
  assert.strictEqual(M.toCell(c.x, c.y).name, n, '往返一致 ' + n);
});
assert.strictEqual(M.fromCell('Z9'), null, '越界格名为 null');
// 世界常数地标落格核对（页文案与图形同源的依据）
var G = L.map.geo;
assert.strictEqual(M.toCell(G.club.x + G.club.w / 2, G.club.y + G.club.h / 2).name, 'E4', '社团活动室在 E4');
assert.strictEqual(M.toCell(G.field.cx, G.field.cy).name, 'B3', '操场中心在 B3');
assert.strictEqual(M.toCell(G.teach.x + G.teach.w / 2, G.teach.y + G.teach.h / 2).name, 'D2', '教学楼中心在 D2');

/* ---- 5. 方位：八方位正向输出 + 指向标相对读数 ---- */
assert.strictEqual(M.azWord(0), '北');
assert.strictEqual(M.azWord(90), '东');
assert.strictEqual(M.azWord(135), '东南');
assert.strictEqual(M.azWord(337), '西北');
assert.strictEqual(M.azWord(720), '北', '超一圈归一');
var bdeg = M.bearing(G.field.cx, G.field.cy, G.teach.x + G.teach.w / 2, G.teach.y + G.teach.h / 2);
assert.ok(Math.abs(bdeg - 58.9) < 0.5, '教学楼在操场的原方位约 58.9°（东北）');
assert.strictEqual(M.azWord(bdeg), '东北', '指向标朝上时读东北');
assert.strictEqual(M.azWord(M.relAz(bdeg, 45)), '北', '指向标转 45° 后读北');
assert.strictEqual(M.azWord(M.relAz(bdeg, 90)), '西北', '指向标转 90° 后读西北');

/* ---- 6. 数据契约：10 页、act 幕序 1/1/1/2/2/2/2/2/3/4、handsOn 全有、notes 六项 ---- */
assert.strictEqual(L.slides.length, 10, 'slides 10 页');
var mdSrc = '';
try { mdSrc = fs.readFileSync(require('path').join(__dirname, '../../../content/resources/geography/geography-rj-7a-1-3.md'), 'utf8'); } catch (e) { mdSrc = ''; }
if (mdSrc) {
  var mdPages = mdSrc.match(/^pages:\s*(\d+)\s*$/m);
  assert.ok(mdPages, '资源 md 含 pages 字段');
  assert.strictEqual(Number(mdPages[1]), L.slides.length, 'md pages 与 slides.length 相等');
}
var acts = L.slides.map(function (s) { return s.act; });
assert.deepStrictEqual(acts, [1, 1, 1, 2, 2, 2, 2, 2, 3, 4], 'act 序列 1/1/1/2/2/2/2/2/3/4');
assert.ok(acts.every(function (a, i) { return i === 0 || a >= acts[i - 1]; }), 'act 单调不降');
[1, 2, 3, 4].forEach(function (a) { assert.ok(acts.indexOf(a) >= 0, '第' + a + '幕至少一页'); });
L.slides.forEach(function (s) {
  assert.ok(s.handsOn && s.handsOn.length > 0, '第' + s.no + '页 handsOn 非空');
  assert.ok(s.title && s.tag && s.title.length > 0, '第' + s.no + '页标题与角标齐');
});
L.slides.forEach(function (s) {
  var n = L.notes[s.no];
  assert.ok(n, '第' + s.no + '页有备注');
  ['goal', 'open', 'clicks', 'difficulty', 'transition'].forEach(function (k) {
    assert.ok(n[k] && String(n[k]).length > 0, '第' + s.no + '页 notes.' + k + ' 非空');
  });
  assert.ok(Array.isArray(n.ask), '第' + s.no + '页 notes.ask 为数组');
});
assert.ok(L.notes[10] && L.notes[10].goal, '板书页 notes 六项在册');

/* ---- 7. 检测页题库：输入题 ≥2（在 check 内取用）、quiz 选项与答案合法 ---- */
var inputQ = L.check.filter(function (c, i) { return i >= 1; });
assert.ok(inputQ.length >= 2, '检测页输入题 ≥2');
L.quiz.forEach(function (q, i) {
  assert.ok(q.a >= 0 && q.a < q.opts.length, 'quiz' + i + '答案索引合法');
  assert.ok(q.why && q.why.length > 0, 'quiz' + i + ' why 非空');
});

/* ---- 8. 板书逐条揭示与末条留白 ---- */
assert.ok(L.board.length >= 5, '板书 ≥5 条（逐条揭示）');
assert.ok(L.board[L.board.length - 1][0] === '留白', '末条为留白（先说后看）');

console.log('地图的阅读 · 校园寻宝：引擎与契约测试通过（归一化/换算/判定/格网/方位/幕序/题库/板书 全绿）');
