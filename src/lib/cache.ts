/**
 * ViewPorter-style multi-layer cache
 * ----------------------------------
 * 1) Memory (instant, same session)
 * 2) localStorage (survives reloads, TTL)
 * 3) In-flight promise dedupe (one network call for N waiters)
 * 4) Stale-while-revalidate (serve stale → refresh in background)
 *
 * Cuts Firestore reads when users navigate Home ↔ Detail ↔ Top repeatedly.
 */

type Entry<T> = {
  v: T;
  exp: number; // hard expiry
  stale: number; // soft stale time (SWR)
};

const mem = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const PREFIX = 'vp-cache:';

function now() {
  return Date.now();
}

function lsGet<T>(key: string): Entry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, entry: Entry<T>) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota full — drop oldest-ish keys
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k);
      }
      keys.slice(0, Math.ceil(keys.length / 3)).forEach((k) =>
        localStorage.removeItem(k)
      );
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
}

export type CacheOpts = {
  /** Fresh window (ms). Default 2 min. */
  ttl?: number;
  /** After ttl, still serve stale until this (ms). Default 30 min. */
  staleTtl?: number;
  /** Skip reading localStorage (memory only). */
  memoryOnly?: boolean;
  /** Force network even if fresh. */
  force?: boolean;
};

/**
 * Cached fetcher with SWR.
 * - Fresh hit → return immediately (no network)
 * - Stale hit → return immediately + revalidate in background
 * - Miss → network, then cache
 * - Concurrent callers share one in-flight promise
 */
export async function cachedFetch<T>(
  key: string,
  loader: () => Promise<T>,
  opts: CacheOpts = {}
): Promise<T> {
  const ttl = opts.ttl ?? 2 * 60_000;
  const staleTtl = opts.staleTtl ?? 30 * 60_000;
  const t = now();

  if (!opts.force) {
    const memHit = mem.get(key) as Entry<T> | undefined;
    if (memHit && memHit.exp > t) {
      return memHit.v;
    }

    if (!opts.memoryOnly) {
      const disk = lsGet<T>(key);
      if (disk && disk.exp > t) {
        mem.set(key, disk);
        return disk.v;
      }
      // Stale-while-revalidate
      if (disk && disk.stale > t) {
        mem.set(key, disk);
        void revalidate(key, loader, ttl, staleTtl, opts.memoryOnly);
        return disk.v;
      }
    } else if (memHit && memHit.stale > t) {
      void revalidate(key, loader, ttl, staleTtl, true);
      return memHit.v;
    }
  }

  return revalidate(key, loader, ttl, staleTtl, opts.memoryOnly);
}

function revalidate<T>(
  key: string,
  loader: () => Promise<T>,
  ttl: number,
  staleTtl: number,
  memoryOnly?: boolean
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = loader()
    .then((v) => {
      const t = now();
      const entry: Entry<T> = { v, exp: t + ttl, stale: t + staleTtl };
      mem.set(key, entry as Entry<unknown>);
      if (!memoryOnly) lsSet(key, entry);
      return v;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}

/** Read cache only (no network). Fresh or stale. */
export function peekCache<T>(key: string): T | undefined {
  const t = now();
  const m = mem.get(key) as Entry<T> | undefined;
  if (m && m.stale > t) return m.v;
  const d = lsGet<T>(key);
  if (d && d.stale > t) {
    mem.set(key, d as Entry<unknown>);
    return d.v;
  }
  return undefined;
}

/** Write into cache manually (e.g. after detail fetch seed list). */
export function seedCache<T>(
  key: string,
  value: T,
  ttl = 2 * 60_000,
  staleTtl = 30 * 60_000
) {
  const t = now();
  const entry: Entry<T> = { v: value, exp: t + ttl, stale: t + staleTtl };
  mem.set(key, entry as Entry<unknown>);
  lsSet(key, entry);
}

export function invalidateCache(prefixOrKey?: string) {
  if (!prefixOrKey) {
    mem.clear();
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    return;
  }
  for (const k of [...mem.keys()]) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) mem.delete(k);
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX + prefixOrKey) || k === PREFIX + prefixOrKey)
        keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** TTL presets used across the app */
export const TTL = {
  banners: { ttl: 5 * 60_000, staleTtl: 60 * 60_000 },
  top: { ttl: 2 * 60_000, staleTtl: 20 * 60_000 },
  category: { ttl: 3 * 60_000, staleTtl: 30 * 60_000 },
  app: { ttl: 3 * 60_000, staleTtl: 30 * 60_000 },
  search: { ttl: 90_000, staleTtl: 10 * 60_000 },
  requests: { ttl: 45_000, staleTtl: 5 * 60_000 },
  notices: { ttl: 3 * 60_000, staleTtl: 30 * 60_000 },
  page: { ttl: 90_000, staleTtl: 15 * 60_000 },
} as const;
