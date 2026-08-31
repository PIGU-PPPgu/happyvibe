export interface PathStation {
  code: string;
  title: string;
  desc: string;
  /** 对应课程 `module/lesson` */
  lessons: { id: string; title: string }[];
}

/** 七站成长路径，源自培训 PPT「深入了解 VibeCoding」成长路径图 */
export const PATH_STATIONS: PathStation[] = [
  {
    code: '01',
    title: '会用 AI',
    desc: '不再只当搜索框：提问、搜索、深度研究、长文档处理',
    lessons: [
      { id: 'basics/five-stages', title: 'AI 使用五阶段' },
      { id: 'basics/why-hard', title: 'AI 为什么越用越难用' },
      { id: 'basics/choose-model', title: '如何选「脑子」' },
    ],
  },
  {
    code: '02',
    title: '教学提效',
    desc: 'AI 主要帮我写材料：备课、课件、命题、作业设计、日常办公',
    lessons: [
      { id: 'basics/when-to-use', title: '什么时候值得用 AI' },
      { id: 'teaching/lesson-prep', title: 'AI 辅助备课' },
    ],
  },
  {
    code: '03',
    title: '场景实践',
    desc: '班级管理与课堂场景落地：副班主任、交互课堂',
    lessons: [
      { id: 'class-management/co-teacher', title: '「副」班主任' },
      { id: 'teaching/fun-class', title: '让课堂更有意思' },
    ],
  },
  {
    code: '04',
    title: '数据分析',
    desc: '有数据不再只看平均分：学情诊断、增值评价、可视化',
    lessons: [
      { id: 'edu-data/grade-analysis', title: '成绩分析与增值评价' },
      { id: 'class-management/trace-desk', title: '万事留痕 Trace Desk' },
    ],
  },
  {
    code: '05',
    title: 'Vibe Coding',
    desc: '用自然语言和 AI 完成网页、工具、原型',
    lessons: [
      { id: 'creation/vibe-coding-intro', title: 'Vibe Coding 入门' },
      { id: 'creation/html-solving', title: '用 HTML 解题' },
    ],
  },
  {
    code: '06',
    title: '做出作品',
    desc: '自己做出 AI 教育小应用，解决真实痛点',
    lessons: [
      { id: 'creation/case-study', title: '实战案例：固化的 Skill' },
      { id: 'creation/consumption-traps', title: '「消费骗局」避坑' },
    ],
  },
  {
    code: '07',
    title: '形成成果',
    desc: '课例、课题、论文、成果展示——把经验沉淀为影响力',
    lessons: [
      { id: 'research/topic-generator', title: '课题生成器' },
      { id: 'creation/prompt-vs-skill', title: 'Prompt 与 Skill' },
    ],
  },
];
