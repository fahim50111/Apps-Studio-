import { Link } from 'react-router-dom';
import type { AppItem } from '../lib/types';
import { getName, catLabel, formatCount } from '../lib/util';
import AppImage from './AppImage';
import { ArrowDownToLine, Download } from 'lucide-react';

export function AppCard({ app }: { app: AppItem }) {
  const name = getName(app);
  return (
    <Link
      to={`/app/${app.id}`}
      className="group relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-line/70 bg-panel p-3 transition-all hover:-translate-y-1 hover:border-accent/40 hover:bg-panel2 shine-hover card-pop"
    >
      <div className="relative mb-2.5">
        <AppImage
          src={app.logo}
          alt={name}
          fallbackName={name}
          className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/5"
        />
        {app.isMod && (
          <span className="absolute -right-1.5 -top-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-ink">
            Mod
          </span>
        )}
      </div>
      <div className="line-clamp-2 w-full text-center text-[12px] font-bold leading-tight text-fg">
        {name}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-mute">
        {catLabel(app.category)}
      </div>
    </Link>
  );
}

export function ListItem({ app, rank }: { app: AppItem; rank?: number }) {
  const name = getName(app);
  const isTop3 = rank !== undefined && rank < 3;
  return (
    <Link
      to={`/app/${app.id}`}
      className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-line/70 bg-panel p-3 transition-all hover:border-accent/40 hover:bg-panel2 sm:gap-3 shine-hover"
    >
      {rank !== undefined && (
        <div
          className={`font-display w-7 shrink-0 text-center text-xl font-extrabold ${
            isTop3 ? 'text-accent' : 'text-line'
          }`}
        >
          {rank + 1}
        </div>
      )}
      <AppImage
        src={app.logo}
        alt={name}
        fallbackName={name}
        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/5"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-fg">{name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-mute">
          <span className="rounded-md bg-panel2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {catLabel(app.category)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3" />
            {formatCount(app.downloads)}
          </span>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-ink transition group-hover:brightness-110 sm:px-4">
        <Download className="h-3.5 w-3.5" />
        <span className="hidden min-[360px]:inline">Get</span>
      </span>
    </Link>
  );
}
