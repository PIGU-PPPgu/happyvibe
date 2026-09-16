# AGENTS.md — AI 协作说明（开源框架仓）

HappyVibe for Teachers：Astro 5 静态站，教师学习站开源框架。

- 课程内容在 `src/content/lessons/<模块>/<课>.md`，模块注册在 `src/data/modules.ts`，工具在 `src/content/tools/`
- 全部交互零依赖原生实现，改动前读 `src/lib/progress.ts` 与 `src/styles/tokens.css`（浅色主题变量在 `:root[data-theme='light']`）
- 数据看板走 `functions/api/analytics.js`（Cloudflare Pages Function），Token 在环境变量，不进代码
- 收尾流程：`npm run build` → 部署（Cloudflare Pages 或 GitHub Pages workflow）→ curl 验证内容（不能只看 200）→ git commit
- 文风：无 emoji、无填充词、按钮标题导航保持干净名字、解释写在正文段落
