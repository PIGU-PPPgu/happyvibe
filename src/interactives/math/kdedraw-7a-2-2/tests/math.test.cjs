global.window = globalThis;
require('../js/mathengine.js');
var M = window.MathEngine, assert = require('assert');
var fs = require('fs');
var src = fs.readFileSync(require('path').join(__dirname, '../js/data.js'), 'utf8');
var sb = { window: {} }; new Function('window', src)(sb.window);
var L = sb.window.LESSON;
// 动点
assert.strictEqual(M.pos(-4, 2, 3), 2, '3秒到+2');
assert.strictEqual(M.pos(-4, 2, 0), -4);
assert.strictEqual(M.pos(0, 2, 2), 4);
assert.strictEqual(M.dist(-3), 3);
// 坐标往返
assert.strictEqual(M.fromX(M.toX(2.5, 6, 900, 80), 6, 900, 80), 2.5);
assert.strictEqual(M.fromX(M.toX(-3, 6, 900, 80), 6, 900, 80), -3);
// 输入判定
assert.ok(M.checkInput('4', '4'));
assert.ok(M.checkInput('+4', '4', ['+4']));
assert.ok(M.checkInput('-3,-2', '-3,-2', ['-3、-2']));
assert.ok(M.checkInput('−3，−2'.replace(/−/g, '-'), '-3,-2', ['-3、-2']));
assert.ok(!M.checkInput('5', '4'));
// 比较与数据
assert.strictEqual(M.cmp(-1, -4), '>');
assert.strictEqual(L.slides.length, 11);
L.quiz.forEach(function (q, i) { assert.ok(q.a >= 0 && q.a < q.opts.length, 'quiz' + i); });
console.log('2.2 旗舰数学测试通过');
