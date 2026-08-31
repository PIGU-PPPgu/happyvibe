# HappyVibe 数智学园 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把两份培训 PPT 转化为紫金科技代码风的 Astro 静态学习网站（7 模块课程 + 工具箱 + 路线图 + 搜索 + 本地学习进度）。

**Architecture:** Astro 5 内容集合（Markdown 课程）+ 原生 CSS 设计令牌 + 少量原生 JS（进度/搜索 UI）。构建产物为纯静态文件，GitHub Pages 托管，Pagefind 做构建后全文索引。

**Tech Stack:** Astro 5 · TypeScript · zod（内容校验）· Pagefind · sharp（图片压缩）· python-pptx（PPT 提取）· GitHub Actions

## Global Constraints

- 设计文档：`docs/superpowers/specs/2026-08-31-happyvibe-learning-site-design.md`（配色/IA/功能以此为准）
- 配色令牌：主紫 `#750F6D`、强调金 `#FEB300`、底 `#150E22`、面板 `#1E1433`；对比度 WCAG AA
- 深色 only；中文正文用系统黑体/Noto Sans SC，代码与英文标签用 JetBrains Mono；像素字体仅英文点缀
- 站名 HappyVibe 数智学园；口号「学会"偷懒" = 减负增效」；署名：港中深附属道远学校 · 吴林璋
- 公网站点：截图含真实学生信息的一律不上线（Task 3 生成待确认清单）
- 课程正文 frontmatter 必须带 `status: draft|ready`，draft 课在页面上显示「内容校对中」徽章
- iCloud 路径含空格，所有 shell 命令必须给路径加引号
- 每个任务完成即 `git commit`

## File Structure

```
happyvibe/
├── astro.config.mjs              # site + Pagefind 集成脚本
├── package.json
├── src/
│   ├── content.config.ts         # 内容集合 schema（modules + lessons + tools）
│   ├── content/
│   │   ├── lessons/<module>/<lesson>.md   # 课程正文
│   │   └── tools/*.md            # 工具箱条目（数据在 frontmatter）
│   ├── data/modules.ts           # 模块元数据（slug/标题/图标/简介/色相）
│   ├── data/path.ts              # 路线图 7 站数据（站名/描述/链接课程）
│   ├── layouts/BaseLayout.astro  # 全站壳：顶栏/搜索/页脚/进度脚本
│   ├── components/               # SiteHeader, SearchModal, TerminalWindow,
│   │                             # PixelBadge, LessonCard, ModuleCard, ProgressBar,
│   │                             # ToolCard, PathMap, MarkDoneButton, TypeWriter
│   ├── pages/                    # index, path, toolbox, about, modules/[slug], modules/[slug]/[lesson]
│   ├── lib/progress.ts           # localStorage 进度读写 + 统计
│   └── styles/tokens.css         # 设计令牌 + 全局样式
├── public/images/lessons/...     # 精选截图（webp）
├── scripts/
│   ├── extract_ppt.py            # PPT media 提取 + 清单
│   └── optimize_images.mjs       # sharp 压缩 webp
└── .github/workflows/deploy.yml  # build + pagefind + Pages 发布
```

---

### Task 1: 工程骨架与内容 Schema

