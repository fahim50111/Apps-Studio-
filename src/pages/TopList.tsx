import { useEffect, useState } from 'react';
import { fetchTopApps, type AppItem } from '../lib/firebase';
import { ListItem } from '../components/AppCard';
import { ListSkeleton } from '../components/Skeletons';
import TopProgress from '../components/TopProgress';
import { updateSEO } from '../lib/seo';
import { Flame } from 'lucide-react';

export default function TopList() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateSEO({
      title: 'Top Charts — Most Downloaded Apps | Apps Studio',
      description: 'See the most popular and most downloaded apps and mod games on Apps Studio.',
    });
    fetchTopApps(50)
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-5">
      <TopProgress active={loading} />
      <div className="mb-5 flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
          <Flame className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-fg">Top Charts</h1>
          <p className="text-xs text-mute">Most downloaded apps</p>
        </div>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3 px-4">
          {apps.map((a, i) => (
            <ListItem key={a.id} app={a} rank={i} />
          ))}
        </div>
      )}
    </div>
  );
}
