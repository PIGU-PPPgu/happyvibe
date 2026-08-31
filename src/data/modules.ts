export type ModuleSlug =
  | 'basics'
  | 'agent'
  | 'teaching'
  | 'class-management'
  | 'edu-data'
  | 'research'
  | 'creation';

export interface ModuleMeta {
  slug: ModuleSlug;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
}

/** 模块顺序即全站导航与课程编号顺序（源自 PPT「六大应用方向」内容地图） */
export const MODULES: ModuleMeta[] = [
  {
    slug: 'basics',
    code: 'M0',
    title: '认知入门',
    subtitle: '先把 AI 用对，再谈赋能',
    icon: '>_',
    accent: '#a63d97',
  },
  {
    slug: 'agent',
    code: 'M1',
    title: 'AI Agent',
    subtitle: '养一只属于你的电子🦞',
    icon: '🦞',
    accent: '#feb300',
  },
  {
    slug: 'teaching',
    code: 'M2',
    title: 'AI × 教学',
    subtitle: '备课 · 命题 · 让课堂更有意思',
    icon: '▶',
    accent: '#c25aa8',
  },
  {
    slug: 'class-management',
    code: 'M3',
    title: 'AI × 班级管理',
    subtitle: '班主任的减负工具箱',
    icon: '▦',
    accent: '#d98e2b',
  },
  {
    slug: 'edu-data',
    code: 'M4',
    title: 'AI × 教育数据',
    subtitle: '看懂平均分背后的学生',
    icon: '%',
    accent: '#b877b0',
  },
  {
    slug: 'research',
    code: 'M5',
    title: 'AI × 教研科研',
    subtitle: '课题、文献与成果沉淀',
    icon: '§',
    accent: '#8a2f7d',
  },
  {
    slug: 'creation',
    code: 'M6',
    title: 'AI × 应用创造',
    subtitle: '会「动嘴」就会 Vibe Coding',
    icon: '</>',
    accent: '#feb300',
  },
];

export const MODULE_MAP = new Map(MODULES.map((m) => [m.slug, m]));
