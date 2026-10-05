# K12 3D/2D 教学资源库 · 阶段 0 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上线 `/resources/` 资源库（数学/历史/语文试点：24 个自产单文件交互资源 + 45 条以上精选外链），含生产管线、质量闸门与生产线 skill。

**Architecture:** 新增 `resources` 内容集合（`src/content/resources/<subject>/*.md`）驱动两张页面（总览矩阵 + 学科页）；自产交互资源源码放 `src/interactives/<subject>/<name>/`（index.mjs + meta.json），`scripts/build_interactives.mjs` 用 esbuild 打包注入共享模板生成 `public/interactives/<name>.html`（真单文件、断网可开），`scripts/check_interactives.mjs` 做质量闸门；试点批量生产用 CreateWorkflow 一学科一智能体。

**Tech Stack:** Astro 5（既有）、three + esbuild（新增）、原生 canvas/SVG、Pagefind（既有）。

**Spec:** `docs/superpowers/specs/2026-10-05-k12-resource-library-design.md`

## Global Constraints

- 产物单文件：2D < 100KB，3D < 1MB；零外部请求（产物内不得出现 `http://` / `https://` 资源引用）；断网双击可开
- 无 emoji；深浅色双主题；投屏大字号（正文 ≥ 16px，标题 ≥ 20px）；触摸与鼠标双交互
- 文风红线（AGENTS.md）：按钮/标题/导航不加解释性括号；禁填充词（扫码即得/一键直达等）；事实说完就停
- 生成物不进 git：`public/interactives/` 除既有 3 个 archify 文件外全部 ignore
- `npm run build` = `node scripts/build_interactives.mjs && astro build && pagefind --site dist`
- 每个内容改动收尾：build → `npx wrangler pages deploy dist --project-name=happyvibe` → curl 线上验证 → git commit（iCloud 落地完成后普通 commit 可用）

---

### Task 1: 构建管线（依赖 + 模板 + runtime + build 脚本）

**Files:**
- Create: `src/interactives/_shared/template.html`
- Create: `src/interactives/_shared/runtime.mjs`
- Create: `scripts/build_interactives.mjs`
- Modify: `package.json`（scripts、dependencies、devDependencies）
- Modify: `.gitignore`

**Interfaces:**
- Produces: `init(opts)` —— 资源入口通过 `import { init } from '../../_shared/runtime.mjs'` 使用；`opts = { mount(el, api) }`，`api = { onTheme(theme), onResize() }`（资源侧可赋值回调）
- Produces: 每个资源目录 `src/interactives/<subject>/<name>/` 含 `index.mjs`（入口）与 `meta.json`（`{"title":"中文名","hint":"一句操作提示"}`）
- Produces: `scripts/.interactives-report.json`（`{ "<name>": {"kind": "interactive-3d"|"interactive-2d", "bytes": N} }`，供闸门脚本消费）

- [ ] **Step 1: 安装依赖**

```bash
npm install three && npm install -D esbuild
```

Expected: package.json 出现 `three`（dependencies）与 `esbuild`（devDependencies）。

- [ ] **Step 2: 写共享模板 `src/interactives/_shared/template.html`**

```html
<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
:root{--bg:#150e22;--panel:#1e1433;--panel2:#271a42;--text:#f2ecf8;--muted:#a99cc0;--purple:#a63d97;--gold:#feb300;--line:rgba(180,130,210,.16)}
:root[data-theme=light]{--bg:#f7f4fb;--panel:#ffffff;--panel2:#f3eefb;--text:#241a33;--muted:#5e5275;--purple:#8a2f7d;--gold:#b8860b;--line:rgba(90,50,120,.16)}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:var(--bg);color:var(--text);font-family:'Noto Sans SC','PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,-apple-system,sans-serif;overflow:hidden;-webkit-tap-highlight-color:transparent}
#bar{position:fixed;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(0,0,0,.001);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
#bar h1{font-size:21px;font-weight:700;letter-spacing:.02em}
#hint{font-size:15px;color:var(--muted)}
.btn{font:inherit;font-size:16px;line-height:1;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--panel);color:var(--text);cursor:pointer;touch-action:manipulation}
.btn:hover{border-color:var(--gold)}
.btn[aria-pressed=true]{border-color:var(--gold);color:var(--gold)}
#fs{margin-left:auto}
#stage{position:absolute;inset:0 0 0 0}
#stage.pad{inset:56px 0 0 0}
</style>
</head>
<body>
<div id="bar">
  <h1>__TITLE__</h1>
  <span id="hint">__HINT__</span>
  <button class="btn" id="theme" type="button" aria-label="切换深浅色">深浅</button>
  <button class="btn" id="fs" type="button" aria-label="全屏">全屏</button>
</div>
<div id="stage" class="pad"></div>
<script>__BUNDLE__</script>
</body>
</html>
```

- [ ] **Step 3: 写 `src/interactives/_shared/runtime.mjs`**

```js
// 资源共享运行时：主题（跟随站内 hv-theme 键与 ?theme= 参数）、全屏、resize
export function init(opts) {
  const el = document.getElementById('stage');
  const param = new URLSearchParams(location.search).get('theme');
  let theme = param === 'light' || param === 'dark' ? param : 'dark';
  try {
    const saved = localStorage.getItem('hv-theme');
    if ((saved === 'light' || saved === 'dark') && !param) theme = saved;
  } catch (e) {}
  document.documentElement.dataset.theme = theme;

  const api = { onTheme: null, onResize: null };
  document.getElementById('theme').addEventListener('click', () => {
    theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('hv-theme', theme); } catch (e) {}
    if (api.onTheme) api.onTheme(theme);
  });
  document.getElementById('fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });
  window.addEventListener('resize', () => { if (api.onResize) api.onResize(); });
  opts.mount(el, api);
  return api;
}
```

- [ ] **Step 4: 写 `scripts/build_interactives.mjs`**

