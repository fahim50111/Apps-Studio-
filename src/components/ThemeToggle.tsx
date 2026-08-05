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
    // cycle button for the header
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const current = options.find((o) => o.mode === mode)!;
    const Icon = current.icon;
    const next = order[(order.indexOf(mode) + 1) % order.length];
    return (
      <button
        onClick={() => setMode(next)}
        aria-label={`Theme: ${current.label}. Switch to ${next}`}
        title={`Theme: ${current.label}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2 text-mute transition hover:border-accent/50 hover:text-accent"
      >
        <Icon className="h-4.5 w-4.5" />
      </button>
    );
  }

  // full segmented control (for settings/profile)
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel2 p-1">
      {options.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            mode === m ? 'bg-accent text-ink' : 'text-mute hover:text-fg'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
