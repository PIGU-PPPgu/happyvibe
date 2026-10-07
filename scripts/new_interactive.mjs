// 脚手架：从课题+教材锚点一键生成资源骨架（harness v2 L0→L2 入口）
// 用法：node scripts/new_interactive.mjs <subject> <slug> --title "..." --anchor "北师大版七上第二章《有理数及其运算》· 2.4" [--archetype numberline] [--hint "..."]
// 产物：src/interactives/<subject>/<slug>/{index.mjs,meta.json,spec.json} + src/content/resources/<subject>/<slug>.md（教学设计骨架）
// 锚点先校验（textbook-index），不通过直接退出——G11 前置，不把假锚点带进产物。
import { writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { validateTextbookAnchor } from './textbook-index.mjs';

const SUBJECT_CN = { math: '数学', chinese: '语文', history: '历史', english: '英语', science: '科学', physics: '物理', chemistry: '化学', biology: '生物', geography: '地理', morality: '道法', it: '信息科技' };
const ARCHETYPES = ['numberline', 'custom'];

const argv = process.argv.slice(2);
const subject = argv[0], slug = argv[1];
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const title = opt('title'), anchor = opt('anchor');
const archetype = opt('archetype') || 'custom';
const hint = opt('hint') || '拖动画面中的金色元素改变数值，键盘左右键微调；点左栏章节切换教学环节。';

if (!subject || !slug || !title || !anchor) {
  console.error('用法: node scripts/new_interactive.mjs <subject> <slug> --title "课题" --anchor "教材锚点" [--archetype numberline] [--hint "操作提示"]');
  process.exit(1);
}
if (!SUBJECT_CN[subject]) { console.error(`未知学科 ${subject}（支持: ${Object.keys(SUBJECT_CN).join('/')}）`); process.exit(1); }
if (!ARCHETYPES.includes(archetype)) { console.error(`未知原型 ${archetype}（支持: ${ARCHETYPES.join('/')}）`); process.exit(1); }

// 1) 锚点校验前置
const verdict = validateTextbookAnchor(SUBJECT_CN[subject], anchor);
if (!verdict.ok) { console.error(`锚点未过校验: ${verdict.note}\n先查 scripts/textbook-index.mjs 的目录库，或修正锚点写法（版本+册次+《单元》+节次）`); process.exit(1); }
console.log(`锚点校验通过: ${verdict.note}`);

// 2) 目录与产物
const dir = `src/interactives/${subject}/${slug}`;
const exists = await access(dir).then(() => true, () => false);
if (exists) { console.error(`已存在 ${dir}，拒绝覆盖`); process.exit(1); }
await mkdir(dir, { recursive: true });

const meta = { title, hint, kind: archetype === 'numberline' ? 'interactive-2d' : 'interactive-2d' };
await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

// SPEC：numberline 原型参数骨架（做一版时按课题调 modes/readouts）
const spec = archetype === 'numberline'
  ? { archetype: 'numberline', range: 6, step: 0.5, bands: true, grid: true, modes: ['sanys', 'free', 'mirror'], readouts: ['p', 'opp', 'abs', 'cmp'] }
  : { archetype: 'custom' };
await writeFile(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2) + '\n');