```js
// 打包 src/interactives/<subject>/<name>/index.mjs 为单文件 public/interactives/<name>.html
import { build } from 'esbuild';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'src/interactives';
const OUT = 'public/interactives';
const template = await readFile(path.join(SRC, '_shared', 'template.html'), 'utf8');

const report = {};
let count = 0;
for (const s of await readdir(SRC, { withFileTypes: true })) {
  if (!s.isDirectory() || s.name === '_shared') continue;
  for (const e of await readdir(path.join(SRC, s.name), { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const entry = path.join(SRC, s.name, e.name, 'index.mjs');
    if (!existsSync(entry)) continue;
    const meta = JSON.parse(await readFile(path.join(SRC, s.name, e.name, 'meta.json'), 'utf8'));
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      write: false,
      format: 'iife',
      target: ['es2019'],
      metafile: true,
      legalComments: 'none',
    });
    const js = result.outputFiles[0].text;
    const is3d = Object.keys(result.metafile.inputs).some((i) => i.includes(`node_modules${path.sep}three`));
    const html = template
      .replaceAll('__TITLE__', meta.title)
      .replaceAll('__HINT__', meta.hint || '')
      .replace('__BUNDLE__', () => js);
    await mkdir(OUT, { recursive: true });
    await writeFile(path.join(OUT, `${e.name}.html`), html);
    report[e.name] = { kind: is3d ? 'interactive-3d' : 'interactive-2d', bytes: html.length };
    count++;
    console.log(`built ${e.name}.html  ${is3d ? '3d' : '2d'}  ${(html.length / 1024).toFixed(1)}KB`);
  }
}
await writeFile('scripts/.interactives-report.json', JSON.stringify(report, null, 2));
console.log(`interactives: ${count} built`);
```

（`replace('__BUNDLE__', () => js)` 用函数形式避免 js 中的 `$&` 等被当作替换模式。）

- [ ] **Step 5: 改 `package.json` scripts 与 `.gitignore`**

package.json：

```json
"scripts": {
  "dev": "astro dev",
  "build": "node scripts/build_interactives.mjs && astro build && pagefind --site dist",
  "build:interactives": "node scripts/build_interactives.mjs",
  "check:interactives": "node scripts/check_interactives.mjs",
  "preview": "astro preview",
  "astro": "astro",
  "optimize:images": "node scripts/optimize_images.mjs"
}
```

.gitignore 追加（保留既有 3 个 archify 产物）：

```
public/interactives/*
!public/interactives/contest-tracks.html
!public/interactives/site-map.html
!public/interactives/topic-roadmap.html
scripts/.interactives-report.json
```

- [ ] **Step 6: 验证并提交**

Run: `npm run build:interactives`
Expected: `interactives: 0 built`，exit 0（还没有资源条目）。

Run: `npm run build`
Expected: 构建成功，dist 正常产出。

```bash
git add package.json package-lock.json .gitignore scripts/build_interactives.mjs src/interactives
git commit -m "资源库管线：esbuild 单文件打包 + 共享模板与 runtime（深浅色/全屏/resize）"
```

---

### Task 2: 质量闸门 `scripts/check_interactives.mjs`

**Files:**
- Create: `scripts/check_interactives.mjs`

**Interfaces:**
- Consumes: `scripts/.interactives-report.json`（Task 1 产出）与 `public/interactives/<name>.html`
- Produces: exit 0（全过）/ exit 1（任一不过），逐项打印 PASS/FAIL

- [ ] **Step 1: 写闸门脚本**

```js
// 质量闸门：体积上限、零外部请求、无 emoji、title、全屏按钮、双主题变量
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const report = JSON.parse(await readFile('scripts/.interactives-report.json', 'utf8'));
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const EXT_URL = /https?:\/\//;
let failed = 0;
const names = Object.keys(report);
if (names.length === 0) { console.log('check: no interactives built'); process.exit(0); }

for (const name of names) {
  const { kind, bytes } = report[name];
  const file = `public/interactives/${name}.html`;
  const problems = [];
  if (!existsSync(file)) problems.push('产物缺失');
  else {
    const html = await readFile(file, 'utf8');
    const limit = kind === 'interactive-3d' ? 1024 * 1024 : 100 * 1024;
    if (bytes > limit) problems.push(`体积 ${(bytes / 1024).toFixed(0)}KB 超限 ${limit / 1024}KB`);
    const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
    if (EXT_URL.test(noComments)) problems.push('存在外部 URL 引用');
    const m = noComments.match(EMOJI);
    if (m) problems.push(`含 emoji: ${m.map((c) => c.codePointAt(0).toString(16)).join(',')}`);
    if (!/<title>[^<]+<\/title>/.test(html) || html.includes('<title>__')) problems.push('title 缺失');
    if (!html.includes('id="fs"')) problems.push('缺全屏按钮');
    if (!html.includes('data-theme') || !html.includes(':root[data-theme=light]')) problems.push('缺双主题');
  }
  if (problems.length) { failed++; console.log(`FAIL ${name}: ${problems.join('；')}`); }
  else console.log(`PASS ${name}`);
}
if (failed) { console.error(`${failed} 个资源未过闸门`); process.exit(1); }
console.log(`check: ${names.length} 个资源全部通过`);
```

- [ ] **Step 2: 用坏样本验证闸门会拦**

```bash
mkdir -p /tmp/badcheck && cd /tmp/badcheck && cat > scripts_fake_report.json <<'EOF'
{"bad-demo": {"kind": "interactive-2d", "bytes": 200000}}
EOF
# 手工构造一个含外部链接与 emoji 的假产物验证正则（可直接用 node 单测两条正则）
node -e "
const EXT_URL = /https?:\/\//; const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/u;
if (!EXT_URL.test('src=\"https://cdn.example.com/a.js\"')) throw new Error('EXT_URL 失效');
if (!EMOJI.test('尺寸✅正确')) throw new Error('EMOJI 失效');
if (EMOJI.test('体积 300KB 正常')) console.log('正则行为正确');
"
```

Expected: 输出 `正则行为正确`。

- [ ] **Step 3: 提交**

```bash
git add scripts/check_interactives.mjs
git commit -m "资源库闸门：体积/零外链/无 emoji/双主题/title/全屏六项检查"
```

---

### Task 3: 学科数据与内容集合

**Files:**
- Create: `src/data/subjects.ts`
- Modify: `src/content.config.ts`

**Interfaces:**
- Produces: `SUBJECTS: SubjectMeta[]`，`SubjectMeta = { slug, name, icon, accent, grades: [start, end] }`；`SUBJECT_SLUGS`（11 项字符串字面量联合）；`STAGES = [{key:'primary',label:'小学'},{key:'junior',label:'初中'},{key:'senior',label:'高中'}]`；工具函数 `gradeToStage(g: number): 'primary'|'junior'|'senior'`（1-6 小学、7-9 初中、10-12 高中）
- Produces: `resources` collection，schema 见 Step 2

- [ ] **Step 1: 写 `src/data/subjects.ts`**

