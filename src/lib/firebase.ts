import { sanitizeText, safeUrl, LIMITS } from './security';
import { cachedFetch, seedCache, peekCache, collectCachedByPrefix, TTL } from './cache';
import type {
  AppItem, Banner, AdminNotice, AppRequest, DownloadLink, Page, PageCursor,
} from './types';

export type {
  AppItem, Banner, AdminNotice, AppRequest, DownloadLink, Page, PageCursor,
} from './types';

const firebaseConfig = {
  apiKey: 'AIzaSyByoVGSmDnWVYAY3CFFpHYOC2siWAH0ajE',
  authDomain: 'apps-studio-1f1c0.firebaseapp.com',
  databaseURL: 'https://apps-studio-1f1c0-default-rtdb.firebaseio.com',
  projectId: 'apps-studio-1f1c0',
  storageBucket: 'apps-studio-1f1c0.firebasestorage.app',
  messagingSenderId: '106546673585',
  appId: '1:106546673585:web:48f13f073d92d9cb58af90',
};

type Firestore = import('firebase/firestore').Firestore;
type FsDocData = import('firebase/firestore').DocumentData;
type FsQueryDoc = import('firebase/firestore').QueryDocumentSnapshot<FsDocData>;
type FsQuery = import('firebase/firestore').Query<FsDocData>;

let dbPromise: Promise<Firestore> | null = null;

async function getDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      const {
        initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
      } = await import('firebase/firestore');
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      try {
        return initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
      } catch {
        return getFirestore(app);
      }
    })();
  }
  return dbPromise;
}

async function fs() {
  const [db, {
    collection, getDocs, getDocsFromCache, getDoc, getDocFromCache, doc, addDoc,
    updateDoc, increment, serverTimestamp, query, where, orderBy, limit: fbLimit,
    startAfter, documentId, getCountFromServer,
  }] = await Promise.all([getDb(), import('firebase/firestore')]);
  return {
    db, collection, getDocs, getDocsFromCache, getDoc, getDocFromCache, doc, addDoc,
    updateDoc, increment, serverTimestamp, query, where, orderBy, fbLimit, startAfter,
    documentId, getCountFromServer,
  };
}

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

function mapLinks(raw: unknown): DownloadLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l) => {
    const o = (l || {}) as Record<string, unknown>;
    const name = sanitizeText((o.name as string) || (o.title as string) || 'Download', 80);
    const url = safeUrl((o.url as string) || (o.link as string) || '') || '';
    return {
      name: name || 'Download',
      url,
      updatedAt: num(o.updatedAt) ?? num(o.updated_at),
      timestamp: num(o.timestamp) ?? num(o.createdAt) ?? num(o.date),
    };
  }).filter((l) => l.url);
}

function mapScreenshots(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    if (typeof s === 'string') return safeUrl(s) || '';
    if (s && typeof s === 'object') {
      const o = s as Record<string, unknown>;
      return safeUrl((o.url as string) || (o.image as string) || '') || '';
    }
    return '';
  }).filter(Boolean).slice(0, 12);
}

function mapApp(id: string, data: FsDocData): AppItem {
  return {
    id,
    name: (data.name as string) || (data.displayName as string) || 'Untitled',
    displayName: (data.displayName as string) || (data.name as string),
    category: (data.category as string) || 'tools',
    logo: safeUrl(data.logo as string) || '',
    cover: safeUrl(data.cover as string) || '',
    screenshots: mapScreenshots(data.screenshots || data.images || data.gallery),
    link: safeUrl(data.link as string) || '',
    links: mapLinks(data.links),
    versionName: (data.versionName as string) || '',
    description: (data.description as string) || '',
    size: (data.size as string) || '',
    isMod: Boolean(data.isMod),
    downloads: num(data.downloads) ?? 0,
    timestamp: num(data.timestamp) ?? num(data.createdAt) ?? num(data.updatedAt),
    updatedAt: num(data.updatedAt) ?? num(data.timestamp) ?? num(data.createdAt),
  };
}

const CATALOG_KEY = 'catalog:50';
const CATALOG_SIZE = 50;

