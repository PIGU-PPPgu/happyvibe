// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 项目站部署时用 PUBLIC_BASE=/happyvibe/ 构建；Vercel/根域名留空即可
const base = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: process.env.PUBLIC_SITE || 'https://pigupppgu.github.io',
  base,
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
});
