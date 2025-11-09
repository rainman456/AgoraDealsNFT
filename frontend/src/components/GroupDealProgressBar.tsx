import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { countUp } from '@/lib/animations';

interface Tier {
  participants: number;
  discount: number;
  label: string;
}

interface GroupDealProgressBarProps {
  currentParticipants: number;
  tiers: Tier[];
  maxParticipants?: number;
}

export const GroupDealProgressBar: React.FC<GroupDealProgressBarProps> = ({
  currentParticipants,
  tiers,
  maxParticipants,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastTierUnlocked, setLastTierUnlocked] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);

  const maxTierParticipants = maxParticipants || tiers[tiers.length - 1].participants;
  const progressPercentage = Math.min((currentParticipants / maxTierParticipants) * 100, 100);

  // Determine current tier
  const currentTier = tiers.reduce((acc, tier, index) => {
    if (currentParticipants >= tier.participants) {
      return index;
    }
    return acc;
  }, -1);

  // Trigger confetti when tier unlocks
  useEffect(() => {
    if (currentTier !== lastTierUnlocked && currentTier >= 0) {
      setShowConfetti(true);
      setLastTierUnlocked(currentTier);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [currentTier, lastTierUnlocked]);

  // Animate count-up on mount and when participants change
  useEffect(() => {
    countUp(displayCount, currentParticipants, 1000, setDisplayCount);
  }, [currentParticipants]);

  // Calculate gradient colors based on progress
  const getGradientColor = () => {
    if (progressPercentage < 33) return 'from-blue-400 to-blue-500';
    if (progressPercentage < 66) return 'from-purple-400 to-purple-500';
    return 'from-pink-400 via-red-400 to-yellow-500';
  };

  return (
    <div className="relative w-full">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 100 + '%',
                  y: -20,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: 200,
                  rotate: Math.random() * 360,
                  opacity: 0,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-heading font-bold text-lg">Group Deal Progress</span>
        </div>
        <div className="text-right">
          <motion.div 
            className="text-2xl font-heading font-bold text-primary"
            key={currentParticipants}
            initial={{ scale: 1.5, color: '#10b981' }}
            animate={{ scale: 1, color: 'var(--primary)' }}
            transition={{ duration: 0.5 }}
          >
            {displayCount}
          </motion.div>
          <div className="text-xs text-muted-foreground">
            You + {displayCount - 1} others
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-16 bg-gray-100 rounded-full overflow-visible mb-6">
        {/* Animated Progress Fill */}
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getGradientColor()} rounded-full shadow-lg`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Tier Markers */}
        {tiers.map((tier, index) => {
          const position = (tier.participants / maxTierParticipants) * 100;
          const isUnlocked = currentParticipants >= tier.participants;

          return (
            <div
              key={index}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              {/* Tier Marker */}
              <motion.div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center z-10 ${
                  isUnlocked
                    ? 'bg-white border-primary shadow-lg'
                    : 'bg-gray-200 border-gray-300'
                }`}
                animate={isUnlocked ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <span
                  className={`text-sm font-bold ${
                    isUnlocked ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  {tier.discount}%
                </span>
              </motion.div>

              {/* Tier Label */}
              <div
                className={`absolute top-16 text-center whitespace-nowrap ${
                  isUnlocked ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <div className="text-xs">{tier.label}</div>
                <div className="text-xs">{tier.participants} people</div>
              </div>
            </div>
          );
        })}

        {/* Current Position Indicator (Animated Avatar) */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 z-20"
          initial={{ left: 0 }}
          animate={{ left: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-4 border-white shadow-xl flex items-center justify-center"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Users className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Current Tier Info */}
      {currentTier >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 text-center"
        >
          <div className="text-sm text-muted-foreground mb-1">Current Discount</div>
          <div className="text-3xl font-heading font-bold text-primary">
            {tiers[currentTier].discount}% OFF
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {currentTier < tiers.length - 1
              ? `${tiers[currentTier + 1].participants - currentParticipants} more to unlock ${
                  tiers[currentTier + 1].discount
                }% discount!`
              : 'Maximum discount unlocked! 🎉'}
          </div>
        </motion.div>
      )}

      {currentTier < 0 && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-muted-foreground">
            {tiers[0].participants - currentParticipants} more people needed to unlock first tier
          </div>
        </div>
      )}
    </div>
  );
};
