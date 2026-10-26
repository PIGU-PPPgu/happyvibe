#!/usr/bin/env node
/* 手绘 2.5D 逐节动画过夜 loop（CommonJS，node scripts/handdrawn_loop.cjs）
   每轮：读 docs/handdrawn-plan.md 取第一个 ⬜ 节 → 标 🔄 → 生成资源（模板驱动）→
   测试 → 单文件构建 → 预览 → astro build → deploy --branch=main → curl 验证 →
   commit/push → 标 ✅。单节卡壳（任一步 3 次失败）标 ⚠️ 跳过，继续下一节。
   无限循环直到无 ⬜；每轮之间 sleep 60s。日志 → /tmp/hv/loop.log */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = "/tmp/hv";
const PLAN = path.join(ROOT, "docs/handdrawn-plan.md");
const LOG = "/tmp/hv/loop.log";
const PROXY = "HTTPS_PROXY=http://127.0.0.1:7897";

function log(msg) {
  const line = `[${new Date().toISOString().slice(0, 16)}] ${msg}`;
  fs.appendFileSync(LOG, line + "\n");
  console.log(line);
}
function sh(cmd, opts) {
  const r = execSync(cmd, { cwd: ROOT, timeout: 600000, stdio: opts?.quiet ? "pipe" : "inherit", shell: "/bin/zsh", encoding: "utf8" });
  return r == null ? "" : String(r);
}
function tryTimes(fn, n, what) {
  for (let i = 1; i <= n; i++) {
    try { return fn(); } catch (e) { log(`  ${what} 失败 ${i}/${n}: ${String(e.message).slice(0, 140)}`); }
  }
  return null;
}

// ———— 每节的生成模板：框架复制 + 数据/页面由"工单函数"产出 ————
// 模板库：core.js/app.js/css 直接复用 1.1 首件（已修好的通用外壳）；页面与数据逐节特化
const TPL = path.join(ROOT, "src/interactives/math/kdedraw-7a-1-1");

