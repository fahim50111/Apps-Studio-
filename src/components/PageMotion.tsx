import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants } from '../lib/motion';

export default function PageMotion({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="min-w-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
