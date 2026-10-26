window.LESSON = { meta: { title: '有理数的乘法' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 速度×时间', minutes: 1 },
    { no: 2, title: '面积模型', minutes: 8 },
    { no: 3, title: '负 × 负', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '3 秒每秒 2 米走多远？向左走呢？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '符号法则', open: '同号得正异号得负，绝对值相乘', ask: ['为什么负×负是正？'], clicks: '翻转身份', difficulty: '负×负', transition: '第3页翻转' },
    3: { goal: '负负得正', open: '视频倒放：每秒 -2 的 -3 秒前位置', ask: ['倒放往哪走？'], clicks: '时间倒放', difficulty: '时间倒流直觉', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '(-2) × 3 = （ ）', opts: ['6', '-6', '5', '-5'], a: 1, why: '异号得负，绝对值相乘 2×3=6，所以 -6。' },
    { q: '(-4) × (-5) = （ ）', opts: ['-20', '20', '-9', '9'], a: 1, why: '同号（负负）得正，4×5=20。' },
    { q: '一个数与 -1 相乘得它本身，这个数是（ ）', opts: ['0', '1', '-1', '不存在'], a: 0, why: 'a×(-1)=-a=a 要求 -a=a 即 a=0。（注：与 1 相乘才得本身）' },
    { q: '三个数相乘积为负，则负因数个数（ ）', opts: ['偶数个', '奇数个', '1 个', '3 个'], a: 1, why: '负因数奇数个积为负，偶数个积为正。' },
  ] };
