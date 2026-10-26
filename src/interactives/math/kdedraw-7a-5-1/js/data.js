window.LESSON = { meta: { title: '方程' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 天平与盒子', minutes: 1 },
    { no: 2, title: '从算式到方程', minutes: 8 },
    { no: 3, title: '方程的解', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '盒子里有几个球，天平才平？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '方程的意义', open: '含有未知数的等式', ask: ['等式 vs 方程差别？'], clicks: '', difficulty: '方程必是等式', transition: '第3页试解' },
    3: { goal: '方程的解', open: '使方程成立的未知数的值', ask: ['代入检验怎么做？'], clicks: '拖 x 检验', difficulty: '解 vs 解方程', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '下列是方程的是（ ）', opts: ['3 + 5 = 8', 'x + 3', '2x = 10', 'x > 5'], a: 2, why: '方程=含有未知数的等式：①无未知数 ②不是等式 ④是不等式。' },
    { q: 'x = 3 是方程 2x − 1 = 5 的解吗？（ ）', opts: ['是，代入左边=5 成立', '不是', '无法判断', '只有 x=2 是'], a: 0, why: '左边 = 2×3−1 = 5 = 右边，成立。' },
    { q: '「比 x 的 2 倍小 5 的数是 11」列方程（ ）', opts: ['2x − 5 = 11', '2x + 5 = 11', '(x−5)/2 = 11', '2(x−5) = 11'], a: 0, why: '2x 减 5 等于 11。' },
    { q: '方程的解是（ ）', opts: ['解方程的过程', '使方程成立的未知数的值', '任意数', '等式右边'], a: 1, why: '「解」是那个值；「解方程」是求值的过程。' },
  ] };
