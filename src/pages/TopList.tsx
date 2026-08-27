import { useEffect } from 'react';
import { fetchTopApps, appsFromCatalog } from '../lib/firebase';
import type { AppItem } from '../lib/types';
import { peekCache } from '../lib/cache';
import { usePorter } from '../lib/viewporter';
import { ListItem } from '../components/AppCard';
import { ListSkeleton } from '../components/Skeletons';
import TopProgress from '../components/TopProgress';
import { AdBanner } from '../components/AdScripts';
import { updateSEO } from '../lib/seo';
import { Flame } from 'lucide-react';

const TOP_MAX = 50;

export default function TopList() {
  const { data: apps = [], loading } = usePorter<AppItem[]>(
    `top:${TOP_MAX}`,
    () => fetchTopApps(TOP_MAX),
    {
      eager: true,
      seed: () =>
        peekCache<AppItem[]>(`top:${TOP_MAX}`) ||
        peekCache<AppItem[]>('top:24') ||
        appsFromCatalog({ max: TOP_MAX }),
    }
  );

  useEffect(() => {
    updateSEO({
      title: 'Top Charts — Most Downloaded Apps & Mod Games | Apps Studio',
      description:
        'The top 50 most downloaded premium apps and mod games on Apps Studio. Updated live, 100% free.',
    });
  }, []);

  return (
    <div className="px-4 py-5">
      <TopProgress active={loading} />
      <div className="mb-5 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent3/15 ring-1 ring-accent3/30">
          <Flame className="h-5 w-5 text-accent3" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-fg">
            Top Charts
          </h1>
          <p className="text-xs text-mute">Top {TOP_MAX} most downloaded</p>
        </div>
      </div>
      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {apps.map((a, i) => (
            <div key={a.id}>
              <ListItem app={a} rank={i} index={i} />
              {(i + 1) % 5 === 0 && (
                <div className="my-3">
                  <AdBanner compact />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
