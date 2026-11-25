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

/** 需要做教材章节抽检的品类。 */
export const TEXTBOOK_CATEGORIES: readonly CategoryKey[] = ['lesson-plan', 'assignment'];

/** 允许镜像到站内的许可证。不在这个清单里的只评不转。 */
export const MIRROR_LICENSES: readonly string[] = [
  'MIT', 'MIT-0', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC-BY-4.0',
];

export interface CheckItem {
  id: string;
  /** Q 计入出活，E 计入懂教育 */
  kind: 'Q' | 'E';
  /** 规矩项：有一条不过，懂教育直接记 1 分 */
  rule?: boolean;
  text: string;
  /** 判法：怎么算过、怎么算不过。评审提示里带上，同一份产出不同轮次的松紧才一样。 */
  how: string;
}

/**
 * 品类检查单。只有定稿的品类才有；某品类第一个技能入库前必须先定检查单。
 * 校验脚本强制：没有检查单的品类不得有「已实测」条目。
 */
export const CHECKLISTS: Partial<Record<CategoryKey, readonly CheckItem[]>> = {
  'lesson-plan': [
    { id: 'LP1', kind: 'E', text: '教材版本、册别、章节号与课题和老师给的一致', how: '版本、册别、章节号、课题四项都与任务给的一样才算过。成品自己声明是按别的版本或旧版章节编排的，不过。' },
    { id: 'LP2', kind: 'E', text: '教学目标可观测，写的是学生能做什么', how: '每条目标都能看出学生要做到的具体行为，如说出、画出、判断、计算。只写经历、体会、感受、培养这类看不出行为的说法，又没有可观测的补充，不过。' },
    { id: 'LP3', kind: 'E', text: '有重难点，且写了突破办法', how: '明确写出本课的重点和难点，并且能看出针对难点用了什么办法；单独的突破办法栏和环节设计里点明的做法都算。只有重难点没有办法，或只有设计意图没有点明难点，不过。' },
    { id: 'LP4', kind: 'E', text: '预设易错点，每个都写了学生为什么错、老师怎么应对', how: '明确列出易错点或常见错误，每一条都写了学生为什么错和老师怎么应对。只列错在哪儿不算；只写应对不写原因不算；冷场、完成率低这类课堂管理问题不算易错点。' },
    { id: 'LP5', kind: 'E', text: '环节时间加起来等于课时长度', how: '把成品里各环节标注的时长相加，等于任务给的课时长度才算过，环节里小步骤的时长不重复累加。没有给环节标时长的，不过。' },
    { id: 'LP6', kind: 'E', text: '每个环节都有学生活动', how: '每个环节都能看出学生做什么，如回答、讨论、动手画、互查、朗读、记录；写明向学生提出、要学生回答的问题，也算。只有教师出示、讲述、板书、布置，没有任何学生动作的环节，算不过。' },
    { id: 'LP7', kind: 'E', text: '作业或练习有分层', how: '作业或练习分成两层以上，并写明哪一层给谁做，必做和选做、基础和提高、全员的和学有余力的都算。只按顺序排列、没有分层的，不过。' },
    { id: 'LP8', kind: 'E', text: '有当堂检测，题目对应本课目标', how: '课上有一个练习或检测环节，题目写在成品里，内容对应本课目标，就算过，环节叫不叫当堂检测都可以。只写练习或检测而没有题目，或题目与本课目标无关，不过。' },
    { id: 'LP9', kind: 'Q', text: '内容具体到这一课，换个课题不能直接套用', how: '教学过程里有结合本课知识点的例题、提问或活动。换成别的课题仍然一字不改能用的，不过。' },
    { id: 'LP10', kind: 'Q', text: '事实、公式、引用无误', how: '逐题验算，逐句核对知识性说法、公式和课标引用。有一处算错或说错就不过，并记进严重错误或修改处。' },
    { id: 'LP11', kind: 'Q', text: '是学校教案的常见结构，能直接誊写或打印', how: '有课题或基本信息、教学目标、教学过程三项，栏目名是学校里通行的说法，才算过。用某种教学框架的外来名称做栏目名，没有对应成通行栏目名的，不过。' },
    { id: 'LP12', kind: 'Q', text: '一课时教案 1 到 2 页，没有大段空话', how: '正文不超过 2400 字算两页以内，按每页约 1200 字折算，以脚本数的正文字数为准，末尾的说明假设段不计入。超过就算不过；成段的空话另记修改处。' },
  ],
  assignment: [
    { id: 'AS1', kind: 'E', text: '不超出所给学段和教材范围', how: '题目只考任务指定的教材和单元里的内容。出现这个单元之后才学的知识点，或明显低于这个学段的内容，不过。' },
    { id: 'AS2', kind: 'E', text: '有难度梯度', how: '卷面能看出容易、中等、较难三类题的区分，标注了难度或在细目表里分列都算。' },
    { id: 'AS3', kind: 'E', text: '覆盖要求的知识点；出卷时有双向细目表', how: '成品里附有细目表或等价的清单，列出每道题对应的知识点和难度。只在文字里说按细目表命题、没有表，不过。' },
    { id: 'AS4', kind: 'E', text: '题干情境贴近学生生活', how: '应用题的情境是这个学段学生熟悉的，如校园、家庭、出行、运动。通篇纯符号运算、没有任何情境题，不过。' },
    { id: 'AS5', kind: 'E', rule: true, text: '不抄录统考真题原题，引用真题时注明出处', how: '成品自己把某题标成中考或统考真题却没写出处的，不过；没有这类标注的，按过。' },
    { id: 'AS6', kind: 'Q', text: '答案正确，解析与题干一致', how: '逐题验算，答案、解析、题干三者对得上。有一处答案错或解析与题干对不上就不过，并记进严重错误。' },
    { id: 'AS7', kind: 'Q', text: '题干自洽：条件充分、无歧义、数据合理', how: '每道题条件充分、只有一个合理答案、数据合平常理。缺条件、有两个答案、数据明显不合常理的，不过。' },
    { id: 'AS8', kind: 'Q', text: '能直接打印：题号连续、留有答题空间', how: '题号连续，分值标注齐全，标题、满分、考试时间、答案、细目表都在。纯文字产出不要求答题横线。' },
    { id: 'AS9', kind: 'Q', text: '没有重复题或换数字的重复题', how: '同一道题没有出现两次，也没有只换了数字或人名的重复题。' },
  ],
  analysis: [
    { id: 'AN1', kind: 'E', text: '写明数据口径：人数、科目、满分、缺失值处理', how: '写明了人数、科目、各科满分，以及对缺考或缺失值的处理。缺哪一项都不过。' },
    { id: 'AN2', kind: 'E', rule: true, text: '不出现学生真实姓名和公开排名', how: '成品里出现学生姓名，或排出个人名次，不过。只做科目之间、班级整体或分数段的比较，不算排名。' },
    { id: 'AN3', kind: 'E', text: '结论有数字支撑，能回溯到表里的数据', how: '每条结论旁边都有能回到成绩表核对的具体数字。只有好、差、明显这类没有数字的形容，不算。' },
    { id: 'AN4', kind: 'E', rule: true, text: '不给学生贴标签', how: '对具体学生下定性判断，如差生、学困生、不是学习的料，不过。按本次分数分段来描述，如低分段学生、得分率低于六成的学生，不算贴标签。' },
    { id: 'AN5', kind: 'E', text: '建议具体可执行：讲评先讲哪几题、哪些知识点', how: '讲评建议落到具体题号和知识点，老师照着就能安排。' },
    { id: 'AN6', kind: 'Q', text: '计算正确：平均分、及格率、优秀率、得分率抽样复核', how: '从成品里挑平均分、及格率、优秀率、得分率各至少一个，用成绩表重算。有一处对不上就不过，并记进严重错误。' },
    { id: 'AN7', kind: 'Q', text: '概况、问题、建议三部分能一眼找到', how: '三部分各有标题或清楚的分段。' },
    { id: 'AN8', kind: 'Q', text: '篇幅适中，没有复述整张成绩表', how: '正文不超过 1500 字，以脚本数的正文字数为准；没有把整张成绩表或逐人分数原样贴回。' },
  ],
  'home-school': [
    { id: 'HS1', kind: 'E', text: '语气尊重，没有指责性表述', how: '通篇没有指责、训斥、施压的说法。' },
    { id: 'HS2', kind: 'E', rule: true, text: '不公开比较学生，不点名批评', how: '没有点出某个学生的名字说成绩或问题，也没有让学生之间比较高低的说法。' },
    { id: 'HS3', kind: 'E', text: '关键信息齐全且前后一致', how: '老师要求里提到的每件事都写到了，时间、地点这些细节前后不矛盾。' },
    { id: 'HS4', kind: 'E', text: '给家长的建议具体可做', how: '每条建议都写明了家长具体做什么。只说多陪伴、多关注这类话，不过。' },
    { id: 'HS5', kind: 'Q', text: '称谓、落款、日期符合学校书信格式', how: '有称呼、正文、落款三项。日期没给的，写占位或照老师原话写周几都算。' },
    { id: 'HS6', kind: 'Q', text: '字数符合老师要求', how: '正文在老师要求的字数上下两成以内，要求 400 字左右就是 320 到 480 字，以脚本数的正文汉字数为准。' },
    { id: 'HS7', kind: 'Q', text: '没有错别字和语病', how: '通读一遍，没有错别字、标点错误和读不通的句子。' },
    { id: 'HS8', kind: 'Q', text: '发出前不需要老师改动', how: '上面各项都过，并且没有留着让老师补的空白；班级名、具体日期这类通用占位不算。' },
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

/** 实测层级：分数是在哪一层测出来的。层级只决定用哪份证据当主分，不参与算分。 */
export type LayerKey = 'workbuddy' | 'same-model' | 'free-tier';
export const LAYERS: readonly { key: LayerKey; label: string; meaning: string }[] = [
  {
    key: 'workbuddy',
    label: 'WorkBuddy 实测',
    meaning: '在 WorkBuddy 桌面版里，按老师平时的说法发任务，看技能会不会被自动调用，安装步骤也在这个界面上核对。',
  },
  {
    key: 'same-model',
    label: '同款复核',
    meaning: '在后台开全新会话，用 WorkBuddy 默认的同款模型重跑。技能说明直接写进提示，不测会不会被自动调用。',
  },
  {
    key: 'free-tier',
    label: '免费档海选',
    meaning: '在后台开全新会话，用免费档模型跑，用来在大批技能里分先后。结论比同款复核粗一层。',
  },
];

/** 测试流程，评价标准页画成流程图。 */
export const PROTOCOL: readonly { title: string; detail: string }[] = [
  { title: '候选', detail: '来源限 SkillHub 教育学习分类的逐条挑选、明确开源的 GitHub 仓库、教师投稿' },
  { title: '隔离下载', detail: '每个技能放独立空目录，只读不执行' },
  { title: '静态审查', detail: '通读全部文件，脚本扫描外联、删除、动态执行、凭据、提权、隐藏指令，核对许可证' },
  { title: '转载判定', detail: 'MIT、Apache-2.0 等明确开源许可的镜像，否则只评不转' },
  { title: '点名加载', detail: '技能说明直接写进提示，不安装、不运行脚本' },
  { title: '实测', detail: '每次开全新会话，同一模型；主任务 3 轮，有副任务的品类加 1 轮；不装技能的对照每个任务另跑 3 轮' },
  { title: '定分', detail: '数得清的交给脚本，其余由评审模型逐项对照检查单，再由另一个 AI 会话抽两成重判' },
  { title: '入库', detail: '写条目、评测档案、技能包，构建，截图目检' },
  { title: '复测', detail: '上游更新后重跑；评测超过 6 个月标「待复测」' },
];

/** 五条规矩。 */
export const RULES: readonly string[] = [
  '没实测不出分。只做过静态审查的条目是「待测」，进候选池，不显示分数。',
  '每份评分写明评测日期、技能版本、实测层级、所用 Agent 与模型。',
  '「AI 代测」与「教师试用」是两种证据，各自有各自的标记，不混为一谈。',
  '每个技能至少有一份产出由评审模型之外的另一个 AI 会话逐字读过，每批另抽两成由它按同一口径重判。这一遍不是真人读的，条目一律标「AI 代测」。没做到的不出分。',
  '实测可以成批跑，条目不能成批套模板：每条的修改处和我看到的都引自具体产出。',
];

/** 口径说明，评价标准页展示。 */
export const TERMS: readonly { term: string; meaning: string }[] = [
  { term: '修改处', meaning: '老师必须改动才能用的一处。错别字一句算一处；缺一个必备栏目算一处；一段空话算一处。每处在评测档案里列出来。' },
  { term: '严重错误', meaning: '老师没发现就会交上去的错误，如公式算错、编造课标条目、数据对不上。' },
  { term: '触发', meaning: '不点名技能，只按老师平时说话的方式发出任务，技能被调用记为触发。后台点名加载时不测这一项，标「触发未测」。' },
  { term: '对照', meaning: '不装技能，同一任务、同一模型，各开新会话跑 3 轮取平均，作为「不装技能」的参照。' },
  { term: '实测层级', meaning: '分数在哪一层测出来的：WorkBuddy 实测、同款复核、免费档海选。层级只决定用哪份证据当主分，不参与算分。' },
  { term: '点名加载', meaning: '把技能说明直接写进提示。技能一定被用到，但它会不会被自动调用没有测。' },
  { term: '抽检', meaning: '每个批次随机抽两成已评审的产出，由评审之外的另一个 AI 会话按同一口径重判。对不上就整批重判。' },
];

export const STANDARD = {
  version: '1.3',
  date: '2026-11-25',
  changes: [
    '1.3（2026-11-25）：四份检查单的每一条都写明判法，评审时按判法判。试跑发现同一份产出不同轮次的松紧不一，分歧集中在易错点、学生活动、篇幅折合几页、是不是学校教案的常见结构这几项；论篇幅的条目改为以脚本数的正文字数为准。',
    '1.2（2026-11-24）：写明逐字读产出和抽检由评审之外的另一个 AI 会话做，不是真人；条目一律标「AI 代测」。',
    '1.1（2026-11-24）：实测可以不在 WorkBuddy 桌面，改在后台开新会话跑，并标明实测层级；对照从每任务 1 轮改为 3 轮；新增点名加载与抽检两条口径。',
    '1.0（2026-11-24）：首版。五个维度与权重、分数规则、四份品类检查单、六道固定任务。',
  ] as string[],
};
