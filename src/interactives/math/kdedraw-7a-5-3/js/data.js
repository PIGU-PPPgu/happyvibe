window.LESSON = { meta: { title: '一元一次方程的解法' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 移项飞行', minutes: 1 },
    { no: 2, title: '移项与合并', minutes: 8 },
    { no: 3, title: '去分母五步曲', minutes: 8 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: 'x + 3 = 7 怎么一步步解？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '移项', open: '过等号要变号', ask: ['为什么变号？——本质是两边同减'], clicks: '移项动画', difficulty: '忘记变号', transition: '第3页五步' },
    3: { goal: '五步曲', open: '去分母→去括号→移项→合并→系数化 1', ask: ['每步的依据？'], clicks: '逐步展示', difficulty: '漏乘不含分母的项', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '解方程 x − 5 = 12，移项得（ ）', opts: ['x = 12 − 5', 'x = 12 + 5', 'x = −12 + 5', '−x = 12 − 5'], a: 1, why: '移项要变号：−5 过等号变 +5，x = 12 + 5 = 17。' },
    { q: '解 3x = x + 6：合并后 2x = 6，x = （ ）', opts: ['2', '3', '6', '9'], a: 1, why: '移项 3x − x = 6，2x = 6，系数化 1 得 x = 3。' },
    { q: '解 (x+1)/2 = 3，去分母得（ ）', opts: ['x + 1 = 3', 'x + 1 = 6', '2x + 1 = 6', 'x/2 + 1 = 3'], a: 1, why: '两边同乘 2（分母的最小公倍数）：x + 1 = 6。' },
    { q: '去分母时漏乘不含分母的项，结果（ ）', opts: ['可能变错解', '没关系', '一定对', '更简单'], a: 0, why: '等式两边必须"每一项"都乘——含分母与不含分母的项都要乘。' },
  ] };
