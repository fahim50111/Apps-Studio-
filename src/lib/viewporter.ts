import { useCallback, useEffect, useRef, useState } from 'react';
import { peekCache } from './cache';

export type InViewOptions = {
  rootMargin?: string;
  once?: boolean;
  threshold?: number | number[];
  enabled?: boolean;
  eager?: boolean;
};

export function useInView<T extends Element = HTMLDivElement>(opts: InViewOptions = {}) {
  const {
    rootMargin = '240px 0px',
    once = true,
    threshold = 0.05,
    enabled = true,
    eager = false,
  } = opts;

  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(eager);

  useEffect(() => {
    if (!enabled || inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [enabled, inView, once, rootMargin, threshold]);

  return { ref, inView };
}

export function useViewportQuery<T>(
  key: string | false,
  loader: () => Promise<T>,
  opts: InViewOptions & {
    initial?: T | (() => T | undefined);
    deps?: unknown[];
    skipIfCached?: boolean;
  } = {}
) {
  const hasValue = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null;

  const { ref, inView } = useInView(opts);
  const [data, setData] = useState<T | undefined>(() => {
    if (typeof opts.initial === 'function') return (opts.initial as () => T | undefined)();
    if (opts.initial !== undefined) return opts.initial;
    return key ? peekCache<T>(String(key)) : undefined;
  });
  const [loading, setLoading] = useState(!hasValue(data));
  const [error, setError] = useState<Error | null>(null);
  const loadedKey = useRef<string | false>(hasValue(data) ? key : false);

  const depsKey = JSON.stringify(opts.deps || []);
  const skipIfCached = opts.skipIfCached !== false;

  const run = useCallback(async () => {
    if (!key) return;
    if (skipIfCached && loadedKey.current === key && hasValue(data)) return;
    if (!hasValue(data)) setLoading(true);
    setError(null);
    try {
      const v = await loader();
      setData(v);
      loadedKey.current = key;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, depsKey, skipIfCached]);

  useEffect(() => {
    if (!inView || !key) return;
    if (skipIfCached && loadedKey.current === key && hasValue(data)) return;
    void run();
  }, [inView, key, run, data, skipIfCached]);

  return { ref, inView, data, loading, error, reload: run };
}

export function usePorter<T>(
  key: string,
  loader: () => Promise<T>,
  opts: InViewOptions & {
    seed?: T | (() => T | undefined);
    skipIfCached?: boolean;
  } = {}
) {
  const seed =
    typeof opts.seed === 'function' ? (opts.seed as () => T | undefined)() : opts.seed;
  return useViewportQuery(key, loader, {
    ...opts,
    initial: seed ?? (() => peekCache<T>(key)),
    skipIfCached: opts.skipIfCached !== false,
  });
}

export function scheduleIdle(fn: () => void, timeout = 2000) {
  if (typeof window === 'undefined') return;
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (ric) {
    ric(fn, { timeout });
  } else {
    window.setTimeout(fn, Math.min(timeout, 400));
  }
}
