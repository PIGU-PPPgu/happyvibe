# HappyVibe 数智学园

集团教师 AI 赋能学习站 —— 由「数智赋能教育教学」系列培训 PPT 整理而成。

**学会「偷懒」 = 减负增效**

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/（含 Pagefind 搜索索引）
npm run preview    # 本地预览构建结果
```

## 怎么加一节新课（最重要）

在 `src/content/lessons/<模块目录>/` 下新建一个 `.md` 文件：

```md
---
title: 课程标题
module: basics          # basics / agent / teaching / class-management / edu-data / research / creation
order: 7                # 模块内序号
description: 一句话简介（会显示在列表和搜索里）
source: 道远 PPT S30-31
status: ready           # ready = 已校对；draft = 内容校对中（页面会显示徽章）
---

正文用 Markdown 写，图片放 public/images/lessons/ 后引用：
![说明](/images/lessons/xxx.webp)
```

保存后重新构建发布即可，导航、搜索、进度自动收录。

## 怎么加一条教学资源（资源库）

1. 写资源本体：`src/interactives/<学科>/<名>/` 下 `index.mjs`（入口，用 `_shared/runtime.mjs` 的 `init`）+ `meta.json`（`{"title":"中文名","hint":"一句操作提示"}`）
2. 写条目：`src/content/resources/<学科>/<名>.md`（frontmatter 照任一黄金样例，如 `src/content/resources/math/math-cube-nets.md`）
3. `npm run build:interactives && npm run check:interactives` 六项全过（命令后可加资源名单独构建校验），再 `npm run build` 看页面

规范细节（形态选择、视觉红线、事实校验）见 `skills/teaching-interactives/SKILL.md`。

## 部署

- **GitHub Pages（默认）**：推送到 GitHub 仓库 main 分支，Actions 自动构建发布（见 `.github/workflows/deploy.yml`）。仓库设置 → Pages → Source 选 **GitHub Actions**。项目站会自动以仓库名作为 base 路径构建。
- **Vercel**：导入仓库即可，构建命令 `npm run build`，输出目录 `dist`，无需配置 base。

## 目录速览

```
src/content/lessons/   课程（Markdown）
src/content/tools/     工具箱条目
src/content/resources/ 教学资源条目（K12 资源库）
src/interactives/      教学交互资源源码（构建产物为单文件 HTML）
src/data/modules.ts    模块定义
src/data/path.ts       学习路线图七站
public/images/lessons/ 课程截图（webp）
public/interactives/   交互资源构建产物（单文件 HTML，gitignore）
docs/                  设计文档、计划、隐私清单、待补充清单
scripts/               构建/校验/图片脚本
```

## 内容维护约定

- 涉及真实学生信息的截图一律不上线（见 `docs/图片待确认清单.md`）
- 未校对的课程 `status: draft`，页面显示「内容校对中」
- 内容仅供集团内部学习交流
