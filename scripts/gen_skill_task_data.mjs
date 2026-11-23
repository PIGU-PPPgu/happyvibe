// 生成固定测试任务 AN-1 的脱敏成绩表：node scripts/gen_skill_task_data.mjs
// 固定随机种子，每次生成结果完全相同。45 名学生，学号 S01 到 S45，语数英三科，含 2 个缺考（空单元格）。
// 成绩表里没有任何真实学生信息。
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'public/skill-tasks/grade-sample.csv';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261124);
const gauss = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const score = (mean, sd, max) => Math.max(0, Math.min(max, Math.round(mean + sd * gauss())));

// 语数英三科的满分、均分、标准差：贴近初一一个中等班的常见分布
const SUBJECTS = [
  { name: '语文', max: 120, mean: 88, sd: 12 },
  { name: '数学', max: 100, mean: 72, sd: 18 },
  { name: '英语', max: 120, mean: 84, sd: 16 },
];
// 缺考：S17 数学，S38 英语
const ABSENT = { 17: '数学', 38: '英语' };

const lines = [['学号', ...SUBJECTS.map((s) => s.name)].join(',')];
const sums = SUBJECTS.map(() => ({ sum: 0, n: 0 }));
for (let i = 1; i <= 45; i++) {
  const id = `S${String(i).padStart(2, '0')}`;
  const row = [id];
  SUBJECTS.forEach((s, k) => {
    if (ABSENT[i] === s.name) {
      row.push('');
      return;
    }
    const v = score(s.mean, s.sd, s.max);
    sums[k].sum += v;
    sums[k].n++;
    row.push(String(v));
  });
  lines.push(row.join(','));
}

mkdirSync('public/skill-tasks', { recursive: true });
writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`已写入 ${OUT}：45 名学生，缺考 ${Object.keys(ABSENT).length} 处`);
SUBJECTS.forEach((s, k) => console.log(`  ${s.name} 实考 ${sums[k].n} 人，平均 ${((sums[k].sum / sums[k].n).toFixed(2))}（满分 ${s.max}）`));
