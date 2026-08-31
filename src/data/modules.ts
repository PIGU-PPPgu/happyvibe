export type ModuleSlug =
  | 'basics'
  | 'agent'
  | 'teaching'
  | 'class-management'
  | 'edu-data'
  | 'research'
  | 'creation'
  | 'software';

export interface ModuleMeta {
  slug: ModuleSlug;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  /** 学习方式：sequence=按顺序学 practice=边做边学 browse=按需查阅 */
  mode: 'sequence' | 'practice' | 'browse';
}

export const MODE_LABEL: Record<ModuleMeta['mode'], string> = {
  sequence: '按顺序学',
  practice: '边做边学',
  browse: '按需查阅',
};

/** 模块顺序即全站导航与课程编号顺序（源自 PPT「六大应用方向」内容地图） */
export const MODULES: ModuleMeta[] = [
  {
    slug: 'basics',
    code: 'M0',
    title: '认知入门',
    subtitle: '先把 AI 用对，再谈赋能',
    icon: '>_',
    accent: '#a63d97',
   mode: 'sequence',
  },
  {
    slug: 'agent',
    code: 'M1',
    title: 'AI Agent',
    subtitle: '养一只属于你的电子🦞',
    icon: '🦞',
    accent: '#feb300',
   mode: 'practice',
  },
  {
    slug: 'teaching',
    code: 'M2',
    title: 'AI × 教学',
    subtitle: '备课 · 命题 · 让课堂更有意思',
    icon: '▶',
    accent: '#c25aa8',
   mode: 'browse',
  },
  {
    slug: 'class-management',
    code: 'M3',
    title: 'AI × 班级管理',
    subtitle: '班主任的减负工具箱',
    icon: '▦',
    accent: '#d98e2b',
   mode: 'browse',
  },
  {
    slug: 'edu-data',
    code: 'M4',
    title: 'AI × 教育数据',
    subtitle: '看懂平均分背后的学生',
    icon: '%',
    accent: '#b877b0',
   mode: 'browse',
  },
  {
    slug: 'research',
    code: 'M5',
    title: 'AI × 教研科研',
    subtitle: '课题、文献与成果沉淀',
    icon: '§',
    accent: '#8a2f7d',
   mode: 'browse',
  },
  {
    slug: 'creation',
    code: 'M6',
    title: 'AI × 应用创造',
    subtitle: '会「动嘴」就会 Vibe Coding',
    icon: '</>',
    accent: '#feb300',
   mode: 'practice',
  },
  {
    slug: 'software',
    code: 'M7',
    title: '软件实操教程',
    subtitle: 'Trae · WorkBuddy · DeepSeek Harness 手把手上手',
    icon: '⌘',
    accent: '#e8935e',
   mode: 'practice',
  },
];

export const MODULE_MAP = new Map(MODULES.map((m) => [m.slug, m]));
