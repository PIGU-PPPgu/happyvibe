# 资源中心与 Skill 工坊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把资源库、工具箱、Skill 工坊合成「资源中心」，并建立一套分数从实测记录算出来的 Skill 评价标准。

**Architecture:** 评价标准是一份纯数据文件加一个纯函数评分库，页面与校验脚本共用同一份，保证页面上写的规则和脚本里算的规则不会走样。技能条目是 Astro 内容集合，frontmatter 存证据，总分构建期算出。资源中心页头是三个板块入口页共用的组件，各板块保留原地址。

**Tech Stack:** Astro 5、TypeScript（Node 24 直跑）、zod、Pagefind、archify（流程图）、Playwright（截图验收）。

**执行方式:** 本会话内联执行（superpowers:executing-plans）。不派子代理做页面：每个页面都要主会话亲眼截图验收，WorkBuddy 代测也只能由主会话做。

## Global Constraints

- 规范仓库 `~/src/happyvibe`，分支 `feat/resource-center-skill-workshop`。不碰会话默认的 iCloud 副本。
- 设计文档 `docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md`，一切以它为准。
- 三个板块地址不变：课件 `/resources/`、工坊 `/skills/`、工具箱 `/toolbox/`。全站既有站内链接不得失效。
- 站内 authored 文本无 emoji；按钮、标题、标签只写干净的名字；不用「一键」「轻松搞定」等填充词；不替读者下结论。
- 沿用 `src/styles/tokens.css`，深浅双主题，零外部字体。
- 只读对待 `~/.workbuddy`：只往 `~/.workbuddy/skills/` 放 `hvtest-` 前缀的测试目录，用完删除。
- 镜像技能源码原样拷贝，不改一字。
- 不部署、不合并到 main，直到用户看过截图确认。
- 每个 Task 结束提交一次，提交后 `git log --oneline -1` 核对。

---

### Task 1: 评价标准数据与评分算法（TDD）

**Files:**
- Create: `src/data/skill-standard.ts`
- Create: `src/lib/skillScore.ts`
- Create: `scripts/test_skill_score.mjs`

**Interfaces:**

```ts
// skill-standard.ts（纯数据，不 import Astro 模块）
export type DimKey = 'value' | 'quality' | 'ease' | 'edu' | 'safety';
export type CategoryKey = 'lesson-plan' | 'assignment' | 'analysis' | 'courseware'
  | 'home-school' | 'class-management' | 'research' | 'office';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'termly';
export const DIMS: readonly { key: DimKey; label: string; weight: number; question: string; anchors: Record<'1'|'2'|'3'|'4'|'5', string> }[];
export const TIERS: readonly { min: number; label: string; meaning: string }[];   // min 降序
export const RED_LINES: readonly string[];
export const CATEGORIES: readonly { key: CategoryKey; label: string; icon: string; module: string }[];
export type CheckItem = { id: string; kind: 'Q' | 'E'; rule?: boolean; text: string };
export const CHECKLISTS: Partial<Record<CategoryKey, readonly CheckItem[]>>;
export type TaskDef = { id: string; category: CategoryKey; role: 'main' | 'second'; note?: string; frequency: Frequency; prompt: string; attach?: string };
export const TASKS: readonly TaskDef[];
export const PROTOCOL: readonly { title: string; detail: string }[];
export const RULES: readonly string[];
export const STANDARD: { version: string; date: string; changes: string[] };

// skillScore.ts
export type Audit = { network: 'none' | 'declared' | 'undeclared'; credentials: boolean; studentData: 'none' | 'local'; overRead: boolean };
export type Run = { task: string; triggered: boolean; seconds: number; edits: number; severe: number; shot?: string };
export type Evidence = {
  category: CategoryKey; frequency: Frequency; runs: Run[];
  baseline: { edits: number; severe: number; seconds: number };
  checklist: { id: string; pass: boolean; note: string }[];
  textbookCheck?: { total: number; passed: number };
  installSteps: number; requires: readonly string[]; platformComplete: boolean; audit: Audit;
};
export function computeValue(e: Evidence): number;
export function computeQuality(e: Evidence): number;
export function computeEdu(e: Evidence): number;
export function computeEase(e: Evidence): number;
export function computeSafety(e: Evidence): number;
export function computeDims(e: Evidence): Record<DimKey, number>;
export function total(dims: Record<DimKey, number>): number;   // 一位小数
export function tierOf(total: number): string;
```

- [ ] **Step 1: 写失败的测试** `scripts/test_skill_score.mjs`，`node:assert/strict`，覆盖每条规则的分支边界：