**Files:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`, `src/data/modules.ts`, `src/styles/tokens.css`

**Interfaces（后续任务依赖的确切定义）:**
- schema `lessons`：`title: string`、`module: enum(basics|agent|teaching|class-management|edu-data|research|creation)`、`order: number`、`description: string`、`source: string`（如 `道远 PPT S32-33`）、`status: enum(draft|ready)`、`icon?: string`
- schema `tools`：`name`、`category: enum(class|teaching|creation|agent)`、`description`、`url?`、`image?`、`order`
- `src/data/modules.ts` 导出 `MODULES: Array<{slug, title, subtitle, icon, accent}>`，顺序即导航顺序
- tokens.css 定义 CSS 变量：`--bg --bg-panel --purple --purple-bright --gold --gold-soft --text --text-muted --line --mono --sans --pixel`

- [x] Step 1: `npm create astro@latest . -- --template minimal --typescript strict --no-git --yes`（在仓库根，保留 docs/）
- [x] Step 2: 安装依赖 `npm i sharp` `npm i -D @pagefind/default-ui pagefind`
- [x] Step 3: 写 `src/content.config.ts`（glob loader，上述 schema）、`src/data/modules.ts`（7 模块元数据 + toolbox 虚拟条目）
- [x] Step 4: 写 `src/styles/tokens.css`（完整令牌 + reset + 深色底、扫描线网格背景工具类、像素边框工具类）
- [x] Step 5: 验证：`npx astro build` 通过（此时无页面，产出空站）
- [x] Step 6: `git commit -m "chore: astro scaffold + content schema + design tokens"`

### Task 2: 全站壳与核心组件

**Files:** `src/layouts/BaseLayout.astro`, `src/components/{SiteHeader,SiteFooter,TerminalWindow,PixelBadge,TypeWriter,SearchModal}.astro|ts`, `src/lib/progress.ts`

**Interfaces:**
- `BaseLayout` props: `{title, description,wide?=false}`；注入 tokens.css；挂载 SiteHeader/SearchModal/SiteFooter；`<script>` 引入进度初始化
- `lib/progress.ts` 导出（全局 window.HVProgress）：
  - `getDone(): Record<string, true>`（key = `module/lesson` slug 对）
  - `toggleDone(id): boolean`
  - `stats(): {done:number,total:number,pct:number}`、`moduleStats(slug)`
  - `subscribe(cb)`（跨页/组件刷新）
- `TerminalWindow` slot 组件：macOS 三点 + 标题栏 + 等宽字内容
- `PixelBadge`：像素风小徽章（status=draft 显示「内容校对中」）
- SearchModal：本任务先出空壳 UI（⌘K 唤起），Task 8 接 Pagefind

- [x] Step 1: 写 `lib/progress.ts`（localStorage key `hv-progress:v1`，含 subscribe/dispatch 自定义事件 `hv:progress`）
- [x] Step 2: 写 BaseLayout + SiteHeader（顶栏：像素 logo `HAPPYVIBE_`、栏目导航、搜索按钮 ⌘K、总进度环）+ SiteFooter（署名/口号/备案占位）
- [x] Step 3: 写 TerminalWindow / PixelBadge / TypeWriter（hero 打字机，respect `prefers-reduced-motion`）
- [x] Step 4: 建临时 `/sandbox` 页面渲染全部组件，`npm run dev` 目检 320/768/1440 三档
- [x] Step 5: 验证 `npx astro build` 通过；删 sandbox 页；commit `feat: base layout + core components + progress lib`

### Task 3: PPT 图片提取与隐私排查

**Files:** `scripts/extract_ppt.py`, `scripts/optimize_images.mjs`, `docs/图片待确认清单.md`, `public/images/lessons/**`

- [x] Step 1: 写并运行 `extract_ppt.py`：用 python-pptx 把两份 PPT 的 slide→media 映射导出到 `assets/raw/<deck>/s<NNN>-*.png`，并打印每页图片数
- [x] Step 2: 按课程需要挑选截图（对照课程清单 Task 4 的 source 页码），复制到 `public/images/lessons/<module>/`
- [x] Step 3: `optimize_images.mjs`（sharp）统一转 webp、宽 1200px、质量 78
- [x] Step 4: 逐张排查：凡出现真实学生姓名/学号/成绩/头像的截图 → 不上线，记入 `docs/图片待确认清单.md`（含原页码），待用户确认打码后再用
- [x] Step 5: commit `feat: ppt image pipeline + curated lesson screenshots`

### Task 4: Phase 1 课程内容（M0/M1/M6 全量 + 其余模块占位）

**Files:** `src/content/lessons/<module>/*.md`

内容以 Task 1 已提取的 PPT 全文为底，重写成教程；每课 frontmatter 带 source 页码；关键截图插入 `public/images/lessons/...`。清单（slug → 来源）：

- M0 basics：`philosophy`(道远S2-4 前言理念+高级偷懒)、`five-stages`(道远S32/时进S4)、`when-to-use`(时进S5)、`why-hard`(道远S33)、`agent-vs-llm`(道远S34)、`choose-model`(道远S35)
- M1 agent：`what-is-agent`(S42)、`why-agent`(S41)、`agent-anatomy`(S37 WorkBuddy 组成)、`product-comparison`(S36/39/40 评分表→HTML 表格)、`agent-obsidian`(S43)
- M6 creation：`vibe-coding-intro`(S25+S73 成长路径)、`ide-tools`(S16)、`consumption-traps`(S17-19 "输出html版本")、`keywords`(S20+S33)、`html-solving`(S23-24)、`prompt-vs-skill`(S25-29)、`case-study`(S30)
- M2/M3/M4/M5：先建骨架课（title/description/source 齐、正文为「内容校对中」占位 + 已知要点列表）：teaching `lesson-prep`(S47-48)、`html-concepts`(S50)、`fun-class`(S52-54)、`mindmap`(S55)、`feixiang-skill`(S49)；class-management `co-teacher`(S45-46)、`trace-desk`(S60-63)、`seat-planner`(S64)；edu-data `grade-analysis`(S63 部分)；research `topic-generator`(S57)

- [x] Step 1: 写 M0 六课（每课 300-600 字结构化教程 + 截图）
- [x] Step 2: 写 M1 五课（product-comparison 用静态 HTML 表格还原评分数据）
- [x] Step 3: 写 M6 七课
- [x] Step 4: 写 M2/M3/M4/M5 骨架课（status: draft）
- [x] Step 5: 验证 `npx astro build`（schema 校验所有 md）；commit `feat: phase-1 lesson content from training decks`

### Task 5: 模块页与课程详情页

**Files:** `src/pages/modules/[slug]/index.astro`, `src/pages/modules/[slug]/[lesson].astro`, `src/components/{ModuleCard,LessonCard,MarkDoneButton,Toc}.astro`

**Interfaces:**
- 列表页：模块头（TerminalWindow 风格）+ LessonCard 列表（序号/标题/描述/draft 徽章/已学 ✓）
- 详情页：面包屑 + 标题 + source 标注 + 正文（prose 样式，图片圆角+扫描线框）+ MarkDoneButton + 上一课/下一课（按 module 内 order）
- MarkDoneButton：`data-lesson-id`，点击 toggle → 事件刷新进度环

- [x] Step 1: 写列表页（getStaticPaths 遍历 MODULES）
- [x] Step 2: 写详情页（getStaticPaths 遍历 lessons）
- [x] Step 3: dev 目检 + build；commit `feat: module & lesson pages`

### Task 6: 首页

**Files:** `src/pages/index.astro`, `src/components/{ModuleGrid,ProgressOverview}.astro`

- [x] Step 1: hero：TerminalWindow 内 TypeWriter 逐行打出 `$ happyvibe --start` → 站名 + 口号 + CTA（开始学习→/path、浏览工具箱）
- [x] Step 2: ModuleGrid 七模块卡（图标/标题/课程数/进度条）+ ProgressOverview（总进度 + 继续学习按钮=第一个未完成课）
- [x] Step 3: build + 三档宽度目检；commit `feat: homepage`

### Task 7: 学习路线图页 /path

**Files:** `src/pages/path.astro`, `src/components/PathMap.astro`, `src/data/path.ts`

- [x] Step 1: `path.ts` 七站数据（站名/一句话/对应课程 slug，取自道远 S73 成长路径：会用 AI→教学提效→场景实践→数据分析→Vibe Coding→做出作品→形成成果）
- [x] Step 2: PathMap：垂直时间线（移动端）/横向像素进度路（桌面），每站显示完成状态；站内课程链接
- [x] Step 3: build + 目检；commit `feat: learning path page`

### Task 8: Pagefind 全站搜索

**Files:** `astro.config.mjs`（build 后跑 pagefind）、`SearchModal` 接入、快捷键

- [x] Step 1: `package.json` scripts: `"build": "astro build && pagefind --site dist"`
- [x] Step 2: SearchModal 接 `@pagefind/default-ui`（中文分词默认支持），⌘K/Ctrl+K 与顶栏按钮唤起，Esc 关闭，焦点陷阱
- [x] Step 3: build 后 `curl` 本地 preview 验证索引命中「万事留痕」；commit `feat: pagefind search`

### Task 9: 工具箱与关于页

**Files:** `src/content/tools/*.md`, `src/pages/toolbox.astro`, `src/pages/about.astro`

- [x] Step 1: tools 条目：班主任小工具合集、Mermaid、飞象 skill（github.com/PIGU-PPPgu/feixiang-skill）、万事留痕 Trace Desk、智能排座、Obsidian、AI 工作坊六方向卡片（来源 PPT S5-11/S49/S57/S63-64/S43）
- [x] Step 2: toolbox 页按 category 分组卡片
- [x] Step 3: about 页：项目来源、署名、更新日志（占位）、反馈方式（占位待用户补）、免责声明（内容仅供集团内部学习）
- [x] Step 4: commit `feat: toolbox & about`

### Task 10: 部署与收尾

**Files:** `.github/workflows/deploy.yml`, `README.md`, `docs/待补充清单.md`

- [x] Step 1: deploy.yml：push main → npm ci → build（含 pagefind）→ Pages 上传产物（官方 actions-pages 配置）
- [x] Step 2: README：本地开发/加新课指南（写 md 即发布）
- [x] Step 3: `docs/待补充清单.md`：逐课列出需要作者补充的讲述要点 + 疑似隐私截图清单引用
- [x] Step 4: 最终 `npm run build` + 本地 preview 全站走查；commit `chore: deploy workflow + docs`

### Task 11: 视觉验收

- [x] Step 1: `npm run build && npx astro preview` + 全页截图（桌面 1440 + 移动 390）
- [x] Step 2: 交 judge 子代理按页验收（首页/模块/课程/路线图/工具箱），修到达标
- [x] Step 3: commit 修复 `fix: visual acceptance fixes`
