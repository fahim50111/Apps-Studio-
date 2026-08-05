import type { AppItem, DownloadLink } from './firebase';

/**
 * Returns the full list of download options for an app, merging the legacy
 * single `link` field with the multi-version `links` array. Deduped by url.
 */
export function getDownloadLinks(app: AppItem): DownloadLink[] {
  const out: DownloadLink[] = [];
  const seen = new Set<string>();
  const push = (name: string, url: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ name, url });
  };
  (app.links || []).forEach((l, i) =>
    push(l.name || `Version ${i + 1}`, l.url)
  );
  if (app.link) push(app.versionName || 'Direct Download', app.link);
  return out;
}

export const CATEGORIES = [
  'social',
  'games',
  'tools',
  'entertainment',
  'education',
  'productivity',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  social: { label: 'Social', icon: 'Users', color: '#1565c0' },
  games: { label: 'Games', icon: 'Gamepad2', color: '#c62828' },
  tools: { label: 'Tools', icon: 'Wrench', color: '#2e7d32' },
  entertainment: { label: 'Entertainment', icon: 'Clapperboard', color: '#e65100' },
  education: { label: 'Education', icon: 'GraduationCap', color: '#6a1b9a' },
  productivity: { label: 'Productivity', icon: 'Briefcase', color: '#00695c' },
};

export function getName(app: AppItem): string {
  return app.displayName || app.name || 'Untitled';
}

export function catLabel(cat?: string): string {
  if (!cat) return 'App';
  return CATEGORY_META[cat]?.label || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function catColor(cat?: string): string {
  return (cat && CATEGORY_META[cat]?.color) || '#1a73e8';
}

export function sortByDate(arr: AppItem[]): AppItem[] {
  return arr.slice().sort((a, b) => {
    const ta = a.updatedAt || a.timestamp || 0;
    const tb = b.updatedAt || b.timestamp || 0;
    return tb - ta;
  });
}

export function sortByDownloads(arr: AppItem[]): AppItem[] {
  return arr.slice().sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

export function formatCount(n?: number): string {
  const v = n || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

// deterministic gradient fallback image for missing logos
export function fallbackLogo(name: string): string {
  const letter = (name.trim()[0] || 'A').toUpperCase();
  const colors = ['#1a73e8', '#c62828', '#2e7d32', '#e65100', '#6a1b9a', '#00695c'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const c = colors[Math.abs(hash) % colors.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' rx='24' fill='${c}'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Poppins,Arial' font-size='60' font-weight='700' fill='white'>${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
