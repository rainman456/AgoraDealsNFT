import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Award, Star, TrendingUp, Target, Zap, 
  Gift, Crown, Shield, Flame, Heart, Users,
  ShoppingBag, Ticket, DollarSign, Calendar
} from 'lucide-react';

interface UserBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  requirement?: number;
}

interface UserTier {
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
}

const tiers: UserTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    color: 'from-orange-700 to-orange-500',
    benefits: ['Basic deals access', '5% bonus rewards']
  },
  {
    name: 'Silver',
    minPoints: 100,
    color: 'from-gray-400 to-gray-300',
    benefits: ['Priority support', '10% bonus rewards', 'Early deal access']
  },
  {
    name: 'Gold',
    minPoints: 500,
    color: 'from-yellow-500 to-yellow-300',
    benefits: ['VIP support', '15% bonus rewards', 'Exclusive deals', 'Free shipping']
  },
  {
    name: 'Platinum',
    minPoints: 1500,
    color: 'from-cyan-400 to-blue-300',
    benefits: ['Dedicated manager', '20% bonus rewards', 'Premium deals', 'Free upgrades']
  },
  {
    name: 'Diamond',
    minPoints: 5000,
    color: 'from-purple-500 to-pink-400',
    benefits: ['Concierge service', '30% bonus rewards', 'Unlimited perks', 'Custom deals']
  }
];

const mockBadges: UserBadge[] = [
  {
    id: 1,
    name: 'First Purchase',
    description: 'Made your first coupon purchase',
    icon: '🎉',
    rarity: 'common',
    earned: true,
    earnedAt: '2024-01-15'
  },
  {
    id: 2,
    name: 'Deal Hunter',
    description: 'Purchased 10 coupons',
    icon: '🎯',
    rarity: 'common',
    earned: true,
    earnedAt: '2024-02-01',
    progress: 10,
    requirement: 10
  },
  {
    id: 3,
    name: 'Savvy Saver',
    description: 'Saved over $500 in total',
    icon: '💰',
    rarity: 'rare',
    earned: true,
    earnedAt: '2024-03-10',
    progress: 750,
    requirement: 500
  },
  {
    id: 4,
    name: 'Social Butterfly',
    description: 'Share 25 deals with friends',
    icon: '🦋',
    rarity: 'rare',
    earned: false,
    progress: 18,
    requirement: 25
  },
  {
    id: 5,
    name: 'Review Master',
    description: 'Write 50 helpful reviews',
    icon: '⭐',
    rarity: 'epic',
    earned: false,
    progress: 32,
    requirement: 50
  },
  {
    id: 6,
    name: 'Group Leader',
    description: 'Complete 20 group deals',
    icon: '👥',
    rarity: 'epic',
    earned: false,
    progress: 12,
    requirement: 20
  },
  {
    id: 7,
    name: 'Auction King',
    description: 'Win 15 auctions',
    icon: '🔨',
    rarity: 'epic',
    earned: false,
    progress: 7,
    requirement: 15
  },
  {
    id: 8,
    name: 'Legendary Shopper',
    description: 'Reach Diamond tier',
    icon: '💎',
    rarity: 'legendary',
    earned: false,
    progress: 2500,
    requirement: 5000
  },
  {
    id: 9,
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: '🚀',
    rarity: 'legendary',
    earned: true,
    earnedAt: '2024-01-01'
  }
];

const mockStats = {
  totalRedemptions: 45,
  totalPurchases: 67,
  totalSavings: 2847,
  reputationScore: 2500,
  currentTier: 'Gold',
  joinedDate: '2024-01-15',
  streakDays: 23,
  referrals: 8,
  groupDealsCompleted: 12,
  auctionsWon: 7,
  reviewsWritten: 32
};

