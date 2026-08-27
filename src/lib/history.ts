import type { AppItem } from './types';
import { getName, fallbackLogo } from './util';

const RECENT_APPS_KEY = 'apps-studio-recent-apps';
const RECENT_SEARCHES_KEY = 'apps-studio-recent-searches';
const MAX_RECENT_APPS = 12;
const MAX_RECENT_SEARCHES = 8;

export interface RecentApp {
  id: string;
  name: string;
  logo: string;
  category?: string;
  isMod?: boolean;
  at: number;
}

export function getRecentApps(): RecentApp[] {
  try {
    const raw = localStorage.getItem(RECENT_APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentApp[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_APPS) : [];
  } catch {
    return [];
  }
}

export function trackAppView(app: AppItem): RecentApp[] {
  const entry: RecentApp = {
    id: app.id,
    name: getName(app),
    logo: app.logo || fallbackLogo(getName(app)),
    category: app.category,
    isMod: app.isMod,
    at: Date.now(),
  };
  const prev = getRecentApps().filter((a) => a.id !== app.id);
  const next = [entry, ...prev].slice(0, MAX_RECENT_APPS);
  try {
    localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecentApps() {
  try {
    localStorage.removeItem(RECENT_APPS_KEY);
  } catch {
    /* ignore */
  }
}

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): string[] {
  const t = term.trim();
  if (!t) return getRecentSearches();
  const prev = getRecentSearches().filter(
    (s) => s.toLowerCase() !== t.toLowerCase()
  );
  const next = [t, ...prev].slice(0, MAX_RECENT_SEARCHES);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function removeRecentSearch(term: string): string[] {
  const next = getRecentSearches().filter(
    (s) => s.toLowerCase() !== term.toLowerCase()
  );
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    /* ignore */
  }
}

export function filterSuggestions(
  pool: { id: string; name: string; logo?: string; category?: string }[],
  term: string,
  max = 6
) {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  return pool
    .filter((a) => a.name.toLowerCase().includes(t))
    .slice(0, max);
}
