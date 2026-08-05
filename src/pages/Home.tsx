import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAppsPage,
  fetchBanners,
  fetchTopApps,
  fetchCategoryPreview,
  type AppItem,
  type Banner,
} from '../lib/firebase';
import { CATEGORIES, CATEGORY_META, getName } from '../lib/util';
import BannerSlider from '../components/BannerSlider';
import { AppCard } from '../components/AppCard';
import CategoryMarquee from '../components/CategoryMarquee';
import { RowSkeleton } from '../components/Skeletons';
import TopProgress from '../components/TopProgress';
import { updateSEO } from '../lib/seo';
import { ArrowRight, Flame } from 'lucide-react';

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [latest, setLatest] = useState<AppItem[]>([]);
  const [trending, setTrending] = useState<AppItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, AppItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateSEO({
      title: 'Apps Studio — Free Premium Apps & Mod Games Download',
      description:
        'Download premium unlocked apps, mod games and free tools. Fast, safe and free on Apps Studio.',
    });
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchBanners(),
      fetchAppsPage(12),
      fetchTopApps(8),
      ...CATEGORIES.slice(0, 4).map((c) =>
        fetchCategoryPreview(c, 6).then((items) => [c, items] as const)
      ),
    ])
      .then(([b, page, top, ...cats]) => {
        if (!alive) return;
        setBanners(b);
        setLatest(page.items);
        setTrending(top);
        const map: Record<string, AppItem[]> = {};
        cats.forEach(([c, items]) => {
          map[c] = items;
        });
        setPreviews(map);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="pb-4">
      <TopProgress active={loading} />
      <BannerSlider banners={banners} loading={loading} />

      <div className="mt-5">
        <CategoryMarquee />
      </div>

      {/* Trending */}
      <section className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-fg">
            <Flame className="h-4.5 w-4.5 text-accent3" />
            Trending Now
          </h2>
          <Link
            to="/toplist"
            className="flex items-center gap-1 text-xs font-bold text-accent"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <RowSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {trending.map((a) => (
              <AppCard key={a.id} app={a} />
            ))}
          </div>
        )}
      </section>

      {/* Latest */}
      <section className="mt-8 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold text-fg">
            Newly Added
          </h2>
          <Link
            to="/categories"
            className="flex items-center gap-1 text-xs font-bold text-accent"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <RowSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {latest.map((a) => (
              <AppCard key={a.id} app={a} />
            ))}
          </div>
        )}
      </section>

      {/* Category previews */}
      {CATEGORIES.slice(0, 4).map((cat) => {
        const items = previews[cat] || [];
        if (!loading && !items.length) return null;
        const meta = CATEGORY_META[cat];
        return (
          <section key={cat} className="mt-8 px-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-fg">
                {meta.label}
              </h2>
              <Link
                to={`/categories?cat=${cat}`}
                className="flex items-center gap-1 text-xs font-bold text-accent"
              >
                More <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <RowSkeleton />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {items.map((a) => (
                  <AppCard key={a.id} app={a} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
