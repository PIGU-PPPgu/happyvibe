# AGENTS.md — AI 协作说明

本仓库是 HappyVibe 数智学园（集团教师 AI 学习站），Astro 5 静态站，部署在 Cloudflare Pages（https://happyvibe.intelliedu.cc）。

## 给 AI 助手的必读规则

1. **做教程配图 / 录操作 GIF / 标注截图 / 发布更新** → 先读 `skills/tutorial-visuals/SKILL.md`，严格按其中流水线与视觉规范执行
2. **图表分工规则**：
   - **思维导图 / 路线图 / 全景图 → 用 Mermaid**。站内已支持渲染：markdown/页面里写 ` ```mermaid ` 代码块，页面引入 `src/components/Mermaid.astro` 即可（课程页按 `body.includes('```mermaid')` 按需加载）。主题跟随站内深浅色，写在 Mermaid.astro 的 themeVariables 里
   - **架构图 / 流程图 / 时序图 / 数据流图 → 用 archify**（`skills/archify/`，源自 github.com/tt-a1i/archify，MIT）：按 `skills/archify/SKILL.md` 写类型化 JSON → `node skills/archify/bin/archify.mjs validate <type> <json> --quality showcase` 全绿 → `deliver <type> <json> <输出.html> --quality showcase`。产物是单文件交互 HTML（动画 trace / 搜索 / 聚焦 / 演示模式 F），放 `public/interactives/`，页面用 iframe 嵌入并配「全屏打开」链接；引用路径去掉 `.html` 后缀（Pages 会 308 跳转）。`meta.locale` 用 `zh-CN`
   - 用户点名要哪种就用哪种，不重复造图
3. 课程内容在 `src/content/lessons/<模块>/<课>.md`，规范见 README「怎么加一节新课」
4. 所有视觉产出遵循：傻瓜式步骤（精确到按钮）、图文并茂、无 emoji、大字号、隐私安全（真实学生信息不上线）
5. **文风红线（AI-isms 清单）**——以下模式一律禁止，出现即重写：
   - 按钮/导航/标题后加解释性括号（如「比赛专区（报名截止）」→ 只写「比赛专区」）
   - 填充词：扫码即得 / 一键直达 / 今天学今天用 / 轻松搞定 / 一看就会
   - 替读者下结论（「这就是满分答案」「堪称完美」）——事实说完就停
   - 三段式排比、强行升华的结尾、「值得注意的是」开头
   - 解释只出现在正文段落里；按钮/标题/导航/徽章 = 干净的名字
6. 每次内容改动收尾必须：`npm run build` → `npx wrangler pages deploy dist --project-name=happyvibe`（带 CF 环境变量）→ curl 线上 URL 验证 → git commit

## 关键脚本

| 脚本 | 用途 |
|---|---|
| `scripts/make_tutorial_gif.py` | 教程 GIF 加工（聚焦放大/波纹/高亮/字幕条）+ 静态图红框箭头标注（annotate） |
| `scripts/build_material_packs.py` | 15 学科材料包生成（含二维码，MATERIALS_BASE_URL 可换域名） |
| `scripts/build_m0_visuals.py` / `build_teaching_visuals.py` | 教学示意图生成（紫金风格） |
| `scripts/extract_ppt.py` / `contact_sheet.py` / `build_lesson_images.mjs` | PPT 图片提取/审阅/压缩 |

## 站点事实

- 正式地址：https://happyvibe.intelliedu.cc（Cloudflare Pages，项目名 happyvibe，主分支 main 自动为生产）
- 本地开发：`npm run dev`；构建：`npm run build`（含 Pagefind 索引）
- 搜索/进度/主题切换均为零依赖原生实现，改动前读 `src/lib/progress.ts` 与 `src/styles/tokens.css`（浅色主题变量在 `:root[data-theme='light']`）
