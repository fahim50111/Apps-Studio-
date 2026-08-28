import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  checkForNewApps,
  getStoredNotifs,
  markAllSeen,
  clearNotifs,
  notificationPermission,
  requestNotificationPermission,
  type NotifItem,
} from '../lib/notifications';
import { fallbackLogo } from '../lib/util';
import { Bell, BellRing, Check, X, Sparkles } from 'lucide-react';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>(() => getStoredNotifs());
  const [unread, setUnread] = useState(0);
  const [perm, setPerm] = useState(notificationPermission());
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    checkForNewApps().then(({ notifs: list, freshCount }) => {
      if (!alive) return;
      setNotifs(list);
      setUnread(freshCount);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      markAllSeen(notifs);
      setUnread(0);
    }
  };

  const enablePush = async () => {
    const ok = await requestNotificationPermission();
    setPerm(ok ? 'granted' : notificationPermission());
  };

  const goto = (n: NotifItem) => {
    setOpen(false);
    navigate(`/app/${n.id}`);
  };

  const clearAll = () => {
    clearNotifs();
    setNotifs([]);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2 text-mute transition hover:border-accent/50 hover:text-accent"
      >
        {unread > 0 ? <BellRing className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent3 px-1 text-[9px] font-extrabold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
            <p className="text-sm font-bold text-fg">Notifications</p>
            <div className="flex items-center gap-2">
              {notifs.length > 0 && (
                <button onClick={clearAll} className="text-[11px] font-bold text-mute hover:text-fg">Clear</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-mute hover:text-fg" />
              </button>
            </div>
          </div>

          {perm !== 'granted' && perm !== 'unsupported' && (
            <button
              onClick={enablePush}
              className="flex w-full items-center gap-2 border-b border-line/60 bg-accent2/10 px-4 py-2.5 text-left text-xs font-semibold text-accent2 transition hover:bg-accent2/15"
            >
              <BellRing className="h-4 w-4" />
              Enable alerts for new apps
            </button>
          )}
          {perm === 'granted' && (
            <div className="flex items-center gap-2 border-b border-line/60 bg-accent/10 px-4 py-2 text-[11px] font-semibold text-accent">
              <Check className="h-3.5 w-3.5" />
              Alerts enabled
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center text-mute">
                <Sparkles className="mb-2 h-8 w-8 text-line" />
                <p className="text-sm font-semibold text-fg">You're all caught up</p>
                <p className="mt-1 text-xs">New apps will show up here as they're added.</p>
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => goto(n)}
                  className="flex w-full items-center gap-3 border-b border-line/40 px-4 py-3 text-left transition hover:bg-panel2"
                >
                  <img
                    src={n.logo || fallbackLogo(n.name)}
                    alt={n.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackLogo(n.name);
                    }}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-white/5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-fg">{n.name}</p>
                    <p className="text-[11px] text-mute">New in {n.category} · Tap to view</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
