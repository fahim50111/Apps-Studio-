import { useEffect, useRef, useState } from 'react';
import { searchApps } from '../lib/firebase';
import type { AppItem } from '../lib/firebase';
import { ListItem } from '../components/AppCard';
import { ListSkeleton } from '../components/Skeletons';
import { updateSEO } from '../lib/seo';
import { LIMITS } from '../lib/security';
import { Search as SearchIcon, X, SearchX, Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    updateSEO({
      title: 'Search — Find Free Apps & Mod Games | Apps Studio',
      description:
        'Search Apps Studio for premium unlocked apps, mod games and free subscriptions.',
    });
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const term = q.trim();
    if (!term) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setTouched(true);
    // debounce so we don't fire a Firestore read on every keystroke
    timer.current = setTimeout(() => {
      searchApps(term)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="px-4 py-5">
      <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-line bg-panel px-4 py-3.5 focus-within:border-accent/50">
        <SearchIcon className="h-5 w-5 text-mute" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, LIMITS.searchTerm))}
          maxLength={LIMITS.searchTerm}
          placeholder="Search apps & games..."
          className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-mute"
        />
        {searching ? (
          <Loader2 className="h-5 w-5 animate-spin text-mute" />
        ) : q ? (
          <button onClick={() => setQ('')}>
            <X className="h-5 w-5 text-mute hover:text-fg" />
          </button>
        ) : null}
      </div>

      {searching && !results.length ? (
        <ListSkeleton />
      ) : !q.trim() ? (
        <div className="flex flex-col items-center py-24 text-center text-mute">
          <SearchIcon className="mb-3 h-12 w-12" />
          <p className="text-sm">Start typing to explore Apps Studio</p>
        </div>
      ) : results.length ? (
        <>
          <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wider text-mute">
            {results.length} result{results.length > 1 ? 's' : ''} · "{q}"
          </p>
          <div className="space-y-3">
            {results.map((a) => (
              <ListItem key={a.id} app={a} />
            ))}
          </div>
        </>
      ) : touched && !searching ? (
        <div className="flex flex-col items-center py-24 text-center text-mute">
          <SearchX className="mb-3 h-12 w-12" />
          <p className="text-sm">No results found for "{q}"</p>
        </div>
      ) : null}
    </div>
  );
}
