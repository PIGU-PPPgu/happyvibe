/**
 * HappyVibe 学习进度 —— 纯本地 localStorage，无账号体系
 * 课 ID 约定：`${module}/${lessonSlug}`，如 `basics/five-stages`
 * 变更时派发 window 事件 `hv:progress`，页面各组件监听刷新
 */
const KEY = 'hv-progress:v1';
export const PROGRESS_EVENT = 'hv:progress';

export type DoneMap = Record<string, true>;

export function getDoneMap(): DoneMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as DoneMap;
  } catch {
    return {};
  }
}

export function isDone(id: string): boolean {
  return Boolean(getDoneMap()[id]);
}

export function toggleDone(id: string): boolean {
  const map = getDoneMap();
  if (map[id]) {
    delete map[id];
    save(map);
    return false;
  }
  map[id] = true;
  save(map);
  return true;
}

export function countDone(ids: string[]): number {
  const map = getDoneMap();
  return ids.reduce((n, id) => n + (map[id] ? 1 : 0), 0);
}

export function clearAll(): void {
  save({});
}

function save(map: DoneMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* 存储不可用时静默降级：进度功能失效但不影响阅读 */
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

export function onProgress(cb: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, cb);
  return () => window.removeEventListener(PROGRESS_EVENT, cb);
}

/** 读取 BaseLayout 注入的全站课程索引 */
export interface LessonIndexItem {
  t: string;
  m: string;
  d: string;
}
export type LessonIndex = Record<string, LessonIndexItem>;

export function getLessonIndex(): LessonIndex {
  const el = document.getElementById('hv-lesson-index');
  if (!el) return {};
  try {
    return JSON.parse(el.textContent || '{}') as LessonIndex;
  } catch {
    return {};
  }
}
