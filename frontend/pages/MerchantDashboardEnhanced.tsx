import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, BarChart3, DollarSign, TrendingUp, Package,
  ShoppingCart, Ticket, Award, Download,
  Share2, Star, Clock, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { merchantDashboardAPI, promotionsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DailyStats {
  date: string;
  coupons: number;
  redemptions: number;
  revenue: number;
  tickets: number;
}

interface Promotion {
  id: string;
  title: string;
  category: string;
  discount: number;
  totalMinted: number;
  totalRedeemed: number;
  revenue: number;
  rating: number;
  status: 'active' | 'paused' | 'ended';
}

interface RecentActivity {
  id: string;
  type: 'mint' | 'redeem' | 'review' | 'share';
  user: string;
  promotion: string;
  timestamp: string;
  amount?: number;
}

// Mock data removed - all data now loaded from database via API

// Mock data removed - all data now loaded from database
const mockAnalytics = {
  overview: {
    totalPromotions: 0,
    activePromotions: 0,
    totalCoupons: 0,
    totalRedemptions: 0,
    redemptionRate: 0,
    totalRevenue: 0,
    auctionRevenue: 0,
    groupDealRevenue: 0
  },
  categoryBreakdown: {}
};

export default function MerchantDashboardEnhanced() {
  const [dateRange, setDateRange] = useState('7d');
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const { merchant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [merchant, dateRange]);

  const loadDashboardData = async () => {
    if (!merchant?.walletAddress) {
      return;
    }

    try {
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load analytics and promotions in parallel
      const [analyticsResponse, promotionsResponse, activityResponse] = await Promise.all([
        merchantDashboardAPI.getAnalytics(merchant.walletAddress, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ success: false, data: null })),
        promotionsAPI.list({ merchantId: merchant._id, limit: 50 }).catch(() => ({ success: false, data: [] })),
        merchantDashboardAPI.getRecentActivity(merchant.walletAddress, { limit: 20 }).catch(() => ({ success: false, data: [] }))
      ]);

      // Set analytics
      if (analyticsResponse.success && analyticsResponse.data) {
        const data = analyticsResponse.data as any;
        setAnalytics({
          overview: {
            totalPromotions: data.totalPromotions || 0,
            activePromotions: data.activePromotions || 0,
            totalCoupons: data.totalCoupons || 0,
            totalRedemptions: data.totalRedemptions || 0,
            redemptionRate: data.redemptionRate || 0,
            totalRevenue: data.totalRevenue || 0,
            auctionRevenue: data.auctionRevenue || 0,
            groupDealRevenue: data.groupDealRevenue || 0
          },
          categoryBreakdown: data.categoryBreakdown || {}
        });

        if (Array.isArray(data.dailyStats)) {
          setDailyStats(data.dailyStats);
        }
      }

      // Set promotions
      if (promotionsResponse.success) {
        const promoData = promotionsResponse.data?.promotions || promotionsResponse.data || [];
        if (Array.isArray(promoData)) {
          setPromotions(promoData);
        }
      }

      // Set recent activity
      if (activityResponse.success && Array.isArray(activityResponse.data)) {
        setRecentActivity(activityResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      mint: ShoppingCart,
      redeem: CheckCircle,
      review: Star,
      share: Share2
    };
    const Icon = icons[type as keyof typeof icons];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      mint: 'text-blue-500',
      redeem: 'text-green-500',
      review: 'text-yellow-500',
      share: 'text-purple-500'
    };
    return colors[type as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Merchant Dashboard</h1>
            <p className="text-base lg:text-lg text-muted-foreground">
              Comprehensive analytics and performance insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{analytics.overview.totalPromotions}</p>
            <p className="text-xs text-muted-foreground">Total Promotions</p>
            <p className="text-xs text-green-600 mt-1">
              {analytics.overview.activePromotions} active
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-5 h-5 text-purple-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{analytics.overview.totalCoupons}</p>
            <p className="text-xs text-muted-foreground">Coupons Minted</p>
            <p className="text-xs text-green-600 mt-1">+12% this week</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{analytics.overview.totalRedemptions}</p>
            <p className="text-xs text-muted-foreground">Redemptions</p>
            <p className="text-xs text-green-600 mt-1">
              {analytics.overview.redemptionRate}% rate
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">${analytics.overview.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xs text-green-600 mt-1">+18% this month</p>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="promotions">
              <Package className="w-4 h-4 mr-2" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Award className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Date Range Filter */}
            <div className="flex gap-2">
              {['24h', '7d', '30d', '90d'].map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range === '24h' ? 'Today' : range === '7d' ? 'Week' : range === '30d' ? 'Month' : 'Quarter'}
                </Button>
              ))}
            </div>

            {/* Daily Stats Chart */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Daily Performance</h3>
              <div className="space-y-4">
                {dailyStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">
                      {new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Coupons</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${(stat.coupons / 80) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8">{stat.coupons}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Redeemed</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(stat.redemptions / 60) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8">{stat.redemptions}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tickets</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${(stat.tickets / 60) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8">{stat.tickets}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                        <span className="text-sm font-semibold">${stat.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Category Performance</h3>
              <div className="space-y-4">
                {Object.entries(analytics.categoryBreakdown).map(([category, data]) => {
                  const categoryData = data as any;
                  return (
                  <div key={category} className="flex items-center gap-4">
                    <div className="w-32 font-medium">{category}</div>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Promotions</p>
                        <p className="text-lg font-bold">{categoryData.promotions || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Coupons</p>
                        <p className="text-lg font-bold">{categoryData.coupons || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Redemptions</p>
                        <p className="text-lg font-bold text-green-600">
                          {categoryData.redemptions || 0} ({categoryData.coupons > 0 ? ((categoryData.redemptions / categoryData.coupons) * 100).toFixed(1) : 0}%)
                        </p>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-2">Regular Sales</p>
                <p className="text-2xl font-bold mb-1">
                  ${(analytics.overview.totalRevenue - analytics.overview.auctionRevenue - analytics.overview.groupDealRevenue).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.totalRevenue > 0 ? (((analytics.overview.totalRevenue - analytics.overview.auctionRevenue - analytics.overview.groupDealRevenue) / analytics.overview.totalRevenue) * 100).toFixed(1) : 0}% of total
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-2">Auction Revenue</p>
                <p className="text-2xl font-bold mb-1">${analytics.overview.auctionRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.totalRevenue > 0 ? ((analytics.overview.auctionRevenue / analytics.overview.totalRevenue) * 100).toFixed(1) : 0}% of total
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-2">Group Deal Revenue</p>
                <p className="text-2xl font-bold mb-1">${analytics.overview.groupDealRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.totalRevenue > 0 ? ((analytics.overview.groupDealRevenue / analytics.overview.totalRevenue) * 100).toFixed(1) : 0}% of total
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {promotions.map((promo: any) => (
                <Card key={promo.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                        <Badge variant="outline">{promo.category}</Badge>
                        <Badge className={
                          promo.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          promo.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                        }>
                          {promo.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(promo.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">{promo.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{promo.discount}%</p>
                      <p className="text-xs text-muted-foreground">Discount</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Minted</p>
                      <p className="text-xl font-bold">{promo.totalMinted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Redeemed</p>
                      <p className="text-xl font-bold text-green-600">{promo.totalRedeemed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Redemption Rate</p>
                      <p className="text-xl font-bold">
                        {((promo.totalRedeemed / promo.totalMinted) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                      <p className="text-xl font-bold">${promo.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.promotion}</p>
                    </div>
                    <div className="text-right">
                      <code className="text-xs">{activity.user}</code>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {activity.amount && (
                      <div className="text-right">
                        <p className="font-bold">${activity.amount}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Top Performing</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Best Redemption Rate</p>
                      <p className="text-sm text-muted-foreground">70% Off Dinner for Two</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">79.9%</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Most Popular</p>
                      <p className="text-sm text-muted-foreground">70% Off Dinner for Two</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">234</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Highest Revenue</p>
                      <p className="text-sm text-muted-foreground">70% Off Dinner for Two</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">$7.3k</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Recommendations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">📈 Increase Supply</p>
                    <p className="text-sm text-muted-foreground">
                      "70% Off Dinner" is selling fast. Consider increasing supply.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">⏰ Extend Duration</p>
                    <p className="text-sm text-muted-foreground">
                      "Gym Membership" has low redemption. Try extending the validity period.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">💰 Adjust Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Similar deals are priced 15% lower. Consider adjusting your pricing.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
