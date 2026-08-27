import type { Transition, Variants } from 'framer-motion';

export const easeOut: Transition = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1],
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...easeOut, staggerChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.18 },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: easeOut },
};

export const popIn: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  enter: { opacity: 1, y: 0, scale: 1, transition: easeOut },
};

export const listStagger: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
