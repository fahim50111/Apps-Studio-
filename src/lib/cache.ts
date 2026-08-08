const memoryCache = new Map<string, { data: any; expiry: number }>();

export function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCache(key: string, data: any, ttlMs = 5 * 60 * 1000) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}

export function getLocalCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function setLocalCache(key: string, data: any, ttlMs = 30 * 60 * 1000) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
  } catch {
    // quota exceeded
  }
}

export function removeLocalCache(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
