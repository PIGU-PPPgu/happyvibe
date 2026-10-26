global.window = globalThis;
require('../js/mathengine.js');
var M = window.MathEngine, assert = require('assert');
var fs = require('fs');
var src = fs.readFileSync(require('path').join(__dirname, '../js/data.js'), 'utf8');
var sb = { window: {} }; new Function('window', src)(sb.window);
var L = sb.window.LESSON;
[1, 2, 5, 10, 100].forEach(function (n) {
  assert.strictEqual(M.matches(n), M.matchesB(n), '三法同源 n=' + n);
  assert.strictEqual(M.matches(n), M.matchesC(n));
});
assert.strictEqual(M.matches(1), 4); assert.strictEqual(M.matches(100), 301);
assert.strictEqual(M.maxSquares(22), 7, '22根摆7个');
assert.strictEqual(M.maxSquares(21), 6, '21根摆6个余3');
assert.ok(L.quiz.every(q => q.a >= 0 && q.a < q.opts.length));
console.log('3.1 数学测试通过');
