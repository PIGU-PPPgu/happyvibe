window.LESSON = { meta: { title: '等式的基本性质' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 两边同操作', minutes: 1 },
    { no: 2, title: '性质 1：同加减', minutes: 8 },
    { no: 3, title: '性质 2：同乘除', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '天平平衡时，两边各加一个砝码还平吗？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '性质1', open: 'a = b 则 a ± c = b ± c', ask: ['为什么可以两边同减？'], clicks: '加砝码', difficulty: '同减消去法', transition: '第3页性质2' },
    3: { goal: '性质2', open: 'a = b 则 ac = bc；除数不为 0', ask: ['为什么 0 不能除？'], clicks: '', difficulty: '除以负数变号吗？不变', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '由 x + 3 = 7 得 x = 4 的依据（ ）', opts: ['两边同减 3', '两边同乘 3', '两边同除 3', '移项定义'], a: 0, why: '等式性质 1：两边同减 3，等式仍成立。' },
    { q: '由 x/2 = 5 得 x = 10 的依据（ ）', opts: ['两边同加 2', '两边同乘 2', '两边同除 2', '两边平方'], a: 1, why: '等式性质 2：两边同乘 2。' },
    { q: '若 a = b，则下列一定成立的是（ ）', opts: ['a + 1 = b + 2', 'a/3 = b/3', 'a·0 = b·1', 'a − b = 1'], a: 1, why: '同除 3（非零）成立；其他两边操作不同。' },
    { q: '由 x = y 能否得 x/(c) = y/(c)？（ ）', opts: ['一定可以', 'c ≠ 0 时才可以', 'c = 0 时才可以', '不可以'], a: 1, why: '除数不能为 0——性质 2 的重要条件。' },
  ] };
