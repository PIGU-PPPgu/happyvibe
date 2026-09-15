// 本地访问记录：每次页面打开记一条 {t: 时间, p: 路径}，只存 localStorage，不上传
const KEY = 'hv-visits:v1';
const CAP = 3000;
const DEDUP_MS = 30_000; // 同一页面 30 秒内重复加载只记一次

interface Visit { t: number; p: string }

export function logVisit(path: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const list: Visit[] = raw ? JSON.parse(raw) : [];
    const last = list[list.length - 1];
    if (last && last.p === path && Date.now() - last.t < DEDUP_MS) return;
    list.push({ t: Date.now(), p: path });
    while (list.length > CAP) list.shift();
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function getVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Visit[]) : [];
  } catch {
    return [];
  }
}

export function clearVisits(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
