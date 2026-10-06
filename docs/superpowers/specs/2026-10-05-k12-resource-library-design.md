# K12 3D/2D 教学资源库设计

日期：2026-10-05
状态：已与用户确认方向（两层结构、全学科覆盖、试点三科先行、dynamic workflow 生产）

## 1. 背景与目标

HappyVibe 目前是教师 AI 学习站（课程 + 工具箱 + 材料包）。本设计新增一个 **K12 3D/2D 教学资源库**：覆盖小初高全部年级、除音体美外的 11 个主要学科，给教师提供**备课参考 + 课堂投屏**用的成品可视化资源。

目标用户是教师，不是学生。资源的使用场景：备课时查找、上课时投屏演示。资源库**只交付成品，不教教师怎么制作**（「怎么用 AI 做资源」的教学保留在现有 creation 模块课程里，两处不重复）。

## 2. 定位与边界

| 现有资产 | 定位 | 与资源库的关系 |
|---|---|---|
| `public/materials/` 15 学科材料包 | 喂给 AI 的素材（文字/图/音频） | 互不重叠。资源库是上课直接投屏的成品 |
| `public/interactives/` archify 产物 | 站点说明图（路线图、赛程等） | 同目录模式；资源库的交互资源也输出到该目录 |
| Mermaid 思维导图 | 课程内嵌图 | 思维导图类资源直接复用 Mermaid 能力，不另造 |
| creation 模块「用 HTML 解题」等课程 | 教制作方法 | 资源库不带教学话术，纯交付 |

差异化（相对国家智慧教育平台等现成导航）：

1. 自产资源是**单文件 HTML，可下载、断网双击即用**——教室网络不可控；
2. 资源按**教材章节知识点**组织，每条带傻瓜式课堂用法，不是资源堆砌。

## 3. 总体结构：两层

- **自产层**：站内生产的单文件交互资源（Three.js 3D、原生 canvas/SVG 2D）。覆盖每科最高价值的知识点，质量统一、离线可用。
- **外链层**：精选外部资源的索引条目。以国家中小学智慧教育平台为主，PhET、GeoGebra 为辅，用于快速填满「学科 × 学段」覆盖矩阵，保证每个格子不空。

11 学科（slug 沿用 `scripts/material_data.py` 既有命名）：

| 学科 | slug | 学段 |
|---|---|---|
| 语文 | chinese | 小学–高中 |
| 数学 | math | 小学–高中 |
| 英语 | english | 小学–高中 |
| 科学 | science | 小学（初中分科前） |
| 物理 | physics | 初二起–高中 |
| 化学 | chemistry | 初三起–高中 |
| 生物 | biology | 初一初二–高中 |
| 地理 | geography | 初一初二–高中 |
| 历史 | history | 初中–高中 |
| 道德与法治（高中为思想政治） | politics | 小学–高中 |
| 信息科技 | it | 小学–高中 |

## 4. 内容模型

新增内容集合 `src/content/resources/<subject>/<name>.md`：

```yaml
title: 正方体的11种展开图
subject: math              # 上表 11 个 slug 之一
stage: primary             # primary / junior / senior
grades: [5, 6]             # 1-12
topic: 展开与折叠           # 对齐教材章节的知识点名
kind: interactive-3d       # interactive-3d / interactive-2d / diagram / external
                          # diagram = 无交互的静态标注图（同为单文件 HTML）；external = 外链条目
file: math-cube-nets       # 自产资源：public/interactives/<file>.html
url: https://...           # external 时使用
source: smartedu           # external 来源：smartedu / phet / geogebra
usage: 引入环节投屏，先让学生猜哪些能折回正方体，再拖动验证
tags: [空间观念]
status: ready              # ready / draft
order: 10                  # 同知识点内排序
```

约束（zod schema 强制）：

- `kind = external` 时必填 `url` 和 `source`，不得有 `file`；其余 kind 必填 `file`；
- 正文 Markdown 放：适用教材版本、三步课堂用法、（外链的）检索路径——如「课程教学 → 初中数学 → 人教八上 → 第13章」，国家平台不能深链的资源靠检索路径兜底。

学科元数据集中在 `src/data/subjects.ts`（slug、名称、图标、主题色、适用学段、年级范围），页面与矩阵从这里取结构。

## 5. 站点结构

