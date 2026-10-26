window.LESSON = { meta: { title: '绝对值' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 小狗找家', minutes: 1 },
    { no: 2, title: '距离与绝对值', minutes: 8 },
    { no: 3, title: '比较大小', minutes: 6 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '小狗离家 3 米，家在数轴哪里？', ask: ['两种可能'], clicks: '', difficulty: '', transition: '' },
    2: { goal: '绝对值=距离', open: '拖小狗，读数与到家的距离各是多少？', ask: ['为什么距离没有负的？'], clicks: '拖小狗', difficulty: '符号与距离分开', transition: '第3页比大小' },
    3: { goal: '负数比大小', open: '两个负数谁大？', ask: ['离原点远的呢？'], clicks: '拖两点', difficulty: '绝对值大反而小', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  home: 0,
  quiz: [
    { q: '|-5| = （ ）', opts: ['-5', '5', '±5', '1/5'], a: 1, why: '-5 到原点距离 5 个单位，距离非负。' },
    { q: '绝对值等于 3 的数有（ ）', opts: ['1 个', '2 个', '3 个', '0 个'], a: 1, why: '±3 到原点都是 3 个单位，绝对值相等的数成对（0 除外）。' },
    { q: '比较 -4 与 -2：（ ）', opts: ['-4 > -2', '-4 < -2', '相等', '无法比'], a: 1, why: '两个负数，绝对值大的反而小：|-4|>|-2| 所以 -4 < -2。' },
    { q: '|a| = -a，则 a 是（ ）', opts: ['正数', '负数或 0', '正数或 0', '任意有理数'], a: 1, why: '-a 非负要求 a 非正：a 是负数或 0。' },
  ] };
