import { useState, useEffect } from 'react';
import { TrendingUp, Share2, Coffee, Pizza, Plane, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { userStatsAPI, couponsAPI, redemptionTicketsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface MonthData {
  month: string;
  savings: number;
}

interface UserStats {
  totalPurchases: number;
  totalRedemptions: number;
  totalRatingsGiven: number;
  totalComments: number;
  reputationScore: string;
  tier: {
    value: any;
    name: string;
  };
  badges: Array<{ type: number; name: string }>;
}

interface Coupon {
  _id: string;
  price: number;
  promotion?: {
    originalPrice?: number;
    price: number;
    discountPercentage: number;
  };
  redeemedAt?: string;
  createdAt: string;
}

const AVERAGE_PRICES = {
  coffee: 5.5, // Starbucks latte
  pizza: 18, // Pizza delivery
  flight: 350, // Domestic flight
};

export function SavingsCalculator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [growthPercentage, setGrowthPercentage] = useState(0);

  useEffect(() => {
    if (user?.walletAddress) {
      loadUserData();
    }
  }, [user?.walletAddress]);

  const loadUserData = async () => {
    if (!user?.walletAddress) return;

    try {
      setLoading(true);

      // Fetch user stats and coupons in parallel
      const [statsResponse, couponsResponse] = await Promise.all([
        userStatsAPI.getUserStats(user.walletAddress).catch(() => ({ success: false, data: null })),
        couponsAPI.getMyCoupons(user.walletAddress).catch(() => ({ success: false, data: [] })),
      ]);

      // Set user stats
      if (statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
      }

      // Calculate savings from coupons
      if (couponsResponse.success && couponsResponse.data) {
        const coupons: Coupon[] = Array.isArray(couponsResponse.data.coupons) 
          ? couponsResponse.data.coupons 
          : couponsResponse.data;
        
        calculateSavings(coupons);
      } else {
        // No coupons, set empty data
        setMonthlyData(getEmptyMonthlyData());
        setTotalSavings(0);
        setGrowthPercentage(0);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load savings data');
      setMonthlyData(getEmptyMonthlyData());
      setTotalSavings(0);
    } finally {
      setLoading(false);
    }
  };

  const getEmptyMonthlyData = (): MonthData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({ month, savings: 0 }));
  };

  const calculateSavings = (coupons: Coupon[]) => {
    // Calculate total savings
    let total = 0;
    const monthlySavingsMap: Record<string, number> = {};

    coupons.forEach(coupon => {
      // Calculate savings per coupon
      let savings = 0;
      if (coupon.promotion?.originalPrice && coupon.promotion?.price) {
        savings = coupon.promotion.originalPrice - coupon.promotion.price;
      } else if (coupon.promotion?.discountPercentage && coupon.promotion?.price) {
        const originalPrice = coupon.promotion.price / (1 - coupon.promotion.discountPercentage / 100);
        savings = originalPrice - coupon.promotion.price;
      }

      total += savings;

      // Group by month
      const date = new Date(coupon.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySavingsMap[monthKey] = (monthlySavingsMap[monthKey] || 0) + savings;
    });

    setTotalSavings(total);

    // Get last 6 months of data
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months: MonthData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      
      last6Months.push({
        month: monthName,
        savings: Math.round(monthlySavingsMap[monthKey] || 0),
      });
    }

    setMonthlyData(last6Months);

    // Calculate growth percentage (compare last month to average of previous months)
    if (last6Months.length >= 2) {
      const lastMonth = last6Months[last6Months.length - 1].savings;
      const previousMonths = last6Months.slice(0, -1);
      const avgPrevious = previousMonths.reduce((sum, m) => sum + m.savings, 0) / previousMonths.length;
      
      if (avgPrevious > 0) {
        const growth = ((lastMonth - avgPrevious) / avgPrevious) * 100;
        setGrowthPercentage(Math.round(growth));
      }
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My DealForge Savings',
          text: `I've saved $${totalSavings.toLocaleString()} with DealForge! 🎉`,
          url: window.location.href
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    } finally {
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  const maxSavings = Math.max(...monthlyData.map(m => m.savings), 1);

  // Calculate comparison values
  const coffeeCount = Math.floor(totalSavings / AVERAGE_PRICES.coffee);
  const pizzaCount = Math.floor(totalSavings / AVERAGE_PRICES.pizza);
  const flightCount = Math.floor(totalSavings / AVERAGE_PRICES.flight);

  const comparisons = [
    { icon: Coffee, label: 'Starbucks lattes', value: coffeeCount, emoji: '☕' },
    { icon: Pizza, label: 'Pizza deliveries', value: pizzaCount, emoji: '🍕' },
    { icon: Plane, label: 'Flight tickets', value: flightCount, emoji: '✈️' }
  ];

  // Get tier level (extract number from tier name or use default)
  const tierLevel = userStats?.tier?.name || 'Bronze';
  const tierNumber = userStats ? Math.floor(parseInt(userStats.reputationScore) / 100) : 1;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-lime-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-lime-200 dark:border-lime-900 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-lime-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-lime-200 dark:border-lime-900 overflow-hidden">
      {/* Header with Big Number */}
      <div className="relative px-8 py-10 bg-gradient-to-r from-lime-500 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Total Savings</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold tracking-tight">
              ${totalSavings.toLocaleString()}
            </span>
            {growthPercentage !== 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 ${growthPercentage > 0 ? 'bg-white/20' : 'bg-red-500/20'} rounded-full backdrop-blur-sm`}>
                <TrendingUp className={`w-4 h-4 ${growthPercentage < 0 ? 'rotate-180' : ''}`} />
                <span className="text-sm font-semibold">{growthPercentage > 0 ? '+' : ''}{growthPercentage}%</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm opacity-90">Since joining DealForge</p>
        </div>

        <Button
          onClick={handleShare}
          className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {isSharing ? 'Shared!' : 'Share'}
        </Button>
      </div>

      {/* Chart */}
      <div className="px-8 py-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Trend</h3>
        <div className="flex items-end justify-between gap-3 h-48">
          {monthlyData.map((data, index) => {
            const height = maxSavings > 0 ? (data.savings / maxSavings) * 100 : 0;
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full group">
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10">
                    ${data.savings}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-700"></div>
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-lime-500 to-yellow-400 rounded-t-lg transition-all duration-500 hover:from-lime-600 hover:to-yellow-500 cursor-pointer shadow-lg"
                    style={{ 
                      height: `${Math.max(height, 2)}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparisons */}
      <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          That's equivalent to...
        </h3>
        <div className="space-y-3">
          {comparisons.map((comp, index) => (
            <div 
              key={comp.label}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-100 to-yellow-100 dark:from-lime-900/30 dark:to-yellow-900/30 flex items-center justify-center text-2xl">
                {comp.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {comp.value} {comp.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on average prices
                </p>
              </div>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                {comp.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-lime-500/10 to-yellow-500/10 rounded-xl border border-lime-200 dark:border-lime-800">
          <div className="text-4xl">🏆</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              {userStats ? `${tierLevel} Tier` : 'Getting Started'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userStats ? `${userStats.totalRedemptions} redemptions, ${userStats.badges.length} badges` : 'Start saving to unlock badges'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">Level {tierNumber}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userStats ? `${userStats.reputationScore} points` : 'No points yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
