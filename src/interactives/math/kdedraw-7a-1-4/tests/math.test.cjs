global.window = globalThis;
require('../js/mathengine.js');
var M = window.MathEngine, assert = require('assert');
var fs = require('fs');
var src = fs.readFileSync(require('path').join(__dirname, '../js/data.js'), 'utf8');
var sandbox = { window: {} };
new Function('window', src)(sandbox.window);
var L = sandbox.window.LESSON;
// 主/左/俯视图计算
var g1 = L.build1;
assert.deepStrictEqual(M.frontView(g1), [0, 1, 2, 1, 0], '主视图列高');
assert.deepStrictEqual(M.leftView(g1), [0, 1, 2, 1, 0], '左视图行高');
assert.strictEqual(M.topCount(g1), 8, '俯视非零格');
assert.strictEqual(M.blockCount(g1), 9, '块数合计');
// 最少块数 <= 实际块数 且 >= 俯视格数
var g2 = L.build2;
var g2min = (function () {   // 压缩后的图形
  var F = M.frontView(g2), Lf = M.leftView(g2);
  return g2.map(function (row, y) { return row.map(function (v, x) { return v > 0 ? Math.min(v, Math.max(1, Math.min(F[x], Lf[y]))) : 0; }); });
})();
assert.ok(M.blockCount(g2min) <= M.blockCount(g2), '压缩后块数不增');
assert.ok(M.sameViews(g2min, g2), '压缩前后三视图一致');   // 教学核心：视图不变
// quiz 答案索引合法
L.quiz.forEach((q, i) => assert.ok(q.a >= 0 && q.a < q.opts.length, 'quiz' + i));
console.log('1.4 数学测试通过');
