// @ts-check
import { defineConfig } from 'astro/config';
import { visit } from 'unist-util-visit';

// GitHub Pages 项目站部署时用 PUBLIC_BASE=/happyvibe/ 构建；Vercel/根域名留空即可
const base = process.env.PUBLIC_BASE || '/';

/** Markdown 里的绝对路径图片加上 base 前缀（GitHub Pages 项目站必需） */
function remarkBaseImages() {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url.startsWith('/')) node.url = `${prefix}${node.url}`;
    });
  };
}

export default defineConfig({
  site: process.env.PUBLIC_SITE || 'https://pigupppgu.github.io',
  base,
  trailingSlash: 'ignore',
  markdown: {
    remarkPlugins: [remarkBaseImages],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
