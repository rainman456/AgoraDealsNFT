import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Star,
  Users,
  Gift,
  Target,
  Activity,
  BarChart2,
  AlertCircle,
  Clock,
  Wallet,
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Download,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';

const reputationTiers = [
  { name: 'Bronze', min: 0, max: 100, color: 'from-orange-600 to-orange-400', icon: '🥉' },
  { name: 'Silver', min: 100, max: 500, color: 'from-gray-400 to-gray-300', icon: '🥈' },
  { name: 'Gold', min: 500, max: 1000, color: 'from-yellow-500 to-yellow-300', icon: '🥇' },
  { name: 'Platinum', min: 1000, max: 5000, color: 'from-cyan-400 to-blue-300', icon: '💎' },
  { name: 'Diamond', min: 5000, max: Infinity, color: 'from-purple-500 to-pink-400', icon: '👑' },
];

const badges = [
  { id: 'early-adopter', name: 'Early Adopter', icon: '🚀', description: 'Joined in the first month' },
  { id: 'deal-hunter', name: 'Deal Hunter', icon: '🎯', description: 'Claimed 10+ deals' },
  { id: 'social-butterfly', name: 'Social Butterfly', icon: '🦋', description: 'Shared 5+ deals' },
  { id: 'group-leader', name: 'Group Leader', icon: '👥', description: 'Completed 3 group deals' },
  { id: 'big-spender', name: 'Big Spender', icon: '💰', description: 'Spent $1000+' },
  { id: 'trader', name: 'Trader', icon: '📈', description: 'Sold 5+ coupons' },
];

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [freeTransactionsLeft, setFreeTransactionsLeft] = useState(3);
  const [stats, setStats] = useState({
    totalSaved: 2450,
    dealsRedeemed: 12,
    couponsOwned: 8,
    activeCoupons: 5,
    reputation: 450,
    groupDealsCompleted: 3,
    referrals: 5,
    totalSpent: 5200,
    averageSavings: 35,
    dealsShared: 8,
    reviewsWritten: 15,
    auctionsWon: 2,
    stakingRewards: 145.50,
  });

  const [expiringCoupons] = useState([
    { id: 1, title: '50% Off Pizza', merchant: 'Pizza Palace', expiresIn: '2 days' },
    { id: 2, title: '$20 Off Spa', merchant: 'Zen Spa', expiresIn: '5 days' },
  ]);

  const [activityData, setActivityData] = useState([
    { month: 'Jan', deals: 2, savings: 450 },
    { month: 'Feb', deals: 3, savings: 680 },
    { month: 'Mar', deals: 1, savings: 220 },
    { month: 'Apr', deals: 4, savings: 890 },
    { month: 'May', deals: 2, savings: 210 },
  ]);

  const currentTier = reputationTiers.find(
    (tier) => stats.reputation >= tier.min && stats.reputation < tier.max
  ) || reputationTiers[0];

  const nextTier = reputationTiers.find((tier) => tier.min > stats.reputation);
  const progressToNextTier = nextTier
    ? ((stats.reputation - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const userBadges = user?.badges?.map(b => b.id) || ['early-adopter', 'deal-hunter'];

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mockWalletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mockWalletAddress);
    toast.success('Wallet address copied to clipboard!');
  };

  const handleExportWallet = () => {
    toast.info('Wallet export initiated. Check your email for recovery instructions.');
  };

  const handleAddFunds = () => {
    setAddFundsOpen(true);
  };

  const handleConfirmAddFunds = () => {
    toast.success(`Successfully added $${fundAmount} to your wallet!`);
    setAddFundsOpen(false);
    setFundAmount('100');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-heading font-bold mb-2">{user?.name || 'User'}</h1>
                <p className="text-muted-foreground mb-4">{user?.email || user?.address}</p>

                {/* Wallet Section - Progressive Disclosure */}
                {advancedMode && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Wallet Address</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWalletDetails(!showWalletDetails)}
                      >
                        {showWalletDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {showWalletDetails && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">
                            {mockWalletAddress}
                          </code>
                          <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={handleExportWallet}>
                            <Download className="w-3 h-3 mr-1" />
                            Export Wallet
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://etherscan.io/address/${mockWalletAddress}`, '_blank')}>
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on Explorer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reputation Tier */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${currentTier.color} text-white font-semibold shadow-lg">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <span>{currentTier.name} Tier</span>
                </div>

                {nextTier && (
                  <div className="mt-4 max-w-md">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                      <span className="font-semibold">{stats.reputation} / {nextTier.min}</span>
                    </div>
                    <Progress value={progressToNextTier} className="h-3" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Saved */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  Lifetime
                </Badge>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                ${stats.totalSaved.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-muted-foreground">Avg per deal: ${Math.round(stats.totalSaved / stats.dealsRedeemed)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Coupons */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                {expiringCoupons.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {expiringCoupons.length} expiring
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1">
                {stats.activeCoupons}
              </p>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs text-muted-foreground">{stats.couponsOwned} total owned</p>
              </div>
            </CardContent>
          </Card>

          {/* Reputation Level */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl">{currentTier.icon}</span>
              </div>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                {stats.reputation}
              </p>
              <p className="text-sm text-muted-foreground">{currentTier.name} Tier</p>
              <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-muted-foreground">Rank: Top 15%</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Badge Progress */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {userBadges.length}/{badges.length}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                {Math.round((userBadges.length / badges.length) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Progress value={(userBadges.length / badges.length) * 100} className="flex-1 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Soon Warning */}
        {expiringCoupons.length > 0 && (
          <Card className="mb-8 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Coupons Expiring Soon
                  </h3>
                  <div className="space-y-3">
                    {expiringCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        <div>
                          <p className="font-semibold text-sm">{coupon.title}</p>
                          <p className="text-xs text-muted-foreground">{coupon.merchant}</p>
                        </div>
                        <Badge variant="destructive" className="animate-pulse">
                          {coupon.expiresIn}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => window.location.href = '/account'}>
                    View All Coupons
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={ShoppingBag}
            label="Deals Redeemed"
            value={stats.dealsRedeemed}
            color="text-blue-600"
          />
          <StatCard
            icon={Users}
            label="Group Deals"
            value={stats.groupDealsCompleted}
            color="text-indigo-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Referrals"
            value={stats.referrals}
            color="text-pink-600"
          />
          <StatCard
            icon={Star}
            label="Reviews"
            value={stats.reviewsWritten}
            color="text-yellow-600"
          />
          <StatCard
            icon={Target}
            label="Auctions Won"
            value={stats.auctionsWon}
            color="text-green-600"
          />
          <StatCard
            icon={Activity}
            label="Deals Shared"
            value={stats.dealsShared}
            color="text-purple-600"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart2 /> Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity /> Activity
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award /> Badges
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Target /> Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet & Payment Section */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="text-primary" />
                    Wallet & Payments
                  </CardTitle>
                  <CardDescription>Manage your funds and payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Funds - Fiat On-Ramp */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">Add Funds</span>
                      </div>
                      <Badge className="bg-blue-600">Instant</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add money using credit card, debit card, or bank transfer
                    </p>
                    <Button onClick={handleAddFunds} className="w-full" size="lg">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                  </div>

                  {/* Sponsored Transactions */}
                  {freeTransactionsLeft > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700 dark:text-green-400">Free Transactions</span>
                        </div>
                        <Badge className="bg-green-600 animate-pulse">
                          {freeTransactionsLeft} left
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your next {freeTransactionsLeft} transactions are free! No fees applied.
                      </p>
                    </div>
                  )}

                  {/* Advanced Mode Toggle */}
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="advanced-mode" className="font-semibold cursor-pointer">
                          Advanced Mode
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Show wallet address, transaction history, and blockchain details
                        </p>
                      </div>
                      <Switch
                        id="advanced-mode"
                        checked={advancedMode}
                        onCheckedChange={setAdvancedMode}
                      />
                    </div>
                  </div>

                  {/* Educational Content - Progressive Disclosure */}
                  {advancedMode && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">About Your Wallet</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Your wallet is secured by industry-standard encryption. You can export your wallet for use in other apps.
                          </p>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            Learn about NFTs & Blockchain →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Spending Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="text-green-600" />
                    Spending Overview
                  </CardTitle>
                  <CardDescription>Your financial activity summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Spent</span>
                    <span className="text-xl font-bold text-green-600">
                      ${stats.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Saved</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${stats.totalSaved.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-gray-600">Average Savings</span>
                    <span className="text-xl font-bold text-purple-600">
                      {stats.averageSavings}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-600">{advancedMode ? 'Staking Rewards' : 'Rewards Earned'}</span>
                    <span className="text-xl font-bold text-orange-600">
                      ${stats.stakingRewards.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Full Width Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Engagement Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-blue-600" />
                    Engagement Stats
                  </CardTitle>
                  <CardDescription>Your platform activity metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="text-blue-600" />
                      <span className="text-sm text-gray-600">Deals Redeemed</span>
                    </div>
                    <span className="text-lg font-bold">{stats.dealsRedeemed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-purple-600" />
                      <span className="text-sm text-gray-600">Deals Shared</span>
                    </div>
                    <span className="text-lg font-bold">{stats.dealsShared}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-600" />
                      <span className="text-sm text-gray-600">Reviews Written</span>
                    </div>
                    <span className="text-lg font-bold">{stats.reviewsWritten}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="text-green-600" />
                      <span className="text-sm text-gray-600">Auctions Won</span>
                    </div>
                    <span className="text-lg font-bold">{stats.auctionsWon}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="text-primary" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Your monthly deal activity and savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityData.map((data, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <p className="text-sm font-semibold text-gray-600">{data.month}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Deals Claimed</span>
                          <Badge variant="secondary">{data.deals}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Savings</span>
                          <span className="font-bold text-green-600">
                            ${data.savings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Progress
                          value={(data.savings / 1000) * 100}
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {activityData.reduce((sum, d) => sum + d.deals, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Deals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ${activityData.reduce((sum, d) => sum + d.savings, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Savings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-primary" />
                  Your Badges ({userBadges.length}/{badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => {
                    const isEarned = userBadges.includes(badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: isEarned ? 1.05 : 1 }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isEarned
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-muted bg-muted/20 opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{badge.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                            {isEarned && (
                              <Badge variant="secondary" className="mt-2">
                                Earned
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-primary" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AchievementItem
                    title="First Deal Claimed"
                    description="You claimed your first deal!"
                    date="2 days ago"
                    icon="🎉"
                  />
                  <AchievementItem
                    title="Group Deal Master"
                    description="Completed your first group deal"
                    date="1 week ago"
                    icon="👥"
                  />
                  <AchievementItem
                    title="Marketplace Seller"
                    description="Listed your first coupon for sale"
                    date="2 weeks ago"
                    icon="💼"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Funds Modal */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Add money to your wallet using credit card, debit card, or bank transfer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Secure Payment</p>
                  <p>Your payment information is encrypted and secure. Funds will be available instantly.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFundsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddFunds}>
              <CreditCard className="w-4 h-4 mr-2" />
              Add ${fundAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-4 text-center">
      <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const AchievementItem: React.FC<{
  title: string;
  description: string;
  date: string;
  icon: string;
}> = ({ title, description, date, icon }) => (
  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
    <span className="text-3xl">{icon}</span>
    <div className="flex-1">
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-1">{description}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
  </div>
);