```ts
export const SUBJECT_SLUGS = [
  'chinese', 'math', 'english', 'science', 'physics',
  'chemistry', 'biology', 'geography', 'history', 'politics', 'it',
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export interface SubjectMeta {
  slug: SubjectSlug;
  name: string;
  icon: string;
  accent: string;
  /** 适用年级范围（1-12） */
  grades: [number, number];
}

export const SUBJECTS: SubjectMeta[] = [
  { slug: 'chinese',   name: '语文',          icon: '语', accent: '#FF8FA3', grades: [1, 12] },
  { slug: 'math',      name: '数学',          icon: '数', accent: '#6EC1FF', grades: [1, 12] },
  { slug: 'english',   name: '英语',          icon: '英', accent: '#7CE38B', grades: [1, 12] },
  { slug: 'science',   name: '科学',          icon: '科', accent: '#FFA45C', grades: [1, 6] },
  { slug: 'physics',   name: '物理',          icon: '物', accent: '#9D8CFF', grades: [8, 12] },
  { slug: 'chemistry', name: '化学',          icon: '化', accent: '#FEB300', grades: [9, 12] },
  { slug: 'biology',   name: '生物',          icon: '生', accent: '#66D9A8', grades: [7, 12] },
  { slug: 'geography', name: '地理',          icon: '地', accent: '#4FC3F7', grades: [7, 12] },
  { slug: 'history',   name: '历史',          icon: '史', accent: '#E0A96D', grades: [7, 12] },
  { slug: 'politics',  name: '道德与法治',     icon: '法', accent: '#C77DFF', grades: [1, 12] },
  { slug: 'it',        name: '信息科技',       icon: '信', accent: '#8FBC8F', grades: [1, 12] },
];

export const STAGES = [
  { key: 'primary', label: '小学', grades: [1, 6] },
  { key: 'junior', label: '初中', grades: [7, 9] },
  { key: 'senior', label: '高中', grades: [10, 12] },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

export function gradeToStage(g: number): StageKey {
  if (g <= 6) return 'primary';
  if (g <= 9) return 'junior';
  return 'senior';
}

export function subjectBySlug(slug: string): SubjectMeta | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}
```

- [ ] **Step 2: `src/content.config.ts` 增加 resources 集合**

在文件顶部 import 区加：

```ts
import { SUBJECT_SLUGS } from './data/subjects';
```

在 `const tools = defineCollection({ ... });` 之后加：

```ts
const RESOURCE_KINDS = ['interactive-3d', 'interactive-2d', 'diagram', 'external'] as const;
const RESOURCE_SOURCES = ['smartedu', 'phet', 'geogebra'] as const;

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z
    .object({
      title: z.string(),
      subject: z.enum(SUBJECT_SLUGS),
      stage: z.enum(['primary', 'junior', 'senior']),
      grades: z.array(z.number().int().min(1).max(12)).nonempty(),
      topic: z.string(),
      kind: z.enum(RESOURCE_KINDS),
      file: z.string().optional(),
      url: z.string().url().optional(),
      source: z.enum(RESOURCE_SOURCES).optional(),
      usage: z.string(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['draft', 'ready']).default('draft'),
      order: z.number().default(99),
    })
    .refine((d) => (d.kind === 'external' ? Boolean(d.url && d.source && !d.file) : Boolean(d.file && !d.url)), {
      message: 'external 条目必填 url+source；自产条目必填 file，二者互斥',
    }),
});
```

并把 `export const collections = { lessons, tools };` 改为：

```ts
export const collections = { lessons, tools, resources };
```

- [ ] **Step 3: 验证并提交**

Run: `npm run build`
Expected: 构建成功（集合为空不影响）。

```bash
git add src/data/subjects.ts src/content.config.ts
git commit -m "资源库数据层：11 学科元数据与 resources 内容集合（kind/file/url 互斥校验）"
```

---

### Task 4: `/resources/` 总览页（覆盖矩阵 + 筛选）

**Files:**
- Create: `src/pages/resources/index.astro`

**Interfaces:**
- Consumes: `SUBJECTS`、`STAGES`（Task 3）；`getCollection('resources')`
- Produces: 页面 `/resources/`；学科卡片链接到 `/resources/<slug>/`

- [ ] **Step 1: 写页面**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TerminalWindow from '../../components/TerminalWindow.astro';
import { SUBJECTS, STAGES } from '../../data/subjects';
import { withBase } from '../../lib/urls';

const all = await getCollection('resources');
const own = all.filter((r) => r.data.kind !== 'external');
const ext = all.filter((r) => r.data.kind === 'external');

// 覆盖矩阵：subject × stage 的资源计数
const cell = new Map<string, number>();
for (const r of all) {
  const k = `${r.data.subject}|${r.data.stage}`;
  cell.set(k, (cell.get(k) ?? 0) + 1);
}
const count = (slug: string, stage: string) => cell.get(`${slug}|${stage}`) ?? 0;
const subjectTotal = (slug: string) => all.filter((r) => r.data.subject === slug).length;
const covered = SUBJECTS.filter((s) => subjectTotal(s.slug) > 0).length;
---

