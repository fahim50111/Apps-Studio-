import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchBanners,
  fetchTopApps,
  fetchTopByCategory,
  appsFromCatalog,
} from '../lib/firebase';
import type { AppItem, Banner } from '../lib/types';
import { CATEGORIES, catLabel } from '../lib/util';
import { getRecentApps, clearRecentApps, type RecentApp } from '../lib/history';
import { peekCache } from '../lib/cache';
import { usePorter } from '../lib/viewporter';
import { updateSEO, websiteJsonLd } from '../lib/seo';
import BannerSlider from '../components/BannerSlider';
import CategoryMarquee from '../components/CategoryMarquee';
import TopProgress from '../components/TopProgress';
import { AppCard, ListItem } from '../components/AppCard';
import AppImage from '../components/AppImage';
import { RowSkeleton } from '../components/Skeletons';
import { ArrowUpRight, Sparkles, TrendingUp, History, Trash2 } from 'lucide-react';

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
          <Link to={to} className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
            All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ))}
    </div>
  );
}

function Grid({ apps }: { apps: AppItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {apps.map((a, i) => (
        <AppCard key={a.id} app={a} index={i} />
      ))}
    </div>
  );
}

const TOP_POOL = 24;
const CAT_PREVIEW = 6;

function CategoryRow({ cat }: { cat: string }) {
  const cacheKey = `cat-top:${cat}:${CAT_PREVIEW}:`;
  const { ref, data, loading, inView } = usePorter<AppItem[]>(
    cacheKey,
    () => fetchTopByCategory(cat, CAT_PREVIEW),
    {
      rootMargin: '280px 0px',
      seed: () => peekCache<AppItem[]>(cacheKey) || appsFromCatalog({ category: cat, max: CAT_PREVIEW }),
    }
  );
  const apps = data || [];

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
  const [recent, setRecent] = useState<RecentApp[]>(() => getRecentApps());

  const { data: banners = [], loading: bannersLoading } = usePorter<Banner[]>(
    'banners',
    () => fetchBanners(),
    { eager: true, seed: () => peekCache<Banner[]>('banners') || [] }
  );

  const { data: topApps = [], loading: topLoading } = usePorter<AppItem[]>(
    `top:${TOP_POOL}`,
    () => fetchTopApps(TOP_POOL),
    {
      eager: true,
      seed: () => peekCache<AppItem[]>(`top:${TOP_POOL}`) || appsFromCatalog({ max: TOP_POOL }),
    }
  );

  const loading = topLoading && topApps.length === 0;

  useEffect(() => {
    updateSEO({
      title: 'Apps Studio — Free Premium Apps & Mod Games Download',
      description: 'Browse and download premium unlocked apps, mod games and useful tools. Updated daily, 100% free.',
      type: 'website',
      jsonLd: websiteJsonLd(),
    });
  }, []);

  const spotlight = topApps.slice(0, 3);
  const mostPopular = topApps.slice(3, 18);

  return (
    <div className="pb-6">
      <TopProgress active={loading && topApps.length === 0} />
      <BannerSlider banners={banners} loading={bannersLoading && !banners.length} />
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
            <section className="anim-fade">
              <SectionHeader title="Spotlight" to="/toplist" icon={<Sparkles className="h-4 w-4 text-accent2" />} />
              <div className="space-y-3">
                {spotlight.map((a, i) => (
                  <ListItem key={a.id} app={a} rank={i} index={i} />
                ))}
              </div>
            </section>
          )}
          {mostPopular.length > 0 && (
            <section className="anim-fade" style={{ animationDelay: '80ms' }}>
              <SectionHeader title="Most Popular" to="/toplist" icon={<TrendingUp className="h-4 w-4 text-accent" />} />
              <Grid apps={mostPopular} />
            </section>
          )}
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
                  <Link key={r.id} to={`/app/${r.id}`} className="card-lift w-[88px] shrink-0">
                    <AppImage src={r.logo} alt={r.name} fallbackName={r.name} className="mb-1.5 h-[88px] w-[88px] rounded-2xl object-cover ring-1 ring-line/60" />
                    <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-fg">{r.name}</p>
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
