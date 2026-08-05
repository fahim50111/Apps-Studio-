import { initializeApp } from 'firebase/app';
import {
  getFirestore,
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
  limit as fbLimit,
  startAfter,
  documentId,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { sanitizeText, safeUrl, LIMITS } from './security';

const firebaseConfig = {
  apiKey: 'AIzaSyByoVGSmDnWVYAY3CFFpHYOC2siWAH0ajE',
  authDomain: 'apps-studio-1f1c0.firebaseapp.com',
  databaseURL: 'https://apps-studio-1f1c0-default-rtdb.firebaseio.com',
  projectId: 'apps-studio-1f1c0',
  storageBucket: 'apps-studio-1f1c0.firebasestorage.app',
  messagingSenderId: '106546673585',
  appId: '1:106546673585:web:48f13f073d92d9cb58af90',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface DownloadLink {
  name: string;
  url: string;
}

export interface AppItem {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  logo?: string;
  cover?: string;
  link?: string;
  links?: DownloadLink[];
  versionName?: string;
  description?: string;
  size?: string;
  isMod?: boolean;
  downloads?: number;
  timestamp?: number;
  updatedAt?: number;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  desc?: string;
  link?: string;
  timestamp?: number;
}

export interface AdminNotice {
  id: string;
  title: string;
  message: string;
  link?: string;
  timestamp?: number;
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
      // Drop any non-http(s) URL (javascript:, data:, etc.) at the source.
      const url = safeUrl((o.url as string) || (o.link as string) || '') || '';
      return { name: name || 'Download', url };
    })
    .filter((l) => l.url);
}

function mapApp(id: string, data: DocumentData): AppItem {
  return {
    id,
    name: (data.name as string) || (data.displayName as string) || 'Untitled',
    displayName: (data.displayName as string) || (data.name as string),
    category: (data.category as string) || 'tools',
    logo: safeUrl(data.logo as string) || '',
    cover: safeUrl(data.cover as string) || '',
    link: safeUrl(data.link as string) || '',
    links: mapLinks(data.links),
    versionName: (data.versionName as string) || '',
    description: (data.description as string) || '',
    size: (data.size as string) || '',
    isMod: Boolean(data.isMod),
    downloads: num(data.downloads) ?? 0,
    timestamp: num(data.timestamp),
    updatedAt: num(data.updatedAt),
  };
}

/**
 * NOTE: Firestore push-style IDs (e.g. "-OnQjBbNgWIhYrRqGD4X") are
 * chronologically sortable, so ordering by documentId() descending gives us the
 * newest apps first WITHOUT requiring every doc to have a `timestamp` field —
 * and works with any collection size because we always cap it with limit().
 */

// ---------- App detail (single doc) ----------
const singleCache = new Map<string, AppItem>();

export async function fetchAppById(id: string): Promise<AppItem | null> {
  if (singleCache.has(id)) return singleCache.get(id)!;
  const snap = await getDoc(doc(db, 'apps', id));
  if (!snap.exists()) return null;
  const item = mapApp(snap.id, snap.data());
  singleCache.set(id, item);
  return item;
}

// ---------- Banners (small collection, load all) ----------
let bannersCache: Banner[] | null = null;

export async function fetchBanners(force = false): Promise<Banner[]> {
  if (bannersCache && !force) return bannersCache;
  const snap = await getDocs(collection(db, 'banners'));
  bannersCache = snap.docs.map((d) => {
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
  return bannersCache;
}

// ---------- Admin notifications/notices (admin app writes, public site reads) ----------
export async function fetchAdminNotices(max = 10): Promise<AdminNotice[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'admin_notifications'), fbLimit(max))
    );
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: sanitizeText((data.title as string) || 'Notice', 100),
          message: sanitizeText((data.message as string) || '', 300),
          link: safeUrl(data.link as string) || '',
          timestamp: num(data.timestamp) || num(data.createdAt) || 0,
        };
      })
      .filter((n) => n.message)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch {
    return [];
  }
}

// ---------- Total app count (cheap server aggregate) ----------
let countCache: number | null = null;

export async function fetchAppCount(): Promise<number> {
  if (countCache !== null) return countCache;
  try {
    const snap = await getCountFromServer(collection(db, 'apps'));
    countCache = snap.data().count;
  } catch {
    countCache = 0;
  }
  return countCache;
}