<BaseLayout title="教学资源库" description="K12 学科 3D/2D 交互教学资源：单文件可下载、断网可投屏，按教材章节知识点组织">
  <div class="container res-page">
    <TerminalWindow title="happyvibe resources">
      <p class="kicker mono">// RESOURCES · {all.length} 条资源 · {covered}/{SUBJECTS.length} 学科已上线</p>
      <h1 class="res-title">教学资源库</h1>
      <p class="res-sub text-muted">
        自产资源是单文件网页，下载后断网双击即可投屏；外链资源以国家中小学智慧教育平台为主。
        按学科进入，按教材章节找知识点。
      </p>
    </TerminalWindow>

    <div class="res-stats">
      <div class="stat"><span class="stat-n mono">{own.length}</span><span class="stat-l">自产交互资源</span></div>
      <div class="stat"><span class="stat-n mono">{ext.length}</span><span class="stat-l">精选外链</span></div>
      <div class="stat"><span class="stat-n mono">{SUBJECTS.length}</span><span class="stat-l">学科规划</span></div>
    </div>

    <section class="matrix-wrap" aria-label="学科与学段覆盖矩阵">
      <table class="matrix">
        <thead>
          <tr>
            <th scope="col">学科</th>
            {STAGES.map((s) => <th scope="col">{s.label}</th>)}
            <th scope="col">合计</th>
          </tr>
        </thead>
        <tbody>
          {SUBJECTS.map((s) => (
            <tr class={subjectTotal(s.slug) === 0 ? 'empty' : ''}>
              <th scope="row">
                <a href={withBase(`/resources/${s.slug}/`)} class="subj-link">
                  <span class="subj-icon mono" style={`--accent:${s.accent}`}>{s.icon}</span>
                  {s.name}
                </a>
              </th>
              {STAGES.map((st) => {
                const n = count(s.slug, st.key);
                const inRange = !(s.grades[1] < st.grades[0] || s.grades[0] > st.grades[1]);
                return <td>{inRange ? (n > 0 ? <span class="cell-n mono" data-n={n}>{n}</span> : <span class="cell-zero">—</span>) : <span class="cell-na"></span>}</td>;
              })}
              <td class="mono total">{subjectTotal(s.slug) || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  </div>
</BaseLayout>

<style>
  .res-page { padding: 28px 20px 60px; display: flex; flex-direction: column; gap: 22px; }
  .res-title { font-size: 28px; margin: 4px 0 6px; }
  .res-sub { max-width: 720px; line-height: 1.7; }
  .res-stats { display: flex; gap: 14px; flex-wrap: wrap; }
  .stat {
    display: flex; flex-direction: column; gap: 2px;
    padding: 14px 22px; background: var(--bg-panel);
    border: 1px solid var(--line); border-radius: var(--radius); min-width: 130px;
  }
  .stat-n { font-size: 26px; color: var(--gold); font-weight: 700; }
  .stat-l { font-size: 13px; color: var(--text-muted); }
  .matrix-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); background: var(--bg-panel); }
  .matrix { width: 100%; border-collapse: collapse; min-width: 560px; }
  .matrix th, .matrix td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--line); font-size: 15px; }
  .matrix thead th { color: var(--text-muted); font-weight: 500; font-size: 13px; }
  .matrix tbody tr:last-child th, .matrix tbody tr:last-child td { border-bottom: none; }
  .subj-link { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; font-weight: 600; }
  .subj-link:hover { color: var(--gold-soft); }
  .subj-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px; font-size: 14px;
    color: var(--accent); border: 1px solid var(--line);
  }
  .cell-n {
    display: inline-flex; min-width: 30px; padding: 3px 9px; justify-content: center;
    border-radius: 999px; background: rgba(166, 61, 151, 0.16); color: var(--text); font-size: 14px;
  }
  .cell-zero { color: var(--text-faint); }
  .cell-na::before { content: ''; }
  .total { color: var(--gold-soft); }
  tr.empty .subj-link { color: var(--text-muted); }
</style>
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build && npm run preview -- --port 4322 &`，然后 `curl -s http://localhost:4322/resources/ | grep -c "教学资源库"`
Expected: 输出 ≥ 1（页面 200 且渲染）。构建无集合条目也不报错。

```bash
git add src/pages/resources/index.astro
git commit -m "资源库总览页：学科×学段覆盖矩阵与统计"
```

---

### Task 5: 学科页与导航入口

**Files:**
- Create: `src/pages/resources/[subject].astro`
- Modify: `src/components/SiteHeader.astro:3-11`（nav 数组）

**Interfaces:**
- Consumes: Task 3 的 `SUBJECTS`/`subjectBySlug`、Task 4 的页面路径约定
- Produces: `/resources/<slug>/` 页面；主导航新增「资源库」

- [ ] **Step 1: 写学科页 `src/pages/resources/[subject].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TerminalWindow from '../../components/TerminalWindow.astro';
import { SUBJECTS, subjectBySlug, STAGES } from '../../data/subjects';
import { withBase } from '../../lib/urls';

export function getStaticPaths() {
  return SUBJECTS.map((s) => ({ params: { subject: s.slug } }));
}

const { subject } = Astro.params;
const meta = subjectBySlug(subject);
if (!meta) return Astro.redirect(withBase('/resources/'));

const all = (await getCollection('resources'))
  .filter((r) => r.data.subject === subject)
  .sort((a, b) => a.data.order - b.data.order);

const own = all.filter((r) => r.data.kind !== 'external');
const ext = all.filter((r) => r.data.kind === 'external');

// 按知识点分组，组内自产在前；组顺序取组内最小 order
const topics = new Map<string, typeof all>();
for (const r of all) {
  const list = topics.get(r.data.topic) ?? [];
  list.push(r);
  topics.set(r.data.topic, list);
}
const groups = [...topics.entries()]
  .map(([topic, items]) => ({
    topic,
    items: items.sort((a, b) => (a.data.kind === b.data.kind ? a.data.order - b.data.order : a.data.kind === 'external' ? 1 : -1)),
    order: Math.min(...items.map((i) => i.data.order)),
  }))
  .sort((a, b) => a.order - b.order);

const stageLabel = Object.fromEntries(STAGES.map((s) => [s.key, s.label]));
const KIND_LABEL: Record<string, string> = {
  'interactive-3d': '3D 交互',
  'interactive-2d': '2D 交互',
  diagram: '图示',
  external: '外链',
};
const SOURCE_LABEL: Record<string, string> = { smartedu: '国家智慧教育平台', phet: 'PhET', geogebra: 'GeoGebra' };
---

<BaseLayout title={`${meta.name}教学资源`} description={`${meta.name}学科 3D/2D 交互教学资源，按教材章节知识点组织，单文件可投屏`}>
  <div class="container res-page">
    <TerminalWindow title={`happyvibe resources / ${meta.slug}`}>
      <p class="kicker mono">// {meta.name} · 自产 {own.length} · 外链 {ext.length}</p>
      <h1 class="res-title"><span class="mono" style={`color:${meta.accent}`}>{meta.icon}</span> {meta.name}教学资源</h1>
      <p class="res-sub text-muted">按教材章节排列。自产资源点击全屏打开，可下载后断网使用。</p>
    </TerminalWindow>

    {groups.length === 0 && <p class="empty-note text-muted">该学科资源制作中。</p>}

    {groups.map((g) => (
      <section class="topic">
        <h2 class="topic-title">{g.topic}</h2>
        <div class="cards">
          {g.items.map((r) => (
            <article class="card" data-kind={r.data.kind}>
              <div class="card-head">
                {r.data.kind === 'external' ? (
                  <a class="card-title" href={r.data.url} target="_blank" rel="noopener">{r.data.title}</a>
                ) : (
                  <a class="card-title" href={withBase(`/interactives/${r.data.file}`)} target="_blank" rel="noopener">{r.data.title}</a>
                )}
                <span class="badge kind" data-kind={r.data.kind}>{KIND_LABEL[r.data.kind]}</span>
              </div>
              <p class="card-usage">{r.data.usage}</p>
              <div class="card-meta">
                <span class="badge">{stageLabel[r.data.stage]}</span>
                <span class="badge mono">{r.data.grades.join('、')} 年级</span>
                {r.data.kind === 'external' && SOURCE_LABEL[r.data.source] && <span class="badge src">{SOURCE_LABEL[r.data.source]}</span>}
                {r.data.status === 'draft' && <span class="badge draft">校对中</span>}
              </div>
              <details class="card-body">
                <summary>使用步骤</summary>
                <div class="body-md"><r.Content /></div>
              </details>
            </article>
          ))}
        </div>
      </section>
    ))}
  </div>
</BaseLayout>

<style>
  .res-page { padding: 28px 20px 60px; display: flex; flex-direction: column; gap: 26px; }
  .res-title { font-size: 28px; margin: 4px 0 6px; }
  .res-sub { line-height: 1.7; }
  .empty-note { padding: 30px 0; }
  .topic { display: flex; flex-direction: column; gap: 12px; }
  .topic-title { font-size: 19px; color: var(--gold-soft); border-left: 3px solid var(--gold); padding-left: 10px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  .card {
    display: flex; flex-direction: column; gap: 10px;
    padding: 16px; background: var(--bg-panel);
    border: 1px solid var(--line); border-radius: var(--radius);
  }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .card-title { color: var(--text); font-weight: 600; font-size: 16px; text-decoration: none; line-height: 1.5; }
  .card-title:hover { color: var(--gold-soft); }
  .card-usage { font-size: 14px; color: var(--text-muted); line-height: 1.7; }
  .card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .badge {
    font-size: 12px; padding: 2px 8px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--text-muted); white-space: nowrap;
  }
  .badge.kind[data-kind='external'] { color: var(--purple-soft); border-color: var(--line-strong); }
  .badge.kind[data-kind='interactive-3d'] { color: #6EC1FF; border-color: rgba(110, 193, 255, 0.4); }
  .badge.kind[data-kind='interactive-2d'] { color: #7CE38B; border-color: rgba(124, 227, 139, 0.4); }
  .badge.src { color: var(--gold-soft); border-color: var(--line-gold); }
  .badge.draft { color: var(--gold); }
  .card-body { font-size: 14px; }
  .card-body summary { cursor: pointer; color: var(--text-faint); font-size: 13px; }
  .card-body .body-md { margin-top: 8px; color: var(--text-muted); line-height: 1.8; }
  .card-body .body-md :global(p) { margin: 0 0 6px; }
  .card-body .body-md :global(ol), .card-body .body-md :global(ul) { padding-left: 18px; }
</style>
```

