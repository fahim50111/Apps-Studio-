import { useEffect, useState } from 'react';

/**
 * Figures out how many grid columns are visible at the current viewport width
 * (must match the Tailwind grid breakpoints used in the app):
 *   base            -> 3 cols
 *   >=640px (sm)    -> 4 cols
 *   >=768px (md)    -> 6 cols
 * Then returns a page size = columns * rows so we always fetch enough docs to
 * fill the screen (plus a little extra) regardless of device size.
 */
function columnsForWidth(w: number): number {
  if (w >= 768) return 6;
  if (w >= 640) return 4;
  return 3;
}

export function useResponsivePageSize(rows = 3): {
  pageSize: number;
  cols: number;
} {
  const getState = () => {
    const w = typeof window === 'undefined' ? 375 : window.innerWidth;
    const cols = columnsForWidth(w);
    return { cols, pageSize: cols * rows };
  };

  const [state, setState] = useState(getState);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setState((prev) => {
          const next = getState();
          // only update if the column count actually changed
          return next.cols === prev.cols ? prev : next;
        });
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return state;
}
