import { useState, useEffect } from 'react';
import { Plus, BarChart3, Users, DollarSign, TrendingUp, Ticket, QrCode, Edit, Pause, Play, Store, Trash2, Sparkles, Gift, Zap, Heart, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MerchantOnboarding } from '@/components/shared/MerchantOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { merchantDashboardAPI, promotionsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const mockPromotions = [
  {
    id: '1',
    title: 'Gourmet Burger Combo',
    status: 'active',
    sold: 67,
    total: 100,
    revenue: 837.50,
    redemptions: 45,
    isActive: true,
  },
  {
    id: '2',
    title: 'Spa Day Package',
    status: 'active',
    sold: 89,
    total: 150,
    revenue: 6408,
    redemptions: 72,
    isActive: true,
  },
  {
    id: '3',
    title: 'Coffee & Pastry Deal',
    status: 'paused',
    sold: 156,
    total: 200,
    revenue: 936,
    redemptions: 143,
    isActive: false,
  },
];

export default function MerchantDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { merchant } = useAuth();
  const { toast } = useToast();

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

  const handleTogglePause = async (promotionId: string, isActive: boolean) => {
    try {
      setActionLoading(promotionId);
      
      if (isActive) {
        await promotionsAPI.pause(promotionId);
        toast({
          title: 'Deal Paused ⏸️',
          description: 'Your deal is now paused and hidden from customers',
        });
      } else {
        await promotionsAPI.resume(promotionId);
        toast({
          title: 'Deal Active! 🎉',
          description: 'Your deal is now live and visible to customers',
        });
      }
      
      // Reload promotions
      const promotionsResponse = await promotionsAPI.list({
        merchantId: merchant?._id,
        page: 1,
        limit: 50,
      });
      
      if (promotionsResponse.success) {
        setPromotions(promotionsResponse.data);
      }
    } catch (error) {
      console.error('Failed to toggle promotion:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to update deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(promotionId);
      await promotionsAPI.delete(promotionId);
      
      toast({
        title: 'Deal Deleted',
        description: 'Your deal has been removed successfully',
      });
      
      // Reload promotions
      const promotionsResponse = await promotionsAPI.list({
        merchantId: merchant?._id,
        page: 1,
        limit: 50,
      });
      
      if (promotionsResponse.success) {
        setPromotions(promotionsResponse.data);
      }
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (showOnboarding) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
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
      {/* Sticky Header - Mobile Optimized */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black">Merchant Hub 🏪</h1>
              <p className="text-sm md:text-base font-semibold text-muted-foreground">
                Manage deals & grow your business
              </p>
            </div>
            <Button 
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Create Deal</span>
              <span className="md:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid mb-6">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="text-xs md:text-sm">
              <Gift className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Deals</span>
            </TabsTrigger>
            <TabsTrigger value="verify" className="text-xs md:text-sm">
              <QrCode className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm">
              <TrendingUp className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-black mb-2">
                      Welcome back! 👋
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      Your deals are performing great! Here's your snapshot for the last 30 days.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-100 text-green-800 border-0 font-bold">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +23% vs last month
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border-0 font-bold">
                        <Users className="w-3 h-3 mr-1" />
                        260 happy customers
                      </Badge>
                    </div>
                  </div>
                  <div className="hidden md:block text-6xl">📊</div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Ticket className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black">312</div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold">Deals Created</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black">260</div>
                  <div className="text-xs md:text-sm text-muted-foreground font-semibold">Redeemed</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-green-900 dark:text-green-100">$8,181</div>
                  <div className="text-xs md:text-sm text-green-700 dark:text-green-300 font-semibold">Revenue</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-blue-900 dark:text-blue-100">83%</div>
                  <div className="text-xs md:text-sm text-blue-700 dark:text-blue-300 font-semibold">Redeem Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Redemptions */}
            <Card className="border-2">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Recent Redemptions
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah M.', deal: 'Gourmet Burger Combo', amount: 12.50, time: '2h ago' },
                    { name: 'Mike R.', deal: 'Spa Day Package', amount: 72.00, time: '3h ago' },
                    { name: 'Emma L.', deal: 'Coffee & Pastry', amount: 6.00, time: '5h ago' },
                    { name: 'David K.', deal: 'Gourmet Burger Combo', amount: 12.50, time: '6h ago' },
                    { name: 'Lisa P.', deal: 'Spa Day Package', amount: 72.00, time: '8h ago' },
                  ].map((redemption, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                          {redemption.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-sm md:text-base">{redemption.name}</div>
                          <div className="text-xs md:text-sm text-muted-foreground">{redemption.deal}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm md:text-base">${redemption.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{redemption.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-yellow-800 dark:text-yellow-200">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">💡</span>
                    <span>Deals with photos get 3x more claims</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">💡</span>
                    <span>Limited-time offers create urgency and boost sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">💡</span>
                    <span>Respond to reviews to build customer trust</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-black">Your Deals</h2>
              {promotions.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-0 font-bold">
                  {promotions.length} active
                </Badge>
              )}
            </div>

            {(promotions.length > 0 ? promotions : mockPromotions).map((promo) => (
              <Card key={promo.id} className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold">{promo.title}</h3>
                        <Badge className={promo.isActive !== false ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
                          {promo.isActive !== false ? '✓ Active' : '⏸ Paused'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-semibold">
                          {promo.sold} / {promo.total} claimed
                        </span>
                        <span className="font-semibold">
                          ({Math.round((promo.sold / promo.total) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${(promo.sold / promo.total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleTogglePause(promo.id || promo._id, promo.isActive !== false)}
                        disabled={actionLoading === (promo.id || promo._id)}
                        className="flex-shrink-0"
                      >
                        {promo.isActive !== false ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDelete(promo.id || promo._id)}
                        disabled={actionLoading === (promo.id || promo._id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl md:text-2xl font-black">{promo.redemptions}</div>
                      <div className="text-xs text-muted-foreground font-semibold">Redeemed</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl md:text-2xl font-black">${promo.revenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-semibold">Revenue</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl md:text-2xl font-black">
                        {Math.round((promo.redemptions / promo.sold) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">Redeem Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {promotions.length === 0 && mockPromotions.length === 0 && (
              <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/20">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
                  <Gift className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-3">Create Your First Deal!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start attracting customers with amazing deals. It only takes a few minutes to set up.
                </p>
                <Button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Deal
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                  <QrCode className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black mb-2">Scan Customer QR Code</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Use your device camera to quickly verify customer deals
                  </p>
                </div>
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 font-bold">
                  <QrCode className="w-5 h-5 mr-2" />
                  Open Scanner
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4">Manual Verification</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter deal code (e.g., DEAL-1234)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                  />
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 font-bold py-6">
                    Verify Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-2">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg md:text-xl font-bold">Performance Analytics</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">Redemption Rate</span>
                      <span className="font-bold text-primary">83%</span>
                    </div>
                    <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent w-[83%] transition-all" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">Customer Satisfaction</span>
                      <span className="font-bold text-primary">4.8/5.0</span>
                    </div>
                    <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-600 w-[96%] transition-all" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">Revenue Goal</span>
                      <span className="font-bold text-primary">$8,181 / $10,000</span>
                    </div>
                    <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-[82%] transition-all" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Peak Hours
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">12:00 PM - 2:00 PM</span>
                      <Badge className="bg-red-100 text-red-800 border-0 font-bold">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">6:00 PM - 8:00 PM</span>
                      <Badge className="bg-red-100 text-red-800 border-0 font-bold">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">3:00 PM - 5:00 PM</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-0 font-bold">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Top Deals
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Coffee & Pastry</span>
                      <span className="font-bold">156 sold</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Spa Package</span>
                      <span className="font-bold">89 sold</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Burger Combo</span>
                      <span className="font-bold">67 sold</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
