// Skill 评价标准 · 唯一数据源
// 评价标准页、技能详情页、评分算法（src/lib/skillScore.ts）、校验脚本共用这一份。
// 规则出处：docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md §3
// 改这里等于改标准，必须同时记一笔 STANDARD.changes。

export type DimKey = 'value' | 'quality' | 'ease' | 'edu' | 'safety';

export type CategoryKey =
  | 'lesson-plan'
  | 'assignment'
  | 'analysis'
  | 'courseware'
  | 'home-school'
  | 'class-management'
  | 'research'
  | 'office';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'termly';

export type Anchor = Record<'1' | '2' | '3' | '4' | '5', string>;

export interface DimDef {
  key: DimKey;
  label: string;
  weight: number;
  question: string;
  anchors: Anchor;
}

/** 五个维度。权重合计 100。 */
export const DIMS: readonly DimDef[] = [
  {
    key: 'value',
    label: '省时',
    weight: 25,
    question: '这活我多久干一次，用了少改多少',
    anchors: {
      '1': '不比不装技能好，或改得更多',
      '2': '每学期一次的活；或不装技能直接问已经够好',
      '3': '每月一两次的活，修改处数少了一些',
      '4': '每日或每周都做的活，修改处数少了一些；或每月一两次的活，少了一半以上',
      '5': '每日或每周都做的活，修改处数比不装技能少一半以上',
    },
  },
  {
    key: 'quality',
    label: '出活',
    weight: 25,
    question: '出来的东西能不能直接交',
    anchors: {
      '1': '三轮里有两处以上严重错误；或检查单通过不足四成',
      '2': '有一处严重错误；或检查单通过不足六成',
      '3': '检查单通过六成以上，没有严重错误',
      '4': '检查单通过八成以上，平均改不超过四处，没有严重错误',
      '5': '检查单通过九成以上，平均只改一两处，没有严重错误',
    },
  },
  {
    key: 'ease',
    label: '好上手',
    weight: 20,
    question: '我装得上、叫得动吗',
    anchors: {
      '1': '必须付费才能用',
      '2': '三项及以上拖累，或一次都没触发；或必须自备密钥',
      '3': '两项拖累；或三次里只触发一次',
      '4': '有一项拖累：步骤超过三步、要装运行环境或联网、三次里触发两次，或功能略有缺失',
      '5': '三步内装好，三次都触发，不要密钥不花钱，WorkBuddy 上功能完整',
    },
  },
  {
    key: 'edu',
    label: '懂教育',
    weight: 15,
    question: '它懂教材、课标和学校规矩吗',
    anchors: {
      '1': '教育项通过不足三成；或有违反教育规矩的输出',
      '2': '教育项通过三成以上',
      '3': '教育项通过一半以上；或教育项都过了但抽检只对三分之一',
      '4': '教育项通过四分之三以上，抽检至少对三分之二',
      '5': '教育项通过九成以上，教材章节抽检全对',
    },
  },
  {
    key: 'safety',
    label: '放心用',
    weight: 15,
    question: '学生信息和我的数据安全吗',
    anchors: {
      '1': '不出现于已收录技能，触碰红线的技能不收录',
      '2': '有外联但说明书没写；或读取范围超过用途所需',
      '3': '需要密钥或登录授权；或把学生信息存在本机文件里',
      '4': '有外联，但说明书里写明了去哪、做什么',
      '5': '不联网、不要密钥、不存学生信息，读取范围与用途相符',
    },
  },
];

/** 档位。min 降序。 */
export const TIERS: readonly { min: number; label: string; meaning: string }[] = [
  { min: 9, label: '必装', meaning: '对口就该装' },
  { min: 8, label: '好用', meaning: '有小瑕疵' },
  { min: 7, label: '可用', meaning: '有明确短板，看短板再定' },
  { min: 6, label: '勉强', meaning: '没得选时再用' },
  { min: 0, label: '不推荐', meaning: '不进正库，进「测过不收」清单并写明原因' },
];

/** 红线：碰任何一条都不收，不看总分。 */
export const RED_LINES: readonly string[] = [
  '索取学生实名、成绩等信息并外传，或无提醒地长期保存。',
  '脚本会删用户文件、读取凭据、向没说明的地址外发数据，或代码混淆。',
  '不声明就得付费，或是第三方接口的推广壳。',
  '生成公开排名、给学生贴标签等违规输出，且没有任何边界说明。',
  '说明书里藏着与用途无关的指令。',
];

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  icon: string;
  /** 对应的课程模块 slug */
  module: string;
}

