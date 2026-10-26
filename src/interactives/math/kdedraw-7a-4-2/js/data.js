window.LESSON = { meta: { title: '比较线段的长短' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 谁更长', minutes: 1 },
    { no: 2, title: '叠合法与度量法', minutes: 8 },
    { no: 3, title: '线段中点', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '两支铅笔谁长？怎么比最公平？', ask: [], clicks: '', difficulty: '', transition: '' },
    2: { goal: '两种方法', open: '一头对齐再比另一头', ask: ['尺子量要注意什么？'], clicks: '拖线段', difficulty: '起点对齐', transition: '第3页中点' },
    3: { goal: '中点', open: 'AM=MB=AB/2', ask: ['中点唯一吗？'], clicks: '拖动看中点', difficulty: '中点必须在线段上', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '比较两条线段长短最可靠的方法（ ）', opts: ['目测', '叠合法或度量法', '估一估', '数格子'], a: 1, why: '叠合法（一头对齐）或用刻度尺度量，目测不可靠。' },
    { q: 'M 是 AB 中点，则（ ）', opts: ['AM = AB', 'AM = MB = AB/2', 'AB = 2AM 且 MB ≠ AM', 'AM + MB ≠ AB'], a: 1, why: '中点把线段分成相等的两段：AM = MB = AB/2。' },
    { q: 'AB = 8 cm，C 是 AB 中点，AC = （ ）', opts: ['2 cm', '4 cm', '6 cm', '8 cm'], a: 1, why: 'AC = AB/2 = 4 cm。' },
    { q: '点 M 在线段 AB 外，AM = MB，则 M（ ）', opts: ['一定是中点', '一定不是中点', '可能是中点', '无法判断'], a: 1, why: '中点必须在线段 AB 上；线段外的点即使 AM=MB 也不是中点。' },
  ] };
