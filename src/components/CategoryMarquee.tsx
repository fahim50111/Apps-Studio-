import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_META } from '../lib/util';
import {
  Users,
  Gamepad2,
  Wrench,
  Clapperboard,
  GraduationCap,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Gamepad2,
  Wrench,
  Clapperboard,
  GraduationCap,
  Briefcase,
};

function Chip({ cat }: { cat: string }) {
  const meta = CATEGORY_META[cat];
  const Icon = ICON_MAP[meta.icon];
  return (
    <Link
      to={`/categories?cat=${cat}`}
      className="mx-1.5 flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 transition hover:border-accent/40"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-lg"
        style={{ background: meta.color + '26' }}
      >
        {Icon && <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />}
      </span>
      <span className="whitespace-nowrap text-xs font-bold text-fg">
        {meta.label}
      </span>
    </Link>
  );
}

/**
 * Auto-scrolling (marquee) category chips. The list is duplicated so the
 * translateX(-50%) loop is seamless. Pauses on hover.
 */
export default function CategoryMarquee() {
  const loop = [...CATEGORIES, ...CATEGORIES];
  return (
    <div className="relative overflow-hidden py-1">
      {/* edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-bg to-transparent" />
      <div className="marquee-track">
        {loop.map((cat, i) => (
          <Chip key={`${cat}-${i}`} cat={cat} />
        ))}
      </div>
    </div>
  );
}
