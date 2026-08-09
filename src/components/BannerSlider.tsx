import { lazy, Suspense } from 'react';
import type { Banner } from '../lib/types';
import LogoMark from './LogoMark';

const BannerSwiper = lazy(() => import('./BannerSwiper'));

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4">{children}</div>;
}

export default function BannerSlider({
  banners,
  loading,
}: {
  banners: Banner[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Shell>
        <div className="skeleton h-44 w-full rounded-3xl md:h-60" />
      </Shell>
    );
  }

  if (!banners.length) {
    return (
      <Shell>
        <div className="relative flex h-44 flex-col items-center justify-center overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-accent2/20 to-panel md:h-60">
          <LogoMark className="mb-2 h-14 w-14" />
          <p className="font-display text-lg font-bold text-fg">Apps Studio</p>
          <p className="text-xs text-mute">Download your favourite mods</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Suspense
        fallback={<div className="skeleton h-44 w-full rounded-3xl md:h-60" />}
      >
        <BannerSwiper banners={banners} />
      </Suspense>
    </Shell>
  );
}
