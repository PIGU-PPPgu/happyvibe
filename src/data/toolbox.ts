/** 工具箱分类（轮播卡 / 吸顶分类条 / 卡片网格共用） */
export const TOOLBOX_CATS = [
  { key: 'class',    code: '01', label: '班级管理',        icon: '▦',   desc: '班主任工具 + 留痕 + 排座',    accent: '#FEB300' },
  { key: 'teaching', code: '02', label: '教学',            icon: '▶',   desc: '课件 + 中考题 + 上课提醒',    accent: '#C77DFF' },
  { key: 'agent',    code: '03', label: 'Agent / 知识库',  icon: '◇',   desc: 'Obsidian + WorkBuddy',       accent: '#7CE38B' },
  { key: 'skill',    code: '04', label: 'Skill / 脚本',    icon: '◈',   desc: '画图 + 飞象 + Mermaid',       accent: '#6EC1FF' },
  { key: 'creation', code: '05', label: '创作辅助',        icon: '</>', desc: '网页工具 + 练习册 + 课件',    accent: '#FF8FA3' },
  { key: 'design',   code: '06', label: '设计美学',        icon: '✦',   desc: '配色 + 图标 + 站酷 + shadcn', accent: '#9D8CFF' },
  { key: 'learn',    code: '07', label: '进阶学习',        icon: '»',   desc: 'easy-vibe + MDN + Dify',     accent: '#FFA45C' },
] as const;

export type ToolboxCat = (typeof TOOLBOX_CATS)[number];
