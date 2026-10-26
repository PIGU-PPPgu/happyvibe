window.LESSON = { meta: { title: '角的比较' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 折纸平分', minutes: 1 },
    { no: 2, title: '角的比较与运算', minutes: 8 },
    { no: 3, title: '角平分线', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '两张角纸片怎么比大小？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '叠合比较', open: '顶点对顶点、边对边', ask: ['余角补角记法'], clicks: '', difficulty: '角的和差方向', transition: '第3页平分' },
    3: { goal: '角平分线', open: '射线 OC 平分 ∠AOB', ask: ['∠AOC = ?'], clicks: '拖角', difficulty: '一半关系', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: 'OC 是 ∠AOB 的平分线，∠AOB=64°，则 ∠AOC=（ ）', opts: ['16°', '32°', '64°', '128°'], a: 1, why: '平分线把角分成相等的两半：64÷2=32。' },
    { q: '∠1=35°，∠2=55°，∠1 与 ∠2（ ）', opts: ['互余', '互补', '相等', '对顶'], a: 0, why: '35+55=90，和为直角的两角互余。' },
    { q: '若 ∠α + ∠β = 180°，则两角（ ）', opts: ['互余', '互补', '相等', '邻补'], a: 1, why: '和为平角（180°）的两角互补。' },
    { q: '∠AOB=48°，∠BOC=20°，∠AOC 最小值（ ）', opts: ['28°', '68°', '28°或 68°', '20°'], a: 0, why: 'OC 在 ∠AOB 内部时相减 28°；题目问最小值取 28°（外部相加 68°）。' },
  ] };
