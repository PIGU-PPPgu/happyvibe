// 一次性内联脚本：读取 index.html 的 <link>/<script src> 标签，
// 按标签实际顺序内联 css/app.css 与 js/data.js、js/engine.js、js/core.js、js/pages.js、js/app.js，
// 生成零外链单文件 public/interactives/geography-rj-7a-1-3.html
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src/interactives/geography/geography-rj-7a-1-3');
const OUT = path.join(ROOT, 'public/interactives/geography-rj-7a-1-3.html');

let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

// 内联 stylesheet（<link rel="stylesheet" href="css/app.css?v=1">）
const css = fs.readFileSync(path.join(SRC, 'css/app.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="css\/app\.css[^"]*">/, () => '<style>\n' + css + '\n</style>');

// 按 <script src="js/xxx.js..."> 的实际顺序内联，src 以文件内容为准逐个替换
const scripts = [...html.matchAll(/<script src="js\/([a-z]+\.js)(\?v=\d+)?"><\/script>/g)].map(m => m[1]);
const expect = ['data.js', 'engine.js', 'core.js', 'pages.js', 'app.js'];
if (JSON.stringify(scripts) !== JSON.stringify(expect)) {
  console.error('script 顺序异常:', scripts);
  process.exit(1);
}
html = html.replace(/<script src="js\/[a-z]+\.js(\?v=\d+)?"><\/script>/g, (tag) => {
  const file = tag.match(/js\/([a-z]+\.js)/)[1];
  const code = fs.readFileSync(path.join(SRC, 'js', file), 'utf8');
  return '<script>\n' + code + '\n</script>';
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('built', OUT, (html.length / 1024).toFixed(1) + 'KB, scripts:', scripts.join(' → '));
