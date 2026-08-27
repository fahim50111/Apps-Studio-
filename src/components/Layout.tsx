import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Flame, User, Search, LayoutGrid } from 'lucide-react';
import Footer from './Footer';
import LogoMark from './LogoMark';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { AdRouteScripts } from './AdScripts';
import ScrollFab from './ScrollFab';
import { useHideOnScroll } from '../lib/useHideOnScroll';

function Header({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  const pin = pathname === '/profile';
  return (
    <header
      className={`glass sticky top-0 z-50 border-b border-line/60 transition-transform duration-300 ${
        hidden && !pin ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 leading-none">
            <h1 className="font-display truncate text-base font-extrabold tracking-tight text-fg sm:text-lg">
              APPS<span className="text-accent">STUDIO</span>
            </h1>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-mute min-[380px]:inline">
              Mods · Games · Free
            </span>
          </div>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}

const navItems = [
  { to: '/categories', label: 'Browse', icon: LayoutGrid },
  { to: '/toplist', label: 'Top', icon: Flame },
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/profile', label: 'You', icon: User },
];

function BottomNav({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  const pin = pathname === '/profile';
  return (
    <div
      className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 transition-transform duration-300 ${
        hidden && !pin ? 'translate-y-[150%]' : 'translate-y-0'
      }`}
    >
      <nav className="glass flex items-center gap-1 rounded-2xl border border-line/70 p-1.5 shadow-2xl shadow-black/40">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active =
            to === '/'
              ? pathname === '/'
              : pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={`mobile-nav-item relative flex flex-col items-center gap-1 rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active ? 'text-ink' : 'text-mute hover:text-fg'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-accent shadow-sm shadow-accent/30"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-1">
                <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.6 : 2} />
                <span>{label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const hidden = useHideOnScroll();
  return (
    <div className="flex min-h-screen flex-col pb-28">
      <Header hidden={hidden} />
      <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
      <Footer />
      <BottomNav hidden={hidden} />
      <ScrollFab hidden={hidden} />
      <AdRouteScripts />
    </div>
  );
}
