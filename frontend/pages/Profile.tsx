import { useState, useEffect } from 'react';
import { User, Settings, Heart, Clock, Trophy, AlertCircle, TrendingUp, Eye, EyeOff, Copy, Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavingsCalculator } from '@/components/shared/SavingsCalculator';
import DealCard from '@/components/shared/DealCard';
import { promotionsAPI, couponsAPI, userStatsAPI, Promotion } from '@/lib/api';
import { FiatOnRamp } from '@/components/wallet/FiatOnRamp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('savings');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFiatOnRamp, setShowFiatOnRamp] = useState(false);
  const [savedDeals, setSavedDeals] = useState<Promotion[]>([]);
  const [redeemedDeals, setRedeemedDeals] = useState<Promotion[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.walletAddress) return;

      try {
        // Fetch user stats
        const statsResponse = await userStatsAPI.getStats(user.walletAddress);
        if (statsResponse.success) {
          setUserStats(statsResponse.data);
        }

        // Fetch user's coupons
        const couponsResponse = await couponsAPI.getMyCoupons(user.walletAddress);
        if (couponsResponse.success) {
          setMyCoupons(couponsResponse.data);
        }

        // Fetch deals for display
        const dealsResponse = await promotionsAPI.list({ isActive: true, limit: 12 });
        if (dealsResponse.success) {
          setSavedDeals(dealsResponse.data.slice(0, 6));
          setRedeemedDeals(dealsResponse.data.slice(6, 12));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
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
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const viewOnExplorer = () => {
    const explorerUrl = `https://explorer.solana.com/address/${walletAddress}?cluster=custom&customUrl=http://localhost:8899`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Profile Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-lime-500 to-yellow-500 flex items-center justify-center shadow-xl">
                <User className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <div>
                <h1 className="text-[32px] lg:text-[44px] font-black mb-2">John Doe</h1>
                <p className="text-lg lg:text-xl font-semibold text-muted-foreground">Member since Jan 2024</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Level 12</span>
                  </div>
                  <div className="px-3 py-1 bg-lime-100 dark:bg-lime-900/30 rounded-full">
                    <span className="text-sm font-semibold text-lime-700 dark:text-lime-300">Super Saver</span>
                  </div>
                </div>
                {/* Next Badge Progress */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-bold text-purple-900 dark:text-purple-100">Next Badge: Elite Saver</span>
                    </div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">320 / 500 XP</span>
                  </div>
                  <div className="h-2 bg-purple-200 dark:bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[64%] transition-all duration-500" />
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">180 XP to go!</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex-1 lg:flex-initial"
              >
                {showAdvanced ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                {showAdvanced ? 'Basic' : 'Advanced'}
              </Button>
              <Button variant="outline" size="lg" className="flex-1 lg:flex-initial">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl border-2 border-orange-300 dark:border-orange-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-orange-900 dark:text-orange-100 mb-1">Expiring Soon!</h3>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                You have <span className="font-black">3 deals</span> expiring in the next 48 hours
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 rounded-full font-semibold">Spa Day - 1d left</span>
                <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 rounded-full font-semibold">Pizza Deal - 2d left</span>
                <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 rounded-full font-semibold">Gym Pass - 2d left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Mode - Wallet Info */}
        {showAdvanced && (
          <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Wallet Details
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFiatOnRamp(true)}
              >
                Add Funds
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</label>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black">${walletBalance}</p>
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                {showAdvancedWallet && (
                  <p className="text-sm text-muted-foreground mt-1">≈ {(parseFloat(walletBalance) / 23.5).toFixed(4)} SOL</p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wallet Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-mono break-all">
                    {walletAddress || 'Not connected'}
                  </code>
                  {walletAddress && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAddress}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewOnExplorer}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wallet Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-background px-3 py-2 rounded-lg flex-1 break-all">
                    {walletAddress}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  💡 Your account is secured by your email login. You can export your recovery key in Settings → Security.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
            <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <p className="text-sm lg:text-base font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Savings</p>
            <p className="text-4xl lg:text-5xl font-black text-blue-900 dark:text-blue-100">$2,847</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-950/30 dark:to-lime-900/30 rounded-2xl border border-lime-200 dark:border-lime-800">
            <Heart className="w-8 h-8 text-lime-600 dark:text-lime-400 mb-3" />
            <p className="text-sm lg:text-base font-semibold text-lime-700 dark:text-lime-300 mb-1">Saved Deals</p>
            <p className="text-4xl lg:text-5xl font-black text-lime-900 dark:text-lime-100">{savedDeals.length}</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-800">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-3" />
            <p className="text-sm lg:text-base font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Redeemed</p>
            <p className="text-4xl lg:text-5xl font-black text-yellow-900 dark:text-yellow-100">{redeemedDeals.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-8">
            <TabsTrigger value="savings" className="text-sm lg:text-base">
              <Trophy className="w-4 h-4 mr-2" />
              Savings
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-sm lg:text-base">
              <Heart className="w-4 h-4 mr-2" />
              Saved Deals
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm lg:text-base">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="savings">
            <SavingsCalculator />
          </TabsContent>

          <TabsContent value="saved">
            <div>
              <h2 className="text-[28px] lg:text-[40px] font-black mb-6">Your Saved Deals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {savedDeals.map((deal) => (
                  <DealCard
                    key={deal._id}
                    deal={deal}
                    onClaim={() => {}}
                    onLike={() => {}}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div>
              <h2 className="text-[24px] lg:text-[32px] font-semibold mb-6">Redeemed Deals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {redeemedDeals.map((deal) => (
                  <div key={deal._id} className="relative">
                    <DealCard
                      deal={deal}
                      onClaim={() => {}}
                      onLike={() => {}}
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      Redeemed
                    </div>
                  </div>
                ))}
              </div>
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