function rememberApp(item: AppItem) {
  seedCache(`app:${item.id}`, item, TTL.app.ttl, TTL.app.staleTtl);
}
function seedApps(items: AppItem[]) { items.forEach(rememberApp); }
function seedCatalog(items: AppItem[]) {
  seedApps(items);
  seedCache(CATALOG_KEY, items, TTL.top.ttl, TTL.top.staleTtl);
  seedCache('top:50', items.slice(0, 50), TTL.top.ttl, TTL.top.staleTtl);
  seedCache('top:24', items.slice(0, 24), TTL.top.ttl, TTL.top.staleTtl);
}
function peekCatalog(): AppItem[] {
  return peekCache<AppItem[]>(CATALOG_KEY) || peekCache<AppItem[]>('top:50') || peekCache<AppItem[]>('top:24') || [];
}

export function appsFromCatalog(opts?: { category?: string; max?: number; excludeId?: string }): AppItem[] {
  let items = peekCatalog();
  if (opts?.category) items = items.filter((a) => a.category === opts.category);
  if (opts?.excludeId) items = items.filter((a) => a.id !== opts.excludeId);
  return items.slice().sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, opts?.max ?? 50);
}

export async function fetchAppById(id: string): Promise<AppItem | null> {
  const warm = peekCache<AppItem>(`app:${id}`);
  if (warm) return cachedFetch(`app:${id}`, async () => warm, TTL.app);
  return cachedFetch(`app:${id}`, async () => {
    const { db, getDoc, getDocFromCache, doc } = await fs();
    const ref = doc(db, 'apps', id);
    try {
      const cached = await getDocFromCache(ref);
      if (cached.exists()) return mapApp(cached.id, cached.data());
    } catch { /* no disk cache */ }
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return mapApp(snap.id, snap.data());
  }, TTL.app);
}

async function docsPreferCache(q: FsQuery) {
  const { getDocs, getDocsFromCache } = await fs();
  try {
    const cached = await getDocsFromCache(q);
    if (!cached.empty) return cached;
  } catch { /* empty persistence */ }
  return getDocs(q);
}

export async function fetchBanners(force = false): Promise<Banner[]> {
  return cachedFetch('banners', async () => {
    const { db, collection } = await fs();
    const snap = await docsPreferCache(collection(db, 'banners') as FsQuery);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        image: safeUrl(data.image as string) || '',
        title: sanitizeText((data.title as string) || '', 120),
        desc: sanitizeText((data.desc as string) || '', 200),
        link: safeUrl(data.link as string) || '',
        timestamp: num(data.timestamp),
      };
    });
  }, { ...TTL.banners, force });
}

export async function fetchAdminNotices(max = 10): Promise<AdminNotice[]> {
  return cachedFetch(`notices:${max}`, async () => {
    const { db, getDocs, collection, query, fbLimit } = await fs();
    const mapSnap = (snap: { docs: { id: string; data: () => Record<string, unknown> }[] }) =>
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: sanitizeText((data.title as string) || (data.name as string) || 'Notice', 100),
          message: sanitizeText((data.message as string) || (data.body as string) || (data.desc as string) || (data.content as string) || '', 300),
          link: safeUrl((data.link as string) || (data.url as string) || '') || '',
          timestamp: num(data.timestamp) || num(data.createdAt) || 0,
        };
      }).filter((n) => n.title || n.message).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    try {
      const snap = await getDocs(query(collection(db, 'news'), fbLimit(max)));
      const items = mapSnap(snap);
      if (items.length) return items;
    } catch { /* try legacy */ }
    try {
      const snap = await getDocs(query(collection(db, 'admin_notifications'), fbLimit(max)));
      return mapSnap(snap);
    } catch { return []; }
  }, TTL.notices);
}

export async function fetchAppCount(): Promise<number> {
  return cachedFetch('app-count', async () => {
    try {
      const { db, getCountFromServer, collection } = await fs();
      const snap = await getCountFromServer(collection(db, 'apps'));
      return snap.data().count;
    } catch { return 0; }
  }, { ttl: 10 * 60_000, staleTtl: 60 * 60_000 });
}

