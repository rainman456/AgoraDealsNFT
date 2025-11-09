import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { hapticFeedback } from '@/lib/animations';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;

    if (offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      hapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only allow pull down when at the top of the page
    const container = containerRef.current;
    if (container && container.scrollTop === 0 && info.offset.y > 0) {
      y.set(Math.min(info.offset.y, threshold * 1.5));
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-auto h-full">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{ 
          y: useTransform(y, (value) => Math.max(0, value - 40)),
          opacity,
        }}
      >
        <motion.div
          className="bg-primary text-white rounded-full p-3 shadow-lg"
          style={{ rotate, scale }}
        >
          <RefreshCw className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Content wrapper */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? threshold : y }}
        animate={isRefreshing ? { y: threshold } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
