window.LESSON = { meta: { title: '角' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 旋转出角', minutes: 1 },
    { no: 2, title: '角的度量', minutes: 8 },
    { no: 3, title: '度分秒', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '钟面指针转出什么图形？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '量角器', open: '中心对顶点、0线对边', ask: ['内圈外圈何时读？'], clicks: '拖角度', difficulty: '内外圈读数', transition: '第3页换算' },
    3: { goal: '度分秒', open: '1°=60′=3600″', ask: ['为什么是 60 进制？'], clicks: '', difficulty: '借位进位', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '角的两边是（ ）', opts: ['两条线段', '两条射线', '两条直线', '两条折线'], a: 1, why: '角由一条射线绕端点旋转而成：公共端点（顶点）+ 两条射线（边）。' },
    { q: '35.5° = 35°（ ）′', opts: ['5', '30', '50', '55'], a: 1, why: '0.5° = 0.5×60′ = 30′。' },
    { q: '25°18′ 化成度是（ ）', opts: ['25.18°', '25.3°', '25.18′', '25.018°'], a: 1, why: '18′ = 18/60 = 0.3°，所以 25.3°。' },
    { q: '钟表 3 点整，时针与分针的夹角（ ）', opts: ['30°', '60°', '90°', '120°'], a: 2, why: '每大格 30°，3 格 = 90°。' },
  ] };
