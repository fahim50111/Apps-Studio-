import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAppById, fetchTopByCategory } from '../lib/firebase';
import type { AppItem } from '../lib/types';
import { peekCache } from '../lib/cache';
import {
  getName,
  catLabel,
  catColor,
  formatCount,
  getDownloadLinks,
  getScreenshots,
  getVersionHistory,
  formatRelativeDate,
} from '../lib/util';
import { trackAppView } from '../lib/history';
import { updateSEO, resetSEO } from '../lib/seo';
import { AppCard } from '../components/AppCard';
import AppImage from '../components/AppImage';
import { CardSkeleton } from '../components/Skeletons';
import TopProgress from '../components/TopProgress';
import {
  ArrowLeft,
  Download,
  Share2,
  HardDrive,
  ShieldCheck,
  Info,
  Layers,
  Flame,
  ChevronRight,
  History,
  Images,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cached = id ? peekCache<AppItem>(`app:${id}`) : undefined;
  const [app, setApp] = useState<AppItem | null>(cached || null);
  const [related, setRelated] = useState<AppItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [loading, setLoading] = useState(!cached);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const hit = peekCache<AppItem>(`app:${id}`);
    if (hit) {
      setApp(hit);
      setLoading(false);
    } else {
      setLoading(true);
      setApp(null);
    }
    setRelated([]);
    setRelatedLoading(true);
    setNotFound(false);
    window.scrollTo(0, 0);

    fetchAppById(id)
      .then((a) => {
        if (!alive) return;
        if (!a) {
          setNotFound(true);
          return;
        }
        setApp(a);
        trackAppView(a);
        const name = getName(a);
        updateSEO({
          title: `${name} — Free Download | Apps Studio`,
          description:
            (a.description && a.description.slice(0, 155)) ||
            `Download ${name} (${catLabel(
              a.category
            )}) for free from Apps Studio. Direct verified link, 100% safe.`,
          image: a.cover || a.logo || undefined,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name,
            applicationCategory: catLabel(a.category),
            operatingSystem: 'Android',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
        });

        if (a.category) {
          fetchTopByCategory(a.category, 6, a.id)
            .then((list) => alive && setRelated(list))
            .finally(() => alive && setRelatedLoading(false));
        } else {
          setRelatedLoading(false);
        }
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
      resetSEO();
    };
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share && app) {
      try {
        await navigator.share({ title: getName(app), url });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Unable to copy link');
    }
  };

  const screenshots = useMemo(
    () => (app ? getScreenshots(app) : []),
    [app]
  );
  const versions = useMemo(() => (app ? getVersionHistory(app) : []), [app]);

  if (loading) {
    return (
      <div className="p-4">
        <TopProgress active />
        <div className="skeleton mb-4 h-56 w-full rounded-3xl" />
        <div className="skeleton mb-3 h-6 w-1/2 rounded" />
        <div className="skeleton mb-2 h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <Info className="mb-3 h-12 w-12 text-line" />
        <h2 className="font-display text-lg font-bold text-fg">App not found</h2>
        <p className="mb-5 text-sm text-mute">This item may have been removed.</p>
        <Link
          to="/"
          className="rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-ink"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const name = getName(app);
  const color = catColor(app.category);
  const links = getDownloadLinks(app);
  const multi = links.length > 1;
  const updated = formatRelativeDate(app.updatedAt || app.timestamp);
  const hasDownloads = links.length > 0;

  return (
    <div className="pb-8">
      {/* hero cover */}
      <div className="relative h-60 w-full overflow-hidden md:h-72">
        {app.cover ? (
          <AppImage
            src={app.cover}
            alt={name}
            priority
            fallbackName={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `radial-gradient(120% 80% at 50% 0%, ${color}, transparent 70%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="glass absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line/60 text-fg"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleShare}
          className="glass absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line/60 text-fg"
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5">
          <AppImage
            src={app.logo}
            alt={name}
            priority
            fallbackName={name}
            className="h-24 w-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/10"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="font-display truncate text-2xl font-extrabold text-fg">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className="rounded-full px-2.5 py-1 font-bold uppercase tracking-wide"
                style={{ background: color + '2a', color }}
              >
                {catLabel(app.category)}
              </span>
              {app.isMod && (
                <span className="rounded-full bg-accent px-2.5 py-1 font-extrabold uppercase tracking-wide text-ink">
                  Mod
                </span>
              )}
              {app.versionName && (
                <span className="rounded-full border border-line/70 bg-panel/80 px-2.5 py-1 font-semibold text-mute backdrop-blur">
                  v{app.versionName.replace(/^v/i, '')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Primary CTA → download page only (never opens external links here) */}
        {hasDownloads ? (
          <Link
            to={`/download/${app.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-extrabold text-ink shadow-lg shadow-accent/25 transition hover:brightness-110"
          >
            <Download className="h-5 w-5" />
            {multi ? 'Choose Version & Download' : 'Download Free'}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showToast('Download link not available yet.')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-extrabold text-ink opacity-60"
          >
            <Download className="h-5 w-5" />
            Download Free
          </button>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: 'Verified link' },
            { icon: Layers, label: 'Multi version' },
            { icon: CheckCircle2, label: 'Free access' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border border-line/60 bg-panel px-2 py-2.5 text-center"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-mute">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            icon={<HardDrive className="mx-auto mb-1 h-4 w-4 text-mute" />}
            label="Size"
            value={app.size || '—'}
          />
          <Stat
            icon={<Flame className="mx-auto mb-1 h-4 w-4 text-accent3" />}
            label="Downloads"
            value={formatCount(app.downloads || 0)}
          />
          <Stat
            icon={<Layers className="mx-auto mb-1 h-4 w-4 text-accent2" />}
            label="Versions"
            value={String(links.length || 1)}
          />
        </div>

        {updated && (
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-mute">
            <History className="h-3.5 w-3.5" />
            Updated {updated}
          </p>
        )}

        {screenshots.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold text-fg">
              <Images className="h-4 w-4 text-accent2" />
              Screenshots
            </h2>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {screenshots.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setLightbox(i)}
                  className="shrink-0 overflow-hidden rounded-2xl border border-line/70 bg-panel2 shadow-sm transition hover:border-accent/40"
                >
                  <AppImage
                    src={src}
                    alt={`${name} screenshot ${i + 1}`}
                    fallbackName={name}
                    className="h-52 w-32 object-cover sm:h-60 sm:w-36"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Available versions — display only, no direct download links */}
        {versions.length > 0 && (
          <section className="mt-6 rounded-2xl border border-line/70 bg-panel p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display flex items-center gap-2 text-sm font-bold text-fg">
                <History className="h-4 w-4 text-accent" />
                Available versions
              </h2>
              {hasDownloads && (
                <Link
                  to={`/download/${app.id}`}
                  className="text-[11px] font-bold text-accent"
                >
                  Download page
                </Link>
              )}
            </div>
            <ul className="divide-y divide-line/60">
              {versions.map((v, i) => (
                <li
                  key={`${v.name}-${i}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                      v.isLatest
                        ? 'bg-accent text-ink'
                        : 'bg-panel2 text-mute ring-1 ring-line'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-fg">
                      {v.name}
                      {v.isLatest && (
                        <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-accent">
                          Latest
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-mute">
                      {[v.size, v.updatedLabel].filter(Boolean).join(' · ') ||
                        'Available on download page'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {hasDownloads && (
              <Link
                to={`/download/${app.id}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 py-3 text-xs font-extrabold text-accent transition hover:bg-accent hover:text-ink"
              >
                <Download className="h-3.5 w-3.5" />
                Go to download page
              </Link>
            )}
          </section>
        )}

        {app.description && (
          <div className="mt-5 rounded-2xl border border-line/70 bg-panel p-5">
            <h2 className="font-display mb-2 flex items-center gap-2 text-sm font-bold text-fg">
              <Info className="h-4 w-4 text-accent" />
              About
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-mute">
              {app.description}
            </p>
          </div>
        )}
      </div>

      {(relatedLoading || related.length > 0) && (
        <section className="mt-8 px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-fg">
              More in {catLabel(app.category)}
            </h2>
            <Link
              to={`/categories?cat=${app.category}`}
              className="flex items-center gap-0.5 text-xs font-bold text-accent"
            >
              All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {relatedLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {related.map((a) => (
                <AppCard key={a.id} app={a} />
              ))}
            </div>
          )}
        </section>
      )}

      {lightbox !== null && screenshots[lightbox] && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <AppImage
            src={screenshots[lightbox]}
            alt={`${name} screenshot`}
            priority
            fallbackName={name}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-panel px-5 py-2.5 text-xs font-bold text-fg shadow-xl ring-1 ring-line">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-line/70 bg-panel p-3 text-center">
      {icon}
      <p className="text-[10px] uppercase tracking-wider text-mute">{label}</p>
      <p className="text-sm font-bold text-fg">{value}</p>
    </div>
  );
}