const idx = archetype === 'numberline'
  ? `import { init } from '../../_shared/runtime.mjs';
import { mountNumberLine } from '../../_shared/scenes/numberline.mjs';
// 场景原型参数（spec.json 同步维护）：modes 三要素/自由拖动/对称演示，或 ['add'] 加法行程
const SPEC = ${JSON.stringify(spec, null, 2).split('\n').slice(1, -1).join('\n')};

const TEACHING = {
  meta: '${SUBJECT_CN[subject]}·七年级｜${anchor}',
  steps: [
    { name: '想一想', guide: '先让学生观察画面并说出看到了什么，再抛出本课核心问题，引导他们用已有经验猜一猜。', note: '讲解词一：写清本环节的知识是什么、为什么这样规定、与前面知识的联系。至少四十字，覆盖一个完整知识点，投屏时教师可照读。', apply: () => api.setNlMode('sanys') },
    { name: '做一做', guide: '让学生上台拖动或用方向键操作，观察读数变化，把发现用自己的话说给同桌听。', note: '讲解词二：写清操作背后的数学规则、常见错误与纠正办法。至少四十字，覆盖一个完整知识点。', apply: () => api.setNlMode('free') },
    { name: '议一议', guide: '小组讨论：变化中的不变规律是什么？用一句话概括，再全班交流。', note: '讲解词三：写清规律的语言表述与符号表述如何对应、如何落到做题。至少四十字。', apply: () => api.setNlMode('mirror') },
  ],
  summary: '本课小结：把三个环节的结论串成一段完整的话，说清规则、几何意义与易错点。',
  quiz: [
    { q: '关于本课知识点一的判断，正确的是？', opts: ['正确表述', '错误表述甲', '错误表述乙', '错误表述丙'], a: 0, why: '解析要讲清为什么对、其余选项错在哪，不少于四十字。' },
    { q: '本课知识点二的应用题，答案是多少？', opts: ['选项甲', '选项乙', '选项丙', '选项丁'], a: 0, why: '解析写清步骤与依据，不少于四十字。' },
    { q: '本课知识点三的辨析题，正确的是？', opts: ['选项甲', '选项乙', '选项丙', '选项丁'], a: 0, why: '解析写清概念边界，不少于四十字。' },
    { q: '下列说法错误的是？', opts: ['说法甲', '说法乙', '说法丙', '说法丁'], a: 0, why: '解析写清易错点与纠正，不少于四十字。' },
  ],
};
let api;
init({ teaching: TEACHING, mount(stage, _api) { api = _api; mountNumberLine(stage, api, SPEC); } });
`
  : `import { init } from '../../_shared/runtime.mjs';
// custom 原型：场景全部手写（参考 math-number-line / history-bronze 的结构）
const TEACHING = { /* 同 numberline 分支的教学契约结构，逐项填 */ };
init({ teaching: TEACHING, mount(stage, api) { /* 场景 + 自检断言（数值读数必须含「同源-」断言） */ } });
`;
await writeFile(path.join(dir, 'index.mjs'), idx);

// resources md 骨架（设计先行：先填这个表再改代码）
const [anchorHead, anchorTail] = anchor.split('·');
const md = `---
title: ${title}
subject: ${subject}
stage: junior
grades: [7]
topic: ${(anchorTail || anchor).trim().replace(/^\\s*/, '')}
kind: interactive-2d
file: ${slug}
usage: 讲${(anchorTail || anchor).trim()}时投屏：学生先说观察，再轮流上台操作，读数卡同步核对结论。
tags: [待填知识点一, 待填知识点二, 待填知识点三]
status: draft
order: 90
---

## 教学设计（先填此表，再改代码）

**教材锚点**：${anchor}（已过 textbook-index 校验：${verdict.note}）

**学习目标**

1. 待填：知识与技能。
2. 待填：过程与方法（借本资源的哪个操作）。

**易错点预设**

- 待填：典型错误与资源里哪个画面能纠正它。

**环节设计**

| 环节 | 学生活动 | 教师提问 | 资源状态 |
|---|---|---|---|
| 想一想 | 观察画面，说发现 | 核心问题一句话 | 初始标注态 |
| 做一做 | 上台拖动/按键操作 | 追问变化规律 | 自由操作态 |
| 议一议 | 小组归纳并汇报 | 用一句话概括 | 对比/规律态 |

**检测设计（5 题，与 quiz 一致）**

| 题干要点 | 答案 | 解析要点 |
|---|---|---|
| 待填 | 待填 | 待填 |

**双版映射**：主用 ${anchorHead.trim()}；人教版对应课时待查后补。
`;
await mkdir(`src/content/resources/${subject}`, { recursive: true });
await writeFile(`src/content/resources/${subject}/${slug}.md`, md);

console.log(`已生成:
  ${dir}/index.mjs（${archetype} 薄壳 + 教学契约骨架）
  ${dir}/meta.json / spec.json
  src/content/resources/${subject}/${slug}.md（教学设计骨架，先填表再动代码）
下一步: 填 TEACHING 与教学设计表（环节用教材动词）→ npm run verify → node scripts/ship.mjs "..."`);
