import { useEffect, useState } from 'react';
import { submitRequest } from '../lib/firebase';
import { updateSEO } from '../lib/seo';
import { LIMITS, openExternal } from '../lib/security';
import { Send, CheckCircle2, Inbox, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/message/L3EUGB2Q7GHXN1';

export default function RequestPage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>(
    'idle'
  );
  const [delivery, setDelivery] = useState<'firestore' | 'local' | null>(null);

  useEffect(() => {
    updateSEO({
      title: 'Request an App — Apps Studio',
      description:
        "Can't find an app or game? Request it on Apps Studio and we'll add it for free.",
    });
  }, []);

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
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent2/15 ring-1 ring-accent2/30">
          <Inbox className="h-5 w-5 text-accent2" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-fg">
            Request an App
          </h1>
          <p className="text-xs text-mute">
            Can't find it? Tell us and we'll add it.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-line/70 bg-panel p-5"
      >
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mute">
          App / Game name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, LIMITS.requestName))}
          maxLength={LIMITS.requestName}
          placeholder="e.g. Spotify Premium Mod"
          className="mb-4 w-full rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-fg outline-none transition placeholder:text-mute focus:border-accent/50"
        />

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mute">
          Details (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, LIMITS.requestNote))}
          maxLength={LIMITS.requestNote}
          rows={4}
          placeholder="Version, features you need, or any notes..."
          className="mb-4 w-full resize-none rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-fg outline-none transition placeholder:text-mute focus:border-accent/50"
        />
        <div className="mb-4 -mt-2 text-right text-[10px] text-mute">
          {note.length}/{LIMITS.requestNote}
        </div>

        <button
          type="submit"
          disabled={status === 'sending' || !name.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-extrabold text-ink transition hover:brightness-110 disabled:opacity-40"
        >
          {status === 'sending' ? (
            'Sending...'
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Request
            </>
          )}
        </button>

        {status === 'done' && (
          <div className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent ring-1 ring-accent/25">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {delivery === 'local'
                ? 'Request saved. Please send it on WhatsApp too.'
                : 'Request submitted. Thank you!'}
            </div>
            {delivery === 'local' && (
              <button
                type="button"
                onClick={() => openExternal(WHATSAPP_URL)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-extrabold text-ink"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Send on WhatsApp
              </button>
            )}
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 rounded-xl bg-accent3/10 px-4 py-3 text-sm font-semibold text-accent3 ring-1 ring-accent3/25">
            Something went wrong. Please try again.
          </div>
        )}
      </form>

      <p className="mt-4 px-1 text-center text-xs text-mute">
        Requests are reviewed by the Apps Studio team.
      </p>
    </div>
  );
}