```js
import assert from 'node:assert/strict';
import { CHECKLISTS, DIMS, TIERS, TASKS, CATEGORIES } from '../src/data/skill-standard.ts';
import { computeValue, computeQuality, computeEdu, computeEase, computeSafety, computeDims, total, tierOf } from '../src/lib/skillScore.ts';

const run = (edits, severe = 0, triggered = true) => [1, 2, 3].map(() => ({ task: 'LP-1', triggered, seconds: 90, edits, severe }));
const it = (kind, n, pass, rule = false) => Array.from({ length: n }, (_, i) => ({ id: `${kind}${i}-${pass}-${rule}`, kind, rule, pass, text: '' }));
// 教案检查单 4 个 Q、8 个 E；参数是不过的条数，failRule 属于 E
const lp = (failQ = 0, failE = 0, failRule = 0) => [
  ...it('Q', 4 - failQ, true), ...it('Q', failQ, false),
  ...it('E', 8 - failE - failRule, true), ...it('E', failE, false), ...it('E', failRule, false, true),
];
const base = (o = {}) => ({
  category: 'lesson-plan', frequency: 'daily', runs: run(2),
  baseline: { edits: 8, severe: 1, seconds: 70 }, checklist: lp(), textbookCheck: { total: 3, passed: 3 },
  installSteps: 3, requires: [], platformComplete: true,
  audit: { network: 'none', credentials: false, studentData: 'none', overRead: false }, ...o,
});

// 省时
assert.equal(computeValue(base()), 5);
assert.equal(computeValue(base({ frequency: 'weekly' })), 5);
assert.equal(computeValue(base({ runs: run(6) })), 4);                                               // gain 0.25
assert.equal(computeValue(base({ baseline: { edits: 1, severe: 0, seconds: 70 } })), 2);              // 裸问已够好
assert.equal(computeValue(base({ runs: run(9) })), 1);                                               // 不比裸问好
assert.equal(computeValue(base({ frequency: 'monthly' })), 4);
assert.equal(computeValue(base({ frequency: 'monthly', runs: run(6) })), 3);
assert.equal(computeValue(base({ frequency: 'termly' })), 2);

// 出活
assert.equal(computeQuality(base()), 5);
assert.equal(computeQuality(base({ runs: run(5) })), 3);                                             // 全过但改 5 处
assert.equal(computeQuality(base({ checklist: lp(1) })), 5);                                         // 11/12
assert.equal(computeQuality(base({ checklist: lp(2) })), 4);                                         // 10/12
assert.equal(computeQuality(base({ checklist: lp(2, 1) })), 3);                                      // 9/12
assert.equal(computeQuality(base({ checklist: lp(2), runs: run(5) })), 3);                           // 0.833 但改 5 处
assert.equal(computeQuality(base({ runs: [{ ...run(2)[0], severe: 1 }, ...run(2).slice(1)] })), 2);  // 严重错误合计 1
assert.equal(computeQuality(base({ runs: [{ ...run(2)[0], severe: 1 }, { ...run(2)[1], severe: 1 }, ...run(2).slice(2)] })), 1);
assert.equal(computeQuality(base({ checklist: lp(4, 4) })), 1);                                      // 4/12

// 懂教育
assert.equal(computeEdu(base()), 5);
assert.equal(computeEdu(base({ checklist: lp(0, 2) })), 4);                                          // 6/8
assert.equal(computeEdu(base({ checklist: lp(0, 4) })), 3);                                          // 4/8
assert.equal(computeEdu(base({ checklist: lp(0, 5) })), 2);                                          // 3/8
assert.equal(computeEdu(base({ checklist: lp(0, 6) })), 1);                                          // 2/8
assert.equal(computeEdu(base({ textbookCheck: { total: 3, passed: 2 } })), 4);
assert.equal(computeEdu(base({ textbookCheck: { total: 3, passed: 1 } })), 3);
assert.equal(computeEdu(base({ checklist: lp(0, 0, 1) })), 1);                                       // 规矩项不过

// 好上手
assert.equal(computeEase(base()), 5);
assert.equal(computeEase(base({ installSteps: 4 })), 4);
assert.equal(computeEase(base({ requires: ['python'] })), 4);
assert.equal(computeEase(base({ runs: run(2, 0, true).map((r, i) => (i === 0 ? { ...r, triggered: false } : r)) })), 4);   // 触发 2/3
assert.equal(computeEase(base({ runs: run(2).map((r, i) => (i === 0 ? r : { ...r, triggered: false })) })), 3);            // 触发 1/3
assert.equal(computeEase(base({ runs: run(2, 0, false) })), 2);                                           // 触发 0/3
assert.equal(computeEase(base({ platformComplete: false })), 4);
assert.equal(computeEase(base({ requires: ['api-key'] })), 2);
assert.equal(computeEase(base({ requires: ['paid'] })), 1);
assert.equal(computeEase(base({ installSteps: 4, requires: ['python'], runs: run(2).map((r, i) => (i === 2 ? { ...r, triggered: false } : r)) })), 2);

// 放心用
const audit = (o) => ({ audit: { ...base().audit, ...o } });
assert.equal(computeSafety(base()), 5);
assert.equal(computeSafety(base(audit({ network: 'declared' }))), 4);
assert.equal(computeSafety(base(audit({ network: 'undeclared' }))), 2);
assert.equal(computeSafety(base(audit({ credentials: true }))), 3);
assert.equal(computeSafety(base(audit({ studentData: 'local' }))), 3);
assert.equal(computeSafety(base(audit({ overRead: true }))), 2);
assert.equal(computeSafety(base(audit({ credentials: true, network: 'declared' }))), 3);

// 合成
assert.deepEqual(computeDims(base()), { value: 5, quality: 5, ease: 5, edu: 5, safety: 5 });
assert.equal(total({ value: 5, quality: 5, ease: 5, edu: 5, safety: 5 }), 10);
assert.equal(total({ value: 4, quality: 4, ease: 5, edu: 4, safety: 5 }), 8.7);
assert.equal(tierOf(9), '必装');
assert.equal(tierOf(8.99), '好用');
assert.equal(tierOf(7.5), '可用');
assert.equal(tierOf(6), '勉强');
assert.equal(tierOf(5.99), '不推荐');

// 标准数据自洽
assert.equal(DIMS.reduce((s, d) => s + d.weight, 0), 100);
assert.ok(DIMS.every((d) => [1, 2, 3, 4, 5].every((n) => d.anchors[String(n)]?.length > 0)));
assert.deepEqual(TIERS.map((t) => t.min), [...TIERS.map((t) => t.min)].sort((a, b) => b - a));
for (const [cat, list] of Object.entries(CHECKLISTS)) {
  assert.ok(CATEGORIES.some((c) => c.key === cat), `检查单 ${cat} 不在品类表里`);
  assert.equal(new Set(list.map((x) => x.id)).size, list.length, `${cat} 编号重复`);
  assert.ok(list.some((x) => x.kind === 'Q') && list.some((x) => x.kind === 'E'), `${cat} 缺 Q 或 E`);
}
assert.ok(TASKS.every((t) => CATEGORIES.some((c) => c.key === t.category)));
console.log('skillScore tests: PASS');
```

