import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { updateSEO } from '../lib/seo';
import { openExternal } from '../lib/security';
import {
  checkForNewApps,
  clearNotifs,
  getStoredNotifs,
  markAllSeen,
  notificationPermission,
  requestNotificationPermission,
  type NotifItem,
} from '../lib/notifications';
import { fetchAdminNotices } from '../lib/firebase';
import type { AdminNotice } from '../lib/types';
import { fallbackLogo } from '../lib/util';
import ThemeToggle from '../components/ThemeToggle';
import {
  User, Lock, Mail, MessageCircle, Send, Flame, LayoutGrid, Search, Info,
  ChevronRight, Palette, FileText, Bell, BellRing, Check, Trash2, Sparkles,
} from 'lucide-react';

const CONTACT_EMAIL = 'fahinur.xo.je';
const WHATSAPP_URL = 'https://wa.me/message/L3EUGB2Q7GHXN1';

export default function Profile() {
  const [notifs, setNotifs] = useState<NotifItem[]>(() => getStoredNotifs());
  const [freshCount, setFreshCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  const [perm, setPerm] = useState(notificationPermission());

  useEffect(() => {
    updateSEO({
      title: 'Profile — Apps Studio',
      description: 'Your Apps Studio guest profile. Explore top charts, categories and contact support.',
      robots: 'noindex, follow',
    });
    let alive = true;
    checkForNewApps()
      .then(({ notifs: list, freshCount }) => {
        if (!alive) return;
        setNotifs(list);
        setFreshCount(freshCount);
        if (freshCount > 0) markAllSeen(list);
      })
      .finally(() => alive && setNotifLoading(false));
    fetchAdminNotices(8).then((items) => {
      if (alive) setAdminNotices(items);
    });
    return () => { alive = false; };
  }, []);

  const enableNotifications = async () => {
    const ok = await requestNotificationPermission();
    setPerm(ok ? 'granted' : notificationPermission());
  };

  const clearNotifications = () => {
    clearNotifs();
    setNotifs([]);
    setFreshCount(0);
  };

  return (
    <div className="px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl border border-line/70 bg-panel p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent2/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent2/15 ring-1 ring-accent2/30">
            <User className="h-8 w-8 text-accent2" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold text-fg">Guest User</h1>
            <p className="text-xs text-mute">Browsing without an account</p>
          </div>
        </div>
        <div className="relative mt-5 flex items-start gap-3 rounded-2xl border border-line bg-panel2 p-4">
          <Lock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-bold text-fg">Login / Sign Up unavailable</p>
            <p className="mt-1 text-xs leading-relaxed text-mute">Accounts are not required on Apps Studio. You can download every app freely as a guest — no sign in, no sign up needed.</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-3">
          <button disabled aria-disabled="true" title="Sign in is disabled" className="cursor-not-allowed rounded-xl border border-line bg-panel2 py-3 text-sm font-bold text-mute/50">Sign In</button>
          <button disabled aria-disabled="true" title="Sign up is disabled" className="cursor-not-allowed rounded-xl border border-line bg-panel2 py-3 text-sm font-bold text-mute/50">Sign Up</button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line/70 bg-panel px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Palette className="h-5 w-5 shrink-0 text-accent2" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-fg">Appearance</p>
            <p className="text-[11px] text-mute">Light, dark or system</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-5 rounded-2xl border border-line/70 bg-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            <p className="text-sm font-bold text-fg">Notifications</p>
            {freshCount > 0 && <span className="rounded-full bg-accent3 px-2 py-0.5 text-[10px] font-extrabold text-white">{freshCount}</span>}
          </div>
          {notifs.length > 0 && (
            <button onClick={clearNotifications} className="flex items-center gap-1 text-[11px] font-bold text-mute hover:text-fg">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
        {perm !== 'granted' && perm !== 'unsupported' && (
          <button onClick={enableNotifications} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent2/15 py-2.5 text-xs font-bold text-accent2">
            <BellRing className="h-4 w-4" /> Enable alerts for new apps
          </button>
        )}
        {perm === 'granted' && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
            <Check className="h-3.5 w-3.5" /> Alerts enabled
          </div>
        )}
        {notifLoading ? (
          <p className="py-4 text-center text-xs text-mute">Loading...</p>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center text-mute">
            <Sparkles className="mb-2 h-7 w-7 text-line" />
            <p className="text-xs">No new apps yet</p>
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {notifs.map((n) => (
              <Link key={n.id} to={`/app/${n.id}`} className="flex items-center gap-3 rounded-xl bg-panel2 px-3 py-2.5 transition hover:bg-panel">
                <img src={n.logo || fallbackLogo(n.name)} alt={n.name} onError={(e) => { (e.target as HTMLImageElement).src = fallbackLogo(n.name); }} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-fg">{n.name}</p>
                  <p className="text-[11px] text-mute">New in {n.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {adminNotices.length > 0 && (
        <div className="mt-5 rounded-2xl border border-line/70 bg-panel p-4">
          <p className="mb-3 text-sm font-bold text-fg">Announcements</p>
          <div className="space-y-2">
            {adminNotices.map((n) => (
              <div key={n.id} className="rounded-xl bg-panel2 px-3 py-2.5">
                <p className="text-sm font-bold text-fg">{n.title}</p>
                {n.message && <p className="mt-1 text-xs text-mute">{n.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line/70 bg-panel">
        <Link to="/toplist" className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5 transition hover:bg-panel2"><Flame className="h-5 w-5 text-accent3" /><span className="flex-1 text-sm font-bold text-fg">Top Charts</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
        <Link to="/categories" className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5 transition hover:bg-panel2"><LayoutGrid className="h-5 w-5 text-accent" /><span className="flex-1 text-sm font-bold text-fg">Categories</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
        <Link to="/search" className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5 transition hover:bg-panel2"><Search className="h-5 w-5 text-accent2" /><span className="flex-1 text-sm font-bold text-fg">Search</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
        <Link to="/request" className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5 transition hover:bg-panel2"><Send className="h-5 w-5 text-accent" /><span className="flex-1 text-sm font-bold text-fg">Request an App</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
        <Link to="/about" className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5 transition hover:bg-panel2"><Info className="h-5 w-5 text-accent2" /><span className="flex-1 text-sm font-bold text-fg">About Us</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
        <Link to="/privacy" className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-panel2"><FileText className="h-5 w-5 text-mute" /><span className="flex-1 text-sm font-bold text-fg">Privacy Policy</span><ChevronRight className="h-4 w-4 text-mute" /></Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line/70 bg-panel">
        <div className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5">
          <Mail className="h-5 w-5 text-accent2" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mute">Email</p>
            <p className="select-all truncate text-sm font-semibold text-fg">{CONTACT_EMAIL}</p>
          </div>
        </div>
        <button onClick={() => openExternal(WHATSAPP_URL)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-panel2">
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-mute">Chat</p>
            <p className="text-sm font-semibold text-fg">WhatsApp</p>
          </div>
          <Send className="h-4 w-4 text-mute" />
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] text-mute">Apps Studio · Free premium unlocked apps</p>
    </div>
  );
}