/** 八个品类。 */
export const CATEGORIES: readonly CategoryDef[] = [
  { key: 'lesson-plan', label: '备课教案', icon: '▤', module: 'teaching' },
  { key: 'assignment', label: '命题作业', icon: '≡', module: 'teaching' },
  { key: 'analysis', label: '学情分析', icon: '%', module: 'edu-data' },
  { key: 'courseware', label: '课件', icon: '▣', module: 'teaching' },
  { key: 'home-school', label: '家校沟通', icon: '@', module: 'class-management' },
  { key: 'class-management', label: '班级管理', icon: '▦', module: 'class-management' },
  { key: 'research', label: '教研课题', icon: '§', module: 'research' },
  { key: 'office', label: '公文事务', icon: '¶', module: 'class-management' },
];

export interface CheckItem {
  id: string;
  /** Q 计入出活，E 计入懂教育 */
  kind: 'Q' | 'E';
  /** 规矩项：有一条不过，懂教育直接记 1 分 */
  rule?: boolean;
  text: string;
}

/**
 * 品类检查单。只有定稿的品类才有；某品类第一个技能入库前必须先定检查单。
 * 校验脚本强制：没有检查单的品类不得有「已实测」条目。
 */
export const CHECKLISTS: Partial<Record<CategoryKey, readonly CheckItem[]>> = {
  'lesson-plan': [
    { id: 'LP1', kind: 'E', text: '教材版本、册别、章节号与课题和老师给的一致' },
    { id: 'LP2', kind: 'E', text: '教学目标可观测，写的是学生能做什么' },
    { id: 'LP3', kind: 'E', text: '有重难点，且写了突破办法' },
    { id: 'LP4', kind: 'E', text: '预设易错点，每个都写了学生为什么错、老师怎么应对' },
    { id: 'LP5', kind: 'E', text: '环节时间加起来等于课时长度' },
    { id: 'LP6', kind: 'E', text: '每个环节都有学生活动' },
    { id: 'LP7', kind: 'E', text: '作业或练习有分层' },
    { id: 'LP8', kind: 'E', text: '有当堂检测，题目对应本课目标' },
    { id: 'LP9', kind: 'Q', text: '内容具体到这一课，换个课题不能直接套用' },
    { id: 'LP10', kind: 'Q', text: '事实、公式、引用无误' },
    { id: 'LP11', kind: 'Q', text: '是学校教案的常见结构，能直接誊写或打印' },
    { id: 'LP12', kind: 'Q', text: '一课时教案 1 到 2 页，没有大段空话' },
  ],
  assignment: [
    { id: 'AS1', kind: 'E', text: '不超出所给学段和教材范围' },
    { id: 'AS2', kind: 'E', text: '有难度梯度' },
    { id: 'AS3', kind: 'E', text: '覆盖要求的知识点；出卷时有双向细目表' },
    { id: 'AS4', kind: 'E', text: '题干情境贴近学生生活' },
    { id: 'AS5', kind: 'E', rule: true, text: '不抄录统考真题原题，引用真题时注明出处' },
    { id: 'AS6', kind: 'Q', text: '答案正确，解析与题干一致' },
    { id: 'AS7', kind: 'Q', text: '题干自洽：条件充分、无歧义、数据合理' },
    { id: 'AS8', kind: 'Q', text: '能直接打印：题号连续、留有答题空间' },
    { id: 'AS9', kind: 'Q', text: '没有重复题或换数字的重复题' },
  ],
  analysis: [
    { id: 'AN1', kind: 'E', text: '写明数据口径：人数、科目、满分、缺失值处理' },
    { id: 'AN2', kind: 'E', rule: true, text: '不出现学生真实姓名和公开排名' },
    { id: 'AN3', kind: 'E', text: '结论有数字支撑，能回溯到表里的数据' },
    { id: 'AN4', kind: 'E', rule: true, text: '不给学生贴标签' },
    { id: 'AN5', kind: 'E', text: '建议具体可执行：讲评先讲哪几题、哪些知识点' },
    { id: 'AN6', kind: 'Q', text: '计算正确：平均分、及格率、优秀率、得分率抽样复核' },
    { id: 'AN7', kind: 'Q', text: '概况、问题、建议三部分能一眼找到' },
    { id: 'AN8', kind: 'Q', text: '篇幅适中，没有复述整张成绩表' },
  ],
  'home-school': [
    { id: 'HS1', kind: 'E', text: '语气尊重，没有指责性表述' },
    { id: 'HS2', kind: 'E', rule: true, text: '不公开比较学生，不点名批评' },
    { id: 'HS3', kind: 'E', text: '关键信息齐全且前后一致' },
    { id: 'HS4', kind: 'E', text: '给家长的建议具体可做' },
    { id: 'HS5', kind: 'Q', text: '称谓、落款、日期符合学校书信格式' },
    { id: 'HS6', kind: 'Q', text: '字数符合老师要求' },
    { id: 'HS7', kind: 'Q', text: '没有错别字和语病' },
    { id: 'HS8', kind: 'Q', text: '发出前不需要老师改动' },
  ],
};

