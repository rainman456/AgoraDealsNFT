import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { stakingAPI } from '@/lib/api';
import {
  Coins, TrendingUp, Lock, Unlock, Gift, Zap,
  Clock, DollarSign, Percent, Award, ArrowUp, Calendar
} from 'lucide-react';

interface StakedCoupon {
  id: string;
  title: string;
  merchant: string;
  discount: number;
  stakedAmount: number;
  stakedAt: string;
  lockPeriod: number; // days
  unlockDate: string;
  rewardsEarned: number;
  apy: number;
  status: 'active' | 'unlocking' | 'unlocked';
}

interface RewardTier {
  days: number;
  apy: number;
  bonus: string;
}

const rewardTiers: RewardTier[] = [
  { days: 7, apy: 5, bonus: 'Early Bird' },
  { days: 30, apy: 12, bonus: 'Steady Saver' },
  { days: 90, apy: 25, bonus: 'Long Term' },
  { days: 180, apy: 40, bonus: 'Diamond Hands' }
];

export default function Staking() {
  const [stakedCoupons, setStakedCoupons] = useState<StakedCoupon[]>([]);
  const [stats, setStats] = useState({
    totalStaked: 0,
    totalRewards: 0,
    activeStakes: 0,
    averageAPY: 0,
    lifetimeRewards: 0
  });
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    try {
      setLoading(true);
      const walletAddress = localStorage.getItem('walletAddress') || '';
      
      if (!walletAddress || !walletAddress.trim()) {
        setStakedCoupons([]);
        setStats({
          totalStaked: 0,
          totalRewards: 0,
          activeStakes: 0,
          averageAPY: 0,
          lifetimeRewards: 0
        });
        setLoading(false);
        return;
      }
      
      const response = await stakingAPI.getUserStakes(walletAddress.trim());
      setStakedCoupons(response.data?.stakedCoupons || []);
      setStats(response.data?.stats || {
        totalStaked: 0,
        totalRewards: 0,
        activeStakes: 0,
        averageAPY: 0,
        lifetimeRewards: 0
      });
    } catch (error) {
      console.error('Failed to load staking data:', error);
      toast({
        title: "Error",
        description: "Failed to load staking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (couponId: string) => {
    const coupon = stakedCoupons.find(c => c.id === couponId);
    if (!coupon) return;

    if (coupon.status !== 'unlocked') {
      toast({
        title: "Cannot Unstake",
        description: "This coupon is still in the lock period",
        variant: "destructive"
      });
      return;
    }

    try {
      const walletAddress = localStorage.getItem('walletAddress') || '';
      await stakingAPI.claimRewards({ userAddress: walletAddress, couponId });
      toast({
        title: "🎉 Unstaked Successfully!",
        description: `Claimed ${coupon.rewardsEarned.toFixed(2)} tokens in rewards`
      });
      setStakedCoupons(prev => prev.filter(c => c.id !== couponId));
      loadStakingData();
    } catch (error) {
      console.error('Failed to unstake:', error);
      toast({
        title: "Error",
        description: "Failed to unstake coupon",
        variant: "destructive"
      });
    }
  };

  const handleClaimRewards = async (couponId: string) => {
    const coupon = stakedCoupons.find(c => c.id === couponId);
    if (!coupon) return;

    try {
      const walletAddress = localStorage.getItem('walletAddress') || '';
      await stakingAPI.claimRewards({ walletAddress });
      toast({
        title: "💰 Rewards Claimed!",
        description: `Claimed ${coupon.rewardsEarned.toFixed(2)} tokens`
      });
      setStakedCoupons(prev => prev.map(c => 
        c.id === couponId ? { ...c, rewardsEarned: 0 } : c
      ));
      loadStakingData();
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive"
      });
    }
  };

  const getDaysRemaining = (unlockDate: string) => {
    const diff = new Date(unlockDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getStakingProgress = (stakedAt: string, lockPeriod: number) => {
    const start = new Date(stakedAt).getTime();
    const end = start + (lockPeriod * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Staking & Rewards</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Stake your coupons to earn passive rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-5 text-center">
            <Lock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">${stats.totalStaked}</p>
            <p className="text-xs text-muted-foreground">Total Staked</p>
          </Card>
          <Card className="p-5 text-center">
            <Gift className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">${stats.totalRewards.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Pending Rewards</p>
          </Card>
          <Card className="p-5 text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.activeStakes}</p>
            <p className="text-xs text-muted-foreground">Active Stakes</p>
          </Card>
          <Card className="p-5 text-center">
            <Percent className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.averageAPY}%</p>
            <p className="text-xs text-muted-foreground">Avg APY</p>
          </Card>
          <Card className="p-5 text-center">
            <Award className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">${stats.lifetimeRewards.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Lifetime Rewards</p>
          </Card>
        </div>

        {/* Staking Tiers */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Staking Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rewardTiers.map((tier) => (
              <Card
                key={tier.days}
                className={`p-5 cursor-pointer transition-all hover:shadow-lg ${
                  selectedTier?.days === tier.days ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{tier.days} Days</h3>
                  <Badge variant="outline" className="mb-3">{tier.bonus}</Badge>
                  <div className="text-3xl font-bold text-primary mb-1">{tier.apy}%</div>
                  <p className="text-xs text-muted-foreground">APY</p>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            💡 Longer lock periods earn higher rewards. Choose wisely!
          </p>
        </Card>

        {/* Active Stakes */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Staked Coupons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stakedCoupons.map((coupon) => {
              const daysRemaining = getDaysRemaining(coupon.unlockDate);
              const progress = getStakingProgress(coupon.stakedAt, coupon.lockPeriod);
              const isUnlocked = coupon.status === 'unlocked';

              return (
                <Card key={coupon.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{coupon.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {typeof coupon.merchant === 'string' 
                          ? coupon.merchant 
                          : (coupon.merchant?.businessName || coupon.merchant?.name || 'Merchant')}
                      </p>
                    </div>
                    <Badge className={isUnlocked ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}>
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </Badge>
                  </div>

                  {/* Staking Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Staked Amount</p>
                      <p className="text-lg font-bold">${coupon.stakedAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">APY</p>
                      <p className="text-lg font-bold text-primary">{coupon.apy}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rewards Earned</p>
                      <p className="text-lg font-bold text-green-600">${coupon.rewardsEarned.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lock Period</p>
                      <p className="text-lg font-bold">{coupon.lockPeriod} days</p>
                    </div>
                  </div>

                  {/* Progress */}
                  {!isUnlocked && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Unlock Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {daysRemaining} days remaining
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Unlock Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {isUnlocked 
                        ? `Unlocked on ${new Date(coupon.unlockDate).toLocaleDateString()}`
                        : `Unlocks on ${new Date(coupon.unlockDate).toLocaleDateString()}`
                      }
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {coupon.rewardsEarned > 0 && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleClaimRewards(coupon.id)}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Claim ${coupon.rewardsEarned.toFixed(2)}
                      </Button>
                    )}
                    <Button
                      className="flex-1"
                      disabled={!isUnlocked}
                      onClick={() => handleUnstake(coupon.id)}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      {isUnlocked ? 'Unstake' : 'Locked'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {stakedCoupons.length === 0 && (
            <Card className="p-12 text-center">
              <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Staked Coupons</h3>
              <p className="text-muted-foreground mb-4">
                Start staking your coupons to earn passive rewards
              </p>
              <Button>Browse Coupons to Stake</Button>
            </Card>
          )}
        </div>

        {/* How It Works */}
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-primary/5 to-accent/5">
          <h2 className="text-2xl font-bold mb-6 text-center">How Staking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">1. Choose Coupon</h3>
              <p className="text-sm text-muted-foreground">Select a coupon from your collection to stake</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">2. Lock Period</h3>
              <p className="text-sm text-muted-foreground">Choose your lock period (7-180 days)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">Accumulate rewards based on APY</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold mb-2">4. Claim & Unstake</h3>
              <p className="text-sm text-muted-foreground">Claim rewards and unstake after lock period</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-center">
              <strong>⚠️ Important:</strong> Coupons cannot be used or transferred while staked. 
              Choose your lock period carefully!
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