export default function UserStats() {
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  const currentTierIndex = tiers.findIndex(t => t.name === mockStats.currentTier);
  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];
  const tierProgress = nextTier 
    ? ((mockStats.reputationScore - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
      rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    return colors[rarity as keyof typeof colors];
  };

  const earnedBadges = mockBadges.filter(b => b.earned);
  const unearnedBadges = mockBadges.filter(b => !b.earned);

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8 pt-4">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Your Stats & Achievements</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Track your progress and unlock exclusive badges
          </p>
        </div>

        {/* Current Tier */}
        <Card className="p-6 lg:p-8 mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentTier.color} flex items-center justify-center shadow-xl`}>
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{currentTier.name} Tier</h2>
                <Badge className="bg-primary text-white">
                  {mockStats.reputationScore} points
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(mockStats.joinedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress to {nextTier.name}</span>
                <span className="text-muted-foreground">
                  {mockStats.reputationScore} / {nextTier.minPoints} points
                </span>
              </div>
              <Progress value={tierProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {nextTier.minPoints - mockStats.reputationScore} points until next tier
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {currentTier.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card className="p-3 md:p-5 text-center">
            <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.totalPurchases}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Purchases</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Ticket className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.totalRedemptions}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Redeemed</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">${mockStats.totalSavings}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Savings</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.streakDays}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Streak</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.groupDealsCompleted}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Groups</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-cyan-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.auctionsWon}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Auctions</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Star className="w-6 h-6 md:w-8 md:h-8 text-pink-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.reviewsWritten}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Reviews</p>
          </Card>
          <Card className="p-3 md:p-5 text-center">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-500 mx-auto mb-1 md:mb-2" />
            <p className="text-xl md:text-3xl font-bold">{mockStats.referrals}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Referrals</p>
          </Card>
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Badges & Achievements</h2>
            <Badge variant="outline">
              {earnedBadges.length} / {mockBadges.length} Unlocked
            </Badge>
          </div>

          {/* Earned Badges */}
          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Unlocked Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {earnedBadges.map((badge) => (
                <Card
                  key={badge.id}
                  className="p-3 md:p-5 text-center cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="text-3xl md:text-5xl mb-2 md:mb-3">{badge.icon}</div>
                  <h4 className="text-sm md:text-base font-semibold mb-2">{badge.name}</h4>
                  <Badge className={getRarityColor(badge.rarity)} variant="outline">
                    {badge.rarity}
                  </Badge>
                  {badge.earnedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              Locked Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {unearnedBadges.map((badge) => (
                <Card
                  key={badge.id}
                  className="p-3 md:p-5 text-center cursor-pointer hover:shadow-lg transition-shadow opacity-60"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="text-3xl md:text-5xl mb-2 md:mb-3 grayscale">{badge.icon}</div>
                  <h4 className="text-sm md:text-base font-semibold mb-2">{badge.name}</h4>
                  <Badge className={getRarityColor(badge.rarity)} variant="outline">
                    {badge.rarity}
                  </Badge>
                  {badge.progress !== undefined && badge.requirement && (
                    <div className="mt-3">
                      <Progress 
                        value={(badge.progress / badge.requirement) * 100} 
                        className="h-2 mb-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {badge.progress} / {badge.requirement}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Tier Roadmap */}
        <Card className="p-6 lg:p-8">
          <h2 className="text-2xl font-bold mb-6">Tier Roadmap</h2>
          <div className="space-y-4">
            {tiers.map((tier, idx) => {
              const isUnlocked = mockStats.reputationScore >= tier.minPoints;
              const isCurrent = tier.name === mockStats.currentTier;
              
              return (
                <div key={tier.name} className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg ${!isUnlocked && 'opacity-40'}`}>
                    {isUnlocked ? (
                      <Crown className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      {isCurrent && (
                        <Badge className="bg-primary text-white">Current</Badge>
                      )}
                      {isUnlocked && !isCurrent && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Unlocked</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {tier.minPoints} reputation points required
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tier.benefits.map((benefit, bidx) => (
                        <Badge key={bidx} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBadge(null)}>
          <Card className="max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-7xl mb-4">{selectedBadge.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{selectedBadge.name}</h3>
              <Badge className={getRarityColor(selectedBadge.rarity)} variant="outline">
                {selectedBadge.rarity}
              </Badge>
              <p className="text-muted-foreground mt-4 mb-6">{selectedBadge.description}</p>
              
              {selectedBadge.earned ? (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-semibold">
                    ✓ Unlocked on {selectedBadge.earnedAt && new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : selectedBadge.progress !== undefined && selectedBadge.requirement ? (
                <div>
                  <Progress 
                    value={(selectedBadge.progress / selectedBadge.requirement) * 100} 
                    className="h-3 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.progress} / {selectedBadge.requirement} completed
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedBadge.requirement - selectedBadge.progress} more to unlock
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Complete the requirement to unlock this badge</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
