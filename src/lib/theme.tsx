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

function apply(resolved: 'light' | 'dark', month = currentMonth()) {
  const root = document.documentElement;
  root.classList.remove(
    'theme-light',
    'theme-dark',
    ...Array.from({ length: 12 }, (_, i) => `theme-month-${i + 1}`)
  );
  root.classList.add(`theme-${resolved}`);
  // The 12 monthly UI palettes apply ONLY in bright/light mode.
  if (resolved === 'light') root.classList.add(`theme-month-${month}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0a0a0f' : '#eef7ff');
  }
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
