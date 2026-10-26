window.LESSON = { meta: { title: '数据的收集' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 要调查谁', minutes: 1 },
    { no: 2, title: '普查与抽样', minutes: 8 },
    { no: 3, title: '样本的代表性', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '想知道全校同学最喜欢哪门课，要问每个人吗？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '两种方式', open: '普查=每一个都查；抽样=查一部分', ask: ['什么时候必须普查？'], clicks: '点人群', difficulty: '总体个体样本概念', transition: '第3页代表性' },
    3: { goal: '代表性', open: '只在篮球场抽样行吗？', ask: ['样本偏向谁？'], clicks: '对比抽样点', difficulty: '样本偏差', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '了解一批灯泡的寿命，适合（ ）', opts: ['普查', '抽样调查', '不用调查', '查资料'], a: 1, why: '寿命测试具有破坏性，只能抽样。' },
    { q: '「全校学生的视力」中总体是（ ）', opts: ['每个学生', '全校学生的视力', '抽查的学生', '视力值'], a: 1, why: '总体=所要考察对象的全体（是"视力"这个指标的整体，不是学生本身）。' },
    { q: '抽样调查时样本要（ ）', opts: ['越多越好', '有代表性', '只挑熟悉的', '只挑一个班'], a: 1, why: '样本要有代表性，否则以偏概全。' },
    { q: '全国人口普查是（ ）', opts: ['抽样调查', '普查', '样本调查', '不可能'], a: 1, why: '人口普查要求每一个都登记——必须普查。' },
  ] };
