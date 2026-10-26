/* 1.1 生活中的立体图形 · 北师大版七上第一章
   data.js：几何体清单与分类。数值唯一来源，pages.js 只读不写。 */
window.LESSON = {
  meta: { title: "生活中的立体图形", anchor: "北师大版七年级上册第一章《丰富的图形世界》1.1" },
  main: 5,
  slides: [
    { no: 1, title: "封面 · 立体图形家族", minutes: 1 },
    { no: 2, title: "认识六类立体", minutes: 8 },
    { no: 3, title: "数一数 · 欧拉公式", minutes: 6 },
    { no: 4, title: "当堂检测 · 连线", minutes: 5 },
    { no: 5, title: "演示台", minutes: 0 },
  ],
  // 六类立体图形：SVG 参数化绘制函数在 pages.js 里按 kind 生成
  solids: [
    { kind: "prism3",  name: "三棱柱", cn: "三棱柱", faces: 5,  surface: "3 个侧面（长方形）+ 2 个底面（三角形）", lives: ["屋顶桁架", "帐篷骨架"], family: "prism" },
    { kind: "prism4",  name: "四棱柱", cn: "四棱柱（长方体）", faces: 6, surface: "4 个侧面（长方形）+ 2 个底面（长方形）", lives: ["粉笔盒", "高楼", "书"], family: "prism" },
    { kind: "cylinder", name: "圆柱", cn: "圆柱", faces: 3, surface: "1 个侧面（曲面）+ 2 个底面（圆）", lives: ["水杯", "易拉罐", "柱子"], family: "round" },
    { kind: "cone",    name: "圆锥", cn: "圆锥", faces: 2, surface: "1 个侧面（曲面）+ 1 个底面（圆）", lives: ["冰淇淋筒", "圣诞帽", "漏斗"], family: "round" },
    { kind: "pyramid", name: "四棱锥", cn: "四棱锥", faces: 5, surface: "4 个侧面（三角形）+ 1 个底面（四边形）", lives: ["金字塔", "帐篷顶"], family: "pyramid" },
    { kind: "sphere",  name: "球", cn: "球", faces: 1, surface: "1 个曲面", lives: ["足球", "地球仪", "乒乓球"], family: "round" },
  ],
  // 分类连线题（检测页）：物体 → 立体图形
  classify: [
    { obj: "易拉罐", ans: "圆柱" },
    { obj: "足球", ans: "球" },
    { obj: "金字塔", ans: "四棱锥" },
    { obj: "粉笔盒", ans: "四棱柱" },
    { obj: "冰淇淋筒", ans: "圆锥" },
    { obj: "帐篷骨架", ans: "三棱柱" },
  ],

  notes: {
    1: { goal: "整课导入", open: "这些立体图形你在哪里见过？", ask: ["逐个指认名字"], clicks: "每步出现一个图形", difficulty: "棱柱与圆柱的区分", transition: "翻到第2页动手分类" },
    2: { goal: "认识六类立体", open: "把身边物体和图形对上号", ask: ["圆柱和棱柱差别在哪？", "圆锥和棱锥差别在哪？"], clicks: "点卡片翻面看面数", difficulty: "曲面与平面的区分", transition: "第3页数顶点棱面" },
    3: { goal: "欧拉公式发现", open: "数一数 V、E、F，算 V−E+F", ask: ["都是多少？", "换个多面体还是 2 吗？"], clicks: "逐步出现表格与结论", difficulty: "数棱容易漏", transition: "第4页连线检测" },
    4: { goal: "当堂检测", open: "物体连图形", ask: ["为什么它是这个图形？"], clicks: "点物体再点图形", difficulty: "三棱柱与四棱锥易混", transition: "第5页演示台自由浏览" },
  },
  // 柱与锥的对比表
  compare: {
    rows: [
      ["棱柱", "两个底面（多边形）+ 侧面（长方形）", "上下一樣粗", "有棱"],
      ["圆柱", "两个底面（圆）+ 侧面（曲面）", "上下一样粗", "无棱"],
      ["棱锥", "一个底面（多边形）+ 侧面（三角形）", "上尖", "有棱"],
      ["圆锥", "一个底面（圆）+ 侧面（曲面）", "上尖", "无棱"],
    ],
  },
};
