// 教材目录索引：闸门 G11 用它验证资源 meta 里的教材锚点是否真实存在
// 数据为各版本教材的单元/章名（按我们资源实际引用的册次收录；lesson 级按已引用课目收录）
// 新资源引用新册次时先在这里补目录，再写 meta——目录库本身错 = 全库错，改动需核对实体教材
export const TEXTBOOK_INDEX = {
  数学: {
    人教版: {
      '七年级上册': { units: ['有理数', '整式的加减', '一元一次方程', '几何图形初步'] },
      '五年级下册': { units: ['观察物体（三）', '因数与倍数', '长方体和正方体', '分数的意义和性质', '图形的运动（三）', '分数的加法和减法', '折线统计图', '数学广角——找次品'] },
      '八年级下册': { startUnit: 16, units: ['二次根式', '勾股定理', '平行四边形', '一次函数', '数据的分析'] },
      '九年级上册': { startUnit: 21, units: ['一元二次方程', '二次函数', '旋转', '圆', '概率初步'] },
    },
    人教A版: {
      必修第一册: { units: ['集合与常用逻辑用语', '一元二次函数、方程和不等式', '函数的概念与性质', '指数函数与对数函数', '三角函数'] },
      必修第二册: { startUnit: 6, units: ['平面向量及其应用', '复数', '立体几何初步', '统计', '概率'] },
    },
    北师大版: {
      '七年级上册': { units: ['丰富的图形世界', '有理数及其运算', '整式及其加减', '基本平面图形', '一元一次方程', '数据的收集与整理'] },
    },
  },
  历史: {
    统编版: {
      '七年级上册': {
        units: ['史前时期：中国境内早期人类的文明起源', '夏商周时期：早期国家的产生与社会变革', '秦汉时期：统一多民族国家的建立和巩固', '三国两晋南北朝时期：政权分立与民族交融'],
        lessons: { '5': '青铜器与甲骨文', '9': '秦统一中国', '14': '丝绸之路的开通与经营西域' },
      },
      '八年级上册': { units: ['中国开始沦为半殖民地半封建社会', '近代化的早期探索与民族危机的加剧', '资产阶级民主革命与中华民国的建立', '新民主主义革命的开始', '从国共合作到国共对立', '中华民族的抗日战争', '人民解放战争', '近代经济、社会生活与教育文化事业的发展'] },
      '八年级下册': { units: ['中华人民共和国的成立和巩固', '社会主义制度的建立与社会主义建设的探索', '中国特色社会主义道路', '民族团结与祖国统一', '国防建设与外交成就', '科技文化与社会生活'] },
      '九年级上册': { units: ['古代亚非文明', '古代欧洲文明', '封建时代的欧洲', '封建时代的亚洲国家', '走向近代', '资本主义制度的初步确立', '工业革命和工人运动的兴起'] },
      '九年级下册': { units: ['殖民地人民的反抗与资本主义制度的扩展', '第二次工业革命和近代科学文化', '第一次世界大战和战后初期的世界', '经济大危机和第二次世界大战', '二战后的世界变化', '走向和平发展的世界'] },
    },
  },
  语文: {
    统编版: {
      '一年级上册': { units: ['识字', '汉语拼音', '课文', '识字', '课文'] },
      '七年级上册': { units: ['春', '济南的冬天', '雨的四季', '古代诗歌四首'], sections: ['课外古诗词诵读', '名著导读'] },
    },
  },
};

