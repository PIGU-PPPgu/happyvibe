export interface PathStation {
  code: string;
  title: string;
  /** 现在的你（PPT 原文） */
  now: string;
  /** 带你做（PPT 原文） */
  do: string;
  /** 你最终能获得（PPT 原文） */
  gain: string;
  /** 对应课程 `module/lesson` */
  lessons: { id: string; title: string }[];
}

/** 七站成长路径，三段式对照严格按培训 PPT「深入了解 VibeCoding」原文 */
export const PATH_STATIONS: PathStation[] = [
  {
    code: '01',
    title: '会用 AI',
    now: 'AI 只会简单问答',
    do: '提问 / 搜索 / 深度研究 / 长文档处理',
    gain: '真正会用 AI，不再只当搜索框',
    lessons: [
      { id: 'basics/five-stages', title: 'AI 使用五阶段' },
      { id: 'basics/why-hard', title: 'AI 为什么越用越难用' },
      { id: 'basics/models-101', title: '模型认知课' },
    ],
  },
  {
    code: '02',
    title: '教学提效',
    now: 'AI 主要帮我写材料',
    do: '备课 · 课件 · 命题 · 作业设计 · 评价量规 · 日常办公',
    gain: '建立自己的 AI 教学工作流',
    lessons: [
      { id: 'basics/when-to-use', title: '什么时候值得用 AI' },
      { id: 'teaching/lesson-prep', title: 'AI 辅助备课' },
    ],
  },
  {
    code: '03',
    title: '场景实践',
    now: '资料很多，用不起来',
    do: '整理教材 · 课标 · 教案 · 论文，搭建个人 / 学科 AI 知识库',
    gain: '拥有自己的 AI 教学知识库',
    lessons: [
      { id: 'growth/knowledge-base', title: '个人知识库（Obsidian）' },
      { id: 'class-management/co-teacher', title: '「副」班主任' },
      { id: 'teaching/fun-class', title: '让课堂更有意思' },
    ],
  },
  {
    code: '04',
    title: '数据分析',
    now: '有数据，只会看平均分',
    do: '成绩 · 问卷 · 作业 · 错题数据，AI 分析 · 学情诊断 · 可视化',
    gain: '能做教育数据分析，看懂学生真实变化',
    lessons: [
      { id: 'edu-data/grade-analysis', title: '成绩分析与增值评价' },
      { id: 'class-management/trace-desk', title: '万事留痕 Trace Desk' },
    ],
  },
  {
    code: '05',
    title: 'Vibe Coding',
    now: '有想法，但不会开发',
    do: '学习 Vibe Coding，用自然语言和 AI 完成网页 / 工具 / 原型',
    gain: '掌握一句话做应用的的能力',
    lessons: [
      { id: 'creation/vibe-coding-intro', title: 'Vibe Coding 入门' },
      { id: 'creation/vibe-101-anatomy', title: '解剖一个网页' },
      { id: 'creation/html-solving', title: '用 HTML 解题' },
    ],
  },
  {
    code: '06',
    title: '做出作品',
    now: '学了这么多，还没产出',
    do: '带着真实任务动手：班级主页 / 学科课件 / 小工具',
    gain: '自己做出 AI 教育小应用',
    lessons: [
      { id: 'software/task-subject-website', title: '任务一 · 学科主题网站（真实跑通）' },
      { id: 'creation/subject-task', title: '学科课件任务' },
    ],
  },
  {
    code: '07',
    title: '形成成果',
    now: '实践很多，成果零散',
    do: '真实问题立项 · 案例沉淀 · 项目打磨',
    gain: '课例 / 课题 / 论文，形成自己的 AI 教育成果',
    lessons: [
      { id: 'research/topic-generator', title: '课题生成器' },
      { id: 'growth/skill-use', title: 'Skill 的使用与迁移' },
    ],
  },
];
