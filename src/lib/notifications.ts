import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, type AppItem } from './firebase';
import { safeUrl, sanitizeText } from './security';

// ============================================================
// New-app notifications.
// Strategy: track the newest app id (Firestore push ids are time-sortable) the
// user has already "seen" in localStorage. On each load we fetch the newest
// apps and anything newer than the stored marker is a fresh notification.
// If the user granted the browser Notification permission, we also fire a
// native notification for the newest one.
// ============================================================

const SEEN_KEY = 'apps-studio-seen-newest';
const NOTIF_STORE = 'apps-studio-notifs';

export interface NotifItem {
  id: string;
  name: string;
  logo: string;
  category: string;
  at: number;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Firestore push ids sort chronologically as strings.
function newestId(apps: AppItem[]): string | null {
  if (!apps.length) return null;
  return apps.reduce((max, a) => (a.id > max ? a.id : max), apps[0].id);
}

function getSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function setSeen(id: string) {
  try {
    localStorage.setItem(SEEN_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getStoredNotifs(): NotifItem[] {
  try {
    const raw = localStorage.getItem(NOTIF_STORE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotifItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function storeNotifs(items: NotifItem[]) {
  try {
    localStorage.setItem(NOTIF_STORE, JSON.stringify(items.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

/**
 * Fetch newest apps and diff against the stored marker.
 * Returns the full, updated notification list (newest first).
 * `firstRun` is true when the user has no marker yet — in that case we DON'T
 * spam them with "new" notifications for the whole catalog; we just set the
 * baseline.
 */
export async function checkForNewApps(): Promise<{
  notifs: NotifItem[];
  freshCount: number;
}> {
  let apps: AppItem[] = [];
  // Index-free: fetch a bounded set and sort by push id (time-ordered) client
  // side. Push ids sort chronologically, so this reliably finds newest apps.
  try {
    const snap = await getDocs(query(collection(db, 'apps'), limit(60)));
    apps = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name:
            (data.displayName as string) || (data.name as string) || 'New app',
          logo: safeUrl(data.logo as string) || '',
          category: (data.category as string) || 'tools',
          downloads: num(data.downloads),
        } as AppItem;
      })
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .slice(0, 15);
  } catch {
    return { notifs: getStoredNotifs(), freshCount: 0 };
  }

  const marker = getSeen();
  const top = newestId(apps);

  // first ever visit: set baseline, no notifications
  if (!marker) {
    if (top) setSeen(top);
    return { notifs: getStoredNotifs(), freshCount: 0 };
  }

  // anything with id > marker is new
  const fresh = apps.filter((a) => a.id > marker);
  const existing = getStoredNotifs();

  if (fresh.length) {
    const freshNotifs: NotifItem[] = fresh.map((a) => ({
      id: a.id,
      name: sanitizeText(a.name, 80),
      logo: a.logo || '',
      category: a.category || 'tools',
      at: Date.now(),
    }));
    const existingIds = new Set(existing.map((n) => n.id));
    const merged = [
      ...freshNotifs.filter((n) => !existingIds.has(n.id)),
      ...existing,
    ].slice(0, 30);
    storeNotifs(merged);

    // fire a native notification for the newest, if allowed
    maybeNativeNotify(freshNotifs[0], fresh.length);

    return { notifs: merged, freshCount: fresh.length };
  }

  return { notifs: existing, freshCount: 0 };
}

/** Mark everything as read (updates the marker to the newest known id). */
export function markAllSeen(notifs: NotifItem[]) {
  if (notifs.length) {
    const newest = notifs.reduce(
      (max, n) => (n.id > max ? n.id : max),
      notifs[0].id
    );
    setSeen(newest);
  }
}

export function clearNotifs() {
  try {
    localStorage.removeItem(NOTIF_STORE);
  } catch {
    /* ignore */
  }
}

// ---- native browser notifications (opt-in) ----
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

function maybeNativeNotify(item: NotifItem, count: number) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const title =
      count > 1 ? `${count} new apps on Apps Studio` : 'New app available';
    const body = count > 1 ? `Including ${item.name}` : item.name;
    const n = new Notification(title, {
      body,
      icon: item.logo || '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'apps-studio-new',
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/app/${item.id}`;
      n.close();
    };
  } catch {
    /* ignore */
  }
}
