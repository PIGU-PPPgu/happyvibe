// SkillHub 初筛：按教师向关键词取列表元数据，一批不超过 REQUEST_BUDGET 次请求。
// 只取筛查要用的字段，不取技能全文，不做定时同步。协议禁止批量导出与再分发，所以输出只能写进 .skilllab/。
// 用法：node scripts/skilllab/scan_skillhub.mjs .skilllab/<批次>/scan/skillhub.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://api.skillhub.cn/api/skills';
export const REQUEST_BUDGET = 15;
/** 教师向关键词。每个词取评分最高的一页，共 13 次请求，留 2 次余量。 */
export const KEYWORDS = ['教案', '备课', '教学设计', '试卷', '命题', '组卷', '作业', '批改', '学情', '成绩分析', '家长会', '家校沟通', '班主任'];

/** 只留筛查要用的字段。 */
export function pickMeta(x) {
  const handle = x.namespace?.handle ?? '';
  return {
    name: x.name,
    slug: x.slug,
    handle,
    link: `https://skillhub.cn/skills/${handle}/${x.slug}`,
    score: x.score,
    installs: x.installs,
    subs: (x.subCategories ?? []).map((s) => s.key),
    source: x.source,
    verified: Boolean(x.verified),
    hint: String(x.description_zh ?? x.description ?? '').replace(/\s+/g, ' ').slice(0, 80),
  };
}

const API_WRAPPER = /万维易源|showapi|API ?Key|api-key|调用接口|接口调用|需配置/i;
const NOT_K12 = /育儿|幼儿|亲子|培训|企业|考研|雅思|托福|留学|成人|职教|大学生/i;
const TEACHER = /小学|初中|高中|中小学|年级|教师|老师|班主任|备课|教案|试卷|学情|家长|板书|教学环节|课堂/i;

/** 机器初判：留下面向中小学老师的。返回原因码，给人工复核排队用。 */
export function prescreen(m) {
  const text = `${m.name} ${m.hint}`;
  if (API_WRAPPER.test(text) || m.handle === 'showapi') return { keep: false, why: 'api-wrapper' };
  if (NOT_K12.test(text)) return { keep: false, why: 'not-k12' };
  if (!TEACHER.test(text)) return { keep: false, why: 'no-teacher-signal' };
  return { keep: true, why: '' };
}

export const dedupe = (rows) => [...new Map(rows.map((r) => [`${r.handle}/${r.slug}`, r])).values()];

async function fetchPage(keyword) {
  const query = new URLSearchParams({ category: 'education', sortBy: 'score', pageSize: '100', page: '1', keyword });
  const res = await fetch(`${API}?${query}`, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}：关键词「${keyword}」`);
  return (await res.json()).data?.skills ?? [];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const out = process.argv[2];
  if (!out || !out.startsWith('.skilllab/')) {
    console.error('用法：node scripts/skilllab/scan_skillhub.mjs .skilllab/<批次>/scan/skillhub.json');
    process.exit(2);
  }
  const rawDir = `${out.replace(/\.json$/, '')}-raw`;
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(dirname(out), { recursive: true });
  const all = [];
  let used = 0;
  for (const keyword of KEYWORDS) {
    const rawFile = `${rawDir}/${keyword}.json`;
    // 这个词上次已经取回就不再请求：中途失败后重跑，不会把预算用光
    if (existsSync(rawFile)) {
      const rows = JSON.parse(readFileSync(rawFile, 'utf8'));
      all.push(...rows);
      console.log(`「${keyword}」沿用上次取回的 ${rows.length} 条`);
      continue;
    }
    used++;
    if (used > REQUEST_BUDGET) throw new Error('超过请求预算');
    const rows = (await fetchPage(keyword)).map(pickMeta);
    writeFileSync(rawFile, JSON.stringify(rows, null, 1));
    all.push(...rows);
    console.log(`「${keyword}」取回 ${rows.length} 条`);
    await sleep(1500);
  }
  const unique = dedupe(all).sort((a, b) => b.score - a.score);
  const judged = unique.map((m) => ({ ...m, ...prescreen(m) }));
  const dropped = {};
  for (const m of judged.filter((x) => !x.keep)) dropped[m.why] = (dropped[m.why] ?? 0) + 1;
  writeFileSync(
    out,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        requests: used,
        raw: all.length,
        unique: unique.length,
        keep: judged.filter((x) => x.keep).length,
        dropped,
        items: judged,
      },
      null,
      1
    )
  );
  console.log(`请求 ${used} 次；原始 ${all.length} 条，去重后 ${unique.length} 条，初判入围 ${judged.filter((x) => x.keep).length} 条；淘汰原因 ${JSON.stringify(dropped)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
