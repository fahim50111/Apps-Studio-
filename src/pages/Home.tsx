import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchBanners,
  fetchTopApps,
  fetchTopByCategory,
} from '../lib/firebase';
import type { AppItem, Banner } from '../lib/types';
import { CATEGORIES, catLabel } from '../lib/util';
import {
  getRecentApps,
  clearRecentApps,
  type RecentApp,
} from '../lib/history';
import { peekCache } from '../lib/cache';
import { useInView, scheduleIdle } from '../lib/viewporter';
import { updateSEO } from '../lib/seo';
import BannerSlider from '../components/BannerSlider';
import CategoryMarquee from '../components/CategoryMarquee';
import TopProgress from '../components/TopProgress';
import { AppCard, ListItem } from '../components/AppCard';
import AppImage from '../components/AppImage';
import { RowSkeleton } from '../components/Skeletons';
import {
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  History,
  Trash2,
} from 'lucide-react';

function SectionHeader({
  title,
  to,
  icon,
  action,
}: {
  title: string;
  to?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between px-1">
      <h2 className="font-display flex items-center gap-2 text-base font-bold text-fg">
        {icon}
        {title}
      </h2>
      {action ||
        (to && (
          <Link
            to={to}
            className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-accent"
          >
            All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ))}
    </div>
  );
}

function Grid({ apps }: { apps: AppItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {apps.map((a) => (
        <AppCard key={a.id} app={a} />
      ))}
    </div>
  );
}

const TOP_POOL = 24;
const CAT_PREVIEW = 6;

/** Category row — loads only when scrolled into view (ViewPorter). */
function CategoryRow({ cat }: { cat: string }) {
  const cacheKey = `cat-top:${cat}:${CAT_PREVIEW}:`;
  const { ref, inView } = useInView({ rootMargin: '320px 0px' });
  const [apps, setApps] = useState<AppItem[]>(
    () => peekCache<AppItem[]>(cacheKey) || []
  );
  const [loading, setLoading] = useState(apps.length === 0);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    // Instant paint from cache already done; still SWR-refresh
    setLoading(apps.length === 0);
    fetchTopByCategory(cat, CAT_PREVIEW)
      .then((items) => {
        if (!alive) return;
        setApps(items);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, cat]);

  if (!inView && apps.length === 0) {
    return (
      <section ref={ref} className="min-h-[120px]">
        <SectionHeader title={catLabel(cat)} to={`/categories?cat=${cat}`} />
        <div className="skeleton h-28 w-full rounded-2xl" />
      </section>
    );
  }

  if (loading && !apps.length) {
    return (
      <section ref={ref}>
        <SectionHeader title={catLabel(cat)} to={`/categories?cat=${cat}`} />
        <RowSkeleton />
      </section>
    );
  }

  if (!apps.length) return <div ref={ref} />;

  return (
    <section ref={ref}>
      <SectionHeader title={catLabel(cat)} to={`/categories?cat=${cat}`} />
      <Grid apps={apps} />
    </section>
  );
}

export default function Home() {
  // Hydrate from ViewPorter cache for instant paint
  const [banners, setBanners] = useState<Banner[]>(
    () => peekCache<Banner[]>('banners') || []
  );
  const [topApps, setTopApps] = useState<AppItem[]>(
    () => peekCache<AppItem[]>(`top:${TOP_POOL}`) || []
  );
  const [recent, setRecent] = useState<RecentApp[]>(() => getRecentApps());
  const [loading, setLoading] = useState(topApps.length === 0);

  useEffect(() => {
    updateSEO({
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Apps Studio',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    });

    let alive = true;
    // Critical path only — banners + top charts (one or two queries)
    Promise.all([fetchBanners(), fetchTopApps(TOP_POOL)])
      .then(([b, top]) => {
        if (!alive) return;
        setBanners(b);
        setTopApps(top);
      })
      .finally(() => alive && setLoading(false));

    // Warm category caches in idle time (doesn't block paint)
    scheduleIdle(() => {
      CATEGORIES.forEach((cat, i) => {
        window.setTimeout(() => {
          void fetchTopByCategory(cat, CAT_PREVIEW);
        }, i * 120);
      });
    }, 2500);

    return () => {
      alive = false;
    };
  }, []);

  const spotlight = topApps.slice(0, 3);
  const mostPopular = topApps.slice(3, 18);

  return (
    <div className="pb-6">
      <TopProgress active={loading && topApps.length === 0} />
      <BannerSlider banners={banners} loading={loading && !banners.length} />

      <div className="mt-4">
        <CategoryMarquee />
      </div>

      {loading && topApps.length === 0 ? (
        <div className="mt-4">
          <RowSkeleton title />
          <RowSkeleton title />
        </div>
      ) : (
        <div className="mt-4 space-y-8 px-4">
          {spotlight.length > 0 && (
            <section>
              <SectionHeader
                title="Spotlight"
                to="/toplist"
                icon={<Sparkles className="h-4 w-4 text-accent2" />}
              />
              <div className="space-y-3">
                {spotlight.map((a, i) => (
                  <ListItem key={a.id} app={a} rank={i} />
                ))}
              </div>
            </section>
          )}

          {mostPopular.length > 0 && (
            <section>
              <SectionHeader
                title="Most Popular"
                to="/toplist"
                icon={<TrendingUp className="h-4 w-4 text-accent" />}
              />
              <Grid apps={mostPopular} />
            </section>
          )}

          {/* ViewPorter: each category fires Firestore only when near viewport */}
          {CATEGORIES.map((cat) => (
            <CategoryRow key={cat} cat={cat} />
          ))}

          {recent.length > 0 && (
            <section>
              <SectionHeader
                title="Recently viewed"
                icon={<History className="h-4 w-4 text-accent2" />}
                action={
                  <button
                    onClick={() => {
                      clearRecentApps();
                      setRecent([]);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-mute transition hover:text-accent3"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                }
              />
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to={`/app/${r.id}`}
                    className="w-[88px] shrink-0"
                  >
                    <AppImage
                      src={r.logo}
                      alt={r.name}
                      fallbackName={r.name}
                      className="mb-1.5 h-[88px] w-[88px] rounded-2xl object-cover ring-1 ring-line/60"
                    />
                    <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-fg">
                      {r.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
