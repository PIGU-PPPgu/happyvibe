// 技能条目里各个枚举值在页面上显示的名字。纯数据，页面共用。
import type { CategoryKey } from '../data/skill-standard.ts';
import { CATEGORIES } from '../data/skill-standard.ts';
import type { Evidence, DimKey } from './skillScore.ts';
import { DIMS } from '../data/skill-standard.ts';

export const PLATFORM_LABEL: Record<string, string> = {
  workbuddy: 'WorkBuddy',
  'claude-code': 'Claude Code',
  zcode: 'ZCode',
  generic: '通用',
};

export const COMPOSITION_LABEL: Record<string, string> = {
  prompt: '纯说明',
  resources: '带参考文档',
  scripts: '带脚本',
};

export const REQUIRES_LABEL: Record<string, string> = {
  'api-key': '自备密钥',
  paid: '付费',
  network: '联网',
  python: 'Python',
  node: 'Node',
  'platform-tool': '平台专用工具',
};

/** 「AI 代测」与「教师试用」是两种证据，分开标记 */
export const EVIDENCE_LABEL: Record<string, string> = {
  ai: 'AI 代测',
  teacher: '教师试用',
};

export const STATUS_LABEL: Record<string, string> = {
  tested: '已实测',
  pending: '待测',
  rejected: '不收录',
};

export const categoryLabel = (key: CategoryKey): string => CATEGORIES.find((c) => c.key === key)?.label ?? key;

/** 把秒数写成「1 分 32 秒」 */
export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} 分 ${r} 秒` : `${r} 秒`;
}

export const dimLabel = (key: DimKey): string => DIMS.find((d) => d.key === key)?.label ?? key;

/** 评测环境一行：Agent、模型、日期、技能版本 */
export function envLine(tested: { agent: string; model: string; date: string; skillVersion: string }): string {
  return [tested.agent, tested.model, tested.date, `技能版本 ${tested.skillVersion}`].filter(Boolean).join(' · ');
}

export type { Evidence };
