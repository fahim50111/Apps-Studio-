import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import type { Banner } from '../lib/firebase';
import { openExternal } from '../lib/security';
import { Zap } from 'lucide-react';

export default function BannerSlider({
  banners,
  loading,
}: {
  banners: Banner[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="skeleton h-44 w-full rounded-3xl md:h-60" />
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="px-4 pt-4">
        <div className="relative flex h-44 flex-col items-center justify-center overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-accent2/20 to-panel md:h-60">
          <Zap className="mb-2 h-10 w-10 text-accent" />
          <p className="font-display text-lg font-bold text-fg">Apps Studio</p>
          <p className="text-xs text-mute">Download your favourite mods</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={banners.length > 1}
        autoplay={
          banners.length > 1
            ? { delay: 4000, disableOnInteraction: false }
            : false
        }
        pagination={{ clickable: true }}
        speed={550}
        className="overflow-hidden rounded-3xl border border-line/70"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <div
              className={`relative h-44 w-full md:h-60 ${b.link ? 'cursor-pointer' : ''}`}
              onClick={() => b.link && openExternal(b.link)}
            >
              <img
                src={b.image}
                alt={b.title || 'Banner'}
                loading="lazy"
                className="h-full w-full bg-panel2 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {b.title && (
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-lg font-bold">{b.title}</h3>
                  {b.desc && <p className="text-xs text-white/80">{b.desc}</p>}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
