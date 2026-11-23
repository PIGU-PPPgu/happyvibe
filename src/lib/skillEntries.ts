// 技能条目加载：astro:content 取 skills 集合，按状态分三组并算出总分。
// 页面专用。证据换算与算分都在 skillEntryCore.ts / skillScore.ts，校验脚本用的是同一份。
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { evidenceOf, isScored, summaryOf } from './skillEntryCore.ts';
import type { Evidence } from './skillScore.ts';

export type SkillData = CollectionEntry<'skills'>['data'];

export interface SkillEntry {
  slug: string;
  data: SkillData;
  body: string;
}

export interface ScoredSkill extends SkillEntry {
  total: number;
  tier: string;
  evidence: Evidence;
}

export interface SkillGroups {
  tested: ScoredSkill[];
  pending: SkillEntry[];
  rejected: SkillEntry[];
}

const byDateDesc = (a: SkillEntry, b: SkillEntry) =>
  (b.data.score?.tested.date ?? '').localeCompare(a.data.score?.tested.date ?? '');

export async function loadSkills(): Promise<SkillGroups> {
  const entries: SkillEntry[] = (await getCollection('skills')).map((e) => ({
    slug: e.id,
    data: e.data,
    body: e.body ?? '',
  }));
  const tested = entries
    .filter((e) => isScored(e.data))
    .map((e) => {
      const summary = summaryOf(e.data);
      return { ...e, total: summary.total, tier: summary.tier, evidence: evidenceOf(e.data) };
    })
    .sort((a, b) => b.total - a.total || byDateDesc(a, b));
  const pending = entries.filter((e) => e.data.status === 'pending').sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh'));
  const rejected = entries.filter((e) => e.data.status === 'rejected').sort(byDateDesc);
  return { tested, pending, rejected };
}
