import { useCallback, useEffect, useState } from 'react';
import { submitRequest, fetchRequests } from '../lib/firebase';
import type { AppRequest } from '../lib/types';
import { updateSEO } from '../lib/seo';
import { LIMITS, openExternal } from '../lib/security';
import { formatUploadDate } from '../lib/util';
import { AdBanner } from '../components/AdScripts';
import { Send, CheckCircle2, Inbox, MessageCircle, Clock3, Loader2, RefreshCw } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/message/L3EUGB2Q7GHXN1';

function isCompleted(status: string) {
  const s = status.toLowerCase().trim();
  return s === 'completed' || s === 'complete' || s === 'done' || s === 'added' || s === 'resolved' || s === 'finished' || s === 'approved';
}

function statusLabel(status: string) {
  const s = status.toLowerCase().trim() || 'pending';
  if (isCompleted(s)) return 'Completed';
  if (s === 'pending' || s === 'open' || s === 'new') return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function RequestPage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [delivery, setDelivery] = useState<'firestore' | 'local' | null>(null);
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  const loadRequests = useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      setRequests(await fetchRequests(100));
    } catch {
      setListError(true);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    updateSEO({
      title: 'Request an App — Apps Studio',
      description: "Can't find an app or game? Request it on Apps Studio and see the latest public requests.",
    });
    loadRequests();
  }, [loadRequests]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('sending');
    try {
      const result = await submitRequest(name.trim(), note.trim());
      setDelivery(result);
      setStatus('done');
      setName('');
      setNote('');
      if (result === 'firestore') await loadRequests();
      setTimeout(() => {
        setStatus('idle');
        setDelivery(null);
      }, result === 'local' ? 9000 : 3500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3500);
    }
  };

  return (
    <div className="px-4 py-6 pb-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent2/15 ring-1 ring-accent2/30">
          <Inbox className="h-5 w-5 text-accent2" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-fg">Request an App</h1>
          <p className="text-xs text-mute">Can't find it? Tell us and we'll add it.</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-3xl border border-line/70 bg-panel p-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mute">App / Game name</label>
        <input value={name} onChange={(e) => setName(e.target.value.slice(0, LIMITS.requestName))} maxLength={LIMITS.requestName} placeholder="e.g. Spotify Premium Mod" className="mb-4 w-full rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-fg outline-none transition placeholder:text-mute focus:border-accent/50" />
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mute">Details (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, LIMITS.requestNote))} maxLength={LIMITS.requestNote} rows={4} placeholder="Version, features you need, or any notes..." className="mb-4 w-full resize-none rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-fg outline-none transition placeholder:text-mute focus:border-accent/50" />
        <div className="mb-4 -mt-2 text-right text-[10px] text-mute">{note.length}/{LIMITS.requestNote}</div>
        <button type="submit" disabled={status === 'sending' || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-extrabold text-ink transition hover:brightness-110 disabled:opacity-40">
          {status === 'sending' ? 'Sending...' : (<><Send className="h-4 w-4" /> Submit Request</>)}
        </button>
        <div className="mt-4">
          <AdBanner compact adKey="71971cef439f7e47d3f26f03c0ce1844" width={320} height={50} />
        </div>
        {status === 'done' && (
          <div className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent ring-1 ring-accent/25">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {delivery === 'local' ? 'Request saved. Please send it on WhatsApp too.' : 'Request submitted. Thank you!'}
            </div>
            {delivery === 'local' && (
              <button type="button" onClick={() => openExternal(WHATSAPP_URL)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-extrabold text-ink">
                <MessageCircle className="h-3.5 w-3.5" /> Send on WhatsApp
              </button>
            )}
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 rounded-xl bg-accent3/10 px-4 py-3 text-sm font-semibold text-accent3 ring-1 ring-accent3/25">Something went wrong. Please try again.</div>
        )}
      </form>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <h2 className="font-display text-base font-bold text-fg">All requests</h2>
          <button type="button" onClick={() => loadRequests()} className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-[11px] font-bold text-mute transition hover:text-fg">
            <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="rounded-3xl border border-line/70 bg-panel p-4">
          {listLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-mute"><Loader2 className="h-4 w-4 animate-spin" /> Loading requests…</div>
          ) : listError ? (
            <div className="rounded-2xl border border-accent3/30 bg-accent3/10 px-4 py-6 text-center text-sm text-accent3">Could not load requests. Deploy Firestore rules, then refresh.</div>
          ) : requests.length === 0 ? (
            <p className="py-8 text-center text-xs text-mute">No requests yet. Be the first!</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {requests.map((r) => {
                const done = isCompleted(r.status);
                return (
                  <li key={r.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-accent/15 text-accent' : 'bg-panel2 text-accent2 ring-1 ring-line'}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-fg">{r.name}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${done ? 'bg-accent/15 text-accent' : 'bg-accent2/15 text-accent2'}`}>{statusLabel(r.status)}</span>
                      </div>
                      {r.text && <p className="mt-0.5 line-clamp-2 text-xs text-mute">{r.text}</p>}
                      <p className="mt-1 text-[10px] font-semibold text-mute">{r.date || formatUploadDate(r.timestamp) || '—'}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
