import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchAppById,
  incrementDownload,
  fetchTopByCategory,
} from '../lib/firebase';
import type { AppItem } from '../lib/firebase';
import {
  getName,
  catLabel,
  catColor,
  fallbackLogo,
  formatCount,
  getDownloadLinks,
} from '../lib/util';
import { updateSEO, resetSEO } from '../lib/seo';
import { openExternal } from '../lib/security';
import { AppCard } from '../components/AppCard';
import { CardSkeleton } from '../components/Skeletons';
import TopProgress from '../components/TopProgress';
import {
  ArrowLeft,
  Download,
  Share2,
  Tag,
  HardDrive,
  ShieldCheck,
  Info,
  Layers,
  CheckCircle2,
  Flame,
  ChevronRight,
} from 'lucide-react';

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppItem | null>(null);
  const [related, setRelated] = useState<AppItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setRelated([]);
    setRelatedLoading(true);
    window.scrollTo(0, 0);

    fetchAppById(id)
      .then((a) => {
        if (!alive) return;
        if (!a) {
          setNotFound(true);
          return;
        }
        setApp(a);
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

  const handleDownload = () => {
    if (!app) return;
    const links = getDownloadLinks(app);
    if (links.length > 1) {
      navigate(`/download/${app.id}`);
      return;
    }
    if (links.length === 1) {
      setApp((prev) =>
        prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev
      );
      incrementDownload(app.id);
      openExternal(links[0].url);
      return;
    }
    showToast('Download link not available yet.');
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
  const logo = app.logo || fallbackLogo(name);
  const links = getDownloadLinks(app);
  const multi = links.length > 1;

  return (
    <div className="pb-8">
      {/* hero cover */}
      <div className="relative h-60 w-full overflow-hidden md:h-72">
        {app.cover ? (
          <img
            src={app.cover}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
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
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleShare}
          className="glass absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line/60 text-fg"
        >
          <Share2 className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5">
          <img
            src={logo}
            alt={name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackLogo(name);
            }}
            className="h-24 w-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/10"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="font-display truncate text-2xl font-extrabold text-fg">
              {name}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-xs">
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
            </div>
          </div>
        </div>
      </div>

      {/* download button */}
      <div className="px-4 pt-4">
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-extrabold text-ink shadow-lg shadow-accent/25 transition hover:brightness-110"
        >
          <Download className="h-5 w-5" />
          {multi ? 'Choose Version & Download' : 'Download Free'}
        </button>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line/70 bg-panel p-3 text-center">
            <HardDrive className="mx-auto mb-1 h-4 w-4 text-mute" />
            <p className="text-[10px] uppercase tracking-wider text-mute">Size</p>
            <p className="text-sm font-bold text-fg">{app.size || '—'}</p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-panel p-3 text-center">
            <Flame className="mx-auto mb-1 h-4 w-4 text-accent3" />
            <p className="text-[10px] uppercase tracking-wider text-mute">Downloads</p>
            <p className="text-sm font-bold text-fg">{formatCount(app.downloads || 0)}</p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-panel p-3 text-center">
            <Layers className="mx-auto mb-1 h-4 w-4 text-accent2" />
            <p className="text-[10px] uppercase tracking-wider text-mute">Versions</p>
            <p className="text-sm font-bold text-fg">{links.length || 1}</p>
          </div>
        </div>

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

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-xs font-semibold text-accent">
          <ShieldCheck className="h-4 w-4" />
          Verified download · Safe & free
        </div>
      </div>

      {/* related */}
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

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-panel px-5 py-2.5 text-xs font-bold text-fg shadow-xl ring-1 ring-line">
          {toast}
        </div>
      )}
    </div>
  );
}