- `/resources/` 总览页：**学科 × 学段覆盖矩阵**（每格显示资源数，一眼看清覆盖度与空洞），顶部统计（自产/外链/学科数），学科/学段/类型筛选。
- `/resources/[subject]/` 学科页：知识点按教材章节顺序分组，组内自产在前、外链在后。
- 资源卡片：标题 + 学段/年级/类型徽章 + 一句话课堂用法 + 「全屏打开」链接（自产指向 `/interactives/<file>`，按站内惯例去掉 `.html` 后缀）。v1 卡片不嵌截图预览，用类型徽章区分；截图预览列为后续增强。
- 主导航加「资源库」入口；Pagefind 收录标题与 description，无需额外配置。

## 6. 自产层技术路线

延续站内零依赖哲学，浏览器端不引入任何外部 CDN。

### 6.1 生产管线

- 新增 devDependencies：`esbuild`；dependencies：`three`（从 npm 打包，不用 CDN）。
- 资源源码：`src/interactives/<subject>/<name>/index.mjs`（入口只写场景与教学逻辑）+ 可选 `style.css`。
- 共享层 `src/interactives/_shared/`：
  - `runtime.mjs`——主题切换（深浅色，色值取自 `src/styles/tokens.css`）、全屏按钮、工具条、iframe 嵌入时的主题跟随；
  - `template.html`——HTML 骨架（字号下限、投屏优化、无 emoji），构建时注入 bundle。
- `scripts/build_interactives.mjs`：esbuild 打包每个入口（tree-shake three）→ 注入模板 → 输出 `public/interactives/<name>.html`。产物为**真·单文件**（JS/CSS 全内联，2D 几十 KB，3D 因内联 three 约 400-600KB），断网双击可用。
- 生成物 `.gitignore`（`public/interactives/*` + 白名单保留现有 3 个 archify 文件），git 只存源码；本地开发先跑一次 `build:interactives`。
- `npm run build` = `node scripts/build_interactives.mjs && astro build && pagefind --site dist`。

### 6.2 新技能沉淀生产线

`skills/teaching-interactives/SKILL.md`：

- 资源类型决策树（3D / 2D / 静态图 / 外链，何时用哪个）；
- 模板与 runtime 的使用规范、Three.js 程序化教学对象配方（几何展开折叠、晶体分子、地球公转、青铜器等）；
- 验收标准与闸门命令（见第 9 节）。

## 7. 外链层策略

- 主来源：国家中小学智慧教育平台（basic.smartedu.cn），全学科覆盖、免费、教师认可度最高；
- 辅助：PhET（phet.colorado.edu，CC BY，嵌入需署名）、GeoGebra（材料 CC BY-NC-SA，**只链接不转存**）；
- 每条外链标注来源徽章；国家平台不可深链的资源写检索路径；
- `scripts/check_resource_links.mjs` 巡检失效链接，后续接入定期任务（阶段 2）。

## 8. 推进计划

### 阶段 0（本次迭代，试点三科）

1. **基础设施**（直接实现）：content collection + `subjects.ts` + `/resources/` 两级页面 + 导航 + 生产管线 + 闸门脚本 + skill 文档；
2. **黄金样例**：数学、历史、语文各 1 个，由主线程手工打磨（数学「正方体 11 种展开图」3D、历史「中国朝代时间线」2D、语文「《天净沙·秋思》意境长卷」2D），作为全组质量基准；
3. **批量生产（CreateWorkflow，dynamic workflow）**：
   - 输入：预编好的资源清单 manifest（每条含标题、学科、学段年级、教材章节知识点、kind、内容要点，对齐人教版目录）；
   - 结构：**一个学科智能体负责一个学科**，三科并行；学科内逐条生产：写 `index.mjs` + 条目 md → 跑 `build + check` → 失败带诊断重试（最多 2 次）→ 通过后落盘，再处理下一条；
   - 外链整理：每科一次智能体调用，联网核对 URL 可达后录入条目；
   - 收尾：全量 build + 总闸门 + 成功/失败清单报告。
4. **发布**：build → wrangler 部署 → curl 线上验证 → git commit；更新 AGENTS.md 与 README（「怎么加一条资源」规范）。

试点资源清单（自产每科 8 个 + 外链每科 15-25 条，共 24 个自产）：

