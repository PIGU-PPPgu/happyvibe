// 1.1 数学测试：欧拉公式与柱锥公式（node tests/math.test.js）
global.window = globalThis;
require('../js/mathengine.js');
var M = window.MathEngine;
var assert = require('assert');
// 欧拉公式
assert.strictEqual(M.euler(8, 12, 6), 2, '立方体 V-E+F=2');
assert.strictEqual(M.euler(6, 9, 5), 2, '三棱柱 V-E+F=2');
assert.strictEqual(M.euler(5, 8, 5), 2, '四棱锥 V-E+F=2');
// 柱/锥公式
assert.strictEqual(M.prismF(4), 6); assert.strictEqual(M.prismV(4), 8); assert.strictEqual(M.prismE(4), 12);
assert.strictEqual(M.pyramidF(4), 5); assert.strictEqual(M.pyramidV(4), 5); assert.strictEqual(M.pyramidE(4), 8);
// iso 投影稳定性
var p = M.iso(1, 1, 0.5);
assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
// 数据一致性：每个 solid 的 faces 与 surface 描述存在（fs 读文本 eval）
var fs = require('fs');
var src = fs.readFileSync(require('path').join(__dirname, '../js/data.js'), 'utf8');
var sandbox = { window: {} };
new Function('window', src)(sandbox.window);
var L = sandbox.window.LESSON;
assert.ok(L.solids.length === 6, '六类立体');
L.solids.forEach(function (sd) {
  assert.ok(sd.faces >= 1 && sd.surface && sd.lives.length >= 2, sd.name + ' 数据完整');
});
assert.strictEqual(L.classify.length, 6, '检测 6 题');
console.log('1.1 数学测试 6/6 通过');
