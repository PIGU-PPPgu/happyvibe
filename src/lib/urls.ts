/** 统一处理 base 前缀（GitHub Pages 项目站 / 根域名部署均可） */
export const withBase = (path: string): string => {
  const raw = import.meta.env.BASE_URL;
  const base = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};