async function fetchAppsPageUncached(pageSize: number, cursor?: PageCursor | null, category?: string): Promise<Page> {
  const { db, collection, query, where, orderBy, fbLimit, startAfter, documentId } = await fs();
  const build = (ordered: boolean) => {
    const constraints = [];
    if (category) constraints.push(where('category', '==', category));
    if (ordered) constraints.push(orderBy(documentId(), 'desc'));
    if (cursor) constraints.push(startAfter(cursor as FsQueryDoc));
    constraints.push(fbLimit(pageSize));
    return query(collection(db, 'apps'), ...constraints) as FsQuery;
  };
  let snap;
  try { snap = await docsPreferCache(build(true)); }
  catch { snap = await docsPreferCache(build(false)); }
  const items = snap.docs.map((d) => mapApp(d.id, d.data()));
  seedApps(items);
  const last = snap.docs[snap.docs.length - 1] || null;
  return { items, cursor: last, hasMore: snap.docs.length === pageSize };
}

export async function fetchAppsPage(pageSize: number, cursor?: PageCursor | null, category?: string): Promise<Page> {
  if (!cursor) {
    return cachedFetch(`page:${category || 'all'}:${pageSize}`, () => fetchAppsPageUncached(pageSize, null, category), { ...TTL.page, memoryOnly: true });
  }
  return fetchAppsPageUncached(pageSize, cursor, category);
}

export async function fetchTopApps(max = 50): Promise<AppItem[]> {
  const take = Math.min(max, CATALOG_SIZE);
  return cachedFetch(`top:${take}`, async () => {
    const catalog = peekCatalog();
    if (catalog.length >= take) {
      return catalog.slice().sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, take);
    }
    const { db, collection, query, orderBy, fbLimit } = await fs();
    try {
      const q = query(collection(db, 'apps'), orderBy('downloads', 'desc'), fbLimit(CATALOG_SIZE));
      const snap = await docsPreferCache(q);
      const items = snap.docs.map((d) => mapApp(d.id, d.data()));
      if (items.length) { seedCatalog(items); return items.slice(0, take); }
    } catch { /* fallback */ }
    const page = await fetchAppsPageUncached(CATALOG_SIZE);
    const sorted = page.items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    seedCatalog(sorted);
    return sorted.slice(0, take);
  }, TTL.top);
}

export async function fetchTopByCategory(category: string, max = 10, excludeId?: string): Promise<AppItem[]> {
  const key = `cat-top:${category}:${max}:${excludeId || ''}`;
  return cachedFetch(key, async () => {
    const fromCatalog = peekCatalog()
      .filter((a) => a.category === category && a.id !== excludeId)
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    if (fromCatalog.length >= max) return fromCatalog.slice(0, max);
    const { db, collection, query, where, fbLimit } = await fs();
    const take = max + (excludeId ? 1 : 0);
    try {
      const q2 = query(collection(db, 'apps'), where('category', '==', category), fbLimit(Math.min(24, take * 3)));
      const snap2 = await docsPreferCache(q2);
      const items = snap2.docs.map((d) => mapApp(d.id, d.data())).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      const out = items.filter((a) => a.id !== excludeId).slice(0, max);
      seedApps(out);
      return out;
    } catch { return fromCatalog.slice(0, max); }
  }, TTL.category);
}

export async function fetchCategoryPreview(category: string, max = 6): Promise<AppItem[]> {
  return fetchTopByCategory(category, max);
}

export async function fetchNewestApps(max = 20): Promise<AppItem[]> {
  return cachedFetch(`newest:${max}`, async () => {
    const catalog = peekCatalog();
    if (catalog.length) return catalog.slice().sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, max);
    const apps = await fetchTopApps(Math.min(max, CATALOG_SIZE));
    return apps.slice().sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, max);
  }, { ttl: 15 * 60_000, staleTtl: 3 * 60 * 60_000 });
}

