import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchBanners,
  fetchTopApps,
  fetchTopByCategory,
} from '../lib/firebase';
import type { AppItem, Banner } from '../lib/firebase';
import { CATEGORIES, catLabel } from '../lib/util';
import { updateSEO } from '../lib/seo';
import BannerSlider from '../components/BannerSlider';
import CategoryMarquee from '../components/CategoryMarquee';
import TopProgress from '../components/TopProgress';
import { AppCard, ListItem } from '../components/AppCard';
import { RowSkeleton } from '../components/Skeletons';
import { ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';

function SectionHeader({
  title,
  to,
  icon,
}: {
  title: string;
  to?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between px-1">
      <h2 className="font-display flex items-center gap-2 text-base font-bold text-fg">
        {icon}
        {title}
      </h2>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-accent"
        >
          All <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
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

const TOP_POOL = 24; // most-downloaded apps to pull for the home feed
const CAT_PREVIEW = 6;

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [topApps, setTopApps] = useState<AppItem[]>([]);
  const [catApps, setCatApps] = useState<Record<string, AppItem[]>>({});
  const [loading, setLoading] = useState(true);

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
    Promise.all([fetchBanners(), fetchTopApps(TOP_POOL)])
      .then(([b, top]) => {
        if (!alive) return;
        setBanners(b);
        setTopApps(top);
      })
      .finally(() => alive && setLoading(false));

    // per-category: most downloaded (tiny bounded queries)
    CATEGORIES.forEach((cat) => {
      fetchTopByCategory(cat, CAT_PREVIEW).then((items) => {
        if (!alive || !items.length) return;
        setCatApps((prev) => ({ ...prev, [cat]: items }));
      });
    });

    return () => {
      alive = false;
    };
  }, []);

  const spotlight = topApps.slice(0, 3);
  const mostPopular = topApps.slice(3, 18);

  return (
    <div className="pb-6">
      <TopProgress active={loading} />
      <BannerSlider banners={banners} loading={loading} />

      {/* moving category buttons */}
      <div className="mt-4">
        <CategoryMarquee />
      </div>

      {loading ? (
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

          {CATEGORIES.map((cat) => {
            const inCat = catApps[cat];
            if (!inCat || !inCat.length) return null;
            return (
              <section key={cat}>
                <SectionHeader
                  title={catLabel(cat)}
                  to={`/categories?cat=${cat}`}
                />
                <Grid apps={inCat} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
