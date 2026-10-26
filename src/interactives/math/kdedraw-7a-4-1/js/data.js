window.LESSON = { meta: { title: '线段、射线、直线' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 三线家族', minutes: 1 },
    { no: 2, title: '端点与延伸', minutes: 8 },
    { no: 3, title: '表示法与计数', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '绷紧的琴弦、手电筒光束、笔直的铁轨各像什么？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '三线对比', open: '各有几个端点？向几方延伸？', ask: ['射线能度量长度吗？'], clicks: '点切换', difficulty: '延伸性vs端点', transition: '第3页表示法' },
    3: { goal: '表示与计数', open: '两点确定几条直线？', ask: ['三条直线两两相交交点几个？'], clicks: '点开关', difficulty: '直线 2 大写字母或 1 小写', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '手电筒射出的光束像（ ）', opts: ['线段', '射线', '直线', '折线'], a: 1, why: '有一个端点、向一方无限延伸——射线。' },
    { q: '直线、射线、线段的端点个数（ ）', opts: ['0,1,2', '2,1,0', '1,2,0', '2,0,1'], a: 0, why: '直线无端点、射线 1 个、线段 2 个。' },
    { q: '过两点能画（ ）条直线', opts: ['0', '1', '2', '无数'], a: 1, why: '两点确定一条直线（直线公理）。' },
    { q: '同一平面内三条直线两两相交，交点最多（ ）个', opts: ['1', '2', '3', '6'], a: 2, why: '不共点时 3 个交点；共点时 1 个。' },
  ] };
