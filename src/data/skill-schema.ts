// skills 内容集合的 schema。Astro 构建（astro sync）与 scripts/check_skills.mjs 共用同一份。
// 字段含义见 docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md §4.1
// 纯模块：不碰 astro:content，node 可直跑。
import { z } from 'zod';
import { CATEGORIES, LAYERS, MIRROR_LICENSES, TEXTBOOK_CATEGORIES } from './skill-standard.ts';
import type { CategoryKey, DimKey, LayerKey } from './skill-standard.ts';

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [CategoryKey, ...CategoryKey[]];
const DIM_KEYS = ['value', 'quality', 'ease', 'edu', 'safety'] as const;
const LAYER_KEYS = LAYERS.map((l) => l.key) as [LayerKey, ...LayerKey[]];

const Dim = z.number().int().min(1).max(5);
const Line = z.string().trim().min(1);
/** YAML 会把 2026-11-24 解析成 Date；带引号才是字符串。两种写法都收，统一成 YYYY-MM-DD。 */
const Ymd = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
);

export const skillSchema = z
  .object({
    name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, '小写字母、数字、连字符，最长 64'),
    title: Line,
    category: z.enum(CATEGORY_KEYS),
    does: Line,
    summary: Line,
    source: z.object({
      kind: z.enum(['github', 'skillhub', 'own']),
      author: z.string(),
      repo: z.string().optional(),
      path: z.string().optional(),
      url: z.string().url().optional(),
      commit: z.string().optional(),
      license: z.string().optional(),
      version: z.string().optional(),
      platformScore: z.object({ score: z.number().min(0).max(5), url: z.string().url() }).optional(),
    }),
    distribution: z.enum(['mirror', 'link']),
    platforms: z.array(z.enum(['workbuddy', 'claude-code', 'zcode', 'generic'])).min(1),
    composition: z.enum(['prompt', 'resources', 'scripts']),
    requires: z.array(z.enum(['api-key', 'paid', 'network', 'python', 'node', 'platform-tool'])).default([]),
    install: z.object({ workbuddy: z.array(Line).min(1), generic: z.array(Line).optional() }).optional(),
    trigger: z.string().optional(),
    examples: z.array(Line).optional(),
    cautions: z.array(Line).default([]),
    customize: z.array(Line).optional(),
    relatedLessons: z.array(z.string()).default([]),
    status: z.enum(['tested', 'pending', 'rejected']),
    rejectReason: z.string().optional(),
    score: z
      .object({
        task: Line,
        dims: z.object({ value: Dim, quality: Dim, ease: Dim, edu: Dim, safety: Dim }),
        notes: z.object({ value: Line, quality: Line, ease: Line, edu: Line, safety: Line }),
        verdict: Line,
        weakness: Line,
        tested: z.object({
          date: Ymd,
          agent: Line,
          model: Line,
          by: z.enum(['ai', 'teacher']),
          skillVersion: Line,
          layer: z.enum(LAYER_KEYS),
          loadedBy: z.enum(['natural', 'named']),
        }),
        /** 更低一层的结果。同款复核后保留海选的分数，页面上并列显示。 */
        prior: z
          .object({ layer: z.literal('free-tier'), model: Line, total: z.number().min(0).max(10), date: Ymd })
          .optional(),
        platformComplete: z.boolean(),
        runs: z
          .array(
            z.object({
              task: Line,
              triggered: z.boolean(),
              seconds: z.number().int().min(0),
              edits: z.number().min(0),
              severe: z.number().int().min(0),
              shot: z.string().optional(),
              /** 原始产出的站内路径 */
              output: z
                .string()
                .regex(/^\/skill-reports\/[a-z0-9][a-z0-9-]*\/[a-z0-9-]+\/[A-Za-z0-9.-]+\.md$/, '要写成 /skill-reports/<slug>/<层级>/<轮次>.md')
                .optional(),
            })
          )
          .min(3),
        baseline: z.object({ edits: z.number().min(0), severe: z.number().int().min(0), seconds: z.number().int().min(0) }),
        checklist: z.array(z.object({ id: Line, pass: z.boolean(), note: z.string().default('') })),
        textbookCheck: z.object({ total: z.number().int().positive(), passed: z.number().int().min(0) }).optional(),
        audit: z.object({
          network: z.enum(['none', 'declared', 'undeclared']),
          credentials: z.boolean(),
          studentData: z.enum(['none', 'local']),
          overRead: z.boolean(),
        }),
        overrides: z.array(z.object({ dim: z.enum(DIM_KEYS), value: Dim, reason: Line })).default([]),
      })
      .optional(),
  })
  .superRefine((d, ctx) => {
    const issue = (message: string, path: (string | number)[] = []) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
    if (d.status === 'tested' && !d.score) issue('已实测条目必须有 score', ['score']);
    if (d.status === 'pending' && d.score) issue('待测条目不得有 score', ['score']);
    if (d.status === 'rejected' && !d.rejectReason) issue('不收录条目必须写 rejectReason', ['rejectReason']);
    if (d.status === 'tested') {
      if (!d.install) issue('已实测条目必须写 install', ['install']);
      if (!d.trigger) issue('已实测条目必须写 trigger', ['trigger']);
      if (!d.examples || d.examples.length === 0) issue('已实测条目至少要有一条 examples', ['examples']);
    }
    if (d.distribution === 'mirror' && !(d.source.license && MIRROR_LICENSES.includes(d.source.license))) {
      issue(`镜像条目的许可证必须在允许清单内（${MIRROR_LICENSES.join('、')}）`, ['source', 'license']);
    }
    if (d.distribution === 'link' && !d.source.url) issue('只评不转的条目必须有上游地址', ['source', 'url']);
    if (!d.score) return;
    const s = d.score;
    if (s.runs.filter((r) => r.task === s.task).length !== 3) {
      issue(`主任务 ${s.task} 必须恰好 3 轮实测`, ['score', 'runs']);
    }
    const seen = new Set<string>();
    for (const o of s.overrides) {
      if (seen.has(o.dim)) issue(`维度 ${o.dim} 只能调整一次`, ['score', 'overrides']);
      seen.add(o.dim);
    }
    if (TEXTBOOK_CATEGORIES.includes(d.category) && !s.textbookCheck) {
      issue('备课教案、命题作业的已实测条目必须有教材抽检 textbookCheck', ['score', 'textbookCheck']);
    }
    if (s.textbookCheck && s.textbookCheck.passed > s.textbookCheck.total) {
      issue('抽检通过数不能超过总数', ['score', 'textbookCheck']);
    }
    for (const r of s.runs) {
      if (r.output && !r.output.startsWith(`/skill-reports/${d.name}/${s.tested.layer}/`)) {
        issue(`原始产出的路径要对得上本技能与本次层级：${r.output}`, ['score', 'runs']);
      }
    }
    if (s.tested.layer !== 'workbuddy' && s.platformComplete) {
      issue('后台实测没有核对 WorkBuddy 上的功能，platformComplete 必须记 false', ['score', 'platformComplete']);
    }
    if (s.tested.loadedBy === 'named' && s.runs.some((r) => !r.triggered)) {
      issue('点名加载的轮次技能一定被用到，triggered 都应记 true', ['score', 'runs']);
    }
    if (s.prior && s.tested.layer !== 'same-model') {
      issue('只有同款复核的条目可以带上一层的海选结果', ['score', 'prior']);
    }
  });

export type SkillFrontmatter = z.infer<typeof skillSchema>;
export type ScoreFrontmatter = NonNullable<SkillFrontmatter['score']>;
export type { DimKey };
