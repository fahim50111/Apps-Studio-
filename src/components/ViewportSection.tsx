import { useViewportQuery } from '../lib/viewporter';
import { peekCache } from '../lib/cache';

/**
 * Renders children only after the section enters the viewport.
 * Optional cacheKey shows instant content from ViewPorter cache while loading.
 */
export default function ViewportSection({
  cacheKey,
  loader,
  skeleton,
  children,
  className,
}: {
  cacheKey: string;
  loader: () => Promise<unknown>;
  skeleton?: React.ReactNode;
  children: (data: unknown, loading: boolean) => React.ReactNode;
  className?: string;
}) {
  const { ref, data, loading } = useViewportQuery(cacheKey, loader, {
    initial: () => peekCache(cacheKey),
    rootMargin: '280px 0px',
  });

  return (
    <div ref={ref} className={className}>
      {data === undefined && loading
        ? skeleton || null
        : children(data, loading)}
    </div>
  );
}