- [ ] **Step 2: 跑测试确认失败** `node scripts/test_skill_score.mjs` → `ERR_MODULE_NOT_FOUND`
- [ ] **Step 3: 写 `skill-standard.ts`** 内容逐字取自设计文档 §3.2 到 §3.8。纯数据。
- [ ] **Step 4: 写 `skillScore.ts`** 规则逐条取自设计文档 §3.3。
- [ ] **Step 5: 跑测试到全过** `node scripts/test_skill_score.mjs` → `skillScore tests: PASS`
- [ ] **Step 6: 提交**

### Task 2: skills 内容集合与条目加载

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/skillEntries.ts`

**Interfaces:**
- Produces: `export async function loadSkills(): Promise<{ tested: ScoredSkill[]; pending: SkillEntry[]; rejected: SkillEntry[] }>`，`ScoredSkill = { slug; data; body; total; tier; evidence: Evidence }`，tested 按 total 降序。

- [ ] Step 1: `content.config.ts` 加 `skills` 集合与 schema，字段名照设计文档 §4.1 的 YAML。
- [ ] Step 2: 写 `skillEntries.ts`。
- [ ] Step 3: `npx astro sync` 通过。
- [ ] Step 4: 提交。

### Task 3: 脚本

**Files:**
- Create: `scripts/audit_skill.mjs`、`scripts/gen_skill_task_data.mjs`、`scripts/check_skills.mjs`、`scripts/build_skill_packages.mjs`、`scripts/check_links.mjs`
- Modify: `package.json`、`scripts/verify.mjs`

- [ ] Step 1: `audit_skill.mjs <dir> [--json <out>]`，从 `/tmp/hv-skill-vet-tools/scan.mjs` 改成单目录版。对 `/tmp/hv-skill-vet/src/qizhitang__xiaozhi-skills/teacher/general/xiaozhi-teach-lesson-planner` 跑一次，构成应为 `resources`、零风险命中。
- [ ] Step 2: `gen_skill_task_data.mjs`，固定种子，产出 45 行、2 个缺考。
- [ ] Step 3: `check_skills.mjs`。用一条临时故意写错分数的条目验证它会报错，验证完删除。
- [ ] Step 4: `build_skill_packages.mjs`。用一个临时技能目录验证 zip 结构后删除。
- [ ] Step 5: `check_links.mjs`，在当前构建上跑通。
- [ ] Step 6: `package.json` 加 `build:skills`、`check:skills`、`test:score`、`check:links`；`build` 最前面加 `build:skills`；`verify.mjs` 加一阶段。
- [ ] Step 7: 提交。

### Task 4: 资源中心页头与全站接入

**Files:**
- Create: `src/components/ResourceHubHeader.astro`
- Modify: `src/components/SiteHeader.astro`、`SiteFooter.astro`、`OnboardingTour.astro`、`SearchModal.astro`、`src/pages/index.astro`、`sitemap.astro`、`analytics.astro`、`toolbox.astro`

**Interfaces:**
- `ResourceHubHeader.astro` props: `{ active: 'courseware' | 'skills' | 'toolbox'; note?: string }`。

- [ ] Step 1: 组件与导航改动，逐项照设计文档 §2.2、§5.1、§5.7。
- [ ] Step 2: `npm run build && node scripts/check_links.mjs`，零 404。
- [ ] Step 3: 截 `/toolbox/`、首页，深浅各一张，目视。
- [ ] Step 4: 提交。

### Task 5: 课件板块重做

**Files:**
- Create: `src/components/ResourceCard.astro`
- Modify: `src/pages/resources/index.astro`、`src/pages/resources/[subject].astro`

- [ ] Step 1: `ResourceCard`，两页共用，消掉现有重复的卡片标记与样式。
- [ ] Step 2: 首页重做，照设计文档 §5.2。
- [ ] Step 3: 学科页套页头并用 `ResourceCard`。
- [ ] Step 4: 截首页与学科页，1440 与 375 宽、深浅各一张，逐张目视。
- [ ] Step 5: 提交。

### Task 6: 课件详情页

**Files:**
- Create: `src/pages/resources/[subject]/[slug].astro`
- Modify: `src/content.config.ts`（`quickstart`、`relatedLessons`）、两份资源 md

- [ ] Step 1: 在浏览器里逐页走一遍两件课件，记下真实按键与按钮，再写 `quickstart`（设计文档 §4.4：写之前必须点过）。
- [ ] Step 2: 详情页，照设计文档 §5.3。
- [ ] Step 3: `quickstart` 逐步照做一遍。
- [ ] Step 4: 截两件详情页深浅各一张，目视。
- [ ] Step 5: 提交。

### Task 7: 评价标准页

**Files:**
- Create: `src/pages/skills/standard.astro`
- Create: archify 产物 `public/interactives/skill-eval-flow.html`（`.gitignore` 白名单加一行）

- [ ] Step 1: 用 archify 写流程图 JSON，`validate` 与 `deliver` 全绿。
- [ ] Step 2: 页面照设计文档 §5.6，全部数据从 `skill-standard.ts` 取，不手抄。
- [ ] Step 3: 截图目视。
- [ ] Step 4: 提交。

### Task 8: 工坊首页与技能详情页

**Files:**
- Create: `src/pages/skills/index.astro`、`src/pages/skills/[slug].astro`
- Create: `src/components/SkillCard.astro`、`src/components/ScoreCard.astro`

- [ ] Step 1: 先完成第一个真实评测（Task 9 的第一个技能），用它的数据驱动页面，不用假数据。
- [ ] Step 2: `ScoreCard`、`SkillCard`、首页、详情页，照设计文档 §5.4、§5.5。
- [ ] Step 3: 深浅、1440 与 375 各截一张，目视。
- [ ] Step 4: 提交。

### Task 9: 首批评测（9 个，一次一个）

每个技能一轮：原样拷贝到 `src/skills/<slug>/` → `audit_skill.mjs` → 通读全部文件 → 放进 `~/.workbuddy/skills/hvtest-<slug>` → WorkBuddy 新会话跑固定任务 → 截图 → 记录 `runs` 与修改处清单 → `check_skills.mjs` 过 → 提交一次。

- [ ] baseline 五道主任务各 1 次。
- [ ] 九个技能各一轮。备选与换选规则照设计文档 §8。
- [ ] 界面自动化连续三次失败即停，向用户说明并请其做一次性登录。

### Task 10: 校准、验收、文档

- [ ] Step 1: 按设计文档 §3.4 校准档位，结论写进 `STANDARD.changes`。
- [ ] Step 2: `npm run verify`、`npm run check:skills`、`node scripts/check_links.mjs` 全绿。
- [ ] Step 3: 全站页面深浅 × 1440/375 截图逐张目视。
- [ ] Step 4: 写 `skills/skill-evaluation/SKILL.md`，`AGENTS.md` 加一条指向它。
- [ ] Step 5: 提交。

### Task 11: 交付

- [ ] 把截图与评测结论交给用户。用户确认后合并到 main、构建、`wrangler pages deploy dist --project-name=happyvibe --branch=main`、curl 线上字节比对、提交。
