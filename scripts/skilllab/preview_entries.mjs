// 版式预览用的假条目：node scripts/skilllab/preview_entries.mjs write [数量] | clean
// 生成的条目以 zz-preview- 开头，分数是按规则从假证据算出来的，只为看版式。
// check_skills 会拦住它们，不许提交。看完务必 clean。
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { CATEGORIES, CHECKLISTS, TASKS, TEXTBOOK_CATEGORIES } from '../../src/data/skill-standard.ts';
import { computeDims } from '../../src/lib/skillScore.ts';

const DIR = 'src/content/skills';
const PREFIX = 'zz-preview-';
const [cmd = '', nArg = '12'] = process.argv.slice(2);

if (cmd === 'clean') {
  const files = readdirSync(DIR).filter((x) => x.startsWith(PREFIX));
  for (const f of files) rmSync(`${DIR}/${f}`);
  console.log(`已删除 ${files.length} 条版式预览假条目`);
} else if (cmd === 'write') {
  const n = Number(nArg);
  const ready = CATEGORIES.filter((c) => CHECKLISTS[c.key]);
  for (let i = 0; i < n; i++) {
    const cat = ready[i % ready.length];
    const task = TASKS.find((t) => t.category === cat.key && t.role === 'main');
    const edits = i % 5;
    const checklist = CHECKLISTS[cat.key].map((c, j) => ({ id: c.id, pass: (j + i) % 4 !== 0, note: '' }));
    const layer = i % 3 === 0 ? 'same-model' : 'free-tier';
    // 教材抽检只给备课教案与命题作业两个品类，和真实条目一致
    const textbookCheck = TEXTBOOK_CATEGORIES.includes(cat.key) ? { total: 3, passed: 2 } : undefined;
    const runs = [1, 2, 3].map((r) => ({ task: task.id, triggered: true, seconds: 70 + r * 9, edits, severe: 0 }));
    const evidence = {
      category: cat.key, frequency: task.frequency, runs,
      baseline: { edits: 6, severe: 1, seconds: 95 }, checklist, textbookCheck,
      installSteps: 3, requires: [], platformComplete: false,
      audit: { network: 'none', credentials: false, studentData: 'none', overRead: false },
    };
    const data = {
      name: `${PREFIX}${i + 1}`, title: `预览技能 ${i + 1}`, category: cat.key,
      does: '版式预览用的假条目，用来看卡片和榜单的排版。',
      summary: '这一段是假的，只占位置。'.repeat(3),
      source: { kind: 'own', author: '版式预览', url: 'https://example.invalid/preview' },
      distribution: 'link', platforms: ['workbuddy'], composition: 'prompt', requires: [],
      install: { workbuddy: ['第一步', '第二步', '第三步'] }, trigger: '帮我做这件事', examples: ['帮我做这件事'],
      cautions: [], relatedLessons: [], status: 'tested',
      score: {
        task: task.id, dims: computeDims(evidence),
        notes: { value: '版式预览用的假依据。', quality: '版式预览用的假依据。', ease: '版式预览用的假依据。', edu: '版式预览用的假依据。', safety: '版式预览用的假依据。' },
        verdict: '版式预览用的假条目，不是真实评测结果。', weakness: '版式预览用的假短板，只占位置。',
        tested: {
          date: '2026-11-24', agent: 'ZCode 后台会话', by: 'ai', skillVersion: '0.0.0', layer, loadedBy: 'named',
          model: layer === 'same-model' ? 'deepseek-v4.1-flash' : 'GLM-5.3-Flash',
        },
        ...(layer === 'same-model' ? { prior: { layer: 'free-tier', model: 'GLM-5.3-Flash', total: 8.4, date: '2026-11-24' } } : {}),
        platformComplete: false, runs, baseline: evidence.baseline, checklist,
        ...(textbookCheck ? { textbookCheck } : {}),
        audit: evidence.audit, overrides: [],
      },
    };
    const body = [
      '#### 输出样例', '', '这里是假的输出样例，只占位置。'.repeat(8), '',
      '#### 修改处清单', '', '这里是假的修改处说明，只占位置，写满四十个字以便看清段落间距。'.repeat(4), '',
      '#### 我看到的', '', '这里是假的观察记录，只占位置，写满四十个字以便看清段落间距。'.repeat(4),
    ].join('\n');
    writeFileSync(`${DIR}/${PREFIX}${i + 1}.md`, `---\n${yaml.dump(data, { lineWidth: 200, noRefs: true })}---\n\n${body}\n`);
  }
  console.log(`已生成 ${n} 条版式预览假条目，看完务必执行 clean`);
} else {
  console.log('用法：node scripts/skilllab/preview_entries.mjs write [数量] | clean');
  process.exit(2);
}
