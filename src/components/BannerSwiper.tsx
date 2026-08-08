import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import type { Banner } from '../lib/types';
import { openExternal } from '../lib/security';
import AppImage from './AppImage';

/** Isolated Swiper chunk — only loaded on Home when banners exist. */
export default function BannerSwiper({ banners }: { banners: Banner[] }) {
  return (
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
      {banners.map((b, i) => (
        <SwiperSlide key={b.id}>
          <div
            className={`relative h-44 w-full md:h-60 ${b.link ? 'cursor-pointer' : ''}`}
            onClick={() => b.link && openExternal(b.link)}
          >
            <AppImage
              src={b.image}
              alt={b.title || 'Banner'}
              priority={i === 0}
              className="h-full w-full bg-panel2 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {b.title && (
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-lg font-bold">{b.title}</h3>
                {b.desc && <p className="text-xs text-white/80">{b.desc}</p>
              </div>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