注意：`<r.Content />` 需要 `const { Content } = await r.render()`——把 map 改为先 `const rendered = await Promise.all(all.map(async (r) => ({ r, Content: (await r.render()).Content })))`，groups 用 rendered 条目组装。实现时按此调整（Astro 5 content layer API）。

- [ ] **Step 2: 主导航加入口**

`src/components/SiteHeader.astro` 的 nav 数组改为（插入资源库，重排 code）：

```ts
const nav = [
  { href: '/', label: '首页', code: '00' },
  { href: '/modules/', label: '课程模块', code: '01' },
  { href: '/path/', label: '学习路线图', code: '02' },
  { href: '/contest/', label: '比赛专区', code: '03' },
  { href: '/toolbox/', label: '工具箱', code: '04' },
  { href: '/resources/', label: '资源库', code: '05' },
  { href: '/analytics/', label: '数据看板', code: '06' },
  { href: '/about/', label: '关于', code: '07' },
];
```

并在 `@media (min-width: 900px) and (max-width: 1279px)` 段内追加 `.nav-link { font-size: 12px; padding: 6px 6px; } .nav-code { display: none; }`，保证 8 项单行放下。

- [ ] **Step 3: 验证并提交**

Run: `npm run build`
Expected: dist 出现 `resources/math/index.html` 等 11 个学科页。

```bash
git add src/pages/resources/[subject].astro src/components/SiteHeader.astro
git commit -m "资源库学科页（按教材章节分组、自产前外链后）与主导航入口"
```

---

### Task 6: 黄金样例一 math-cube-nets（3D 正方体展开图）

**Files:**
- Create: `src/interactives/math/math-cube-nets/index.mjs`
- Create: `src/interactives/math/math-cube-nets/meta.json`
- Create: `src/content/resources/math/math-cube-nets.md`

**Interfaces:**
- Consumes: `init`（Task 1 runtime）、`three`（npm）
- Produces: `public/interactives/math-cube-nets.html`（3D，< 1MB）

- [ ] **Step 1: 写 meta.json**

```json
{ "title": "正方体的11种展开图", "hint": "左右切换展开图，拖动旋转，滑杆折叠" }
```

- [ ] **Step 2: 写 index.mjs（完整首版）**

11 种展开图用「面网格坐标 + 折叠铰链树」统一描述：每个面是 1×1 正方形（带面颜色），展开态平铺在网格上，折叠时沿共享边逐层旋转 90°。首版实现：数据内置 11 种经典展开图的网格坐标与铰链父子关系，Three.js 场景拖拽旋转（自实现 orbit，不引 OrbitControls 以控制体积），底部滑杆控制折叠进度 t（0 展开 → 1 折成正方体），按铰链深度插值旋转角度。

