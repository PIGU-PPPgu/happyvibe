# HappyVibe 数智学园 · 设计文档

日期：2026-08-31 ｜ 状态：已经用户确认

## 1. 背景与目标

吴林璋老师（港中深附属道远学校）此前面向集团教师做了两场「数智赋能教育教学」培训（道远版 75 页、时进版 51 页，内容高度重叠，合并处理）。本项目把培训内容转化为一个**长期使用的集团教师学习网站**。

目标：
- 分类清晰，教师可按模块自学
- 站名：HappyVibe 数智学园；口号：「学会"偷懒" = 减负增效」
- 以后新增内容只需写 Markdown 文件

## 2. 内容来源与形态

- 两份 PPT 合并去重：《数智技术赋能教学（道远）》为主干，《数智赋能教育教学（时进）》补充
- 内容形态：**重写结构化图文教程 + 从 PPT 提取的关键截图（webp 压缩）**
- PPT 以图片为主、讲述未落到文字的部分，列出「待补充清单」逐节请作者补文字
- 图片中疑似含真实学生信息的截图，上线前请作者确认/打码（公网站点，隐私优先）

## 3. 信息架构

七大课程模块 + 工具箱（模块源自 PPT「六大应用方向」页，前置入门模块）：

| 模块 | slug | 内容 |
|---|---|---|
| M0 认知入门 | `basics` | AI 赋能理念、AI 使用五阶段、什么时候值得用 AI、AI 为什么难用、Agent 与 LLM 区别、如何选模型 |
| M1 AI Agent | `agent` | 什么是 Agent、为什么养一只🦞、桌面 Agent 组成、大厂 Agent 产品横评（交互表格）、Agent + Obsidian |
| M2 AI × 教学 | `teaching` | 辅助备课、HTML 讲概念 > PPT、让课堂更有意思、思维导图、飞象 skill |
| M3 AI × 班级管理 | `class-management` | "副"班主任、万事留痕 Trace Desk 专题、智能排座 |
| M4 AI × 教育数据 | `edu-data` | 学情分析、增值评价、成绩分析（内容少，待补充） |
| M5 AI × 教研科研 | `research` | 课题生成器 EDU Research Workbench、Agent 做课题 |
| M6 AI × 应用创造 | `creation` | Vibe Coding 入门、IDE 工具、"消费骗局"避坑、关键词与提示词、HTML 解题、Prompt 与 Skill、案例 |
| 工具箱 | `toolbox` | 班主任小工具、好物推荐、Mermaid、飞象 skill、万事留痕小程序等（卡片 + 链接） |

页面：
- 首页 `/`：终端风 hero + 模块入口卡片 + 学习进度概览
- 学习路线图 `/path`：按 PPT 成长路径做 7 站像素进度图（会用 AI → 教学提效 → 场景实践 → 数据分析 → Vibe Coding → 做出作品 → 形成成果），每站链到对应课程，显示完成进度
- 模块列表 `/modules/<slug>/`、课程详情 `/modules/<slug>/<lesson>/`
- 工具箱 `/toolbox/`、关于 `/about/`（内容来源署名 + 更新日志 + 反馈方式）

## 4. 视觉设计（紫金科技代码风，像素点缀）

- 配色基座（CUHK 官方校色体系）：主紫 `#750F6D`（Pantone 255C）、强调金 `#FEB300`（Pantone 117C）
- 深色 only：底色深紫黑 `#150E22` 系（由校色紫色相衍生）、面板 `#1E1433` 系
- 科技代码风为主：终端窗口装饰、hero 打字机动画、JetBrains Mono（代码/英文标签）+ Noto Sans SC（正文）
- 像素风点缀：图标徽章、英文小标签可用像素字体（Fusion Pixel / Press Start 2P）；中文正文不用像素字
- 对比度 WCAG AA；响应式 320–1440px

## 5. 功能

- **全站搜索**：Pagefind 静态索引，`⌘K / Ctrl+K` 唤起，支持中文
- **学习进度**：localStorage（key 前缀 `hv-progress`）；课程页「标记已学」；模块列表与路线图显示完成百分比；无账号体系
- **上一课/下一课**导航；课程 frontmatter 含 `status: draft | ready` 标注内容完整度

## 6. 技术方案（用户已选：方案 A）

- **Astro 5 + TypeScript**，内容集合（content collections + zod schema：title / module / order / description / source / status）
- 样式：原生 CSS 设计令牌（`src/styles/tokens.css`），组件化 Astro 组件
- 图像：python-pptx 提取 PPT media + sharp 压缩 webp
- 搜索：Pagefind（build 后索引）
- 部署：GitHub Pages（GitHub Actions 自动构建）；用户 GitHub 账号 PIGU-PPPgu（待确认）
- 分期：Phase 1 骨架 + 设计系统 + 首页/路线图/工具箱 + M0/M1/M6 核心课程 + 搜索进度 → Phase 2 全量课程与待补充填充 → Phase 3 可选（原 PPT 下载区、反馈区）

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| PPT 截图含真实学生数据 | 提取后逐张排查，疑似敏感的列入清单请作者确认 |
| 讲述内容与图片对不上 | 每课标注 `status: draft`，待补充清单驱动作者校对 |
| 像素字体中文可读性 | 中文一律标准字体，像素字仅英文标签点缀 |
| iCloud 目录路径含空格/中文 | 脚本统一引号处理；git 仓库放在此目录需注意 iCloud 同步冲突，构建产物不进 git |
