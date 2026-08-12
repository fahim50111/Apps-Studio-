import { sanitizeText, safeUrl, LIMITS } from './security';
import { cachedFetch, seedCache, peekCache, TTL } from './cache';
import type {
  AppItem,
  Banner,
  AdminNotice,
  AppRequest,
  DownloadLink,
  Page,
  PageCursor,
} from './types';

export type {
  AppItem,
  Banner,
  AdminNotice,
  AppRequest,
  DownloadLink,
  Page,
  PageCursor,
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

/**
 * Lazy-load Firebase + enable persistent local cache (IndexedDB).
 * Repeated visits / SPA navigations hit disk cache → fewer billed reads.
 */
async function getDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      const {
        initializeFirestore,
        getFirestore,
        persistentLocalCache,
        persistentMultipleTabManager,
      } = await import('firebase/firestore');
      const app =
        getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      try {
        return initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        // Already initialized (HMR / second call) or persistence unsupported
        return getFirestore(app);
      }
    })();
  }
  return dbPromise;
}



async function fs() {
  const [
    db,
    {
      collection,
      getDocs,
      getDoc,
      doc,
      addDoc,
      updateDoc,
      increment,
      serverTimestamp,
      query,
      where,
      orderBy,
      limit: fbLimit,
      startAfter,
      documentId,
      getCountFromServer,
    },
  ] = await Promise.all([getDb(), import('firebase/firestore')]);

  return {
    db,
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    increment,
    serverTimestamp,
    query,
    where,
    orderBy,
    fbLimit,
    startAfter,
    documentId,
    getCountFromServer,
  };
}

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

function mapLinks(raw: unknown): DownloadLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const o = (l || {}) as Record<string, unknown>;
      const name = sanitizeText(
        (o.name as string) || (o.title as string) || 'Download',
        80
      );
      const url = safeUrl((o.url as string) || (o.link as string) || '') || '';
      return {
        name: name || 'Download',
        url,
        // Keep admin-provided per-link times when present
        updatedAt: num(o.updatedAt) ?? num(o.updated_at),
        timestamp: num(o.timestamp) ?? num(o.createdAt) ?? num(o.date),
      };
    })
    .filter((l) => l.url);
}

function mapScreenshots(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === 'string') return safeUrl(s) || '';
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        return safeUrl((o.url as string) || (o.image as string) || '') || '';
      }
      return '';
    })
    .filter(Boolean)
    .slice(0, 12);
}

function mapApp(id: string, data: FsDocData): AppItem {
  return {
    id,
    name: (data.name as string) || (data.displayName as string) || 'Untitled',
    displayName: (data.displayName as string) || (data.name as string),
    category: (data.category as string) || 'tools',
    logo: safeUrl(data.logo as string) || '',
    cover: safeUrl(data.cover as string) || '',
    screenshots: mapScreenshots(
      data.screenshots || data.images || data.gallery
    ),
    link: safeUrl(data.link as string) || '',
    links: mapLinks(data.links),
    versionName: (data.versionName as string) || '',
    description: (data.description as string) || '',
    size: (data.size as string) || '',
    isMod: Boolean(data.isMod),
    downloads: num(data.downloads) ?? 0,
    // Prefer explicit timestamp, then createdAt, then updatedAt for upload date.
    timestamp:
      num(data.timestamp) ?? num(data.createdAt) ?? num(data.updatedAt),
    updatedAt: num(data.updatedAt) ?? num(data.timestamp) ?? num(data.createdAt),
  };
}

function rememberApp(item: AppItem) {
  seedCache(`app:${item.id}`, item, TTL.app.ttl, TTL.app.staleTtl);
}

export async function fetchAppById(id: string): Promise<AppItem | null> {
  return cachedFetch(
    `app:${id}`,
    async () => {
      const { db, getDoc, doc } = await fs();
      const snap = await getDoc(doc(db, 'apps', id));
      if (!snap.exists()) return null;
      const item = mapApp(snap.id, snap.data());
      return item;
    },
    TTL.app
  );
}

export async function fetchBanners(force = false): Promise<Banner[]> {
  return cachedFetch(
    'banners',
    async () => {
      const { db, getDocs, collection } = await fs();
      const snap = await getDocs(collection(db, 'banners'));
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
    },
    { ...TTL.banners, force }
  );
}

export async function fetchAdminNotices(max = 10): Promise<AdminNotice[]> {
  return cachedFetch(
    `notices:${max}`,
    async () => {
      const { db, getDocs, collection, query, fbLimit } = await fs();

      const mapSnap = (snap: {
        docs: { id: string; data: () => Record<string, unknown> }[];
      }) =>
        snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: sanitizeText(
                (data.title as string) || (data.name as string) || 'Notice',
                100
              ),
              message: sanitizeText(
                (data.message as string) ||
                  (data.body as string) ||
                  (data.desc as string) ||
                  (data.content as string) ||
                  '',
                300
              ),
              link:
                safeUrl((data.link as string) || (data.url as string) || '') ||
                '',
              timestamp: num(data.timestamp) || num(data.createdAt) || 0,
            };
          })
          .filter((n) => n.title || n.message)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      try {
        const snap = await getDocs(query(collection(db, 'news'), fbLimit(max)));
        const items = mapSnap(snap);
        if (items.length) return items;
      } catch {
        /* try legacy */
      }
      try {
        const snap = await getDocs(
          query(collection(db, 'admin_notifications'), fbLimit(max))
        );
        return mapSnap(snap);
      } catch {
        return [];
      }
    },
    TTL.notices
  );
}

