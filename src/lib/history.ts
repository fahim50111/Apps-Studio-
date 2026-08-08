const HISTORY_KEY = 'apps_studio_history';
const MAX_HISTORY = 50;

export type HistoryItem = {
  id: string;
  name: string;
  icon?: string;
  packageName?: string;
  visitedAt: number;
};

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<HistoryItem, 'visitedAt'>) {
  try {
    let list = getHistory().filter((h) => h.id !== item.id);
    list.unshift({ ...item, visitedAt: Date.now() });
    if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export function removeFromHistory(id: string) {
  try {
    const list = getHistory().filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {}
}
