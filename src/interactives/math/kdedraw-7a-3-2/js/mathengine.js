(function (global) {
  'use strict';
  var M = {};
  M.fmt = function (x) { return typeof x === 'number' && Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 100) / 100); };
  // 安全代入求值器（白名单字符，x/a/b 变量）
  M.evalExpr = function (expr, vars) {
    if (!/^[-+*/()0-9\s xabxyz]+$/i.test(expr)) return null;
    try {
      var js = expr.replace(/\^/g, '**')
        .replace(/([0-9\.]+)\s*\(/g, '$1*(')                                   // 3( → 3*(
        .replace(/\)\s*\(/g, ')*(')                                            // )( → )*(
        .replace(/([0-9a-z\.]+)\s*([xabxyzw])\b/gi, function (_, c, v) { return '(' + c + ')*(' + v + ')'; })
        .replace(/\b([xabxyzw])\s*\(/gi, function (_, v) { return '(' + v + ')*('; })   // x( → x*(
        .replace(/\b([xabxyzw])\s*([xabxyzw])\b/gi, function (_, v1, v2) { return '(' + v1 + ')*(' + v2 + ')'; });
      Object.keys(vars).forEach(function (k) {
        js = js.replace(new RegExp('\\b' + k + '\\b', 'gi'), '(' + vars[k] + ')');
      });
      var r = Function('"use strict"; return (' + js + ')')();
      return typeof r === 'number' && isFinite(r) ? r : null;
    } catch (e) { return null; }
  };
  global.MathEngine = M;
})(typeof window !== 'undefined' ? window : globalThis);
