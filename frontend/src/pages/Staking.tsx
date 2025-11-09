import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { TrendingUp, DollarSign, Clock, Lock, Unlock, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  lockPeriod: number; // in days
  minStake: number;
  maxStake: number;
  totalStaked: number;
  poolLimit: number;
  rewards: string[];
  icon: string;
}

interface UserStake {
  id: string;
  poolId: string;
  poolName: string;
  amount: number;
  stakedAt: string;
  unlocksAt: string;
  earnedRewards: number;
  apy: number;
  status: 'active' | 'unlocked' | 'withdrawn';
}

const stakingPools: StakingPool[] = [
  {
    id: 'pool-1',
    name: 'Flexible Staking',
    apy: 5,
    lockPeriod: 0,
    minStake: 100,
    maxStake: 10000,
    totalStaked: 45000,
    poolLimit: 100000,
    rewards: ['DEAL Tokens', 'Early Access'],
    icon: '🔓',
  },
  {
    id: 'pool-2',
    name: '30-Day Lock',
    apy: 12,
    lockPeriod: 30,
    minStake: 500,
    maxStake: 50000,
    totalStaked: 120000,
    poolLimit: 500000,
    rewards: ['DEAL Tokens', 'Exclusive Deals', 'Priority Support'],
    icon: '⏰',
  },
  {
    id: 'pool-3',
    name: '90-Day Lock',
    apy: 25,
    lockPeriod: 90,
    minStake: 1000,
    maxStake: 100000,
    totalStaked: 280000,
    poolLimit: 1000000,
    rewards: ['DEAL Tokens', 'VIP Deals', 'Exclusive Drops', 'Governance Rights'],
    icon: '🔒',
  },
  {
    id: 'pool-4',
    name: '180-Day Lock',
    apy: 40,
    lockPeriod: 180,
    minStake: 5000,
    maxStake: 500000,
    totalStaked: 450000,
    poolLimit: 2000000,
    rewards: ['DEAL Tokens', 'Premium VIP Access', 'Exclusive Drops', 'Governance Rights', 'Revenue Share'],
    icon: '💎',
  },
];

const mockUserStakes: UserStake[] = [
  {
    id: 's1',
    poolId: 'pool-2',
    poolName: '30-Day Lock',
    amount: 1000,
    stakedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    unlocksAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    earnedRewards: 4.93,
    apy: 12,
    status: 'active',
  },
  {
    id: 's2',
    poolId: 'pool-3',
    poolName: '90-Day Lock',
    amount: 5000,
    stakedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    unlocksAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    earnedRewards: 205.48,
    apy: 25,
    status: 'active',
  },
];

