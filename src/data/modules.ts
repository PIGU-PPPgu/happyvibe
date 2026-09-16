export type ModuleSlug = 'start' | 'teaching' | 'tools';

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

export const MODULES: ModuleMeta[] = [
  {
    slug: 'start',
    code: '00',
    title: '起点',
    subtitle: '认识这个站，发出你给 AI 的第一句话',
    icon: '◈',
    accent: '#feb300',
    mode: 'sequence',
  },
  {
    slug: 'teaching',
    code: '01',
    title: '教学实战',
    subtitle: '示例课：教学设计、期末评语两条产线',
    icon: '▶',
    accent: '#c77dff',
    mode: 'sequence',
  },
  {
    slug: 'tools',
    code: '02',
    title: '工具与脚本',
    subtitle: '哪些活适合交给脚本，怎么开第一枪',
    icon: '▦',
    accent: '#7ce38b',
    mode: 'browse',
  },
];

export const MODULE_MAP = new Map(MODULES.map((m) => [m.slug, m]));
