window.LESSON = { meta: { title: '数轴' }, main: 5,
  slides: [
    { no: 1, title: '封面 · 温度计是数轴', minutes: 1 },
    { no: 2, title: '三要素拼装', minutes: 8 },
    { no: 3, title: '在数轴上表示数', minutes: 7 },
    { no: 4, title: '当堂检测', minutes: 5 },
    { no: 5, title: '演示台', minutes: 0 },
  ],
  notes: { 1: { goal: '导入', open: '温度计哪里像一条数轴？', ask: ['零上零下怎么分？'], clicks: '', difficulty: '', transition: '' },
    2: { goal: '三要素', open: '缺了原点/正方向/单位长度还行吗？', ask: ['为什么箭头不可少？'], clicks: '逐个点亮', difficulty: '单位长度要均匀', transition: '第3页描点' },
    3: { goal: '描点', open: '把 -2.5 画到数轴上', ask: ['先定方向再数格'], clicks: '拖金点', difficulty: '负数方向', transition: '第4页检测' },
    4: { goal: '检测', open: '', ask: [], clicks: '', difficulty: '', transition: '' } },
  quiz: [
    { q: '数轴三要素是（ ）', opts: ['原点、正方向、单位长度', '0、1、2', '正数、0、负数', '箭头、刻度、数字'], a: 0, why: '原点是基准，正方向定正负，单位长度保证每格一样长。' },
    { q: '数轴上 -3 在 -1 的（ ）边', opts: ['左', '右', '上', '下'], a: 0, why: '负数离原点越远越靠左：-3 的点在 -1 左边。' },
    { q: '温度计 0℃ 以上 3 格记 +3，以下 2 格记（ ）', opts: ['+2', '-2', '2℃', '无法记'], a: 1, why: '规定零上为正，零下就用负记：-2。' },
    { q: '原点表示的数是（ ）', opts: ['正数', '负数', '0', '任意数'], a: 2, why: '原点是正负的分界点，表示 0。' },
  ] };
