import { type MouseEventHandler, useMemo } from 'react';
import { fallbackLogo } from '../lib/util';

type Props = {
  src?: string;
  alt: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLImageElement>;
  loading?: 'lazy' | 'eager';
};

export default function AppImage({ src, alt, className = '', onClick, loading = 'lazy' }: Props) {
  const finalSrc = useMemo(() => src || fallbackLogo, [src]);

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onClick={onClick}
      loading={loading}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== fallbackLogo) {
          target.src = fallbackLogo;
        }
      }}
    />
  );
}
