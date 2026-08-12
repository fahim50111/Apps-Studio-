import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeCtx {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  month: number;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'apps-studio-theme';

function currentMonth(): number {
  return new Date().getMonth() + 1; // 1..12 from the user's device calendar
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

/** Theme-aware favicon — same grid mark as reference site LogoMark. */
function buildFaviconSvg(): string {
  const c = getComputedStyle(document.documentElement);
  const bg = c.getPropertyValue('--c-bg').trim() || '#eef7ff';
  const panel = c.getPropertyValue('--c-panel').trim() || '#ffffff';
  const panel2 = c.getPropertyValue('--c-panel2').trim() || '#dfefff';
  const line = c.getPropertyValue('--c-line').trim() || '#c8d9ec';
  const fg = c.getPropertyValue('--c-fg').trim() || '#152033';
  const accent = c.getPropertyValue('--c-accent').trim() || '#1d9bf0';
  const accent2 = c.getPropertyValue('--c-accent2').trim() || '#6b8cff';
  const accent3 = c.getPropertyValue('--c-accent3').trim() || '#00bcd4';

  // Exact same geometry as header LogoMark (S + A tiles)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="60" y1="42" x2="452" y2="470" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${panel2}"/><stop offset="0.58" stop-color="${bg}"/><stop offset="1" stop-color="${accent2}"/></linearGradient><linearGradient id="a" x1="126" y1="122" x2="386" y2="382"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent2}"/></linearGradient><linearGradient id="b" x1="278" y1="122" x2="386" y2="382"><stop offset="0" stop-color="${accent2}"/><stop offset="1" stop-color="${accent3}"/></linearGradient></defs><rect x="32" y="32" width="448" height="448" rx="112" fill="url(#bg)"/><rect x="54" y="54" width="404" height="404" rx="96" fill="none" stroke="${line}" stroke-width="10" opacity="0.65"/><rect x="126" y="122" width="108" height="108" rx="30" fill="url(#a)"/><rect x="278" y="122" width="108" height="108" rx="30" fill="${panel}"/><rect x="126" y="274" width="108" height="108" rx="30" fill="${panel}"/><rect x="278" y="274" width="108" height="108" rx="30" fill="url(#b)"/><path d="M307 162c0-21 17-38 43-38 19 0 33 7 44 18l-19 22c-8-7-16-11-27-11-10 0-17 4-17 11 0 9 10 12 28 18 24 8 42 20 42 47 0 27-22 45-54 45-24 0-45-9-59-24l20-23c11 11 25 17 40 17 13 0 21-5 21-13 0-9-9-13-27-19-23-8-35-20-35-48Z" fill="${fg}"/><path d="M182 371h-30l41-72 41 72h-30v48h-22v-48Z" fill="${fg}" opacity="0.9"/><circle cx="386" cy="126" r="18" fill="${accent}"/></svg>`;
}

function updateFavicon() {
  const href = `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg())}`;

  // Keep a single canonical tab icon so browser tab matches header LogoMark.
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((n) => n.parentElement?.removeChild(n));

  const link = document.createElement('link');
  link.id = 'app-favicon';
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  document.head.appendChild(link);
}

function apply(resolved: 'light' | 'dark', month = currentMonth()) {
  const root = document.documentElement;
  root.classList.remove(
    'theme-light',
    'theme-dark',
    ...Array.from({ length: 12 }, (_, i) => `theme-month-${i + 1}`)
  );
  root.classList.add(`theme-${resolved}`);
  // Month palette accents apply in both modes (dark gets accent-only overrides).
  root.classList.add(`theme-month-${month}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0a0a0f' : '#eef7ff');
  }
  updateFavicon();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'light';
  });

  const [month, setMonth] = useState(() => currentMonth());

  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    resolve(mode)
  );

  // apply theme whenever mode changes
  useEffect(() => {
    const r = resolve(mode);
    setResolved(r);
    const m = currentMonth();
    setMonth(m);
    apply(r, m);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // react to OS theme changes while in "system" mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = systemPrefersDark() ? 'dark' : 'light';
      setResolved(r);
      const m = currentMonth();
      setMonth(m);
      apply(r, m);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);

  return (
    <Ctx.Provider value={{ mode, resolved, month, setMode }}>{children}</Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
