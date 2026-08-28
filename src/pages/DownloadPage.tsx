import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAppById, incrementDownload } from '../lib/firebase';
import type { AppItem, DownloadLink } from '../lib/types';
import {
  getName,
  catLabel,
  getDownloadLinks,
  getAppUpdatedDate,
  getLinkUpdatedAt,
  formatRelativeDate,
} from '../lib/util';
import { trackAppView } from '../lib/history';
import { updateSEO, resetSEO } from '../lib/seo';
import { openExternal } from '../lib/security';
import AppImage from '../components/AppImage';
import { AdBanner } from '../components/AdScripts';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import {
  ArrowLeft,
  Download,
  Info,
  ShieldCheck,
  Package,
  CalendarDays,
  Clock3,
  Loader2,
} from 'lucide-react';

export default function DownloadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState('');
  const [firstReady, setFirstReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setFirstReady(false);
    fetchAppById(id)
      .then((a) => {
        if (!alive) return;
        if (!a) setNotFound(true);
        else {
          setApp(a);
          trackAppView(a);
          updateSEO({
            title: `Download ${getName(a)} — All Versions | Apps Studio`,
            description: `Choose your version and download ${getName(a)} for free. Direct verified links from Apps Studio.`,
            robots: 'noindex, follow',
            image: a.cover || a.logo || undefined,
          });
        }
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
      resetSEO();
    };
  }, [id]);

  useEffect(() => {
    if (loading || notFound || !app) return;
    setFirstReady(false);
    const t = window.setTimeout(() => setFirstReady(true), 3000);
    return () => window.clearTimeout(t);
  }, [loading, notFound, app]);

  const handleDownload = (l: DownloadLink, locked: boolean) => {
    if (!app || !l.url || locked) return;
    setBusy(l.url);
    incrementDownload(app.id);
    openExternal(l.url);
    setTimeout(() => setBusy(''), 1200);
  };

  if (loading) {
    return (
      <div className="p-4">
        <NotificationPermissionPrompt />
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
        <Link to="/" className="mt-5 rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-ink">Back to Home</Link>
      </div>
    );
  }

  const name = getName(app);
  const links = getDownloadLinks(app);
  const updatedOn = getAppUpdatedDate(app);

  return (
    <div className="px-4 py-5">
      <NotificationPermissionPrompt />
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-mute transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-4 rounded-3xl border border-line/70 bg-panel p-4">
        <AppImage src={app.logo} alt={name} priority fallbackName={name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-lg font-extrabold text-fg">{name}</h1>
          <p className="mt-0.5 text-xs text-mute">{catLabel(app.category)} · {links.length} version{links.length !== 1 ? 's' : ''} available</p>
          {updatedOn && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-panel2 px-2 py-1 text-[11px] font-semibold text-mute">
              <CalendarDays className="h-3.5 w-3.5 text-accent2" />
              <span>Updated <span className="font-bold text-fg">{updatedOn}</span></span>
            </p>
          )}
        </div>
      </div>
      <h2 className="font-display mb-3 mt-6 flex items-center gap-2 px-1 text-sm font-bold text-fg">
        <Package className="h-4 w-4 text-accent" /> Choose a version to download
      </h2>
      {links.length ? (
        <div className="space-y-3">
          {links.map((l, i) => {
            const isLatest = i === 0;
            const waiting = isLatest && !firstReady;
            const ago = isLatest ? (() => { const ts = getLinkUpdatedAt(l, app); return ts ? formatRelativeDate(ts) : ''; })() : '';
            return (
              <div key={l.url}>
                <button type="button" disabled={waiting} onClick={() => handleDownload(l, waiting)} className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-line/70 bg-panel p-4 text-left transition ${waiting ? 'cursor-wait opacity-80' : 'hover:border-accent/50 hover:bg-panel2'}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent2/15 font-display text-sm font-extrabold text-accent2 ring-1 ring-accent2/25">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-fg">
                      {l.name}
                      {isLatest && <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-accent">Latest</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-mute">
                      <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-accent" /> Direct download</span>
                      {ago && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3 text-accent2" /> Updated {ago}</span>}
                    </div>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-extrabold sm:px-4 ${waiting ? 'bg-panel2 text-mute ring-1 ring-line' : 'bg-accent text-ink transition group-hover:brightness-110'}`}>
                    {waiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span className="hidden min-[360px]:inline">{waiting ? 'Wait…' : busy === l.url ? 'Opening…' : 'Get'}</span>
                  </span>
                  {waiting && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-line/50">
                      <span className="dl-wait-bar block h-full bg-accent" />
                    </span>
                  )}
                </button>
                {i === 0 && <div className="mt-3"><AdBanner compact /></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-line/70 bg-panel p-8 text-center text-sm text-mute">No download link available yet.</div>
      )}
      <p className="mt-5 text-center text-xs text-mute">Links open in a new tab. Downloads are provided as-is by Apps Studio.</p>
    </div>
  );
}
