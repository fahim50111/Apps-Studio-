import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAppsPage } from '../lib/firebase';
import type { AppItem, PageCursor } from '../lib/types';
import { CATEGORIES, CATEGORY_META, catLabel } from '../lib/util';
import { AppCard } from '../components/AppCard';
import { RowSkeleton, CardSkeleton } from '../components/Skeletons';
import { useResponsivePageSize } from '../lib/useResponsivePage';
import TopProgress from '../components/TopProgress';
import { updateSEO } from '../lib/seo';
import {
  Loader2,
  PackageOpen,
  Users,
  Gamepad2,
  Wrench,
  Clapperboard,
  GraduationCap,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Gamepad2,
  Wrench,
  Clapperboard,
  GraduationCap,
  Briefcase,
};

export default function Categories() {
  // page size adapts to the screen: enough rows to fill the viewport + spare
  const { pageSize, cols } = useResponsivePageSize(5);

  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const cursorRef = useRef<PageCursor | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  const [params, setParams] = useSearchParams();
  const active = params.get('cat') || 'all';

  useEffect(() => {
    const label =
      active === 'all'
        ? 'All Apps'
        : active.charAt(0).toUpperCase() + active.slice(1);
    updateSEO({
      title: `${label} — Browse Free Apps & Mod Games | Apps Studio`,
      description: `Browse ${label.toLowerCase()} on Apps Studio. Download premium unlocked apps and mod games for free.`,
    });
  }, [active]);

  const loadFirst = useCallback(
    (cat: string, size: number) => {
      setLoading(true);
      cursorRef.current = null;
      const category = cat === 'all' ? undefined : cat;
      fetchAppsPage(size, null, category)
        .then((page) => {
          setApps(page.items);
          cursorRef.current = page.cursor;
          setHasMore(page.hasMore);
          hasMoreRef.current = page.hasMore;
        })
        .finally(() => setLoading(false));
    },
    []
  );

  // reload when the category changes
  useEffect(() => {
    loadFirst(active, pageSize);
  }, [active, pageSize, loadFirst]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const category = active === 'all' ? undefined : active;
    fetchAppsPage(pageSize, cursorRef.current, category)
      .then((page) => {
        setApps((prev) => [...prev, ...page.items]);
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
        hasMoreRef.current = page.hasMore;
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [active, pageSize]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, apps.length, hasMore]);

  const setCat = (cat: string) => {
    if (cat === 'all') setParams({});
    else setParams({ cat });
  };

  return (
    <div className="pb-6">
      <TopProgress active={loading} />

      {/* category chips */}
      <div className="sticky top-0 z-20 border-b border-line/60 bg-bg/90 px-4 py-3 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Chip
            label="All"
            activeState={active === 'all'}
            onClick={() => setCat('all')}
          />
          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <Chip
                key={c}
                label={catLabel(c)}
                icon={meta?.icon}
                color={meta?.color}
                activeState={active === c}
                onClick={() => setCat(c)}
              />
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 px-4">
          <RowSkeleton />
        </div>
      ) : apps.length ? (
        <>
          <div className="grid grid-cols-3 gap-3 px-4 sm:grid-cols-4 md:grid-cols-6">
            {apps.map((a) => (
              <AppCard key={a.id} app={a} />
            ))}
            {loadingMore &&
              Array.from({ length: cols }).map((_, i) => (
                <CardSkeleton key={`s-${i}`} />
              ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-1 w-full" />}

          {hasMore ? (
            <div className="mt-6 flex justify-center px-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-line bg-panel px-6 py-3 text-sm font-bold text-fg transition hover:border-accent/50 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-xs text-mute">
              You've reached the end
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-24 text-center text-mute">
          <PackageOpen className="mb-3 h-12 w-12" />
          <p className="text-sm">No apps in this category yet.</p>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  icon,
  color,
  activeState,
  onClick,
}: {
  label: string;
  icon?: string;
  color?: string;
  activeState: boolean;
  onClick: () => void;
}) {
  const Icon = icon ? ICON_MAP[icon] : null;
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
        activeState
          ? 'bg-accent text-ink'
          : 'border border-line bg-panel text-mute hover:text-fg'
      }`}
    >
      {Icon && (
        <Icon
          className="h-3.5 w-3.5"
          style={!activeState && color ? { color } : undefined}
        />
      )}
      {label}
    </button>
  );
}
