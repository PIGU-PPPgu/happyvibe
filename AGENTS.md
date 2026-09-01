# AGENTS.md — AI 协作说明

本仓库是 HappyVibe 数智学园（集团教师 AI 学习站），Astro 5 静态站，部署在 Cloudflare Pages（https://happyvibe.intelliedu.cc）。

## 给 AI 助手的必读规则

1. **做教程配图 / 录操作 GIF / 标注截图 / 发布更新** → 先读 `skills/tutorial-visuals/SKILL.md`，严格按其中流水线与视觉规范执行
2. 课程内容在 `src/content/lessons/<模块>/<课>.md`，规范见 README「怎么加一节新课」
3. 所有视觉产出遵循：傻瓜式步骤（精确到按钮）、图文并茂、无 emoji、大字号、隐私安全（真实学生信息不上线）
4. 每次内容改动收尾必须：`npm run build` → `npx wrangler pages deploy dist --project-name=happyvibe`（带 CF 环境变量）→ curl 线上 URL 验证 → git commit

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
