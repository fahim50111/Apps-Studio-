import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApps, fetchSuggestPool } from '../lib/firebase';
import type { AppItem } from '../lib/types';
import { ListItem } from '../components/AppCard';
import AppImage from '../components/AppImage';
import { ListSkeleton } from '../components/Skeletons';
import { updateSEO } from '../lib/seo';
import { LIMITS } from '../lib/security';
import { catLabel } from '../lib/util';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  filterSuggestions,
} from '../lib/history';
import { Search as SearchIcon, X, SearchX, Loader2, Clock, TrendingUp, Trash2 } from 'lucide-react';

type SuggestItem = { id: string; name: string; logo?: string; category?: string };

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<AppItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(Boolean(initial.trim()));
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const [pool, setPool] = useState<SuggestItem[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(initial.trim());

  useEffect(() => {
    updateSEO({
      title: 'Search — Find Free Apps & Mod Games | Apps Studio',
      description: 'Search Apps Studio for premium unlocked apps, mod games and free tools.',
      robots: 'noindex, follow',
    });
    fetchSuggestPool(50).then(setPool).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const term = q.trim();
    timer.current = setTimeout(() => {
      if (!term) {
        setResults([]);
        setSearching(false);
        setParams({}, { replace: true });
        return;
      }
      setSearching(true);
      setTouched(true);
      setParams({ q: term }, { replace: true });
      searchApps(term)
        .then((list) => {
          setResults(list);
          if (term.length >= 2) {
            committed.current = term;
            setRecent(addRecentSearch(term));
          }
        })
        .finally(() => setSearching(false));
    }, term ? 350 : 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, setParams]);

  const suggestions =
    q.trim().length >= 1 && q.trim().length < 24 ? filterSuggestions(pool, q, 6) : [];

  const pickSuggestion = (name: string) => setQ(name);
  const pickRecent = (term: string) => setQ(term);

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-line bg-panel px-4 py-3.5 shadow-sm focus-within:border-accent/50 focus-within:shadow-lg focus-within:shadow-accent/10">
        <SearchIcon className="h-5 w-5 text-mute" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, LIMITS.searchTerm))}
          maxLength={LIMITS.searchTerm}
          placeholder="Search apps & games..."
          className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-mute"
          autoComplete="off"
          enterKeyHint="search"
        />
        {searching ? (
          <Loader2 className="h-5 w-5 animate-spin text-mute" />
        ) : q ? (
          <button onClick={() => setQ('')} aria-label="Clear search">
            <X className="h-5 w-5 text-mute hover:text-fg" />
          </button>
        ) : null}
      </div>

      {!searching && suggestions.length > 0 && q.trim() && results.length === 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-line/70 bg-panel">
          <p className="border-b border-line/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-mute">Suggestions</p>
          <ul>
            {suggestions.map((s) => (
              <li key={s.id} className="border-b border-line/40 last:border-0">
                <button onClick={() => pickSuggestion(s.name)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-panel2">
                  <AppImage src={s.logo} alt={s.name} fallbackName={s.name} className="h-9 w-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-fg">{s.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-mute">{catLabel(s.category)}</p>
                  </div>
                  <SearchIcon className="h-3.5 w-3.5 text-mute" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searching && !results.length ? (
        <ListSkeleton />
      ) : !q.trim() ? (
        <div className="space-y-6">
          {recent.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-mute">
                  <Clock className="h-3.5 w-3.5" /> Recent searches
                </h2>
                <button onClick={() => { clearRecentSearches(); setRecent([]); }} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-mute transition hover:text-accent3">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <span key={term} className="inline-flex items-center gap-1 rounded-full border border-line bg-panel2 pl-3 pr-1.5 py-1.5 text-xs font-semibold text-fg">
                    <button onClick={() => pickRecent(term)} className="max-w-[180px] truncate transition hover:text-accent">{term}</button>
                    <button onClick={() => setRecent(removeRecentSearch(term))} className="flex h-6 w-6 items-center justify-center rounded-full text-mute hover:bg-panel hover:text-fg" aria-label={`Remove ${term}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}
          {pool.length > 0 && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-mute">
                <TrendingUp className="h-3.5 w-3.5 text-accent" /> Popular now
              </h2>
              <div className="flex flex-wrap gap-2">
                {pool.slice(0, 10).map((p) => (
                  <button key={p.id} onClick={() => pickSuggestion(p.name)} className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-mute transition hover:border-accent/40 hover:text-accent">{p.name}</button>
                ))}
              </div>
            </section>
          )}
          {!recent.length && !pool.length && (
            <div className="flex flex-col items-center py-24 text-center text-mute">
              <SearchIcon className="mb-3 h-12 w-12" />
              <p className="text-sm">Start typing to explore Apps Studio</p>
            </div>
          )}
        </div>
      ) : results.length ? (
        <>
          <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wider text-mute">{results.length} result{results.length > 1 ? 's' : ''} · "{q}"</p>
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
          <Link to="/request" className="mt-4 text-xs font-bold text-accent underline-offset-2 hover:underline">Request this app</Link>
        </div>
      ) : null}
    </div>
  );
}
