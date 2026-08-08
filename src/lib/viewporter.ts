import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ViewPorter — viewport-powered loading
 * -------------------------------------
 * Only runs network work when a section actually enters the viewport.
 * Combined with `cachedFetch`, this is the main bandwidth saver on Home
 * (category rows load one-by-one as the user scrolls, not all at once).
 */

export type InViewOptions = {
  /** Root margin — preload slightly before visible. Default 240px. */
  rootMargin?: string;
  /** Once true, stay true (default true). */
  once?: boolean;
  /** Intersection ratio 0–1. Default 0.05 */
  threshold?: number | number[];
  /** Disabled until parent is ready. */
  enabled?: boolean;
};

export function useInView<T extends Element = HTMLDivElement>(
  opts: InViewOptions = {}
) {
  const {
    rootMargin = '240px 0px',
    once = true,
    threshold = 0.05,
    enabled = true,
  } = opts;

  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled || inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // SSR / old browsers — load immediately
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

/**
 * Load data only when the sentinel enters the viewport.
 * Shows cached data instantly if available (via optional peek).
 */
export function useViewportQuery<T>(
  key: string | false,
  loader: () => Promise<T>,
  opts: InViewOptions & {
    /** Instant seed from cache (no wait). */
    initial?: T | (() => T | undefined);
    /** deps that force reload when in view */
    deps?: unknown[];
  } = {}
) {
  const { ref, inView } = useInView(opts);
  const [data, setData] = useState<T | undefined>(() => {
    if (typeof opts.initial === 'function')
      return (opts.initial as () => T | undefined)();
    return opts.initial;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const loadedKey = useRef<string | false>(false);

  const depsKey = JSON.stringify(opts.deps || []);

  const run = useCallback(async () => {
    if (!key) return;
    setLoading(true);
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
    // loader intentionally excluded — callers pass stable keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, depsKey]);

  useEffect(() => {
    if (!inView || !key) return;
    if (loadedKey.current === key && data !== undefined) return;
    void run();
  }, [inView, key, run, data]);

  return { ref, inView, data, loading, error, reload: run };
}

/** Prefetch when idle + near viewport (optional helper). */
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
