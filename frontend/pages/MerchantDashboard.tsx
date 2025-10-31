import { useState, useEffect } from 'react';
import { Plus, BarChart3, Users, DollarSign, TrendingUp, Ticket, QrCode, Edit, Pause, Play, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MerchantOnboarding } from '@/components/shared/MerchantOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { merchantDashboardAPI, promotionsAPI } from '@/lib/api';

const mockPromotions = [
  {
    id: '1',
    title: 'Gourmet Burger Combo',
    status: 'active',
    sold: 67,
    total: 100,
    revenue: 837.50,
    redemptions: 45,
  },
  {
    id: '2',
    title: 'Spa Day Package',
    status: 'active',
    sold: 89,
    total: 150,
    revenue: 6408,
    redemptions: 72,
  },
  {
    id: '3',
    title: 'Coffee & Pastry Deal',
    status: 'paused',
    sold: 156,
    total: 200,
    revenue: 936,
    redemptions: 143,
  },
];

export default function MerchantDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { merchant } = useAuth();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!merchant?.walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load analytics
        const analyticsResponse = await merchantDashboardAPI.getAnalytics(
          merchant.walletAddress,
          {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          }
        );
        
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.data);
        }

        // Load promotions
        const promotionsResponse = await promotionsAPI.list({
          merchantId: merchant._id,
          page: 1,
          limit: 50,
        });
        
        if (promotionsResponse.success) {
          setPromotions(promotionsResponse.data);
        } else {
          setPromotions(mockPromotions);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setPromotions(mockPromotions);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [merchant]);

  if (showOnboarding) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowOnboarding(false)}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <MerchantOnboarding />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black">Merchant Dashboard</h1>
              <p className="text-base lg:text-lg font-semibold text-muted-foreground">Manage your promotions and track performance</p>
            </div>
            <Button 
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="verify">Verify</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-8 h-8 text-primary" />
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                </div>
                <div className="text-2xl font-bold">312</div>
                <div className="text-sm text-muted-foreground">Total Coupons Created</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <QrCode className="w-8 h-8 text-chart-4" />
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                </div>
                <div className="text-2xl font-bold">260</div>
                <div className="text-sm text-muted-foreground">Redeemed</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-chart-2" />
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                </div>
                <div className="text-2xl font-bold">$8,181</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-chart-5" />
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                </div>
                <div className="text-2xl font-bold">83%</div>
                <div className="text-sm text-muted-foreground">Redemption Rate</div>
              </Card>
            </div>

            {/* Recent Redemptions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Recent Redemptions</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-white font-semibold">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div>
                        <div className="font-medium">Customer #{1000 + i}</div>
                        <div className="text-sm text-muted-foreground">Gourmet Burger Combo</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$12.50</div>
                      <div className="text-xs text-muted-foreground">{i}h ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-4">
            {mockPromotions.map((promo) => (
              <Card key={promo.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{promo.title}</h3>
                      <Badge className={promo.status === 'active' ? 'bg-chart-4' : 'bg-muted'}>
                        {promo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {promo.sold} / {promo.total} sold ({Math.round((promo.sold / promo.total) * 100)}%)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      {promo.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{promo.redemptions}</div>
                    <div className="text-xs text-muted-foreground">Redemptions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">${promo.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round((promo.redemptions / promo.sold) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Redeem Rate</div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <QrCode className="w-24 h-24 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Scan Customer QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your device camera to scan and verify customer coupons
                  </p>
                </div>
                <Button size="lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  Open Scanner
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Manual Verification</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
                <Button className="w-full">Verify Code</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Performance Analytics</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Redemption Rate</span>
                    <span className="font-semibold">83%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-chart-4 to-chart-4 w-[83%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Customer Satisfaction</span>
                    <span className="font-semibold">4.8/5.0</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-chart-2 w-[96%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Revenue Goal</span>
                    <span className="font-semibold">$8,181 / $10,000</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-chart-2 to-chart-3 w-[82%]" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Peak Hours</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">12:00 PM - 2:00 PM</span>
                    <span className="font-semibold">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">6:00 PM - 8:00 PM</span>
                    <span className="font-semibold">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">3:00 PM - 5:00 PM</span>
                    <span className="font-semibold">Medium</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-4">Top Deals</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coffee & Pastry</span>
                    <span className="font-semibold">156 sold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spa Package</span>
                    <span className="font-semibold">89 sold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Burger Combo</span>
                    <span className="font-semibold">67 sold</span>
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
