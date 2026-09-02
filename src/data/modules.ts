export type ModuleSlug =
  | 'basics'
  | 'teaching'
  | 'class-management'
  | 'edu-data'
  | 'policy'
  | 'research'
  | 'growth'
  | 'creation'
  | 'agent'
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

/**
 * 模块体系严格对应培训 PPT「六大应用方向」：
 * 01 AI×教学  02 AI×班级管理  03 AI×教育数据
 * 04 AI×教研科研  05 AI×教师成长  06 AI×应用创造
 * 「00 认知入门」为先修，「T1/T2」为工具教程区。
 */
export const MODULES: ModuleMeta[] = [
  {
    slug: 'basics',
    code: '00',
    title: '认知入门',
    subtitle: '先修 · 把 AI 用对，再谈赋能',
    icon: '>_',
    accent: '#a63d97',
    mode: 'sequence',
  },
  {
    slug: 'teaching',
    code: '01',
    title: 'AI × 教学',
    subtitle: '智能辅导 · 备课 · 命题 · 个性化学习',
    icon: '▶',
    accent: '#c25aa8',
    mode: 'browse',
  },
  {
    slug: 'class-management',
    code: '02',
    title: 'AI × 班级管理',
    subtitle: '班主任助手 · 家校沟通 · 万事留痕',
    icon: '▦',
    accent: '#d98e2b',
    mode: 'browse',
  },
  {
    slug: 'edu-data',
    code: '03',
    title: 'AI × 教育数据',
    subtitle: '学情分析 · 增值评价 · 数据可视化',
    icon: '%',
    accent: '#b877b0',
    mode: 'browse',
  },
  {
    slug: 'policy',
    code: 'P',
    title: '政策速查',
    subtitle: 'AI 赋能教育的政策依据（全国/广东/深圳）',
    icon: '§',
    accent: '#5f8fb0',
    mode: 'browse',
  },
  {
    slug: 'research',
    code: '04',
    title: 'AI × 教研科研',
    subtitle: '课题研究 · 文献分析 · 成果沉淀',
    icon: '§',
    accent: '#8a2f7d',
    mode: 'browse',
  },
  {
    slug: 'growth',
    code: '05',
    title: 'AI × 教师成长',
    subtitle: '知识库 · 素养学习 · 智能体 · 工作流',
    icon: '✦',
    accent: '#5fb0a0',
    mode: 'practice',
  },
  {
    slug: 'creation',
    code: '06',
    title: 'AI × 应用创造',
    subtitle: 'Vibe Coding · 教学网页 · Skills · 智能教务',
    icon: '</>',
    accent: '#feb300',
    mode: 'practice',
  },
  {
    slug: 'agent',
    code: 'T1',
    title: 'Agent 通识',
    subtitle: '工具区 · 什么是 Agent 与产品横评',
    icon: '◇',
    accent: '#a63d97',
    mode: 'browse',
  },
  {
    slug: 'software',
    code: 'T2',
    title: 'WorkBuddy 实操',
    subtitle: '工具区 · 手把手六课与实战任务',
    icon: '⌘',
    accent: '#e8935e',
    mode: 'sequence',
  },
];

export const MODULE_MAP = new Map(MODULES.map((m) => [m.slug, m]));
