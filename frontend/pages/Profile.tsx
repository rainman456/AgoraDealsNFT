import { useState, useEffect } from 'react';
import { User, Settings, Heart, Clock, Trophy, AlertCircle, TrendingUp, Eye, EyeOff, Copy, Wallet, ExternalLink, Award, Sparkles, Gift, Zap, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavingsCalculator } from '@/components/shared/SavingsCalculator';
import DealCard from '@/components/shared/DealCard';
import { promotionsAPI, couponsAPI, userStatsAPI, badgesAPI, stakingAPI, Promotion } from '@/lib/api';
import { FiatOnRamp } from '@/components/wallet/FiatOnRamp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('savings');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFiatOnRamp, setShowFiatOnRamp] = useState(false);
  const [savedDeals, setSavedDeals] = useState<Promotion[]>([]);
  const [redeemedDeals, setRedeemedDeals] = useState<Promotion[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [stakingInfo, setStakingInfo] = useState<any>(null);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [loadingStaking, setLoadingStaking] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.walletAddress) {
        setLoadingDeals(false);
        return;
      }

      try {
        // Fetch user stats
        const statsResponse = await userStatsAPI.getUserStats(user.walletAddress);
        if (statsResponse.success) {
          setUserStats(statsResponse.data);
        }

        // Fetch user's coupons
        const couponsResponse = await couponsAPI.getMyCoupons(user.walletAddress);
        if (couponsResponse.success) {
          setMyCoupons(couponsResponse.data);
        }

        // Fetch deals for display
        setLoadingDeals(true);
        const dealsResponse = await promotionsAPI.list({ isActive: true, limit: 12 });
        if (dealsResponse.success && dealsResponse.data?.promotions && Array.isArray(dealsResponse.data.promotions)) {
          setSavedDeals(dealsResponse.data.promotions.slice(0, 6));
          setRedeemedDeals(dealsResponse.data.promotions.slice(6, 12));
        } else {
          setSavedDeals([]);
          setRedeemedDeals([]);
        }
        setLoadingDeals(false);

        // Fetch user badges
        setLoadingBadges(true);
        const badgesResponse = await badgesAPI.getUserBadges(user.walletAddress);
        if (badgesResponse.success) {
          setBadges(badgesResponse.data?.badges || badgesResponse.data || []);
        } else {
          setBadges([]);
        }
        setLoadingBadges(false);

        // Fetch staking info
        setLoadingStaking(true);
        const stakingResponse = await stakingAPI.getUserStakes(user.walletAddress);
        if (stakingResponse.success) {
          setStakingInfo(stakingResponse.data);
        }
        setLoadingStaking(false);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setLoadingBadges(false);
        setLoadingStaking(false);
        setLoadingDeals(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  const walletAddress = user?.walletAddress || '';
  const walletBalance = localStorage.getItem('wallet_balance') || '0.00';
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showAdvancedWallet, setShowAdvancedWallet] = useState(false);
  
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied! 📋",
      description: "Wallet address copied to clipboard",
    });
  };

  const viewOnExplorer = () => {
    const explorerUrl = `https://explorer.solana.com/address/${walletAddress}?cluster=custom&customUrl=http://localhost:8899`;
    window.open(explorerUrl, '_blank');
  };

  const handleShare = async () => {
    const shareText = `I just saved $2,847 with amazing deals! Join me and start saving today 🎉`;
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my savings!',
          text: shareText,
          url: shareUrl
        });
        toast({
          title: "Thanks for sharing! 🎉",
          description: "You earned 10 bonus points",
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share with your friends to earn rewards",
      });
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Badge Celebration Overlay */}
      {showBadgeCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 max-w-md mx-4 text-center shadow-2xl animate-bounce-in">
            <div className="text-8xl mb-6 animate-pulse-slow">🏆</div>
            <h2 className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              New Badge Unlocked!
            </h2>
            <p className="text-xl font-bold mb-2">Super Saver</p>
            <p className="text-muted-foreground mb-6">You've saved over $2,000! Keep it up!</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowBadgeCelebration(false)}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
              >
                Awesome!
              </Button>
              <Button
                onClick={() => {
                  setShowBadgeCelebration(false);
                  handleShare();
                }}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Profile Header - Mobile Optimized */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black mb-1">{user?.name || user?.email || 'Welcome!'}</h1>
                <p className="text-sm md:text-base font-semibold text-muted-foreground">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border-0 font-bold">
                    <Trophy className="w-3 h-3 mr-1" />
                    Level 12
                  </Badge>
                  <Badge className="bg-accent/10 text-accent border-0 font-bold">
                    Super Saver
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={handleShare}
                className="flex-1 md:flex-initial bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 font-bold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" className="flex-1 md:flex-initial">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Next Badge Progress - Collectible Feel */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-black">Next Badge: Elite Saver 🏆</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Unlock exclusive perks & rewards!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl md:text-2xl font-black text-primary">320</p>
                  <p className="text-xs text-muted-foreground">/500 XP</p>
                </div>
              </div>
              <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden shadow-inner mb-2">
                <div className="h-full bg-gradient-to-r from-primary via-accent to-primary w-[64%] transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-bold text-primary">🎯 180 XP to unlock!</p>
                <p className="text-xs md:text-sm font-semibold text-muted-foreground">64% complete</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Soon Warning - Mobile Friendly */}
        <Card className="mb-6 border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-bold text-orange-900 dark:text-orange-100 mb-1">
                  Expiring Soon!
                </h3>
                <p className="text-xs md:text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                  You have <span className="font-black">3 deals</span> expiring in the next 48 hours
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 border-0 text-xs">
                    Spa Day - 1d left
                  </Badge>
                  <Badge className="bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 border-0 text-xs">
                    Pizza Deal - 2d left
                  </Badge>
                  <Badge className="bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 border-0 text-xs">
                    Gym Pass - 2d left
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
            <CardContent className="p-4 md:p-6">
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Savings</p>
              <p className="text-3xl md:text-4xl font-black text-blue-900 dark:text-blue-100">$2,847</p>
              <Button
                onClick={handleShare}
                variant="ghost"
                className="mt-3 w-full text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Success
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
            <CardContent className="p-4 md:p-6">
              <Heart className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Saved Deals</p>
              <p className="text-3xl md:text-4xl font-black text-green-900 dark:text-green-100">{savedDeals.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30">
            <CardContent className="p-4 md:p-6">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-3" />
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Redeemed</p>
              <p className="text-3xl md:text-4xl font-black text-yellow-900 dark:text-yellow-100">{redeemedDeals.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Mobile Optimized */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="savings" className="text-xs md:text-sm">
              <Trophy className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Savings</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs md:text-sm">
              <Heart className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">
              <Clock className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs md:text-sm">
              <Award className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="staking" className="text-xs md:text-sm">
              <Wallet className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Wallet</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="savings">
            <SavingsCalculator />
          </TabsContent>

          <TabsContent value="saved">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-black">Your Saved Deals</h2>
                {savedDeals.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-0 font-bold">
                    {savedDeals.length} deals
                  </Badge>
                )}
              </div>
              
              {loadingDeals ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[16/10] bg-muted" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : savedDeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {savedDeals.map((deal) => (
                    <DealCard
                      key={deal._id}
                      deal={deal}
                      onClaim={() => {}}
                      onLike={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/20">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
                    <Heart className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-3">No Saved Deals Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start saving on amazing deals! Tap the heart icon on any deal to save it here.
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90">
                    <Gift className="w-4 h-4 mr-2" />
                    Browse Deals
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-black">Redeemed Deals</h2>
                {redeemedDeals.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 border-0 font-bold">
                    {redeemedDeals.length} redeemed
                  </Badge>
                )}
              </div>
              
              {loadingDeals ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[16/10] bg-muted" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : redeemedDeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {redeemedDeals.map((deal) => (
                    <div key={deal._id} className="relative">
                      <DealCard
                        deal={deal}
                        onClaim={() => {}}
                        onLike={() => {}}
                      />
                      <Badge className="absolute top-4 right-4 bg-green-500 text-white border-0 font-bold shadow-lg">
                        ✓ Redeemed
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/20">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
                    <Clock className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-3">No Redeemed Deals Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Claim your first deal and start saving! Your redeemed deals will appear here.
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90">
                    <Zap className="w-4 h-4 mr-2" />
                    Find Deals
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <div>
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-4xl font-black mb-2">Your Badge Collection 🏆</h2>
                <p className="text-sm md:text-base text-muted-foreground">Unlock exclusive perks and show off your achievements</p>
              </div>
              
              {loadingBadges ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground font-semibold">Loading your collection...</p>
                </div>
              ) : badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {badges.map((badge: any, index: number) => (
                    <Card
                      key={badge._id}
                      className="p-4 md:p-6 text-center bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg">
                        ✓
                      </div>
                      <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {badge.icon || '🏆'}
                      </div>
                      <h3 className="font-black text-base md:text-lg mb-2 group-hover:text-primary transition-colors">
                        {badge.name}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-3">{badge.description}</p>
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-primary">
                          Earned {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      {badge.reward && (
                        <Badge className="mt-3 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0 font-bold text-xs">
                          {badge.reward}
                        </Badge>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/20">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
                      <Award className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black mb-3">Start Your Collection!</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Earn badges by completing activities and unlock exclusive rewards and perks
                    </p>
                    <Button
                      onClick={() => setShowBadgeCelebration(true)}
                      className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      See How It Works
                    </Button>
                  </Card>

                  {/* Available Badges to Earn */}
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-4">Available Badges</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {/* Badges would be loaded from API */}
                      {[].map((badge: any, i: number) => (
                        <Card key={i} className="p-3 md:p-4 text-center opacity-60 hover:opacity-100 transition-opacity border-dashed">
                          <div className="text-3xl md:text-4xl mb-2 grayscale">{badge.icon}</div>
                          <h4 className="font-bold text-xs md:text-sm mb-1">{badge.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badge.desc}</p>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent w-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{badge.progress}/{badge.total}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="staking">
            <div>
              <h2 className="text-2xl md:text-4xl font-black mb-6">Wallet & Rewards</h2>
              {loadingStaking ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading wallet info...</p>
                </div>
              ) : stakingInfo ? (
                <div className="space-y-6">
                  <Card className="p-4 md:p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                    <h3 className="text-lg md:text-xl font-bold mb-4">Staking Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Staked</p>
                        <p className="text-2xl font-bold">{stakingInfo.totalStaked || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rewards Earned</p>
                        <p className="text-2xl font-bold">{stakingInfo.rewardsEarned || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">APY</p>
                        <p className="text-2xl font-bold">{stakingInfo.apy || 0}%</p>
                      </div>
                    </div>
                  </Card>

                  {stakingInfo.stakedCoupons && stakingInfo.stakedCoupons.length > 0 && (
                    <Card className="p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-bold mb-4">Staked Coupons</h3>
                      <div className="space-y-3">
                        {stakingInfo.stakedCoupons.map((coupon: any) => (
                          <div key={coupon._id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                              <p className="font-semibold">{coupon.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Staked: {new Date(coupon.stakedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              Unstake
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/20">
                  <Wallet className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl md:text-2xl font-bold mb-2">No Wallet Activity</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Connect your wallet to start earning rewards and staking your deals
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <FiatOnRamp 
        isOpen={showFiatOnRamp} 
        onClose={() => setShowFiatOnRamp(false)}
      />
    </main>
  );
}
