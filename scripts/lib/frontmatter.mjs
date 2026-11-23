// Markdown frontmatter 解析（js-yaml，Astro 自带的依赖）
import yaml from 'js-yaml';

/** 返回 { data, body }；没有 frontmatter 时 data 为空对象。 */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  return { data: yaml.load(m[1]) ?? {}, body: text.slice(m[0].length) };
}
