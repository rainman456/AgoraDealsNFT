import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Share2, X, TrendingUp, Award, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';

interface RedemptionSuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  savingsAmount: number;
  dealTitle: string;
  merchantName: string;
  reputationGain: number;
  currentTier: string;
  nextTier: string;
  tierProgress: number; // 0-100
}

export const RedemptionSuccessScreen: React.FC<RedemptionSuccessScreenProps> = ({
  isOpen,
  onClose,
  savingsAmount,
  dealTitle,
  merchantName,
  reputationGain,
  currentTier,
  nextTier,
  tierProgress,
}) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [animatedReputation, setAnimatedReputation] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Trigger fireworks
      setShowFireworks(true);
      
      // Multiple confetti bursts
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          setShowFireworks(false);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a855f7', '#ec4899', '#f97316', '#10b981'],
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a855f7', '#ec4899', '#f97316', '#10b981'],
        });
      }, 50);

      // Animate numbers
      animateValue(0, savingsAmount, 1500, setAnimatedSavings);
      setTimeout(() => animateValue(0, reputationGain, 1000, setAnimatedReputation), 500);
      setTimeout(() => animateValue(0, tierProgress, 1500, setAnimatedProgress), 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, savingsAmount, reputationGain, tierProgress]);

  const animateValue = (
    start: number,
    end: number,
    duration: number,
    setter: (value: number) => void
  ) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setter(end);
        clearInterval(timer);
      } else {
        setter(Math.floor(current));
      }
    }, 16);
  };

  const handleShare = () => {
    toast.success('Shared to social media!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Success Header */}
            <div className="relative bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-8 text-white text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-10 h-10" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-2"
              >
                Deal Redeemed!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/90"
              >
                {dealTitle}
              </motion.p>
            </div>

            {/* Savings Amount */}
            <div className="p-8 text-center border-b border-border">
              <p className="text-sm text-muted-foreground mb-2">You saved</p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <h3 className="text-6xl font-bold text-success mb-2">
                  ${animatedSavings}
                </h3>
              </motion.div>
              <p className="text-muted-foreground">at {merchantName}</p>
            </div>

            {/* Reputation Gain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-6 bg-gradient-to-r from-accent/10 to-primary/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reputation Gained</p>
                    <p className="text-2xl font-bold text-accent">
                      +{animatedReputation} points
                    </p>
                  </div>
                </div>
                <Badge className="bg-success text-white border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Level Up!
                </Badge>
              </div>

              {/* Tier Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{currentTier}</span>
                  <span className="text-muted-foreground">{nextTier}</span>
                </div>
                <Progress value={animatedProgress} className="h-3" />
                <p className="text-xs text-center text-muted-foreground">
                  {100 - tierProgress}% to {nextTier}
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="p-6 space-y-3">
              <Button
                onClick={handleShare}
                size="lg"
                className="w-full text-base font-semibold"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Your Savings
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                size="lg"
                className="w-full text-base"
              >
                Continue Exploring
              </Button>
            </div>

            {/* Fun Fact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="px-6 pb-6"
            >
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  🎉 You've saved{' '}
                  <span className="font-bold text-foreground">
                    ${(animatedSavings * 12).toLocaleString()}
                  </span>{' '}
                  in total this year!
                </p>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