```js
import { init } from '../../_shared/runtime.mjs';
import * as THREE from 'three';

// 11 种展开图：每个面 [gridX, gridY, cubeFaceId]；faceId 0-5 对应 上下左右前后
// 铰链：faceId 的父面（折叠时子面绕与父共享的边旋转）；-1 为根（底面，不动）
const NETS = [
  { name: '1-4-1 十字', faces: [[0,0,0],[0,1,4],[1,1,1],[2,1,5],[3,1,2],[0,2,3]], hinge: [-1,4,4,4,4,4] },
  { name: '1-4-1 阶梯', faces: [[0,0,0],[0,1,4],[1,1,1],[2,1,5],[3,1,2],[1,2,3]], hinge: [-1,4,4,4,4,1] },
  { name: '1-4-1 偏移', faces: [[0,0,0],[0,1,4],[1,1,1],[2,1,5],[2,2,2],[2,3,3]], hinge: [-1,4,4,4,5,5] },
  { name: '2-3-1',     faces: [[0,0,3],[0,1,4],[1,1,1],[2,1,5],[0,2,0],[3,1,2]], hinge: [4,-1,4,4,4,4] },
  { name: '2-3-1 变体', faces: [[0,0,3],[0,1,4],[1,1,1],[2,1,5],[0,2,0],[1,2,2]], hinge: [4,-1,4,4,4,1] },
  { name: '2-2-2 楼梯', faces: [[0,0,3],[0,1,4],[1,1,1],[1,2,0],[2,2,5],[2,3,2]], hinge: [-1,4,4,1,1,5] },
  { name: '2-2-2 直排', faces: [[0,0,3],[0,1,4],[1,1,1],[1,2,0],[1,3,5],[1,4,2]], hinge: [-1,4,4,1,0,5] },
  { name: '3-3 楼梯',   faces: [[0,0,3],[0,1,4],[1,1,1],[1,2,0],[2,2,5],[2,3,2]], hinge: [-1,4,4,1,1,5] },
  { name: '3-3 直排',   faces: [[0,0,3],[0,1,4],[0,2,1],[1,2,0],[1,3,5],[1,4,2]], hinge: [-1,4,1,4,0,5] },
  { name: '1-3-2',     faces: [[0,0,0],[1,0,4],[2,0,1],[1,1,5],[1,2,3],[1,3,2]], hinge: [0,-1,4,4,4,4] },
  { name: '1-3-2 变体', faces: [[0,0,0],[1,0,4],[2,0,1],[1,1,5],[1,2,2],[1,3,3]], hinge: [0,-1,4,4,1,4] },
];
```

（实现时逐一校核 11 种展开图几何正确性与铰链深度顺序，折叠动画按「离底面深度 × 90° × t」插值；场景：`WebGLRenderer({antialias:true})`，双面材质 `MeshStandardMaterial({side:THREE.DoubleSide})`，环境光 + 平行光，`requestAnimationFrame` 恒渲染；拖拽：pointerdown/move 改变相机绕原点的经纬角；主题回调里切换背景色与材质色调。完整代码在实现时按上述结构落地，闸门与视觉审阅通过为准。）

- [ ] **Step 3: 写条目 `src/content/resources/math/math-cube-nets.md`**

```md
---
title: 正方体的11种展开图
subject: math
stage: primary
grades: [5, 6]
topic: 长方体和正方体 · 展开与折叠
kind: interactive-3d
file: math-cube-nets
usage: 引入环节投屏，先让学生猜哪些能折回正方体，再用滑杆折叠验证；左右键切换 11 种形态。
tags: [空间观念, 正方体, 展开图]
status: ready
order: 10
---

## 课堂用法

1. 全屏打开，先停在展开态（滑杆最左），让学生观察 11 种形态的规律（1-4-1、2-3-1、2-2-2、3-3）。
2. 切到某一种，请学生预测能否折成正方体，再拖动滑杆折叠验证。
3. 追问：为什么「田」字形、「L」形折不回去？引导学生用对面间隔规律判断。

## 适用教材

人教版五年级下册第三单元；初一《几何图形初步》展开图复习可用。
```

- [ ] **Step 4: 构建 + 闸门 + 视觉审阅迭代**

Run: `npm run build:interactives && npm run check:interactives`
Expected: `PASS math-cube-nets`，体积 < 1MB（three tree-shake 后预估 450-650KB）。

视觉审阅：dev server 打开 `http://localhost:4321/interactives/math-cube-nets`，按交付协议渲染截图交 visual-judge 审；不通过则迭代（配色/字号/交互手感/折叠动画）直到通过。

- [ ] **Step 5: 提交**

```bash
git add src/interactives/math src/content/resources/math
git commit -m "黄金样例：正方体11种展开图（3D 折叠动画、滑杆步进、拖拽旋转）"
```

---

### Task 7: 黄金样例二 history-dynasties（2D 朝代时间线）

**Files:**
- Create: `src/interactives/history/history-dynasties/index.mjs`
- Create: `src/interactives/history/history-dynasties/meta.json`
- Create: `src/content/resources/history/history-dynasties.md`

- [ ] **Step 1: meta.json**

```json
{ "title": "中国朝代时间线", "hint": "滚轮或双指缩放，点击朝代看大事" }
```

- [ ] **Step 2: index.mjs（完整首版）**

单 canvas 实现：横轴为年份（约前 2070 至 1912），朝代画为分段色带（宽度按起止年），支持缩放（wheel 缩放以指针为中心、drag 平移），点击色带弹出该朝代起止年与 3-5 条大事（数据内置：夏商周春秋战国秦汉三国晋南北朝隋唐五代十国宋元明清）。字体随缩放分级：宏观显示朝代名，放大后显示帝王年份刻度。深浅色回调重绘。完整代码实现时落地，闸门与视觉审阅通过为准（结构与 math 样例同：init + mount + pointer 事件 + resize 重绘）。

- [ ] **Step 3: 条目 md**

```md
---
title: 中国朝代时间线
subject: history
stage: junior
grades: [7]
topic: 中国古代史 · 朝代更替
kind: interactive-2d
file: history-dynasties
usage: 单元复习投屏，缩放到具体时段梳理朝代顺序与并存关系；点击查大事年表。
tags: [朝代, 时间线, 古代史]
status: ready
order: 10
---

## 课堂用法

1. 全屏打开，先整体浏览朝代色带，口诀接龙（夏商与西周，东周分两段……）。
2. 缩放到三国两晋南北朝时段，辨析政权并存与更替顺序。
3. 点击隋唐，核对大事件与年代，练「世纪、年代」换算。

## 适用教材

统编版七年级上、下册；初三中考复习通览。
```

- [ ] **Step 4: 构建 + 闸门 + 视觉审阅迭代，提交**

```bash
npm run build:interactives && npm run check:interactives
git add src/interactives/history src/content/resources/history
git commit -m "黄金样例：中国朝代时间线（可缩放平移、朝代大事）"
```

---

### Task 8: 黄金样例三 chinese-tianjingsa（2D 意境长卷）

**Files:**
- Create: `src/interactives/chinese/chinese-tianjingsa/index.mjs`
- Create: `src/interactives/chinese/chinese-tianjingsa/meta.json`
- Create: `src/content/resources/chinese/chinese-tianjingsa.md`

- [ ] **Step 1: meta.json**

```json
{ "title": "天净沙·秋思 意境长卷", "hint": "点击景物高亮诗句，滑杆推移暮色" }
```

- [ ] **Step 2: index.mjs（完整首版）**

