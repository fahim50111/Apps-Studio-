import { useEffect, useState } from 'react';

/**
 * Returns `hidden = true` when the user is scrolling DOWN (past a small
 * threshold), and `false` when scrolling up or near the top. Used to slide the
 * header up and the bottom nav down out of the way while reading.
 */
export function useHideOnScroll(threshold = 10): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY;

      // always show near the very top
      if (y < 80) {
        setHidden(false);
      } else if (Math.abs(diff) > threshold) {
        setHidden(diff > 0); // scrolling down -> hide
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
