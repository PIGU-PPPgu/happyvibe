window.LESSON = { meta: { title: '一元一次方程的应用' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 甲乙相遇', minutes: 1 },
    { no: 2, title: '相遇问题', minutes: 10 },
    { no: 3, title: '调配问题', minutes: 8 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '两人相向而行何时相遇？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '审设列解验', open: '四步走：审题→设未知数→列方程→解与验', ask: ['等量关系是什么？'], clicks: '拖 t', difficulty: '找等量关系', transition: '第3页调配' },
    3: { goal: '调配', open: '调动人数后两处相等', ask: ['怎么设？'], clicks: '', difficulty: '变化量表述', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '甲 60 m/min、乙 40 m/min，相距 1000 m 相向而行，t 分钟后相遇：方程（ ）', opts: ['60t = 1000', '60t + 40t = 1000', '60t − 40t = 1000', '60 + 40 = 1000t'], a: 1, why: '相向而行：两人路程之和等于总距离。' },
    { q: '上题相遇时间 t = （ ）', opts: ['8 min', '10 min', '12 min', '15 min'], a: 1, why: '100t = 1000，t = 10 分钟。' },
    { q: '追及问题：后车速快，方程通常是（ ）', opts: ['快者路程 − 慢者路程 = 初始距离', '两路程之和 = 距离', '速度差 = 距离', '时间相等'], a: 0, why: '同向追及：快者比慢者多走初始距离时追上。' },
    { q: '甲处 32 人、乙处 18 人，从甲调 x 人去乙使两处相等：方程（ ）', opts: ['32 − x = 18 + x', '32 + x = 18 − x', '32 = 18 + x', '32 − 18 = x'], a: 0, why: '甲减去调出、乙加上调入后相等：32 − x = 18 + x，x = 7。' },
  ] };