canvas 绘制横向长卷：枯藤、老树、昏鸦、小桥、流水、人家、古道、西风、瘦马、夕阳、断肠人各为一组程序化矢量图形（深色剪影风 + 金色夕照），横向滚动浏览；点击景物高亮并显示对应诗句（「枯藤老树昏鸦」逐景对应）；底部滑杆控制「暮色」滤镜（叠加半透明紫黑渐变），配曲「小桥流水人家」段落教学提示。实现时落地完整代码，闸门与视觉审阅通过为准。

- [ ] **Step 3: 条目 md**

```md
---
title: 天净沙·秋思 意境长卷
subject: chinese
stage: junior
grades: [7]
topic: 古代诗歌 · 元曲意象
kind: interactive-2d
file: chinese-tianjingsa
usage: 诗文精读投屏：逐景品意象，学生先说画面再点出诗句印证；滑杆推移暮色体会氛围。
tags: [元曲, 意象, 情境教学]
status: ready
order: 10
---

## 课堂用法

1. 全屏打开长卷，只看画面不出示诗句，请学生用一句话描述看到了什么。
2. 点击「枯藤」「老树」等景物，高亮并出示「枯藤老树昏鸦」，对照画面品词。
3. 拖动暮色滑杆，讨论：为什么把九种景物放在黄昏里？

## 适用教材

统编版七年级上册课外古诗词诵读；写景散文意象教学通用。
```

- [ ] **Step 4: 构建 + 闸门 + 视觉审阅迭代，提交**

```bash
npm run build:interactives && npm run check:interactives
git add src/interactives/chinese src/content/resources/chinese
git commit -m "黄金样例：天净沙·秋思意境长卷（景物-诗句联动、暮色推移）"
```

---

### Task 9: 生产线 skill `skills/teaching-interactives/SKILL.md`

**Files:**
- Create: `skills/teaching-interactives/SKILL.md`

**Interfaces:**
- Consumes: Task 1-8 的全部约定（目录结构、runtime API、meta.json、闸门命令、黄金样例路径）
- Produces: 后续学科智能体与人类协作者共用的生产规范

- [ ] **Step 1: 写 SKILL.md，内容必须覆盖**

1. 决策树：知识点 → 3D（空间结构/过程模拟）｜2D（关系/变化/平面几何）｜diagram（静态标注）｜external（现成优秀资源）
2. 目录与文件约定：`src/interactives/<subject>/<name>/{index.mjs,meta.json}`、`src/content/resources/<subject>/<name>.md` frontmatter 全字段示例（从黄金样例复制）
3. runtime API：`init({mount(el, api)})`、`api.onTheme/onResize`；主题色必须读 CSS 变量（`getComputedStyle`），禁止写死两套色值
4. 视觉规范：投屏字号下限（图内文字 ≥ 16px）、深浅色双审、触摸与鼠标、动画可控（暂停/步进）
5. 构建与验收命令：`npm run build:interactives && npm run check:interactives` 六项全过 + 视觉审阅；体积红线与减重手段（不引 examples/jsm 控件、贴图用程序化生成、几何体合并）
6. 文风红线引用（AGENTS.md 第 5 条）与隐私红线
7. 黄金样例索引：三个样例的路径与「照这个标准做」

- [ ] **Step 2: 提交**

```bash
git add skills/teaching-interactives/SKILL.md
git commit -m "生产线文档：teaching-interactives skill（决策树/规范/验收命令）"
```

---

### Task 10: 试点 manifest（数据文件）

**Files:**
- Create: `src/data/resource-manifest.json`

**Interfaces:**
- Produces: workflow 的机器可读输入；每条自产资源 `{ slug, subject, title, kind, stage, grades, topic, brief }`，brief 为内容要点（智能体据此实现）；外链部分为每科 `{ subject, min, sources, note }` 的整理指引（具体 URL 由智能体联网验证后写入 md，不得凭记忆写死）

- [ ] **Step 1: 写 manifest（自产 21 条剩余条目全文如下）**

数学（7）：
1. `math-rect-volume` 长方体与正方体表面积与体积 interactive-3d primary [5] 「长方体和正方体 · 表面积」滑杆改长宽高，实时展开面与表面积/体积算式联动
2. `math-views` 三视图与直观图 interactive-3d junior [7] 「几何图形初步 · 三视图」几何体拖转 + 三视图投影联动，答案遮罩开关
3. `math-function-lab` 一次函数与反比例函数图像实验室 interactive-2d junior [8] 「一次函数 / 反比例函数」k、b 滑杆，图像与性质表联动
4. `math-quadratic` 二次函数的图像与系数 interactive-2d junior [9] 「二次函数 · 系数与图像」a/b/c 滑杆联动开口、对称轴、定点
5. `math-circle-angle` 圆周角动态演示 interactive-2d junior [9] 「圆 · 圆周角」拖动圆周点，同弧圆周角恒相等、圆心角两倍关系实时标注
6. `math-unit-circle` 单位圆与三角函数 interactive-2d senior [10] 「三角函数 · 定义」角度扫动，单位圆上点与 sin/cos/tan 图像同步描点
7. `math-solid-section` 立体几何截面演示 interactive-3d senior [10] 「立体几何 · 截面」平面切正方体/圆柱/圆锥，截面多边形高亮与形状判断

历史（7）：
1. `history-qin-unify` 秦统一多民族国家建立 interactive-2d junior [7] 「秦汉时期 · 统一多民族国家建立」战国形势→秦疆域四至地图演变动画，分步播放
2. `history-silk-road` 丝绸之路 interactive-2d junior [7] 「秦汉时期 · 沟通中外文明的丝路」陆上/海上路线分步点亮，途经地与交流物产标注
3. `history-bronze` 青铜器与甲骨文 interactive-3d junior [7] 「夏商周时期 · 青铜器与甲骨文」可旋转青铜鼎（程序化建模）+ 纹饰放大 + 甲骨文与今字对照翻面
4. `history-modern-timeline` 中国近代史大事年表 interactive-2d junior [8] 「中国近代史 · 大事年表」1840-1949 可拖时间线，事件卡片按阶段分层
5. `history-new-routes` 新航路开辟 interactive-2d junior [9] 「走向近代 · 新航路开辟」四条航线动态航行 + 时间轴与人物卡
6. `history-world-wars` 两次世界大战时间线 interactive-2d junior [9] 「经济大危机与二战」1914-1945 双层时间线，关键事件与因果连线
7. `history-reform-open` 改革开放历程 interactive-2d junior [8] 「中国特色社会主义道路 » 改革开放」大事时间线 + 深圳等城市数据增长条

