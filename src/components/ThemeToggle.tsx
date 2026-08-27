import { AnimatePresence, motion } from 'framer-motion';
import { useTheme, type ThemeMode } from '../lib/theme';
import { Sun, Moon, Monitor } from 'lucide-react';

const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Bright' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();

  if (compact) {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const current = options.find((o) => o.mode === mode)!;
    const Icon = current.icon;
    const next = order[(order.indexOf(mode) + 1) % order.length];
    return (
      <button
        onClick={() => setMode(next)}
        aria-label={`Theme: ${current.label}. Switch to ${next}`}
        title={`Theme: ${current.label}`}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-panel2 text-mute transition hover:border-accent/50 hover:text-accent"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={mode}
            initial={{ rotate: -80, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 80, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22 }}
            className="flex"
          >
            <Icon className="h-4.5 w-4.5" />
          </motion.span>
        </AnimatePresence>
      </button>
    );
  }

  return (
    <div className="inline-flex max-w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-line bg-panel2 p-1">
      {options.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold transition sm:gap-1.5 sm:px-3 sm:text-xs ${
            mode === m ? 'bg-accent text-ink' : 'text-mute hover:text-fg'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden min-[380px]:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