// ---------- Paginated list (cursor based) ----------
export interface Page {
  items: AppItem[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Loads one page of apps, newest first.
 * @param pageSize how many docs to pull
 * @param cursor   last doc snapshot from the previous page (for "load more")
 * @param category optional category filter
 */
export async function fetchAppsPage(
  pageSize: number,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  category?: string
): Promise<Page> {
  const build = (ordered: boolean) => {
    const constraints = [];
    if (category) constraints.push(where('category', '==', category));
    if (ordered) constraints.push(orderBy(documentId(), 'desc'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(fbLimit(pageSize));
    return query(collection(db, 'apps'), ...constraints) as Query<DocumentData>;
  };

  let snap;
  try {
    snap = await getDocs(build(true));
  } catch {
    // Missing composite index for (category + documentId) — fall back to an
    // unordered, still-bounded query so the UI keeps working.
    snap = await getDocs(build(false));
  }

  const items = snap.docs.map((d) => mapApp(d.id, d.data()));
  const last = snap.docs[snap.docs.length - 1] || null;
  return {
    items,
    cursor: last,
    hasMore: snap.docs.length === pageSize,
  };
}

// ---------- Top downloaded (for charts / trending) ----------
export async function fetchTopApps(max = 50): Promise<AppItem[]> {
  try {
    const q = query(
      collection(db, 'apps'),
      orderBy('downloads', 'desc'),
      fbLimit(max)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => mapApp(d.id, d.data()));
    if (items.length) return items;
  } catch {
    /* falls through to fallback below */
  }
  // Fallback (e.g. missing index) — pull a page and sort client-side
  const page = await fetchAppsPage(max);
  return page.items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

// ---------- Most downloaded apps in a single category (related list) ----------
export async function fetchTopByCategory(
  category: string,
  max = 10,
  excludeId?: string
): Promise<AppItem[]> {
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
    // fallback if the composite index is missing: equality query + client sort
    try {
      const q2 = query(
        collection(db, 'apps'),
        where('category', '==', category),
        fbLimit(60)
      );
      const snap2 = await getDocs(q2);
      items = snap2.docs
        .map((d) => mapApp(d.id, d.data()))
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } catch {
      items = [];
    }
  }
  return items.filter((a) => a.id !== excludeId).slice(0, max);
}

// ---------- Newest apps in a single category ----------
export async function fetchCategoryPreview(
  category: string,
  max = 6
): Promise<AppItem[]> {
  try {
    const q = query(
      collection(db, 'apps'),
      where('category', '==', category),
      orderBy(documentId(), 'desc'),
      fbLimit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapApp(d.id, d.data()));
  } catch {
    // Fallback if a composite index is missing: plain equality query, capped.
    try {
      const q2 = query(
        collection(db, 'apps'),
        where('category', '==', category),
        fbLimit(max)
      );
      const snap2 = await getDocs(q2);
      return snap2.docs.map((d) => mapApp(d.id, d.data()));
    } catch {
      return [];
    }
  }
}

// ---------- Search (caps how much it scans, newest first) ----------
export async function searchApps(term: string, scan = 500): Promise<AppItem[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];

  // Plain limited fetch — no orderBy so it never needs a special index.
  let snap;
  try {
    snap = await getDocs(query(collection(db, 'apps'), fbLimit(scan)));
  } catch (e) {
    console.error('searchApps failed:', e);
    return [];
  }

  return snap.docs
    .map((d) => mapApp(d.id, d.data()))
    .filter((a) => {
      const name = (a.displayName || a.name || '').toLowerCase();
      const cat = (a.category || '').toLowerCase();
      return name.includes(t) || cat.includes(t);
    })
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

// ---------- Mutations ----------
export async function incrementDownload(id: string) {
  try {
    await updateDoc(doc(db, 'apps', id), { downloads: increment(1) });
    const cached = singleCache.get(id);
    if (cached) cached.downloads = (cached.downloads || 0) + 1;
  } catch (error) {
    console.error('Failed to increment download count:', error);
  }
}

export async function submitRequest(name: string, note: string): Promise<'firestore' | 'local'> {
  const cleanName = sanitizeText(name, LIMITS.requestName);
  const cleanNote = sanitizeText(note, LIMITS.requestNote);
  if (!cleanName) throw new Error('App name is required');
  // Payload shape is enforced by Firestore rules; we keep it identical here.
  try {
    await addDoc(collection(db, 'app_requests'), {
      name: cleanName,
      note: cleanNote,
      timestamp: serverTimestamp(),
      createdAt: Date.now(),
    });
    return 'firestore';
  } catch (error) {
    // If live Firestore rules have not been deployed yet, do not make the form
    // look broken. Keep a local backup and let the UI offer WhatsApp handoff.
    console.error('Firestore app request failed:', error);
    try {
      const key = 'apps-studio-pending-requests';
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      prev.unshift({ name: cleanName, note: cleanNote, createdAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
    } catch {
      /* ignore local backup failure */
    }
    return 'local';
  }
}
