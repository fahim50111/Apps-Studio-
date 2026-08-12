import type { AppItem, DownloadLink } from './types';

/**
 * Returns download options for display.
 * Firebase stores oldest→newest in `links[]`, so we reverse for UI:
 * last array item appears first and is marked "Latest".
 */
export function getDownloadLinks(app: AppItem): DownloadLink[] {
  const out: DownloadLink[] = [];
  const seen = new Set<string>();
  const push = (link: DownloadLink) => {
    if (!link.url || seen.has(link.url)) return;
    seen.add(link.url);
    out.push(link);
  };

  // Reverse so last (newest) is first in the UI list
  const raw = (app.links || []).slice().reverse();
  raw.forEach((l, i) =>
    push({
      name: l.name || `Version ${raw.length - i}`,
      url: l.url,
      updatedAt: l.updatedAt,
      timestamp: l.timestamp,
    })
  );

  // Legacy single link goes after reversed multi-links (older fallback)
  if (app.link) {
    push({
      name: app.versionName || 'Direct Download',
      url: app.link,
      updatedAt: app.updatedAt,
      timestamp: app.timestamp,
    });
  }
  return out;
}

/** Best timestamp for a download row (link → app updatedAt). */
export function getLinkUpdatedAt(
  link: DownloadLink,
  app?: Pick<AppItem, 'updatedAt' | 'timestamp'>
): number | undefined {
  return (
    link.updatedAt ||
    link.timestamp ||
    app?.updatedAt ||
    app?.timestamp ||
    undefined
  );
}

/** Gallery images: explicit screenshots, else cover as a single preview. */
export function getScreenshots(app: AppItem): string[] {
  const shots = (app.screenshots || []).filter(Boolean);
  if (shots.length) return shots;
  if (app.cover) return [app.cover];
  return [];
}

/** Version history rows derived from download links + metadata. */
export function getVersionHistory(app: AppItem): {
  name: string;
  url: string;
  size?: string;
  isLatest: boolean;
  updatedLabel?: string;
}[] {
  const links = getDownloadLinks(app);

  if (!links.length) {
    const updated =
      app.updatedAt || app.timestamp
        ? formatRelativeDate(app.updatedAt || app.timestamp)
        : undefined;
    return app.versionName
      ? [
          {
            name: app.versionName,
            url: '',
            size: app.size,
            isLatest: true,
            updatedLabel: updated,
          },
        ]
      : [];
  }

  return links.map((l, i) => {
    const isLatest = i === 0;
    const ts = isLatest ? getLinkUpdatedAt(l, app) : undefined;
    return {
      name: l.name,
      url: l.url,
      size: isLatest ? app.size : undefined,
      isLatest,
      updatedLabel: ts ? formatRelativeDate(ts) : undefined,
    };
  });
}

function toMs(ts?: number): number | null {
  if (!ts) return null;
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Support seconds or ms timestamps
  return n < 1e12 ? n * 1000 : n;
}

export function formatRelativeDate(ts?: number): string {
  const ms = toMs(ts);
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return 'Recently';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatUploadDate(ts);
}

/** Absolute calendar date for upload/publish time, e.g. "12 Mar 2026". */
export function formatUploadDate(ts?: number): string {
  const ms = toMs(ts);
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Prefer original upload timestamp, then last update. */
export function getAppUploadDate(app: {
  timestamp?: number;
  updatedAt?: number;
}): string {
  return formatUploadDate(app.timestamp || app.updatedAt);
}

/** Prefer last update time, then original upload (for Download page badge). */
export function getAppUpdatedDate(app: {
  timestamp?: number;
  updatedAt?: number;
}): string {
  return formatUploadDate(app.updatedAt || app.timestamp);
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
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' rx='24' fill='${c}'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Sora,Arial' font-size='60' font-weight='700' fill='white'>${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
