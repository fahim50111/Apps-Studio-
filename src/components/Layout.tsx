import { Link, useLocation } from 'react-router-dom';
import { Home, Flame, Send, User, Search, LayoutGrid } from 'lucide-react';
import Footer from './Footer';
import LogoMark from './LogoMark';
import ThemeToggle from './ThemeToggle';
import NotificationPermissionPrompt from './NotificationPermissionPrompt';
import { AdRouteScripts, ClickAdController } from './AdScripts';
import { useHideOnScroll } from '../lib/useHideOnScroll';

function Header({ hidden }: { hidden: boolean }) {
  return (
    <header
      className={`glass sticky top-0 z-40 border-b border-line/60 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
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
          <Link
            to="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2 text-mute transition hover:border-accent/50 hover:text-accent"
          >
            <Search className="h-4.5 w-4.5" />
          </Link>
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
  { to: '/request', label: 'Request', icon: Send },
  { to: '/profile', label: 'You', icon: User },
];

function BottomNav({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  return (
    <div
      className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 transition-transform duration-300 ${
        hidden ? 'translate-y-[150%]' : 'translate-y-0'
      }`}
    >
      <nav className="glass flex items-center gap-1 rounded-2xl border border-line/70 p-1.5 shadow-2xl shadow-black/50">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`mobile-nav-item shine-hover relative flex flex-col items-center gap-1 rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                active ? 'bg-accent text-ink' : 'text-mute hover:text-fg'
              }`}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.6 : 2} />
              <span>{label}</span>
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
      <NotificationPermissionPrompt />
      <AdRouteScripts />
      <ClickAdController />
    </div>
  );
}
