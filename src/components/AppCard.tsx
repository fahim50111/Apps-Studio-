import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AppItem } from '../lib/types';
import { getName, catLabel, formatCount } from '../lib/util';
import AppImage from './AppImage';
import { popIn } from '../lib/motion';
import { ArrowDownToLine, Download } from 'lucide-react';

export function AppCard({ app, index = 0 }: { app: AppItem; index?: number }) {
  const name = getName(app);
  return (
    <motion.div
      variants={popIn}
      initial="initial"
      animate="enter"
      transition={{ delay: Math.min(index, 10) * 0.035 }}
    >
      <Link
        to={`/app/${app.id}`}
        className="card-lift shine-hover group relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-line/70 bg-panel p-3"
      >
        <div className="relative mb-2.5">
          <AppImage
            src={app.logo}
            alt={name}
            fallbackName={name}
            className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-105"
          />
          {app.isMod && (
            <span className="absolute -right-1.5 -top-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-ink shadow-sm">
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
    </motion.div>
  );
}

export function ListItem({
  app,
  rank,
  index = 0,
}: {
  app: AppItem;
  rank?: number;
  index?: number;
}) {
  const name = getName(app);
  const isTop3 = rank !== undefined && rank < 3;
  return (
    <motion.div
      variants={popIn}
      initial="initial"
      animate="enter"
      transition={{ delay: Math.min(index, 12) * 0.04 }}
    >
      <Link
        to={`/app/${app.id}`}
        className="card-lift shine-hover group flex min-w-0 items-center gap-2.5 rounded-2xl border border-line/70 bg-panel p-3 sm:gap-3"
      >
        {rank !== undefined && (
          <div
            className={`font-display w-7 shrink-0 text-center text-xl font-extrabold ${
              isTop3 ? 'text-accent drop-shadow-[0_0_10px_var(--c-accent)]' : 'text-line'
            }`}
          >
            {rank + 1}
          </div>
        )}
        <AppImage
          src={app.logo}
          alt={name}
          fallbackName={name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-105"
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
        <span className="btn-press flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-ink shadow-sm shadow-accent/20 transition group-hover:brightness-110 sm:px-4">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden min-[360px]:inline">Get</span>
        </span>
      </Link>
    </motion.div>
  );
}
