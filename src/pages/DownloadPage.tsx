import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAppById, incrementDownload } from '../lib/firebase';
import type { AppItem, DownloadLink } from '../lib/firebase';
import { getName, catLabel, fallbackLogo, getDownloadLinks } from '../lib/util';
import { updateSEO, resetSEO } from '../lib/seo';
import { openExternal } from '../lib/security';
import { ArrowLeft, Download, Info, ShieldCheck, Package } from 'lucide-react';

export default function DownloadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    fetchAppById(id)
      .then((a) => {
        if (!alive) return;
        if (!a) setNotFound(true);
        else {
          setApp(a);
          updateSEO({
            title: `Download ${getName(a)} — All Versions | Apps Studio`,
            description: `Choose your version and download ${getName(
              a
            )} for free. Direct verified links from Apps Studio.`,
          });
        }
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      resetSEO();
    };
  }, [id]);

  const go = (l: DownloadLink) => {
    if (!app) return;
    setBusy(l.url);
    incrementDownload(app.id);
    openExternal(l.url);
    setTimeout(() => setBusy(''), 1200);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton mb-4 h-24 w-full rounded-3xl" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <Info className="mb-3 h-12 w-12 text-line" />
        <h2 className="font-display text-lg font-bold text-fg">App not found</h2>
        <Link
          to="/"
          className="mt-5 rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-ink"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const name = getName(app);
  const links = getDownloadLinks(app);

  return (
    <div className="px-4 py-5">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-xs font-bold text-mute transition hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-4 rounded-3xl border border-line/70 bg-panel p-4">
        <img
          src={app.logo || fallbackLogo(name)}
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackLogo(name);
          }}
          className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
        />
        <div className="min-w-0">
          <h1 className="font-display truncate text-lg font-extrabold text-fg">
            {name}
          </h1>
          <p className="text-xs text-mute">
            {catLabel(app.category)} · {links.length} version
            {links.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <h2 className="font-display mb-3 mt-6 flex items-center gap-2 px-1 text-sm font-bold text-fg">
        <Package className="h-4 w-4 text-accent" />
        Choose a version to download
      </h2>

      {links.length ? (
        <div className="space-y-3">
          {links.map((l, i) => (
            <button
              key={l.url}
              onClick={() => go(l)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-panel p-4 text-left transition hover:border-accent/50 hover:bg-panel2"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent2/15 font-display text-sm font-extrabold text-accent2 ring-1 ring-accent2/25">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-fg">
                  {l.name}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-mute">
                  <ShieldCheck className="h-3 w-3 text-accent" />
                  Verified & Safe
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-xs font-extrabold text-ink transition group-hover:brightness-110 sm:px-4">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden min-[360px]:inline">
                  {busy === l.url ? 'Opening…' : 'Get'}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line/70 bg-panel p-8 text-center text-sm text-mute">
          No download link available yet.
        </div>
      )}

      <p className="mt-5 text-center text-xs text-mute">
        Links open in a new tab. Downloads are provided as-is by Apps Studio.
      </p>
    </div>
  );
}
