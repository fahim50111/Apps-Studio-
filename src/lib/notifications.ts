import { fetchNewestApps, type AppItem } from './firebase';
import { sanitizeText } from './security';

const SEEN_KEY = 'apps-studio-seen-newest';
const NOTIF_STORE = 'apps-studio-notifs';

export interface NotifItem {
  id: string;
  name: string;
  logo: string;
  category: string;
  at: number;
}

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

export async function checkForNewApps(): Promise<{
  notifs: NotifItem[];
  freshCount: number;
}> {
  let apps: AppItem[] = [];
  try {
    apps = (await fetchNewestApps(20)).slice(0, 12);
  } catch {
    return { notifs: getStoredNotifs(), freshCount: 0 };
  }

  const marker = getSeen();
  const top = newestId(apps);

  if (!marker) {
    if (top) setSeen(top);
    return { notifs: getStoredNotifs(), freshCount: 0 };
  }

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
    maybeNativeNotify(freshNotifs[0], fresh.length);
    return { notifs: merged, freshCount: fresh.length };
  }

  return { notifs: existing, freshCount: 0 };
}

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
