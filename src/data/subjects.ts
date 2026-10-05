export const SUBJECT_SLUGS = [
  'chinese', 'math', 'english', 'science', 'physics',
  'chemistry', 'biology', 'geography', 'history', 'politics', 'it',
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export interface SubjectMeta {
  slug: SubjectSlug;
  name: string;
  icon: string;
  accent: string;
  /** 适用年级范围（1-12） */
  grades: [number, number];
}

export const SUBJECTS: SubjectMeta[] = [
  { slug: 'chinese',   name: '语文',          icon: '语', accent: '#FF8FA3', grades: [1, 12] },
  { slug: 'math',      name: '数学',          icon: '数', accent: '#6EC1FF', grades: [1, 12] },
  { slug: 'english',   name: '英语',          icon: '英', accent: '#7CE38B', grades: [1, 12] },
  { slug: 'science',   name: '科学',          icon: '科', accent: '#FFA45C', grades: [1, 6] },
  { slug: 'physics',   name: '物理',          icon: '物', accent: '#9D8CFF', grades: [8, 12] },
  { slug: 'chemistry', name: '化学',          icon: '化', accent: '#FEB300', grades: [9, 12] },
  { slug: 'biology',   name: '生物',          icon: '生', accent: '#66D9A8', grades: [7, 12] },
  { slug: 'geography', name: '地理',          icon: '地', accent: '#4FC3F7', grades: [7, 12] },
  { slug: 'history',   name: '历史',          icon: '史', accent: '#E0A96D', grades: [7, 12] },
  { slug: 'politics',  name: '道德与法治',     icon: '法', accent: '#C77DFF', grades: [1, 12] },
  { slug: 'it',        name: '信息科技',       icon: '信', accent: '#8FBC8F', grades: [1, 12] },
];

export const STAGES = [
  { key: 'primary', label: '小学', grades: [1, 6] },
  { key: 'junior', label: '初中', grades: [7, 9] },
  { key: 'senior', label: '高中', grades: [10, 12] },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

export function gradeToStage(g: number): StageKey {
  if (g <= 6) return 'primary';
  if (g <= 9) return 'junior';
  return 'senior';
}

export function subjectBySlug(slug: string): SubjectMeta | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}
