import { type MouseEventHandler, useMemo } from 'react';
import { fallbackLogo } from '../lib/util';

type Props = {
  src?: string;
  alt: string;
  className?: string;
  /** When true, loads eagerly and hints high fetch priority (LCP/hero). */
  priority?: boolean;
  fallbackName?: string;
  onClick?: MouseEventHandler<HTMLImageElement>;
};

/**
 * Image with lazy-by-default loading and optional priority for hero/LCP assets.
 */
export default function AppImage({
  src,
  alt,
  className,
  priority = false,
  fallbackName,
  onClick,
}: Props) {
  const fallback = useMemo(
    () => fallbackLogo(fallbackName || alt || 'A'),
    [fallbackName, alt]
  );
  const imageSrc = src || fallback;

  return (
    <img
      key={imageSrc}
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onClick={onClick}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src !== fallback) el.src = fallback;
      }}
      className={className}
    />
  );
}
