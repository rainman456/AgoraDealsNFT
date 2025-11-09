import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star } from 'lucide-react';
import { sparkleEffect } from './ConfettiEffect';
import { hapticFeedback } from '@/lib/animations';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeUnlockProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 via-orange-500 to-red-500',
};

const rarityGlow = {
  common: 'shadow-gray-400/50',
  rare: 'shadow-blue-400/50',
  epic: 'shadow-purple-400/50',
  legendary: 'shadow-yellow-400/50',
};

export const BadgeUnlock: React.FC<BadgeUnlockProps> = ({ badge, isOpen, onClose }) => {
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (isOpen && badge) {
      hapticFeedback('heavy');
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 2000);
    }
  }, [isOpen, badge]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle particles */}
            {showSparkles && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: '50%',
                      y: '50%',
                      scale: 0,
                      rotate: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: [0, 1, 0],
                      rotate: Math.random() * 360,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1 + Math.random(),
                      ease: 'easeOut',
                    }}
                    className="absolute w-2 h-2"
                  >
                    <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center shadow-2xl">
              {/* Badge unlock text */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <p className="text-yellow-400 font-semibold text-sm uppercase tracking-wider mb-2">
                  Achievement Unlocked!
                </p>
                <h2 className="text-white font-heading font-bold text-3xl">
                  {badge.name}
                </h2>
              </motion.div>

              {/* Badge icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.3,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className="relative mb-6"
              >
                {/* Rotating glow effect */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${rarityColors[badge.rarity]} opacity-30 blur-xl`}
                />

                {/* Badge container */}
                <div className={`relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${rarityColors[badge.rarity]} p-1 shadow-2xl ${rarityGlow[badge.rarity]}`}>
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Award className="w-16 h-16 text-white" />
                    </motion.div>
                  </div>
                </div>

                {/* Pulsing rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                      scale: [1, 2, 2.5],
                      opacity: [0.5, 0.2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeOut',
                    }}
                    className={`absolute inset-0 rounded-full border-4 border-gradient-to-r ${rarityColors[badge.rarity]}`}
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '8rem',
                      height: '8rem',
                    }}
                  />
                ))}
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 mb-6"
              >
                {badge.description}
              </motion.p>

              {/* Rarity badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <span className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${rarityColors[badge.rarity]} text-white font-semibold text-sm uppercase`}>
                  {badge.rarity}
                </span>
              </motion.div>

              {/* Close button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Awesome!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
