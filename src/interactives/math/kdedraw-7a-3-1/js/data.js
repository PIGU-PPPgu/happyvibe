window.LESSON = { meta: { title: '字母表示数' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 火柴棒摆正方形', minutes: 1 },
    { no: 2, title: '一排正方形', minutes: 8 },
    { no: 3, title: '从算式到字母', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '摆 1 个、2 个、10 个正方形各要几根火柴？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '找规律', open: '每多摆 1 个正方形多几根？', ask: ['3+3n 与 4n-(n-1) 一样吗？'], clicks: '拖个数', difficulty: '不同列式法殊途同归', transition: '第3页代数化' },
    3: { goal: '字母的意义', open: 'n 可以取什么值？', ask: ['字母能表示任意数'], clicks: '', difficulty: '字母是数不是单位', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '摆 n 个正方形（一排共用边）需要火柴（ ）', opts: ['4n 根', '3n+1 根', 'n+3 根', '4n-1 根'], a: 1, why: '第 1 个 4 根，之后每个添 3 根：4+3(n-1)=3n+1。三种列式 4n-(n-1)、n+n+(n+1) 展开后相同。' },
    { q: '用 22 根火柴最多能摆（ ）个正方形', opts: ['6', '7', '8', '9'], a: 1, why: '3n+1=22 → n=7，恰好用完。' },
    { q: '比 x 的 2 倍大 3 的数是（ ）', opts: ['2x+3', '2(x+3)', '3x+2', 'x+5'], a: 0, why: '先倍后加：2x+3。' },
    { q: 'a 表示偶数，与它相邻的两个偶数是（ ）', opts: ['a-1, a+1', 'a-2, a+2', '2a, 3a', 'a+1, a+2'], a: 1, why: '相邻偶数相差 2。' },
  ] };