**数学**：正方体展开图（黄金样例）、长方体表面积与体积、三视图与直观图、函数图像变换实验室（y=af(k(x+b))+c 滑块）、二次函数系数与图像、圆周角动态演示、单位圆与三角函数、立体几何截面演示。
**历史**：中国朝代时间线（黄金样例）、秦统一地图演变、丝绸之路路线动态图、青铜器与甲骨文（3D 鼎）、新航路开辟动态地图、中国近代史大事年表 1840-1949、两次世界大战时间线、改革开放历程时间线。
**语文**：《天净沙·秋思》意境长卷（黄金样例）、易错字笔顺对比演示、常见文言实词翻面卡片、修辞手法例句对比演示、文章结构思维导图（写景/写人/议论文）、拼音声母韵母表、标点符号用法决策图、古诗文名句情境填空（月/山/水主题）。

### 阶段 1（其余八科）

第二批 dynamic workflow（英语、科学、物理、化学、生物、地理、道法、信息科技），可分两批放行；物理化学生物地理的 3D 配方在黄金样例阶段扩展。

### 阶段 2（深化）

覆盖矩阵补点、外链巡检自动化、卡片截图预览、按教师反馈排产。

## 9. 质量标准与闸门

`scripts/check_interactives.mjs`（构建后对产物逐项检查，任一不过即失败）：

1. 文件存在且 HTML title 非空；
2. 体积：2D < 100KB，3D < 1MB；
3. 零外部请求：产物内不出现 `http://`、`https://` 资源引用（数据 URI 与纯文本说明除外）；
4. 无 emoji（含常用 emoji Unicode 区段扫描）；
5. 深浅色双主题 CSS 变量齐全、含全屏按钮（template 统一保证）；
6. 无真实学生信息、无隐私数据。

视觉与交互规范（写进 skill，模板统一承载）：投屏字号下限、触摸与鼠标双交互、深浅色跟随站内色板、动画不自动循环干扰讲解（暂停/步进可控）。

### 9.1 教研员契约（2026-10-06 增补，随用户反馈加入）

资源不是「会动的教具」而是「课」。每个自产交互资源页内必须自答教研员三问，由 harness 机器核查四个 DOM 标记：

- `[data-hv-meta]`：定位行（学科·学段年级｜教材版本册次·知识点，≥8 字）——这是什么课的什么点；
- `[data-hv-step]`：教学环节 ≥2 个，点击切换真实预设状态——课堂怎么组织；
- `[data-hv-guide]`：每环节一句教师引导/提问话术，合计 ≥60 字——这一步问什么；
- `[data-hv-summary]`：知识小结 ≥30 字——学生带走什么。

环节与引导语是教学内容而非 UI 装饰，实现范例为 math-cube-nets 的 buildTeachingPanel。此前教训（已固化进流程）：断言必须 NaN 防护；「是否能用」的验收以 harness（报错零容忍 + 主体占比 ≥50%×40% + 教研四规则）为准，图像分析只作辅助且必须用数数式提问。

## 10. 版权与合规

- 只链接不转存第三方材料；PhET 嵌入需署名（CC BY）；GeoGebra 材料只链接（NC 许可）；
- 不收录教材扫描件、付费资源、任何需要账号才能访问的转存内容；
- 自产资源全部程序化生成或自绘，不使用来路不明素材。

## 11. 风险与对策

| 风险 | 对策 |
|---|---|
| 国家平台链接常要求登录或无法深链 | 卡片写检索路径而非死链 |
| 自产资源产能与质量不齐 | 模板 + runtime 收敛公共质量；学科智能体以黄金样例为基准；闸门脚本硬性拦截 |
| 单智能体长任务跑偏 | workflow 内一资源一调用，每次只带当前资源的上下文与诊断 |
| 3D 产物体积膨胀 | tree-shake + 1MB 上限 + 配方沉淀控制 |

## 12. 阶段 0 验收（Definition of Done）

1. 线上 `/resources/` 可访问，覆盖矩阵正确显示三科；
2. 24 个自产资源全部通过闸门，抽样断网双击可打开；
3. 外链条目 ≥ 45 条，全部 https 且标来源；
4. `npm run build` 全绿，`npx wrangler pages deploy dist --project-name=happyvibe` 部署成功，curl 线上 URL 验证；
5. `skills/teaching-interactives/SKILL.md`、AGENTS.md、README 更新完毕；
6. git commit。
