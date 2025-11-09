import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Zap, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Tier {
  threshold: number;
  discount: number;
  label: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

interface EnhancedGroupDealProgressProps {
  currentCount: number;
  tiers: Tier[];
  participants: Participant[];
  timeRemaining: number; // in seconds
  onJoin?: () => void;
}

export const EnhancedGroupDealProgress: React.FC<EnhancedGroupDealProgressProps> = ({
  currentCount,
  tiers,
  participants,
  timeRemaining,
  onJoin,
}) => {
  const [count, setCount] = useState(0);
  const [unlockedTiers, setUnlockedTiers] = useState<number[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  // Animate count up
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = currentCount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentCount) {
        setCount(currentCount);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentCount]);

  // Check for tier unlocks
  useEffect(() => {
    tiers.forEach((tier, index) => {
      if (count >= tier.threshold && !unlockedTiers.includes(index)) {
        setUnlockedTiers((prev) => [...prev, index]);
        setShowCelebration(true);
        
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f97316'],
        });

        setTimeout(() => setShowCelebration(false), 3000);
      }
    });
  }, [count, tiers, unlockedTiers]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const currentTier = tiers.findIndex((tier) => count < tier.threshold);
  const activeTier = currentTier === -1 ? tiers.length - 1 : Math.max(0, currentTier - 1);
  const nextTier = currentTier === -1 ? null : tiers[currentTier];
  const progress = nextTier
    ? ((count - (tiers[activeTier]?.threshold || 0)) / 
       (nextTier.threshold - (tiers[activeTier]?.threshold || 0))) * 100
    : 100;

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-white mb-2">Tier Unlocked!</h3>
              <p className="text-xl text-white/90">
                {tiers[unlockedTiers[unlockedTiers.length - 1]]?.discount}% discount activated
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-2xl font-bold">Group Deal Progress</h3>
              <Badge className="bg-accent text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Join {count} others to unlock bigger savings
            </p>
          </div>

          {/* Countdown */}
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              Time left
            </div>
            <div className="text-2xl font-bold text-accent">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Animated Count */}
        <div className="text-center mb-6">
          <motion.div
            key={count}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold text-primary mb-2"
          >
            {count}
          </motion.div>
          <p className="text-muted-foreground">people joined</p>
        </div>

        {/* Progress Bar with Faces */}
        <div className="mb-6">
          <div className="relative">
            <Progress value={progress} className="h-4 mb-2" />
            
            {/* Tier markers */}
            <div className="relative h-8">
              {tiers.map((tier, index) => {
                const position = (tier.threshold / tiers[tiers.length - 1].threshold) * 100;
                const isUnlocked = count >= tier.threshold;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="absolute -top-2"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isUnlocked
                          ? 'bg-primary text-white shadow-lg scale-110'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tier.discount}%
                    </div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground">
                      {tier.threshold}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Discount</p>
                <p className="text-3xl font-bold text-primary">
                  {tiers[activeTier]?.discount || 0}% OFF
                </p>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Next Tier</p>
                  <p className="text-2xl font-bold">
                    {nextTier.discount}% at {nextTier.threshold}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nextTier.threshold - count} more needed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">Recent Joiners</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 8).map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.name[0]}</AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
            </div>
            
            {participants.length > 8 && (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                +{participants.length - 8}
              </div>
            )}
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={onJoin}
          size="lg"
          className="w-full text-base font-semibold"
        >
          <Users className="w-5 h-5 mr-2" />
          Join {count} Friends & Save {tiers[activeTier]?.discount || 0}%
        </Button>

        {/* Social Proof */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-success" />
          <span>
            <span className="font-semibold text-foreground">127 people</span> joined in the last hour
          </span>
        </div>
      </div>
    </Card>
  );
};