语文（7）：
1. `chinese-stroke-order` 易错字笔顺对比 interactive-2d primary [1,2,3] 「识字与写字 » 笔顺」田字格逐笔动画，常见易错字「火、出、里、方」等对比正误笔顺
2. `chinese-pinyin` 拼音声母韵母表 interactive-2d primary [1] 「汉语拼音 » 声母韵母」23 声母 24 韵母分类表，点击放大与拼读示例（文字口型要点，无音频）
3. `chinese-punctuation` 标点符号用法决策图 interactive-2d primary [3,4,5,6] 「标点符号 » 正确使用」按场景走流程选择该用哪种标点，附例句对错并列
4. `chinese-rhetoric` 修辞手法例句对比 interactive-2d junior [7,8] 「词句品析 » 修辞」比喻/拟人/排比/夸张例句切换，手法成分高亮标注
5. `chinese-classical-words` 文言实词翻面卡片 interactive-2d junior [7,8,9] 「文言文 » 实词」40 个高频实词卡片，正面义项背面例句，按册次筛选
6. `chinese-essay-structure` 文章结构思维导图 interactive-2d junior [7,8,9] 「写作 » 结构」写景/写人/议论文三棵可折叠结构树，节点带写作提示
7. `chinese-famous-lines` 古诗文名句情境填空 interactive-2d junior [6,7,8,9] 「古诗文积累 » 默写」按月/山/水主题分组，情境选择题式填空，即时判定

外链整理指引（三科相同结构）：

```json
"external": [
  { "subject": "math", "min": 15, "sources": ["smartedu", "phet", "geogebra"], "note": "国家平台课程教学栏按册次章节选精品课例与课件；PhET 选数学模拟（有中文）；GeoGebra 只录链接" },
  { "subject": "history", "min": 15, "sources": ["smartedu"], "note": "统编版逐册选精品课；适当收国家平台「党史学习」等专题资源" },
  { "subject": "chinese", "min": 15, "sources": ["smartedu"], "note": "统编版逐册选精品课与课文朗读资源；优先基础型作业示范" }
]
```

- [ ] **Step 2: 提交**

```bash
git add src/data/resource-manifest.json
git commit -m "试点 manifest：三科 21 个自产资源规格与外链整理指引"
```

---

### Task 11: CreateWorkflow 试点生产（数学/历史/语文）

**执行方式（不是普通代码任务）：**

1. 先加载 `dynamic-workflows` skill，再写 workflow 脚本并 `CreateWorkflow` 提交确认。
2. workflow 结构：
   - 输入：`src/data/resource-manifest.json` + `skills/teaching-interactives/SKILL.md` + 三个黄金样例路径
   - 并行三组（concurrency ≤ 3），每组一个「学科智能体」循环本科条目：读 manifest 条目与黄金样例 → 写 `src/interactives/<subject>/<slug>/{index.mjs,meta.json}` 与 `src/content/resources/<subject>/<slug>.md` → 跑 `npm run build:interactives && npm run check:interactives` → 失败带诊断重试（最多 2 次）→ 通过后继续下一条
   - 每科外链整理一次智能体调用：联网逐条验证 URL 可达（HTTP 200）后写 md 条目（kind: external）
   - 收尾阶段：全量 build + 总闸门 + 汇总成功/失败清单报告
3. 验收：21 个自产资源全过闸门；外链 ≥ 45 条且全 https；报告落盘。

**Files:** 无手工新文件（全部由 workflow 产出）

---

### Task 12: 收尾发布

**Files:**
- Modify: `AGENTS.md`（图表分工规则后追加第 2.5 条：教学资源生产 → 先读 `skills/teaching-interactives/SKILL.md`；「怎么加一节新课」旁补「怎么加一条资源」）
- Modify: `README.md`（目录速览补 `src/content/resources/` 与 `src/interactives/`；「怎么加一节新课」后补「怎么加一条教学资源」小节）

- [ ] **Step 1: 更新 AGENTS.md 与 README**

AGENTS.md 在规则 2（图表分工规则）后插入：

```md
2.5 **做教学 3D/2D 交互资源** → 先读 `skills/teaching-interactives/SKILL.md`，按其目录约定与验收命令执行；产物为单文件 HTML，过闸门才算完成
```

README 新增小节（放「怎么加一节新课」之后）：

```md
## 怎么加一条教学资源（资源库）

1. 写资源本体：`src/interactives/<学科>/<name>/` 下 `index.mjs`（入口，用 `_shared/runtime.mjs` 的 init）+ `meta.json`（title/hint）
2. 写条目：`src/content/resources/<学科>/<name>.md`（frontmatter 见任意黄金样例）
3. `npm run build:interactives && npm run check:interactives` 六项全过，再 `npm run build` 看页面
```

- [ ] **Step 2: 全量构建与本地验证**

```bash
npm run build
```

Expected: 24 个交互产物 + 11 个学科页 + Pagefind 索引全绿，`npm run check:interactives` 全 PASS。

- [ ] **Step 3: 部署与线上验证**

```bash
npx wrangler pages deploy dist --project-name=happyvibe
curl -s -o /dev/null -w "%{http_code}" https://happyvibe.intelliedu.cc/resources/
curl -s -o /dev/null -w "%{http_code}" https://happyvibe.intelliedu.cc/interactives/math-cube-nets
```

Expected: 均为 200（interactives 无后缀走 308 → 200）。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "教学资源库阶段 0 上线：数学/历史/语文试点 24 自产 + N 外链，管线/闸门/生产线 skill"
```

---

## Self-Review 记录

- Spec 覆盖：内容模型（T3）、总览矩阵（T4）、学科页（T5）、单文件管线与内联（T1）、闸门六项（T2）、黄金样例三科各一（T6-8）、skill（T9）、manifest 与 workflow（T10-11）、发布与文档（T12）——spec 第 4-9 节全部有对应任务；spec 第 10 节版权由外链整理指引（只链接、联网验证）与 SKILL.md 规范承载。
- 已知裁剪：卡片截图预览为 spec「后续增强」，不在本计划（正确，属阶段 2）。
- 类型一致性：`SubjectMeta`/`StageKey`/`gradeToStage` 在 T3 定义、T4/T5 按同名字段消费；`init` 签名 T1 定义、T6-8 消费；report json 字段 `kind/bytes` 在 T1 产出、T2 消费。
