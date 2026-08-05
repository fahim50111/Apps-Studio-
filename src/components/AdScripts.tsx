import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ShieldAlert } from 'lucide-react';

const SOCIAL_SRC =
  'https://pl28865518.profitablecpmratenetwork.com/c3/2e/df/c32edf399a2465e679c6916a452916a5.js';
const POPHOLDER_SRC =
  'https://pl29173150.profitablecpmratenetwork.com/58/dc/4e/58dc4e250696a8ca032b8aeda82e02db.js';
const BANNER_SRC =
  'https://www.highperformanceformat.com/2f5bbf6218f8e38947d13ae964d09fd6/invoke.js';
const BANNER_KEY = '2f5bbf6218f8e38947d13ae964d09fd6';

const SOCIAL_PAGES = ['/', '/app', '/categories', '/toplist'];
const POPHOLDER_PAGES = ['/app', '/categories'];

const CLICK_COUNT_KEY = 'apps-studio-click-ad-count';

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

function pageMatches(pathname: string, pages: string[]) {
  return pages.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)));
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function injectScript(src: string, target: HTMLElement, prefix: string) {
  const s = document.createElement('script');
  s.id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  s.src = src;
  s.async = false;
  s.setAttribute('data-cfasync', 'false');
  s.onerror = () => console.warn('Ad script failed to load:', src);
  target.appendChild(s);
  return s;
}

function runPopHolder() {
  injectScript(POPHOLDER_SRC, document.head, 'ad-popholder-route');
}

function runSocialBar() {
  injectScript(SOCIAL_SRC, document.body, 'ad-socialbar-route');
}

export function AdRouteScripts() {
  const { pathname } = useLocation();
  const social = pageMatches(pathname, SOCIAL_PAGES);
  const popholder = pageMatches(pathname, POPHOLDER_PAGES);

  useEffect(() => {
    if (!social) return;
    const t = window.setTimeout(runSocialBar, 500);
    return () => window.clearTimeout(t);
  }, [social, pathname]);

  useEffect(() => {
    if (!popholder) return;

    const immediate = window.setTimeout(runPopHolder, 450);

    let firedOnClick = false;
    const onFirstClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-ad-overlay]')) return;
      if (firedOnClick) return;
      firedOnClick = true;
      runPopHolder();
      document.removeEventListener('click', onFirstClick, true);
    };
    document.addEventListener('click', onFirstClick, true);

    return () => {
      window.clearTimeout(immediate);
      document.removeEventListener('click', onFirstClick, true);
    };
  }, [popholder, pathname]);

  return <AdPageNotice social={social} popholder={popholder} banner={pathname === '/toplist'} />;
}

export function AdBanner({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    window.atOptions = {
      key: BANNER_KEY,
      format: 'iframe',
      height: 250,
      width: 300,
      params: {},
    };
    const cfg = document.createElement('script');
    cfg.type = 'text/javascript';
    cfg.text = `atOptions = {'key':'${BANNER_KEY}','format':'iframe','height':250,'width':300,'params':{}};`;
    const s = document.createElement('script');
    s.src = BANNER_SRC;
    s.async = false;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = () => {
      el.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:250px;width:300px;border-radius:12px;background:rgba(0,0,0,.04);font:12px sans-serif;color:#777;text-align:center;padding:16px;">Advertisement could not load. Please disable ad blocker.</div>';
    };
    el.appendChild(cfg);
    el.appendChild(s);
    return () => {
      el.innerHTML = '';
    };
  }, []);

  return (
    <div
      className={`mx-auto flex w-full justify-center rounded-2xl border border-line bg-panel p-3 ${
        compact ? 'max-w-[332px]' : ''
      }`}
    >
      <div ref={ref} className="ad-inner min-h-[250px] overflow-hidden rounded-xl" />
    </div>
  );
}

export function ClickAdController() {
  const [show, setShow] = useState(false);
  const showRef = useRef(false);
  const { pathname } = useLocation();
  const enabled = pageMatches(pathname, SOCIAL_PAGES);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (showRef.current || target?.closest('[data-ad-overlay]')) return;

      const count = Number(localStorage.getItem(CLICK_COUNT_KEY) || '0') + 1;
      localStorage.setItem(CLICK_COUNT_KEY, String(count));

      if (count % 5 === 0) {
        setShow(true);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [enabled]);

  if (!show) return null;
  return (
    <div
      data-ad-overlay
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-panel p-5 shadow-2xl shadow-black/40">
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 rounded-lg bg-panel2 p-1.5 text-mute hover:text-fg"
          aria-label="Close advertisement"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-mute">
          Advertisement
        </p>
        <AdBanner compact />
      </div>
    </div>
  );
}

function AdPageNotice({
  social,
  popholder,
  banner,
}: {
  social: boolean;
  popholder: boolean;
  banner: boolean;
}) {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const labels = useMemo(() => {
    const l = [];
    if (social) l.push('SocialBar');
    if (popholder) l.push('PopHolder');
    if (banner) l.push('Banner');
    return l;
  }, [social, popholder, banner]);

  useEffect(() => {
    if (!labels.length) {
      setVisible(false);
      return;
    }

    const key = `apps-studio-adnotice:${todayKey()}:${pathname}`;
    if (localStorage.getItem(key) === '1') {
      setVisible(false);
      return;
    }

    setVisible(true);
    localStorage.setItem(key, '1');
    const t = window.setTimeout(() => setVisible(false), 6500);
    return () => window.clearTimeout(t);
  }, [labels, pathname]);

  if (!visible || !labels.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[65] px-4 pointer-events-none">
      <div className="glass pointer-events-auto mx-auto flex max-w-sm items-start gap-2 rounded-2xl border border-line px-4 py-3 text-xs text-fg shadow-xl shadow-black/20">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent3" />
        <p className="flex-1 leading-relaxed">
          এই পেজে {labels.join(', ')} বিজ্ঞাপন রয়েছে। নিরাপদভাবে ব্রাউজ করুন।
        </p>
        <button onClick={() => setVisible(false)} className="text-mute hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