export async function fetchSuggestPool(max = 50): Promise<{ id: string; name: string; logo?: string; category?: string }[]> {
  const apps = await fetchTopApps(Math.min(max, CATALOG_SIZE));
  return apps.map((a) => ({ id: a.id, name: a.displayName || a.name, logo: a.logo, category: a.category }));
}

export async function searchApps(term: string): Promise<AppItem[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const match = (a: AppItem) => {
    const name = (a.displayName || a.name || '').toLowerCase();
    const cat = (a.category || '').toLowerCase();
    return name.includes(t) || cat.includes(t);
  };
  const local = [...peekCatalog(), ...collectCachedByPrefix<AppItem>('app:')];
  const seen = new Set<string>();
  const fromLocal = local.filter((a) => {
    if (!a?.id || seen.has(a.id) || !match(a)) return false;
    seen.add(a.id);
    return true;
  }).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  if (fromLocal.length) return fromLocal;
  try {
    const catalog = await fetchTopApps(CATALOG_SIZE);
    return catalog.filter(match).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } catch (e) {
    console.error('searchApps failed:', e);
    return [];
  }
}

export async function incrementDownload(id: string) {
  try {
    const { db, updateDoc, doc, increment } = await fs();
    await updateDoc(doc(db, 'apps', id), { downloads: increment(1) });
    const cached = peekCache<AppItem>(`app:${id}`);
    if (cached) {
      seedCache(`app:${id}`, { ...cached, downloads: (cached.downloads || 0) + 1 }, TTL.app.ttl, TTL.app.staleTtl);
    }
  } catch (error) {
    console.error('Failed to increment download count:', error);
  }
}

export async function fetchRequests(max = 100): Promise<AppRequest[]> {
  return cachedFetch(`requests:${max}`, async () => {
    const { db, getDocs, collection, query, orderBy, fbLimit } = await fs();
    const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): AppRequest => {
      const data = d.data();
      const tsRaw = data.timestamp;
      let timestamp = 0;
      if (typeof tsRaw === 'number') timestamp = tsRaw;
      else if (tsRaw && typeof tsRaw === 'object' && 'toMillis' in tsRaw) {
        try { timestamp = Number((tsRaw as { toMillis: () => number }).toMillis()) || 0; }
        catch { timestamp = 0; }
      } else timestamp = num(tsRaw) || 0;
      return {
        id: d.id,
        date: sanitizeText(String(data.date || ''), 32),
        name: sanitizeText(String(data.name || 'Untitled'), 120),
        status: sanitizeText(String(data.status || 'pending').toLowerCase(), 40),
        text: sanitizeText(String(data.text || data.note || data.message || ''), 600),
        timestamp,
      };
    };
    try {
      const snap = await getDocs(query(collection(db, 'requests'), orderBy('timestamp', 'desc'), fbLimit(max)));
      return snap.docs.map((d) => mapDoc(d as { id: string; data: () => Record<string, unknown> }));
    } catch (firstErr) {
      try {
        const snap = await getDocs(query(collection(db, 'requests'), fbLimit(max)));
        return snap.docs.map((d) => mapDoc(d as { id: string; data: () => Record<string, unknown> })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } catch (e) {
        console.error('fetchRequests failed:', firstErr || e);
        throw e;
      }
    }
  }, TTL.requests);
}

export async function submitRequest(name: string, note: string): Promise<'firestore' | 'local'> {
  const cleanName = sanitizeText(name, LIMITS.requestName);
  const cleanText = sanitizeText(note, LIMITS.requestNote);
  if (!cleanName) throw new Error('App name is required');
  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const payload = { date, name: cleanName, status: 'pending', text: cleanText, timestamp: now };
  try {
    const { db, addDoc, collection } = await fs();
    await addDoc(collection(db, 'requests'), payload);
    const { invalidateCache } = await import('./cache');
    invalidateCache('requests:');
    return 'firestore';
  } catch (error) {
    console.error('Firestore app request failed:', error);
    try {
      const key = 'apps-studio-pending-requests';
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      prev.unshift(payload);
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
    } catch { /* ignore */ }
    return 'local';
  }
}