export interface TaskDef {
  id: string;
  category: CategoryKey;
  /** main 主任务，每个技能跑 3 次；second 副任务，跑 1 次 */
  role: 'main' | 'second';
  /** 同品类有多道主任务时用来说明分工 */
  note?: string;
  frequency: Frequency;
  prompt: string;
  /** 测试输入文件，站内路径 */
  attach?: string;
}

/** 固定测试任务。同品类的技能用同一道任务，分数才可比。 */
export const TASKS: readonly TaskDef[] = [
  {
    id: 'LP-1', category: 'lesson-plan', role: 'main', frequency: 'daily',
    prompt: '我是初一数学老师，教材是北师大版。请帮我设计七年级上册第二章 2.2 数轴第 1 课时的教案，45 分钟，班级 45 人。',
  },
  {
    id: 'LP-2', category: 'lesson-plan', role: 'second', frequency: 'daily',
    prompt: '请做人教版八年级下册第十九章 19.1.1 变量与函数第 1 课时的教案，45 分钟。',
  },
  {
    id: 'EX-1', category: 'assignment', role: 'main', frequency: 'monthly',
    prompt: '请出一份人教版八年级下册《一次函数》单元测试卷，满分 100 分，时间 45 分钟，附答案解析和双向细目表。',
  },
  {
    id: 'HW-1', category: 'assignment', role: 'main', note: '错题辅导', frequency: 'daily',
    prompt: '孩子读初一，这道题做错了：数轴上点 A 表示的数是 −3，点 B 表示的数是 2，求 A、B 两点间的距离。孩子写的是 1。请先讲清错在哪，再出 3 道变式题并给答案。',
  },
  {
    id: 'AN-1', category: 'analysis', role: 'main', frequency: 'monthly',
    prompt: '这是我们班期中三科成绩，请分析班级学情，给出讲评重点。',
    attach: '/skill-tasks/grade-sample.csv',
  },
  {
    id: 'HS-1', category: 'home-school', role: 'main', frequency: 'monthly',
    prompt: '期中考试刚结束，请帮我给全班家长写一封信，400 字左右：说明整体情况（不排名、不点名）、给家长三条家庭配合建议、通知下周四晚上 7 点开家长会。语气亲切。',
  },
];

/** 测试流程，评价标准页画成流程图。 */
export const PROTOCOL: readonly { title: string; detail: string }[] = [
  { title: '候选', detail: '来源限 SkillHub 教育学习分类的逐条挑选、明确开源的 GitHub 仓库、教师投稿' },
  { title: '隔离下载', detail: '每个技能放独立空目录，只读不执行' },
  { title: '静态审查', detail: '通读全部文件，脚本扫描外联、删除、动态执行、凭据、提权、隐藏指令，核对许可证' },
  { title: '转载判定', detail: 'MIT、Apache-2.0 等明确开源许可的镜像，否则只评不转' },
  { title: '装进 WorkBuddy', detail: '把技能目录放进本机技能目录，用完移除' },
  { title: '实测', detail: 'WorkBuddy 桌面版，每次新会话，主任务 3 次，有副任务的品类加 1 次' },
  { title: '定分', detail: '按规则从记录算出五个维度，填检查单与修改处清单' },
  { title: '入库', detail: '写条目、评测档案、技能包，构建，截图目检' },
  { title: '复测', detail: '上游更新后重跑；评测超过 6 个月标「待复测」' },
];

/** 五条规矩。 */
export const RULES: readonly string[] = [
  '没实测不出分。只做过静态审查的条目是「待测」，进候选池，不显示分数。',
  '每份评分写明评测日期、技能版本、所用 Agent 与模型。',
  '「AI 代测」与「教师试用」是两种证据，各自有各自的标记，不混为一谈。',
  '没截图亲眼看过的输出不算测过。',
  '一次只评一个技能，不批量套模板。',
];

/** 口径说明，评价标准页展示。 */
export const TERMS: readonly { term: string; meaning: string }[] = [
  { term: '修改处', meaning: '老师必须改动才能用的一处。错别字一句算一处；缺一个必备栏目算一处；一段空话算一处。每处在评测档案里列出来。' },
  { term: '严重错误', meaning: '老师没发现就会交上去的错误，如公式算错、编造课标条目、数据对不上。' },
  { term: '触发', meaning: '不点名技能，只按老师平时说话的方式发出任务，技能被调用记为触发。' },
  { term: 'baseline', meaning: '不装技能，同一任务、同一模型、新会话跑一次，作为「不装技能」的对照。' },
];

export const STANDARD = {
  version: '1.0',
  date: '2026-11-24',
  changes: ['1.0（2026-11-24）：首版。五个维度与权重、分数规则、四份品类检查单、六道固定任务。'] as string[],
};