export const Staking: React.FC = () => {
  const [userStakes, setUserStakes] = useState<UserStake[]>(mockUserStakes);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  const totalStaked = userStakes
    .filter(s => s.status === 'active')
    .reduce((sum, stake) => sum + stake.amount, 0);

  const totalEarned = userStakes.reduce((sum, stake) => sum + stake.earnedRewards, 0);

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) {
      toast.error('Please select a pool and enter an amount');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (amount < selectedPool.minStake) {
      toast.error(`Minimum stake is $${selectedPool.minStake}`);
      return;
    }

    if (amount > selectedPool.maxStake) {
      toast.error(`Maximum stake is $${selectedPool.maxStake}`);
      return;
    }

    setIsStaking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newStake: UserStake = {
        id: `s${Date.now()}`,
        poolId: selectedPool.id,
        poolName: selectedPool.name,
        amount,
        stakedAt: new Date().toISOString(),
        unlocksAt: new Date(Date.now() + selectedPool.lockPeriod * 24 * 60 * 60 * 1000).toISOString(),
        earnedRewards: 0,
        apy: selectedPool.apy,
        status: 'active',
      };

      setUserStakes([...userStakes, newStake]);
      setStakeAmount('');
      setSelectedPool(null);
      toast.success('Tokens staked successfully!');
    } catch (error) {
      toast.error('Failed to stake tokens');
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    const stake = userStakes.find(s => s.id === stakeId);
    if (!stake) return;

    const now = new Date();
    const unlockDate = new Date(stake.unlocksAt);

    if (now < unlockDate) {
      toast.error('Stake is still locked. Early withdrawal will incur penalties.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserStakes(userStakes.map(s =>
        s.id === stakeId ? { ...s, status: 'withdrawn' as const } : s
      ));
      toast.success(`Unstaked ${stake.amount} DEAL + ${stake.earnedRewards.toFixed(2)} rewards`);
    } catch (error) {
      toast.error('Failed to unstake tokens');
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    const stake = userStakes.find(s => s.id === stakeId);
    if (!stake || stake.earnedRewards === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Claimed ${stake.earnedRewards.toFixed(2)} DEAL tokens!`);
      setUserStakes(userStakes.map(s =>
        s.id === stakeId ? { ...s, earnedRewards: 0 } : s
      ));
    } catch (error) {
      toast.error('Failed to claim rewards');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (unlockDate: string) => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    const diffMs = unlock.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Staking Pools
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stake your DEAL tokens to earn rewards and unlock exclusive benefits
            </p>
          </motion.div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalStaked.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Staked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalEarned.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStakes.filter(s => s.status === 'active').length}</p>
                  <p className="text-sm text-gray-600">Active Stakes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pools" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="pools">Staking Pools</TabsTrigger>
            <TabsTrigger value="mystakes">My Stakes</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stakingPools.map((pool, index) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{pool.icon}</span>
                          <div>
                            <CardTitle>{pool.name}</CardTitle>
                            <CardDescription>
                              {pool.lockPeriod === 0 ? 'No lock period' : `${pool.lockPeriod} days lock`}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600">
                          {pool.apy}% APY
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Pool Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Pool Capacity</span>
                          <span className="font-semibold">
                            ${pool.totalStaked.toLocaleString()} / ${pool.poolLimit.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={(pool.totalStaked / pool.poolLimit) * 100} />
                      </div>

                      {/* Stake Limits */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 mb-1">Min Stake</p>
                          <p className="font-bold">${pool.minStake.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 mb-1">Max Stake</p>
                          <p className="font-bold">${pool.maxStake.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Rewards */}
                      <div>
                        <p className="text-sm font-semibold mb-2">Rewards:</p>
                        <div className="flex flex-wrap gap-2">
                          {pool.rewards.map((reward, idx) => (
                            <Badge key={idx} variant="secondary">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Stake Form */}
                      {selectedPool?.id === pool.id ? (
                        <div className="space-y-3 pt-2 border-t">
                          <Label htmlFor={`stake-${pool.id}`}>Amount to Stake</Label>
                          <Input
                            id={`stake-${pool.id}`}
                            type="number"
                            placeholder={`Min: $${pool.minStake}`}
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            min={pool.minStake}
                            max={pool.maxStake}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleStake}
                              disabled={isStaking}
                              className="flex-1"
                            >
                              {isStaking ? 'Staking...' : 'Confirm Stake'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPool(null);
                                setStakeAmount('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedPool(pool)}
                          className="w-full"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Stake Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mystakes" className="space-y-6">
            {userStakes.filter(s => s.status === 'active').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">You don't have any active stakes</p>
                  <Button onClick={() => document.querySelector('[value="pools"]')?.dispatchEvent(new Event('click'))}>
                    Explore Staking Pools
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userStakes
                  .filter(s => s.status === 'active')
                  .map((stake, index) => (
                    <motion.div
                      key={stake.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{stake.poolName}</CardTitle>
                              <CardDescription>
                                Staked on {formatDate(stake.stakedAt)}
                              </CardDescription>
                            </div>
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                              {stake.apy}% APY
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Staked Amount</p>
                              <p className="text-lg font-bold text-purple-600">
                                ${stake.amount.toLocaleString()}
                              </p>
                            </div>

                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Earned Rewards</p>
                              <p className="text-lg font-bold text-green-600">
                                ${stake.earnedRewards.toFixed(2)}
                              </p>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Unlocks On</p>
                              <p className="text-sm font-bold text-blue-600">
                                {formatDate(stake.unlocksAt)}
                              </p>
                            </div>

                            <div className="p-3 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                              <p className="text-lg font-bold text-orange-600">
                                {getDaysRemaining(stake.unlocksAt)}
                              </p>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleClaimRewards(stake.id)}
                            disabled={stake.earnedRewards === 0}
                            className="flex-1"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Claim Rewards
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUnstake(stake.id)}
                            disabled={getDaysRemaining(stake.unlocksAt) > 0}
                            className="flex-1"
                          >
                            <Unlock className="w-4 h-4 mr-2" />
                            {getDaysRemaining(stake.unlocksAt) > 0 ? 'Locked' : 'Unstake'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
