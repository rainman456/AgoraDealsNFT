import { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tier {
  participants: number;
  discount: number;
  price: number;
  unlocked: boolean;
}

interface GroupDealVisualizationProps {
  dealTitle: string;
  originalPrice: number;
  currentParticipants: number;
  tiers: Tier[];
  endsAt: Date;
  friendsJoined?: string[];
}

export function GroupDealVisualization({
  dealTitle,
  originalPrice,
  currentParticipants,
  tiers,
  endsAt,
  friendsJoined = []
}: GroupDealVisualizationProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  
  const maxParticipants = Math.max(...tiers.map(t => t.participants));
  const progress = (currentParticipants / maxParticipants) * 100;
  const currentTier = [...tiers].reverse().find(t => currentParticipants >= t.participants) || tiers[0];
  const nextTier = tiers.find(t => t.participants > currentParticipants);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  useEffect(() => {
    if (nextTier && currentParticipants >= nextTier.participants) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [currentParticipants, nextTier]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-white mb-2">New Tier Unlocked!</h3>
            <p className="text-xl text-lime-400">Save {nextTier?.discount}% now!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-lime-500 to-yellow-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white/90">Group Deal</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{dealTitle}</h3>
            <p className="text-sm text-white/80">
              {currentParticipants} people joined • Save up to {Math.max(...tiers.map(t => t.discount))}%
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm mb-2">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">{timeLeft}</span>
            </div>
            <p className="text-xs text-white/70">Time left</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 py-6">
        {/* Animated Progress Bar */}
        <div className="relative mb-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-lime-500 to-yellow-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            </div>
          </div>
          
          {/* Tier Markers */}
          <div className="absolute -top-8 left-0 right-0">
            {tiers.map((tier, index) => {
              const position = (tier.participants / maxParticipants) * 100;
              const isUnlocked = currentParticipants >= tier.participants;
              
              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${position}%` }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-lime-500 to-yellow-500 text-white shadow-lg scale-110' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tier.discount}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-lime-50 to-yellow-50 dark:from-lime-950/20 dark:to-yellow-950/20 rounded-xl">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Discount</p>
            <p className="text-3xl font-bold text-lime-600 dark:text-lime-400">{currentTier.discount}% OFF</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${currentTier.price}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ${originalPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Next Tier */}
        {nextTier && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Next Tier: {nextTier.discount}% OFF
                </span>
              </div>
              <span className="text-sm font-bold text-lime-600 dark:text-lime-400">
                ${nextTier.price}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-lime-500 to-yellow-500"
                  style={{ width: `${(currentParticipants / nextTier.participants) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {nextTier.participants - currentParticipants} more needed
              </span>
            </div>
          </div>
        )}

        {/* Friends Joined */}
        {friendsJoined.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {friendsJoined.slice(0, 3).map((friend, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-white"
                  >
                    {friend[0]}
                  </div>
                ))}
                {friendsJoined.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                    +{friendsJoined.length - 3}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {friendsJoined.length} {friendsJoined.length === 1 ? 'friend' : 'friends'} joined
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {friendsJoined.slice(0, 2).join(', ')}
                  {friendsJoined.length > 2 && ` and ${friendsJoined.length - 2} more`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <Button className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
          <Users className="w-5 h-5 mr-2" />
          Join {currentParticipants} People & Save {currentTier.discount}%
        </Button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          <TrendingUp className="w-3 h-3 inline mr-1" />
          Price drops as more people join!
        </p>
      </div>
    </div>
  );
}
