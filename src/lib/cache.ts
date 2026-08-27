type Entry<T> = {
  v: T;
  exp: number;
  stale: number;
};

const mem = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const revalidatedThisSession = new Set<string>();

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
  ttl?: number;
  staleTtl?: number;
  memoryOnly?: boolean;
  force?: boolean;
};

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
      if (disk && disk.stale > t) {
        mem.set(key, disk);
        if (!revalidatedThisSession.has(key)) {
          revalidatedThisSession.add(key);
          void revalidate(key, loader, ttl, staleTtl, opts.memoryOnly);
        }
        return disk.v;
      }
    } else if (memHit && memHit.stale > t) {
      if (!revalidatedThisSession.has(key)) {
        revalidatedThisSession.add(key);
        void revalidate(key, loader, ttl, staleTtl, true);
      }
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

export const TTL = {
  banners: { ttl: 15 * 60_000, staleTtl: 6 * 60 * 60_000 },
  top: { ttl: 10 * 60_000, staleTtl: 3 * 60 * 60_000 },
  category: { ttl: 10 * 60_000, staleTtl: 3 * 60 * 60_000 },
  app: { ttl: 15 * 60_000, staleTtl: 4 * 60 * 60_000 },
  search: { ttl: 10 * 60_000, staleTtl: 2 * 60 * 60_000 },
  requests: { ttl: 2 * 60_000, staleTtl: 20 * 60_000 },
  notices: { ttl: 10 * 60_000, staleTtl: 2 * 60 * 60_000 },
  page: { ttl: 8 * 60_000, staleTtl: 2 * 60 * 60_000 },
} as const;

export function collectCachedByPrefix<T>(prefix: string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const push = (key: string, v: unknown) => {
    if (seen.has(key) || v == null) return;
    seen.add(key);
    out.push(v as T);
  };
  for (const [k, e] of mem) {
    if (k.startsWith(prefix)) push(k, e.v);
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const rawKey = localStorage.key(i);
      if (!rawKey?.startsWith(PREFIX + prefix)) continue;
      const key = rawKey.slice(PREFIX.length);
      if (seen.has(key)) continue;
      const disk = lsGet<T>(key);
      if (disk) push(key, disk.v);
    }
  } catch {
    /* ignore */
  }
  return out;
}