export async function fetchAppCount(): Promise<number> {
  return cachedFetch(
    'app-count',
    async () => {
      try {
        const { db, getCountFromServer, collection } = await fs();
        const snap = await getCountFromServer(collection(db, 'apps'));
        return snap.data().count;
      } catch {
        return 0;
      }
    },
    { ttl: 10 * 60_000, staleTtl: 60 * 60_000 }
  );
}

async function fetchAppsPageUncached(
  pageSize: number,
  cursor?: PageCursor | null,
  category?: string
): Promise<Page> {
  const {
    db,
    getDocs,
    collection,
    query,
    where,
    orderBy,
    fbLimit,
    startAfter,
    documentId,
  } = await fs();

  const build = (ordered: boolean) => {
    const constraints = [];
    if (category) constraints.push(where('category', '==', category));
    if (ordered) constraints.push(orderBy(documentId(), 'desc'));
    if (cursor) {
      constraints.push(startAfter(cursor as FsQueryDoc));
    }
    constraints.push(fbLimit(pageSize));
    return query(collection(db, 'apps'), ...constraints) as FsQuery;
  };

  let snap;
  try {
    snap = await getDocs(build(true));
  } catch {
    snap = await getDocs(build(false));
  }

  const items = snap.docs.map((d) => mapApp(d.id, d.data()));
  seedApps(items);
  const last = snap.docs[snap.docs.length - 1] || null;
  return {
    items,
    cursor: last,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function fetchAppsPage(
  pageSize: number,
  cursor?: PageCursor | null,
  category?: string
): Promise<Page> {
  // First page: memory-only cache (Firestore cursor can't serialize to localStorage)
  if (!cursor) {
    return cachedFetch(
      `page:${category || 'all'}:${pageSize}`,
      () => fetchAppsPageUncached(pageSize, null, category),
      { ...TTL.page, memoryOnly: true }
    );
  }
  return fetchAppsPageUncached(pageSize, cursor, category);
}

function seedApps(items: AppItem[]) {
  items.forEach(rememberApp);
}

export async function fetchTopApps(max = 50): Promise<AppItem[]> {
  return cachedFetch(
    `top:${max}`,
    async () => {
      const { db, getDocs, collection, query, orderBy, fbLimit } = await fs();
      try {
        const q = query(
          collection(db, 'apps'),
          orderBy('downloads', 'desc'),
          fbLimit(max)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => mapApp(d.id, d.data()));
        if (items.length) {
          seedApps(items);
          return items;
        }
      } catch {
        /* fallback */
      }
      const page = await fetchAppsPageUncached(max);
      const sorted = page.items.sort(
        (a, b) => (b.downloads || 0) - (a.downloads || 0)
      );
      seedApps(sorted);
      return sorted;
    },
    TTL.top
  );
}

export async function fetchTopByCategory(
  category: string,
  max = 10,
  excludeId?: string
): Promise<AppItem[]> {
  const key = `cat-top:${category}:${max}:${excludeId || ''}`;
  return cachedFetch(
    key,
    async () => {
      const { db, getDocs, collection, query, where, orderBy, fbLimit } =
        await fs();
      const take = max + (excludeId ? 1 : 0);
      let items: AppItem[] = [];
      try {
        const q = query(
          collection(db, 'apps'),
          where('category', '==', category),
          orderBy('downloads', 'desc'),
          fbLimit(take)
        );
        const snap = await getDocs(q);
        items = snap.docs.map((d) => mapApp(d.id, d.data()));
      } catch {
        try {
          const q2 = query(
            collection(db, 'apps'),
            where('category', '==', category),
            fbLimit(Math.min(40, take * 4))
          );
          const snap2 = await getDocs(q2);
          items = snap2.docs
            .map((d) => mapApp(d.id, d.data()))
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        } catch {
          items = [];
        }
      }
      const out = items.filter((a) => a.id !== excludeId).slice(0, max);
      seedApps(out);
      return out;
    },
    TTL.category
  );
}

export async function fetchCategoryPreview(
  category: string,
  max = 6
): Promise<AppItem[]> {
  // Same as top-by-category for home previews — share cache key family
  return fetchTopByCategory(category, max);
}

/** Newest apps by push-id order (for notifications baseline). */
export async function fetchNewestApps(max = 60): Promise<AppItem[]> {
  return cachedFetch(
    `newest:${max}`,
    async () => {
      const { db, getDocs, collection, query, fbLimit } = await fs();
      try {
        const snap = await getDocs(
          query(collection(db, 'apps'), fbLimit(max))
        );
        return snap.docs
          .map((d) => mapApp(d.id, d.data()))
          .sort((a, b) => (a.id < b.id ? 1 : -1));
      } catch {
        return [];
      }
    },
    { ttl: 5 * 60_000, staleTtl: 30 * 60_000 }
  );
}

export async function fetchSuggestPool(
  max = 200
): Promise<{ id: string; name: string; logo?: string; category?: string }[]> {
  // Reuse top apps cache — no extra Firestore scan
  const apps = await fetchTopApps(Math.min(max, 50));
  return apps.map((a) => ({
    id: a.id,
    name: a.displayName || a.name,
    logo: a.logo,
    category: a.category,
  }));
}

/** Catalog scan used by search — heavily cached; small scan window. */
async function loadSearchCatalog(scan = 200): Promise<AppItem[]> {
  return cachedFetch(
    `search-catalog:${scan}`,
    async () => {
      const { db, getDocs, collection, query, fbLimit } = await fs();
      const snap = await getDocs(
        query(collection(db, 'apps'), fbLimit(scan))
      );
      const items = snap.docs.map((d) => mapApp(d.id, d.data()));
      seedApps(items);
      return items;
    },
    { ttl: 3 * 60_000, staleTtl: 20 * 60_000 }
  );
}

export async function searchApps(term: string, scan = 200): Promise<AppItem[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];

  // Prefer filtering the already-warm top/catalog cache before a full scan
  const top = peekCache<AppItem[]>('top:50') || peekCache<AppItem[]>('top:24');
  if (top?.length) {
    const fromTop = top
      .filter((a) => {
        const name = (a.displayName || a.name || '').toLowerCase();
        const cat = (a.category || '').toLowerCase();
        return name.includes(t) || cat.includes(t);
      })
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    // If we got decent hits, skip the big catalog fetch
    if (fromTop.length >= 5 || t.length < 3) return fromTop;
  }

  try {
    const catalog = await loadSearchCatalog(scan);
    return catalog
      .filter((a) => {
        const name = (a.displayName || a.name || '').toLowerCase();
        const cat = (a.category || '').toLowerCase();
        return name.includes(t) || cat.includes(t);
      })
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
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
      seedCache(
        `app:${id}`,
        { ...cached, downloads: (cached.downloads || 0) + 1 },
        TTL.app.ttl,
        TTL.app.staleTtl
      );
    }
  } catch (error) {
    console.error('Failed to increment download count:', error);
  }
}

