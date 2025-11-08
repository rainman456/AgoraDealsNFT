import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Star, 
  TrendingUp, 
  Crown, 
  Flame, 
  Target,
  Calendar,
  Sparkles,
  Medal,
  Heart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { badgesAPI, couponsAPI, userStatsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  earnedDate?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface CollectibleItem {
  id: string;
  image: string;
  title: string;
  merchant: string;
  discount: number;
  claimed: string;
}

// Legacy alias for backwards compatibility
type NFTGalleryItem = CollectibleItem;

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"achievements" | "nfts" | "stats">("achievements");
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    totalSavings: 0,
    dealsRedeemed: 0,
    streakDays: 0,
    reputation: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [nftGallery, setNftGallery] = useState<NFTGalleryItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      const walletAddress = user?.walletAddress || localStorage.getItem('walletAddress') || '';
      
      if (!walletAddress) {
        return;
      }

      // Load user stats, badges, and coupons in parallel
      const [statsResponse, badgesResponse, couponsResponse] = await Promise.all([
        userStatsAPI.getUserStats(walletAddress).catch(() => ({ success: false, data: null })),
        badgesAPI.getUserBadges(walletAddress).catch(() => ({ success: false, data: [] })),
        couponsAPI.getMyCoupons(walletAddress).catch(() => ({ success: false, data: [] }))
      ]);

      // Set user stats
      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data;
        setUserStats({
          level: Math.floor((stats.totalPurchases || 0) / 10) + 1,
          xp: (stats.totalPurchases || 0) * 100,
          nextLevelXp: (Math.floor((stats.totalPurchases || 0) / 10) + 1) * 1000,
          totalSavings: stats.totalSavings || 0,
          dealsRedeemed: stats.totalRedemptions || 0,
          streakDays: stats.streakDays || 0,
          reputation: stats.reputationScore || 0,
        });
      }

      // Set badges as achievements
      if (badgesResponse.success && Array.isArray(badgesResponse.data)) {
        const badgeAchievements: Achievement[] = badgesResponse.data.map((badge: any) => ({
          id: badge._id || badge.id,
          title: badge.name || badge.badgeType,
          description: badge.description || '',
          icon: Award,
          earned: true,
          earnedDate: badge.createdAt,
          rarity: badge.tier || 'common'
        }));
        setAchievements(badgeAchievements);
      }

      // Set coupons as NFT gallery
      if (couponsResponse.success && Array.isArray(couponsResponse.data)) {
        const nfts: NFTGalleryItem[] = couponsResponse.data.map((coupon: any) => ({
          id: coupon._id || coupon.id,
          image: coupon.promotion?.imageUrl || '',
          title: coupon.promotion?.title || 'Coupon',
          merchant: typeof coupon.promotion?.merchant === 'string' 
            ? coupon.promotion.merchant 
            : (coupon.promotion?.merchant?.businessName || 'Merchant'),
          discount: coupon.promotion?.discountPercentage || 0,
          claimed: coupon.createdAt || new Date().toISOString()
        }));
        setNftGallery(nfts);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-500 to-orange-500";
      case "epic":
        return "from-purple-500 to-pink-500";
      case "rare":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-500/50";
      case "epic":
        return "border-purple-500/50";
      case "rare":
        return "border-blue-500/50";
      default:
        return "border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-xl">
                  JD
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  {userStats.level}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  John <span className="neon-text">Doe</span>
                </h1>
                <p className="text-foreground/60 mb-4">Member since January 2024</p>

                {/* XP Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Level {userStats.level}</span>
                    <span className="text-foreground/60">{userStats.xp} / {userStats.nextLevelXp} XP</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 animate-shimmer"
                      style={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reputation */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(userStats.reputation)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{userStats.reputation}</span>
                  <span className="text-sm text-foreground/60">Reputation</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-success">${userStats.totalSavings}</div>
                  <div className="text-xs text-foreground/60">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{userStats.dealsRedeemed}</div>
                  <div className="text-xs text-foreground/60">Deals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-secondary flex items-center justify-center gap-1">
                    <Flame className="w-6 h-6" />
                    {userStats.streakDays}
                  </div>
                  <div className="text-xs text-foreground/60">Day Streak</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
          {[
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "nfts", label: "Collection", icon: Sparkles },
            { id: "stats", label: "Statistics", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Achievements</h2>
              <p className="text-foreground/60">
                {achievements.filter((a) => a.earned).length} of {achievements.length} unlocked
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <Card
                    key={achievement.id}
                    className={`p-6 transition-all duration-300 ${
                      achievement.earned
                        ? `border-2 ${getRarityBorder(achievement.rarity)} hover:shadow-xl hover:scale-105 cursor-pointer`
                        : "opacity-50 grayscale"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                          achievement.earned
                            ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} shadow-lg`
                            : "bg-muted"
                        }`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg">{achievement.title}</h3>
                          {achievement.earned && (
                            <Medal className="w-5 h-5 text-yellow-500 animate-bounce-slow" />
                          )}
                        </div>
                        <p className="text-sm text-foreground/60 mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              achievement.earned ? getRarityBorder(achievement.rarity) : ""
                            }`}
                          >
                            {achievement.rarity}
                          </Badge>
                          {achievement.earned && achievement.earnedDate && (
                            <span className="text-xs text-foreground/40 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(achievement.earnedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* NFT Collection Tab */}
        {activeTab === "nfts" && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Collection</h2>
              <p className="text-foreground/60">Showcase of your favorite claimed deals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nftGallery.map((nft) => (
                <Card
                  key={nft.id}
                  className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={nft.image}
                      alt={nft.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Discount Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-white px-3 py-2 rounded-full shadow-lg">
                      <span className="text-lg font-bold">{nft.discount}%</span>
                      <span className="text-xs ml-1">OFF</span>
                    </div>

                    {/* Merchant */}
                    <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
                      {nft.merchant}
                    </div>

                    {/* Favorite Icon */}
                    <button className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{nft.title}</h3>
                    <div className="flex items-center justify-between text-sm text-foreground/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(nft.claimed).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Claimed
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {nftGallery.length === 0 && (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Collection Yet</h3>
                <p className="text-foreground/60 mb-6">Start claiming deals to build your collection!</p>
                <Button>Browse Deals</Button>
              </Card>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Statistics</h2>
              <p className="text-foreground/60">Track your savings and activity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">${userStats.totalSavings}</div>
                    <div className="text-sm text-foreground/60">Total Savings</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{userStats.dealsRedeemed}</div>
                    <div className="text-sm text-foreground/60">Deals Redeemed</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">{userStats.streakDays}</div>
                    <div className="text-sm text-foreground/60">Day Streak</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-500">Level {userStats.level}</div>
                    <div className="text-sm text-foreground/60">Current Level</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Activity Chart Placeholder */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Savings Over Time</h3>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-foreground/40">Chart visualization coming soon</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
