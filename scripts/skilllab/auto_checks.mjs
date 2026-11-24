// 脚本可判定的事实：只报数字和有无，不判好坏。评审模型和人都看得到这些数。node 可直跑（scripts/test_skilllab.mjs）。
// 设计见 docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md §5.1
/** 任务指定的教材标识：输出里缺任何一个，这一轮的教材核对就不过。 */
export const TEXTBOOK_MARKS = {
  'LP-1': ['北师大版', '七年级', '数轴'],
  'LP-2': ['人教版', '八年级', '函数'],
  'EX-1': ['人教版', '八年级', '一次函数'],
};

const SEGMENT_WORD =
  /环节|阶段|步骤|导入|引入|新课|新授|讲授|探究|活动|讨论|练习|巩固|小结|总结|作业|检测|拓展|复习|热身|提问/;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/** 教案：各环节标注的分钟数、课时长度、作业与检测的有无。 */
export function lessonPlanFacts(text) {
  const minutes = [];
  // 数的前面不能是数字或小数点，免得把「20」拆成「2」和「0」；环节关键词到这一行的开头去找
  for (const m of text.matchAll(/(?<![\d.])(\d{1,2})\s*分钟/g)) {
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    if (SEGMENT_WORD.test(text.slice(lineStart, m.index))) minutes.push(Number(m[1]));
  }
  return {
    segmentMinutes: minutes,
    segmentMinutesSum: sum(minutes),
    states45Minutes: /45\s*分钟/.test(text),
    mentionsHomework: /作业|课后练习/.test(text),
    mentionsCheck: /当堂检测|课堂检测|随堂检测|当堂练习|课堂练习|检测题/.test(text),
  };
}

/** 试卷：分值标注、满分与时长、答案与细目表的有无。 */
export function examFacts(text) {
  const marks = [...text.matchAll(/(\d{1,3})\s*分(?![钟析类层布段别数式之支])/g)].map((m) => Number(m[1]));
  return {
    scoreMarks: marks,
    scoreMarksSum: sum(marks),
    states100Points: /100\s*分/.test(text),
    states45Minutes: /45\s*分钟/.test(text),
    hasAnswer: /参考答案|答案与解析|答案解析|答案/.test(text),
    hasBlueprint: /双向细目表|细目表/.test(text),
    bigSections: [...text.matchAll(/(?:^|\n)\s*[一二三四五六七八九十]+、/g)].length,
  };
}

/** 错题辅导：变式的个数、答案的有无、有没有说出正确距离 5。 */
export function homeworkFacts(text) {
  return {
    variantMentions: [...text.matchAll(/变式/g)].length,
    hasAnswer: /答案/.test(text),
    mentionsFive: /(?<![\d.])5(?![\d.])/.test(text),
    explainsWhy: /绝对值|单位长度|相减|减去|右减左|大减小|距离/.test(text),
  };
}

/** 成绩表真值：语文、英语 120 分制 72 分及格，数学 100 分制 60 分及格。空值记缺考。 */
export function gradeStats(csvText) {
  const rows = csvText.trim().split(/\r?\n/).filter(Boolean);
  const subjects = rows[0].split(',').slice(1);
  const passLine = { 语文: 72, 数学: 60, 英语: 72 };
  const out = {};
  for (const s of subjects) out[s] = { count: 0, absent: 0, sum: 0, pass: 0, max: 0, min: Infinity };
  for (const row of rows.slice(1)) {
    row.split(',').slice(1).forEach((v, i) => {
      const o = out[subjects[i]];
      if (v.trim() === '') {
        o.absent++;
        return;
      }
      const n = Number(v);
      o.count++;
      o.sum += n;
      if (n >= (passLine[subjects[i]] ?? 60)) o.pass++;
      o.max = Math.max(o.max, n);
      o.min = Math.min(o.min, n);
    });
  }
  for (const o of Object.values(out)) {
    o.mean = o.count ? Math.round((o.sum / o.count) * 10) / 10 : 0;
    o.passRate = o.count ? Math.round((o.pass / o.count) * 100) : 0;
    if (!Number.isFinite(o.min)) o.min = 0;
  }
  return out;
}

/** 学情分析：产出有没有引用成绩表里的真值。 */
export function analysisFacts(text, csvText) {
  const truth = gradeStats(csvText);
  const cited = {};
  for (const [s, o] of Object.entries(truth)) {
    cited[s] = { mean: text.includes(String(o.mean)), passRate: text.includes(`${o.passRate}%`) || text.includes(`${o.passRate}％`) };
  }
  const absents = sum(Object.values(truth).map((o) => o.absent));
  return {
    truth,
    cited,
    mentionsAbsent: absents > 0 && /缺考|缺测|未参加|请假/.test(text),
  };
}

/** 家校信：字数、家长会时间、分条建议数、有没有排名点名。 */
export function letterFacts(text) {
  const cjk = [...text].filter((c) => /[\u4e00-\u9fff]/.test(c)).length;
  const items = [...text.matchAll(/(?:^|\n)[ \t]*(?:[1-9][.．、]|[一二三四五][、.]|[①②③④⑤⑥⑦⑧⑨])/g)].length;
  return {
    cjkChars: cjk,
    statesThursday: /下周四|周四|星期四/.test(text),
    statesSevenPm: /晚上\s*(?:7|七)\s*点|19[:：]00/.test(text),
    numberedItems: items,
    mentionsRanking: /排名|名列|名次|排在第|倒数第|第\s*[一二三四五六七八九十\d]+\s*名/.test(text),
  };
}

export function textbookCheck(taskId, text) {
  const marks = TEXTBOOK_MARKS[taskId] ?? [];
  return { total: marks.length, passed: marks.filter((m) => text.includes(m)).length };
}

/** 按任务分发。 */
export function autoChecks(taskId, text, { csvText } = {}) {
  const facts = { taskId };
  if (taskId === 'LP-1' || taskId === 'LP-2') Object.assign(facts, lessonPlanFacts(text), { textbook: textbookCheck(taskId, text) });
  else if (taskId === 'EX-1') Object.assign(facts, examFacts(text), { textbook: textbookCheck(taskId, text) });
  else if (taskId === 'HW-1') Object.assign(facts, homeworkFacts(text));
  else if (taskId === 'AN-1') Object.assign(facts, analysisFacts(text, csvText ?? ''));
  else if (taskId === 'HS-1') Object.assign(facts, letterFacts(text));
  return facts;
}