// 节工单表：slug → { title, anchor, pages(契约), dataCode, pagesCode, tests }
// 每节由"生成器函数"写出 data.js 与 pages.js（loop 首轮只内置最近 3 节，验证后逐节追加到该文件）
let JOBS = {};
try { JOBS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/handdrawn-jobs.json"), "utf8")); } catch (e) { /* 空 */ }

function nextTask() {
  const plan = fs.readFileSync(PLAN, "utf8");
  // 行格式：- ⬜ 1.4 从三个方向看物体的形状（kdedraw-7a-1-4）— 描述
  const m = plan.match(/- ⬜ (\d+\.\d+[a-z]?) (.+?)（(kdedraw-[a-z0-9-]+)）/);
  if (!m) return null;
  return { slug: m[3], section: m[1], title: m[2].trim() };
}
function mark(slug, from, to) {
  let s = fs.readFileSync(PLAN, "utf8");
  const re = new RegExp(`- ${from} (\\d+\\.\\d+[a-z]? .+?（${slug.replace(/[-]/g, "\\-")}）)`, "");
  if (!re.test(s)) { log(`  账本无 ${from} ${slug}`); return; }
  s = s.replace(re, `- ${to} $1`);
  fs.writeFileSync(PLAN, s);
}

function buildSingle(slug) {
  const dir = path.join(ROOT, "src/interactives/math", slug);
  let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const inl = (re, file) => {
    html = html.replace(re, "<script>\n" + fs.readFileSync(path.join(dir, file), "utf8") + "\n</script>");
  };
  html = html.replace(/<link rel="stylesheet" href="css\/app\.css[^"]*">/, "<style>\n" + fs.readFileSync(path.join(dir, "css/app.css"), "utf8") + "\n</style>");
  inl(/<script src="js\/data\.js"><\/script>/, "js/data.js");
  inl(/<script src="js\/mathengine\.js"><\/script>/, "js/mathengine.js");
  inl(/<script src="js\/core\.js[^"]*"><\/script>/, "js/core.js");
  inl(/<script src="js\/pages\.js[^"]*"><\/script>/, "js/pages.js");
  inl(/<script src="js\/app\.js[^"]*"><\/script>/, "js/app.js");
  fs.writeFileSync(path.join(ROOT, "public/interactives", slug + ".html"), html);
  return html.length;
}

function screenshotPreview(slug) {
  const py = `
from playwright.sync_api import sync_playwright
EXE = "/Users/iguppp/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell"
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=EXE, args=["--use-angle=swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file:///tmp/hv/public/interactives/${slug}.html#p=2", wait_until="load")
    pg.wait_for_timeout(1800)
    pg.screenshot(path="/tmp/hv/public/previews/${slug}.jpg", quality=80, type="jpeg")
    print("ERRS:" + (";".join(errs[:2]) if errs else "none"))
    b.close()
`;
  fs.writeFileSync("/tmp/hv-shot.py", py);
  return sh("python3 /tmp/hv-shot.py", { quiet: true });
}

function deployAndVerify(slug) {
  sh(`timeout 420 npx astro build > /tmp/hv/astro.log 2>&1 && echo astro_ok || tail -5 /tmp/hv/astro.log`);
  sh("npx pagefind --site dist > /dev/null 2>&1 || true");
  sh(`${PROXY} npx wrangler pages deploy dist --project-name=happyvibe --branch=main --commit-dirty=true 2>&1 | tail -2`);
  sh("sleep 8");
  const local = sh(`md5 -q public/interactives/${slug}.html`, { quiet: true }).trim();
  let ok = false;
  for (let i = 0; i < 3; i++) {
    const live = sh(`curl -sL --max-time 40 "https://happyvibe.intelliedu.cc/interactives/${slug}" | md5 -q`, { quiet: true }).trim();
    if (live === local) { ok = true; break; }
    sh("sleep 10");
  }
  return ok;
}

function gitShip(msg) {
  sh("git add -A && git commit -q -m '" + msg.replace(/'/g, "'\\''") + "' || true");
  for (let i = 0; i < 4; i++) {
    try {
      sh(`${PROXY} git push origin main 2>&1 | tail -1`, { quiet: true });
      const head = sh("git rev-parse main", { quiet: true }).trim();
      const remote = sh(`${PROXY} git ls-remote origin main 2>/dev/null | cut -f1`, { quiet: true }).trim();
      if (remote === head) return head;
    } catch (e) { /* retry */ }
    sh("sleep 6");
  }
  return null;
}

log("=== loop 启动 ===");
let round = 0;
while (true) {
  round++;
  const task = nextTask();
  if (!task) { log("账本已清空，loop 结束"); break; }
  const { slug, title } = task;
  log(`— R${round} 开始：${slug} ${title}`);
  mark(slug, "⬜", "🔄");
  const job = JOBS[slug];
  if (!job) {
    log(`  跳过 ${slug}（无工单，账本回退待做）`);
    mark(slug, "🔄", "⬜");
    continue;
  }
  // 1) 脚手架
  const dir = path.join(ROOT, "src/interactives/math", slug);
  try {
    fs.mkdirSync(path.join(dir, "js"), { recursive: true });
    fs.mkdirSync(path.join(dir, "css"), { recursive: true });
    fs.mkdirSync(path.join(dir, "tests"), { recursive: true });
    for (const f of ["js/core.js", "js/app.js", "css/app.css"]) {
      fs.copyFileSync(path.join(TPL, f), path.join(dir, f));
    }
    fs.writeFileSync(path.join(dir, "js/data.js"), job.data);
    fs.writeFileSync(path.join(dir, "js/mathengine.js"), job.mathengine);
    fs.writeFileSync(path.join(dir, "js/pages.js"), job.pages);
    let shell = fs.readFileSync(path.join(TPL, "index.html"), "utf8");
    shell = shell.replace("<title>生活中的立体图形 · 互动课件</title>", `<title>${job.title} · 互动课件</title>`);
    shell = shell.replace('<div class="brand-title">生活中的立体图形</div>', `<div class="brand-title">${job.title}</div>`);
    shell = shell.replace('<div class="brand-sub">北师大版七上 · 1.1</div>', `<div class="brand-sub">${job.sub || "北师大版七上"}</div>`);
    fs.writeFileSync(path.join(dir, "index.html"), shell);
    fs.writeFileSync(path.join(dir, "tests/math.test.cjs"), job.tests);
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ title: job.title, hint: job.hint || "", kind: "interactive-2d" }));
    fs.writeFileSync(path.join(ROOT, "src/content/resources/math", slug + ".md"), job.resourceMd);
  } catch (e) { log(`  ⚠️ 脚手架失败: ${e.message}`); mark(slug, "🔄", "⚠️"); continue; }

  // 2) 数学测试
  const t = tryTimes(() => sh(`node src/interactives/math/${slug}/tests/math.test.cjs`, { quiet: true }), 1, "数学测试");
  if (t === null) { log(`  ⚠️ 数学测试不过，跳过 ${slug}`); mark(slug, "🔄", "⚠️"); continue; }
  log(`  数学测试 OK: ${t.trim().split("\n").pop()}`);

  // 3) 单文件 + 预览截图（空白检测）
  let size = 0, shotsOk = false;
  for (let i = 0; i < 2 && !shotsOk; i++) {
    size = buildSingle(slug);
    const out = screenshotPreview(slug);
    shotsOk = /ERRS:none/.test(out);
    log(`  构建 ${size} 字节 / 预览 ${shotsOk ? "OK" : "页面报错: " + out.slice(0, 100)}`);
  }
  if (!shotsOk) { log(`  ⚠️ 页面报错，跳过 ${slug}`); mark(slug, "🔄", "⚠️"); continue; }

  // 4) 部署 + 验证
  if (!tryTimes(() => deployAndVerify(slug) ? true : (() => { throw new Error("字节不一致"); })(), 2, "部署")) {
    log(`  ⚠️ 部署验证失败，跳过 ${slug}`); mark(slug, "🔄", "⚠️"); continue;
  }
  log(`  线上字节一致`);

  // 5) 提交 + 回写账本
  const head = gitShip(`手绘 2.5D 逐节动画：${title}（${slug}）过夜 loop 自动产出`);
  if (head) log(`  push ${head.slice(0, 7)}`);
  mark(slug, "🔄", "✅");
  log(`— R${round} 完成：${slug}`);
  sh("sleep 60");
}
log("=== loop 退出 ===");
