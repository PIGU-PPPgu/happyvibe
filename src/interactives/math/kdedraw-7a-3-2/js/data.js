window.LESSON = { meta: { title: '代数式' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 翻译机', minutes: 1 },
    { no: 2, title: '文字 ⇄ 式子', minutes: 8 },
    { no: 3, title: '代入求值', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '「比 x 大 5」写成式子？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '互译', open: '关键词：和差积商、倍、比大比小', ask: ['除法的谁在前？'], clicks: '点翻译', difficulty: '减法除法顺序', transition: '第3页代入' },
    3: { goal: '代入求值', open: '负数代入要加括号', ask: ['x=-2 时 3x+1？'], clicks: '拖滑杆', difficulty: '负数代入', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  pairs: [
    { txt: '比 a 大 5 的数', expr: 'a + 5' },
    { txt: 'x 的 3 倍少 2', expr: '3x - 2' },
    { txt: 'a 与 b 的和的一半', expr: '(a + b) ÷ 2' },
    { txt: '比 m 的相反数小 1', expr: '-m - 1' },
  ],
  quiz: [
    { q: '「x 的 2 倍与 y 的差」写成代数式（ ）', opts: ['2x - y', '2(x - y)', 'x/2 - y', '2y - x'], a: 0, why: '先 2 倍得 2x，再与 y 作差：2x - y。' },
    { q: 'a = -2 时，a² + 1 = （ ）', opts: ['-3', '3', '5', '-5'], a: 2, why: '(-2)² = 4（负数代入先加括号），4 + 1 = 5。' },
    { q: '代数式 3(x - 1) 表示（ ）', opts: ['x 减 1 的 3 倍', 'x 减 3', '3 减 x', '3x 减 1'], a: 0, why: '括号先算：(x-1) 的整体再乘 3。' },
    { q: '一个两位数十位 a 个位 b，这个数是（ ）', opts: ['a + b', 'ab', '10a + b', '10b + a'], a: 2, why: '十位数字表示 a 个 10：10a + b。' },
  ] };
