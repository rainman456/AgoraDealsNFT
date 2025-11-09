import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Share2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface NFTBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  unlockCriteria: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
}

interface NFTBadgeGalleryProps {
  badges: NFTBadge[];
  onShare?: (badge: NFTBadge) => void;
}

const rarityConfig = {
  common: {
    gradient: 'from-gray-400 to-gray-500',
    glow: 'shadow-[0_0_15px_rgba(156,163,175,0.5)]',
    border: 'border-gray-400',
  },
  rare: {
    gradient: 'from-blue-400 to-blue-600',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
    border: 'border-blue-500',
  },
  epic: {
    gradient: 'from-purple-400 to-purple-600',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.7)]',
    border: 'border-purple-500',
  },
  legendary: {
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.8)]',
    border: 'border-yellow-500',
  },
};

export const NFTBadgeGallery: React.FC<NFTBadgeGalleryProps> = ({ badges, onShare }) => {
  const [selectedBadge, setSelectedBadge] = useState<NFTBadge | null>(null);
  const [newBadges, setNewBadges] = useState<Set<string>>(new Set());

  const handleBadgeClick = (badge: NFTBadge) => {
    setSelectedBadge(badge);
    if (newBadges.has(badge.id)) {
      const updated = new Set(newBadges);
      updated.delete(badge.id);
      setNewBadges(updated);
    }
  };

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-2xl">Badge Collection</h3>
          <p className="text-sm text-muted-foreground">
            {earnedBadges.length} of {badges.length} badges earned
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-heading font-bold text-primary">
            {Math.round((earnedBadges.length / badges.length) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {badges.map((badge, index) => {
          const config = rarityConfig[badge.rarity];
          const isNew = newBadges.has(badge.id);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: badge.earned ? 1.1 : 1.05 }}
              className="relative cursor-pointer"
              onClick={() => handleBadgeClick(badge)}
            >
              {/* New Badge Sparkle Animation */}
              {isNew && badge.earned && (
                <motion.div
                  className="absolute -top-2 -right-2 z-10"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-2xl">✨</span>
                </motion.div>
              )}

              {/* Badge Container */}
              <div
                className={`relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center ${
                  badge.earned
                    ? `bg-gradient-to-br ${config.gradient} ${config.glow}`
                    : 'bg-gray-200 grayscale'
                } transition-all duration-300`}
              >
                {/* Lock Icon for Locked Badges */}
                {!badge.earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                )}

                {/* Badge Icon */}
                <div className={`text-4xl ${badge.earned ? '' : 'opacity-30'}`}>
                  {badge.icon}
                </div>

                {/* Badge Name */}
                <div
                  className={`text-xs font-semibold text-center mt-2 line-clamp-2 ${
                    badge.earned ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {badge.name}
                </div>

                {/* Rarity Indicator */}
                {badge.earned && (
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        badge.rarity === 'legendary'
                          ? 'bg-yellow-300'
                          : badge.rarity === 'epic'
                          ? 'bg-purple-300'
                          : badge.rarity === 'rare'
                          ? 'bg-blue-300'
                          : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-md">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedBadge.icon}</span>
                  <div>
                    <div className="font-heading font-bold text-xl">
                      {selectedBadge.name}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {selectedBadge.rarity} • {selectedBadge.category}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Badge Story */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.description}
                  </p>
                </div>

                {/* Unlock Criteria */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    {selectedBadge.earned ? 'Unlocked' : 'How to Unlock'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.unlockCriteria}
                  </p>
                </div>

                {/* Earned Date */}
                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Earned On</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedBadge.earnedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Share Button */}
                {selectedBadge.earned && (
                  <Button
                    onClick={() => {
                      onShare?.(selectedBadge);
                      setSelectedBadge(null);
                    }}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Badge
                  </Button>
                )}

                {/* Locked State */}
                {!selectedBadge.earned && (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Complete the criteria above to unlock this badge
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
