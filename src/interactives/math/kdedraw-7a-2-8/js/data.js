window.LESSON = { meta: { title: '有理数的除法' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 均分与逆运算', minutes: 1 },
    { no: 2, title: '除以一个数 = 乘倒数', minutes: 8 },
    { no: 3, title: '符号与零', minutes: 6 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '6 米分 3 段每段多长？-6 呢？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '倒数法则', open: '除以 1/2 等于乘几？', ask: ['0 有倒数吗？'], clicks: '翻卡片', difficulty: '倒数与相反数混淆', transition: '第3页符号' },
    3: { goal: '符号与零', open: '除法符号法则与乘法相同', ask: ['0 能做除数吗？'], clicks: '', difficulty: '0 作除数无意义', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '(-6) ÷ 2 = （ ）', opts: ['3', '-3', '-4', '4'], a: 1, why: '异号得负，6÷2=3，所以 -3。' },
    { q: '(-8) ÷ (-1/2) = （ ）', opts: ['-16', '16', '-4', '4'], a: 1, why: '除以 -1/2 = 乘 -2：(-8)×(-2)=16，同号得正。' },
    { q: '-2 的倒数是（ ）', opts: ['-1/2', '1/2', '2', '-2'], a: 0, why: '倒数=1/a：-2 的倒数是 -1/2（乘积为 1）；不要与相反数 2 混淆。' },
    { q: '0 作除数（ ）', opts: ['得 0', '得 1', '无意义', '得任意数'], a: 2, why: '找不到数乘 0 等于非零被除数，0 作除数无意义；0 作被除数（除数非零）得 0。' },
  ] };
