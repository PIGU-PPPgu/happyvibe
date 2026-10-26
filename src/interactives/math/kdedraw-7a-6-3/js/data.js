window.LESSON = { meta: { title: '统计图的选择' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 一数三图', minutes: 1 },
    { no: 2, title: '三种统计图', minutes: 8 },
    { no: 3, title: '选图的陷阱', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '同一组数据画三种图，讲的故事不同', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '三图分工', open: '条形比多少、折线看变化、扇形看占比', ask: ['气温变化选哪个？'], clicks: '切图', difficulty: '扇形只看占比不问总量', transition: '第3页陷阱' },
    3: { goal: '误导图', open: '纵轴不从 0 开始会怎样？', ask: ['差 2% 画成 3 倍高'], clicks: '', difficulty: '纵轴截断', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '表示一周气温变化，选（ ）', opts: ['条形图', '折线图', '扇形图', '表格'], a: 1, why: '折线图反映随时间的变化趋势。' },
    { q: '表示家庭各项支出占总支出的比例，选（ ）', opts: ['扇形图', '折线图', '条形图', '频数表'], a: 0, why: '扇形图表现部分占总体的百分比。' },
    { q: '比较五个班的植树数量，选（ ）', opts: ['折线图', '扇形图', '条形图', '都一样'], a: 2, why: '条形图直观比较各类数据的多少。' },
    { q: '纵轴从 90 而不是 0 开始画条形图（ ）', opts: ['更精确', '会夸大差异误导读者', '更美观', '没区别'], a: 1, why: '纵轴截断会放大视觉差异，是常见统计误导。' },
  ] };
