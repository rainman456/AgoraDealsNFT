import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { hapticFeedback } from '@/lib/animations';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 100,
  className = '',
}) => {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateZ = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;

    // Determine swipe direction based on offset and velocity
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
        if (offset.x > 0) {
          setExitDirection('right');
          hapticFeedback('medium');
          onSwipeRight?.();
        } else {
          setExitDirection('left');
          hapticFeedback('medium');
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > 500) {
        if (offset.y > 0) {
          setExitDirection('down');
          hapticFeedback('medium');
          onSwipeDown?.();
        } else {
          setExitDirection('up');
          hapticFeedback('medium');
          onSwipeUp?.();
        }
      }
    }
  };

  const exitVariants = {
    left: { x: -300, opacity: 0, transition: { duration: 0.3 } },
    right: { x: 300, opacity: 0, transition: { duration: 0.3 } },
    up: { y: -300, opacity: 0, transition: { duration: 0.3 } },
    down: { y: 300, opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className={className}
      style={{ x, y, rotateZ, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? exitVariants[exitDirection] : {}}
      whileTap={{ cursor: 'grabbing' }}
    >
      {children}
    </motion.div>
  );
};