// 册次缩写归一：'七上'/'七年级上册' → '七年级上册'；'必修一' → 必修第一册
function normalizeVolume(tok) {
  const t = tok.replace(/\s/g, '');
  if (/^必修[一二三四]/.test(t)) {
    const n = { 一: '一', 二: '二', 三: '三', 四: '四' }[t[2]];
    if (t.startsWith('必修第')) return `必修第${n}册`;
    return `必修第${n}册`;
  }
  const m = t.match(/([一二三四五六七八九])年级?(上|下)/) || t.match(/^([一二三四五六七八九])(上|下)$/);
  if (m) return `${m[1]}年级${m[2]}册`;
  return t;
}

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
function cnNum(str) {
  // 支持 一~九十九：二十四 → 24（人教初中章号用到 二十几）
  const m = str.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
  if (m) return (m[1] ? CN_NUM[m[1]] : 1) * 10 + (m[2] ? CN_NUM[m[2]] : 0);
  return CN_NUM[str] ?? NaN;
}

// 校验一条 meta 定位行。返回 { ok, note }——note 为空表示全量核验通过，'册级' 表示仅验到册（跨册综述类）
export function validateTextbookAnchor(subject, rawMeta) {
  // 册次缩写展开：七上/九下（可带可不带「册」）→ 七年级上册/九年级下册
  const meta = rawMeta
    .replace(/(?<!年级)([一二三四五六七八九])(上|下)册/g, '$1年级$2册')
    .replace(/(?<![年级册])([一二三四五六七八九])([上下])(?=[第单课章·｜\s])/g, '$1年级$2册');
  const subj = TEXTBOOK_INDEX[subject];
  if (!subj) return { ok: true, note: `学科 ${subject} 未建目录，跳过` };
  const edMatch = meta.match(/(人教A版|人教版|北师大版|统编版)/);
  if (!edMatch) return { ok: false, note: '未识别教材版本' };
  const edition = edMatch[1];
  const book = subj[edition];
  if (!book) return { ok: false, note: `${subject}·${edition} 未收录目录，先补 textbook-index` };

  // 册次：跨册（、/至/各册）只验版本；单册必须命中
  const volSpans = meta.match(/([一二三四五六七八九]年级[上下]册|必修第[一二三四]册)/g) || [];
  const multiVol = /、|至|各册/.test(meta);
  if (volSpans.length === 0 && !multiVol) return { ok: false, note: '未识别册次' };
  if (multiVol || volSpans.length > 1) return { ok: true, note: '册级（跨册综述）' };
  const vol = normalizeVolume(volSpans[0]);
  if (!book[vol]) return { ok: false, note: `${edition}「${vol}」未收录目录` };

  // 单元/章：引用了序号就必须存在
  const unitRef = meta.match(/第([一二三四五六七八九十]+)[单元章]/);
  if (unitRef) {
    const idx0 = cnNum(unitRef[1]);
    const units = book[vol].units;
    const start = book[vol].startUnit || 1;
    const idx = idx0 - start + 1; // 人教初中等章号跨册连续，按起始章号换算
    if (!(idx >= 1 && idx <= units.length)) return { ok: false, note: `${edition}${vol} 第${unitRef[1]}${unitRef[0].slice(-1)} 越界（${start}–${start + units.length - 1}）` };
    const nameRef = meta.match(/《([^》]{2,24})》/);
    const lessonRef = meta.match(/第(\d+)课/);
    const lessons = book[vol].lessons || {};
    if (lessonRef && nameRef) {
      // 单元+课级引用：《》是课名，按课目表核对；该课未收录时不拦（目录按引用逐步补全）
      if (lessons[lessonRef[1]] && !meta.includes(lessons[lessonRef[1]])) {
        return { ok: false, note: `${edition}${vol} 第${lessonRef[1]}课是《${lessons[lessonRef[1]]}》` };
      }
    } else if (nameRef) {
      // 单元级引用：《》是单元名，包含匹配（容忍副题）
      const expect = units[idx - 1];
      if (!nameRef[1].includes(expect.replace(/：.*$/, '')) && !expect.includes(nameRef[1])) {
        return { ok: false, note: `${edition}${vol} 第${unitRef[1]}单元是《${expect}》，meta 写《${nameRef[1]}》` };
      }
    }
  }
  return { ok: true, note: '全量核验' };
}
