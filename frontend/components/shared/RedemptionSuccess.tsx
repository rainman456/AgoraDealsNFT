import { useEffect, useState } from 'react';
import { Share2, Download, TrendingUp, Trophy, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface RedemptionSuccessProps {
  dealTitle: string;
  merchantName: string;
  savingsAmount: number;
  reputationGain: number;
  currentLevel: number;
  levelProgress: number;
  onClose: () => void;
}

export function RedemptionSuccess({
  dealTitle,
  merchantName,
  savingsAmount,
  reputationGain,
  currentLevel,
  levelProgress,
  onClose
}: RedemptionSuccessProps) {
  const [showContent, setShowContent] = useState(false);
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [animatedReputation, setAnimatedReputation] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#84cc16', '#eab308', '#22c55e', '#fbbf24']
      });
    }, 50);

    // Show content after brief delay
    setTimeout(() => setShowContent(true), 100);

    // Animate numbers
    const savingsInterval = setInterval(() => {
      setAnimatedSavings(prev => {
        const next = prev + savingsAmount / 30;
        return next >= savingsAmount ? savingsAmount : next;
      });
    }, 30);

    const reputationInterval = setInterval(() => {
      setAnimatedReputation(prev => {
        const next = prev + reputationGain / 20;
        return next >= reputationGain ? reputationGain : next;
      });
    }, 50);

    const progressInterval = setInterval(() => {
      setAnimatedProgress(prev => {
        const next = prev + levelProgress / 40;
        return next >= levelProgress ? levelProgress : next;
      });
    }, 25);

    return () => {
      clearInterval(interval);
      clearInterval(savingsInterval);
      clearInterval(reputationInterval);
      clearInterval(progressInterval);
    };
  }, [savingsAmount, reputationGain, levelProgress]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'I just saved money!',
        text: `I just saved $${savingsAmount} at ${merchantName} using DealForge! 🎉`,
        url: window.location.href
      });
    }
  };

  const handleDownload = () => {
    // In a real app, this would generate and download a screenshot
    alert('Screenshot saved to your device!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative max-w-lg w-full mx-4 bg-gradient-to-br from-white via-lime-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
        showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Fireworks Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-lime-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-lime-500 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-lime-500 to-yellow-500 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Success! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You redeemed <span className="font-semibold text-gray-900 dark:text-white">{dealTitle}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              at {merchantName}
            </p>
          </div>

          {/* Savings Amount - Hero */}
          <div className="mb-8 p-8 bg-gradient-to-r from-lime-500 to-yellow-500 rounded-2xl shadow-xl">
            <p className="text-center text-white/90 text-sm font-medium mb-2">You Saved</p>
            <p className="text-center text-6xl font-bold text-white mb-2">
              ${animatedSavings.toFixed(2)}
            </p>
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>That's real money in your pocket!</span>
            </div>
          </div>

          {/* Reputation Gain */}
          <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-lime-200 dark:border-lime-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reputation Gained</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    +{Math.round(animatedReputation)} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Level</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {currentLevel}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>Level {currentLevel}</span>
                <span>Level {currentLevel + 1}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${animatedProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {Math.round(animatedProgress)}% to next level
              </p>
            </div>
          </div>

          {/* Achievement Unlocked */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200 dark:border-blue-800 animate-slideIn">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Achievement Unlocked!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Smart Shopper - Redeemed 10 deals</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-6"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-2 border-gray-300 dark:border-gray-600 font-semibold py-6"
            >
              <Download className="w-5 h-5 mr-2" />
              Save
            </Button>
          </div>

          {/* Footer Message */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Keep exploring deals to level up faster! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