/** Fetch public request board (newest first). */
export async function fetchRequests(max = 100): Promise<AppRequest[]> {
  return cachedFetch(
    `requests:${max}`,
    async () => {
      const { db, getDocs, collection, query, orderBy, fbLimit } = await fs();

      const mapDoc = (d: {
        id: string;
        data: () => Record<string, unknown>;
      }): AppRequest => {
        const data = d.data();
        const tsRaw = data.timestamp;
        let timestamp = 0;
        if (typeof tsRaw === 'number') timestamp = tsRaw;
        else if (tsRaw && typeof tsRaw === 'object' && 'toMillis' in tsRaw) {
          try {
            timestamp =
              Number((tsRaw as { toMillis: () => number }).toMillis()) || 0;
          } catch {
            timestamp = 0;
          }
        } else {
          timestamp = num(tsRaw) || 0;
        }

        return {
          id: d.id,
          date: sanitizeText(String(data.date || ''), 32),
          name: sanitizeText(String(data.name || 'Untitled'), 120),
          status: sanitizeText(
            String(data.status || 'pending').toLowerCase(),
            40
          ),
          text: sanitizeText(
            String(data.text || data.note || data.message || ''),
            600
          ),
          timestamp,
        };
      };

      try {
        const snap = await getDocs(
          query(
            collection(db, 'requests'),
            orderBy('timestamp', 'desc'),
            fbLimit(max)
          )
        );
        return snap.docs.map((d) =>
          mapDoc(d as { id: string; data: () => Record<string, unknown> })
        );
      } catch (firstErr) {
        try {
          const snap = await getDocs(
            query(collection(db, 'requests'), fbLimit(max))
          );
          return snap.docs
            .map((d) =>
              mapDoc(d as { id: string; data: () => Record<string, unknown> })
            )
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (e) {
          console.error('fetchRequests failed:', firstErr || e);
          throw e;
        }
      }
    },
    TTL.requests
  );
}

/**
 * Submit an app request to collection `requests`.
 * Schema (admin panel):
 *   date: string, name: string, status: string, text: string, timestamp: int64
 */
export async function submitRequest(
  name: string,
  note: string
): Promise<'firestore' | 'local'> {
  const cleanName = sanitizeText(name, LIMITS.requestName);
  const cleanText = sanitizeText(note, LIMITS.requestNote);
  if (!cleanName) throw new Error('App name is required');

  const now = Date.now(); // int64 ms
  const date = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD string
  const payload = {
    date,
    name: cleanName,
    status: 'pending',
    text: cleanText,
    timestamp: now,
  };

  try {
    const { db, addDoc, collection } = await fs();
    await addDoc(collection(db, 'requests'), payload);
    // Bust request board cache so next load is fresh
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
    } catch {
      /* ignore */
    }
    return 'local';
  }
}
