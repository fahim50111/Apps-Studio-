import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

type Banner = {
  id: string;
  image: string;
  link?: string;
  title?: string;
};

type Props = {
  banners: Banner[];
};

export default function BannerSwiper({ banners }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || banners.length === 0) return null;

  return (
    <div className="banner-swiper-wrap">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        className="banner-swiper"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            {b.link ? (
              <a href={b.link} target="_blank" rel="noopener noreferrer">
                <img src={b.image} alt={b.title || 'Banner'} className="banner-img" />
              </a>
            ) : (
              <img src={b.image} alt={b.title || 'Banner'} className="banner-img" />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
