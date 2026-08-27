import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Send } from 'lucide-react';
import { useTheme } from '../lib/theme';

const TOP_THRESHOLD = 420;
const HINT = 'Do you need any mod?';

const fabStyle = {
  backgroundColor: 'var(--c-accent)',
  color: 'var(--c-on-accent)',
  boxShadow: '0 10px 24px -10px color-mix(in srgb, var(--c-accent) 70%, transparent)',
} as const;

export default function ScrollFab({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hintOn, setHintOn] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > TOP_THRESHOLD);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/request' || scrolled) {
      setHintOn(false);
      return;
    }
    let on = false;
    const start = window.setTimeout(() => {
      setHintOn(true);
      on = true;
    }, 1800);
    const loop = window.setInterval(() => {
      on = !on;
      setHintOn(on);
    }, 6500);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(loop);
    };
  }, [pathname, scrolled]);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showRequest = !scrolled && pathname !== '/request';
  const showUp = scrolled;
  if (!showRequest && !showUp) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-24 right-4 z-40 flex items-center justify-end gap-2 transition-transform duration-300 sm:bottom-28 ${
        hidden ? 'translate-y-[160%]' : 'translate-y-0'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showUp ? (
          <motion.button
            key="up"
            type="button"
            onClick={goTop}
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            style={fabStyle}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/15 transition-[background-color,color,box-shadow] duration-300"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.6} />
          </motion.button>
        ) : (
          <motion.div
            key="request"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <AnimatePresence>
              {hintOn && (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, x: 10, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.94 }}
                  className="pointer-events-none max-w-[160px] rounded-2xl rounded-br-sm bg-panel px-3 py-1.5 text-[11px] font-bold leading-snug text-fg shadow-lg ring-1 ring-line/70"
                >
                  {HINT}
                </motion.p>
              )}
            </AnimatePresence>
            <Link
              to="/request"
              aria-label="Request an app"
              style={fabStyle}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/15 transition-[background-color,color,box-shadow] duration-300"
            >
              <Send className="h-5 w-5" strokeWidth={2.4} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
