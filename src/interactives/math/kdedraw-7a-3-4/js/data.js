window.LESSON = { meta: { title: '整式的加减' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 苹果与橙子', minutes: 1 },
    { no: 2, title: '同类项装箱', minutes: 8 },
    { no: 3, title: '去括号法则', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '3 个苹果加 2 个苹果是几个？苹果加橙子呢？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '同类项', open: '字母相同、相同字母指数也相同', ask: ['3x²y 与 5xy² 是同类项吗？'], clicks: '拖入箱子', difficulty: '指数顺序', transition: '第3页去括号' },
    3: { goal: '去括号', open: '括号前是负号，里面全变号', ask: ['为什么？分配 -1'], clicks: '翻符号', difficulty: '漏变号', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  items: [
    { e: '3x²',  kind: 'x2' }, { e: '5x²', kind: 'x2' }, { e: '-2x²', kind: 'x2' },
    { e: '4x',   kind: 'x' },  { e: '-x',  kind: 'x' },  { e: '7x', kind: 'x' },
    { e: '2y',   kind: 'y' },  { e: '-5y', kind: 'y' },
    { e: '9',    kind: 'c' },  { e: '-3',  kind: 'c' },
  ],
  quiz: [
    { q: '3x + 5x = （ ）', opts: ['8x', '8x²', '15x', '15x²'], a: 0, why: '同类项合并：系数相加 3+5=8，字母部分不变。' },
    { q: '3a²b − 4a²b = （ ）', opts: ['-1', '-a²b', '-a⁴b²', 'a²b'], a: 1, why: '同类项：(3−4)a²b = −a²b。' },
    { q: '去括号：2(x − 3) = （ ）', opts: ['2x − 3', '2x − 6', '2x + 6', 'x − 6'], a: 1, why: '分配律：2×x 与 2×(−3)，得 2x − 6。' },
    { q: '去括号：−(2a − 3) = （ ）', opts: ['−2a − 3', '−2a + 3', '2a − 3', '2a + 3'], a: 1, why: '负号乘进去全变号：−2a + 3。' },
  ] };
