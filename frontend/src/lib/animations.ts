// Animation constants and utilities for consistent timing and easing

export const ANIMATION_TIMINGS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const EASING = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.65, 0, 0.35, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Framer Motion variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

export const slideLeft = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

export const slideRight = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const cardHover = {
  rest: { 
    y: 0, 
    scale: 1,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  hover: { 
    y: -8, 
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.15,
      ease: EASING.easeOut,
    },
  },
};

export const buttonPress = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
};

export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const sparkle = {
  initial: { scale: 0, rotate: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 180, 360],
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8,
      ease: EASING.spring,
    },
  },
};

export const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
};

// Haptic feedback utility
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
  }
};

// Count-up animation utility
export const countUp = (
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void
) => {
  const startTime = Date.now();
  const animate = () => {
    const now = Date.now();
    const progress = Math.min((now - startTime) / duration, 1);
    const easeOutQuad = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOutQuad);
    onUpdate(current);
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: EASING.easeOut,
    },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: EASING.easeIn,
    },
  },
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: EASING.easeOut,
    },
  },
};
