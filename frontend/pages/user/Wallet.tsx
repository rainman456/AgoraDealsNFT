import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Gift, TrendingUp, Award, Clock, Sparkles, Grid3x3, List, Share2, QrCode, AlertCircle, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { couponsAPI, Coupon, Promotion } from "@/lib/api";

interface Transaction {
  id: string;
  type: "claim" | "redeem" | "gift" | "list" | "purchase";
  dealTitle: string;
  amount?: number;
  recipient?: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

export default function MyDeals() {
  const [activeTab, setActiveTab] = useState<"nfts" | "staking" | "profile">("nfts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakingYield] = useState(12.5);
  const [transactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMyCoupons();
  }, []);

  const loadMyCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = localStorage.getItem('user');
      if (!user) {
        setError('Please connect your wallet');
        return;
      }
      const userData = JSON.parse(user);
      const response = await couponsAPI.getMyCoupons(userData.walletAddress);
      setCoupons(response.data || []);
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
      setError(err.response?.data?.message || 'Failed to load your deals');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = (dealId: string) => {
    toast({
      title: "Share Deal",
      description: "Enter recipient email to share this deal",
    });
  };

  const handleGift = (dealId: string) => {
    toast({
      title: "Send as Gift",
      description: "Select recipient and confirm gift",
    });
  };

  const handleList = (dealId: string) => {
    toast({
      title: "List for Sale",
      description: "Your deal has been listed on the marketplace",
    });
  };

  const handleRedeem = (dealId: string) => {
    toast({
      title: "Ready to Redeem",
      description: "Show QR code to merchant to redeem this deal",
    });
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "claim": return <ArrowDownLeft className="w-4 h-4" />;
      case "purchase": return <ArrowDownLeft className="w-4 h-4" />;
      case "gift": return <Gift className="w-4 h-4" />;
      case "redeem": return <CheckCircle className="w-4 h-4" />;
      case "list": return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "claim": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "purchase": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "gift": return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      case "redeem": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
      case "list": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days <= 3) return { color: "text-destructive", bg: "bg-destructive/10", label: "Expires Soon!" };
    if (days <= 7) return { color: "text-warning", bg: "bg-warning/10", label: `${days} days left` };
    return { color: "text-success", bg: "bg-success/10", label: `${days} days left` };
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            My <span className="neon-text">Deals</span>
          </h1>
          <p className="text-foreground/60 text-lg">Your deals, rewards, and savings in one place</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
          {[
            { id: "nfts", label: "My Deals", icon: Sparkles },
            { id: "staking", label: "Rewards", icon: TrendingUp },
            { id: "profile", label: "Profile", icon: Award },
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

        {/* My Deals Tab */}
        {activeTab === "nfts" && (
          <div className="animate-slide-up">
            {/* Sub-tabs for Deals and History */}
            <Tabs defaultValue="deals" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="deals">My Deals</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>

              {/* Deals Content */}
              <TabsContent value="deals" className="mt-6">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Loading your deals...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center border-destructive/50">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error Loading Deals</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadMyCoupons}>Try Again</Button>
              </Card>
            )}

            {/* View Toggle & Stats */}
            {!loading && !error && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/30">
                  <span className="text-2xl font-bold">{coupons.length}</span>
                  <span className="text-sm ml-2">Active Deals</span>
                </div>
                <div className="bg-success/10 text-success px-4 py-2 rounded-lg border border-success/30">
                  <span className="text-2xl font-bold">
                    ${coupons.reduce((sum, c) => sum + ((c.promotion?.originalPrice || 0) - (c.promotion?.discountedPrice || 0)), 0).toFixed(0)}
                  </span>
                  <span className="text-sm ml-2">Total Savings</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Grid View */}
            {!loading && !error && viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => {
                  const promotion = coupon.promotion;
                  if (!promotion) return null;
                  const daysLeft = getDaysUntilExpiry(promotion.endDate);
                  const expiryStatus = getExpiryStatus(daysLeft);

                  return (
                    <Card key={coupon._id} className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-200 hover:shadow-xl group">
                      {/* Deal Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {promotion.imageUrl ? (
                          <img
                            src={promotion.imageUrl}
                            alt={promotion.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <Sparkles className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Discount Badge */}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-white px-3 py-1.5 rounded-full shadow-lg">
                          <span className="text-lg font-bold">{promotion.discountPercentage}%</span>
                          <span className="text-xs ml-1">OFF</span>
                        </div>

                        {/* Expiry Warning */}
                        <div className={`absolute top-3 left-3 ${expiryStatus.bg} ${expiryStatus.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm`}>
                          <Clock className="w-3 h-3" />
                          {expiryStatus.label}
                        </div>

                        {/* Merchant Badge */}
                        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
                          {promotion.merchant?.businessName || 'Merchant'}
                        </div>

                        {/* Redeemed Badge */}
                        {coupon.isRedeemed && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="bg-success text-white px-4 py-2 rounded-full font-bold">
                              ✓ REDEEMED
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{promotion.title}</h3>
                        <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{promotion.description}</p>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleList(coupon._id)}
                            className="w-full"
                            disabled={coupon.isRedeemed}
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            List
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRedeem(coupon._id)}
                            className="w-full bg-primary hover:bg-primary-dark"
                            disabled={coupon.isRedeemed}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Redeem
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {!loading && !error && viewMode === "list" && (
              <div className="space-y-4">
                {coupons.map((coupon) => {
                  const promotion = coupon.promotion;
                  if (!promotion) return null;
                  const daysLeft = getDaysUntilExpiry(promotion.endDate);
                  const expiryStatus = getExpiryStatus(daysLeft);

                  return (
                    <Card key={coupon._id} className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary/30">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        <div className="relative w-full md:w-48 aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0">
                          {promotion.imageUrl ? (
                            <img
                              src={promotion.imageUrl}
                              alt={promotion.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Sparkles className="w-12 h-12 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-sm font-bold">
                            {promotion.discountPercentage}% OFF
                          </div>
                          {coupon.isRedeemed && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="bg-success text-white px-4 py-2 rounded-full font-bold text-sm">
                                ✓ REDEEMED
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold mb-1">{promotion.title}</h3>
                              <p className="text-sm text-foreground/60">{promotion.merchant?.businessName || 'Merchant'}</p>
                            </div>
                            <div className={`${expiryStatus.bg} ${expiryStatus.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                              <Clock className="w-3 h-3" />
                              {expiryStatus.label}
                            </div>
                          </div>

                          <p className="text-foreground/70 mb-4">{promotion.description}</p>

                          <div className="flex items-center gap-3 flex-wrap">
                            <Button
                              size="lg"
                              onClick={() => handleRedeem(coupon._id)}
                              className="bg-primary hover:bg-primary-dark"
                              disabled={coupon.isRedeemed}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Redeem Now
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleList(coupon._id)}
                              disabled={coupon.isRedeemed}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              List for Sale
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleGift(coupon._id)}
                              disabled={coupon.isRedeemed}
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Gift
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && !error && coupons.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No deals yet</h3>
                <p className="text-foreground/60 mb-6">Start exploring and claim your first deal</p>
                <Button size="lg" className="bg-primary hover:bg-primary-dark" onClick={() => window.location.href = '/'}>
                  Browse Deals
                </Button>
              </Card>
            )}
            )}
            )}
              </TabsContent>

              {/* Transaction History Content */}
              <TabsContent value="history" className="mt-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Transaction History</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Last 30 days
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold capitalize">{transaction.type}</p>
                              {transaction.status === "completed" && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {transaction.status === "pending" && (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              )}
                              {transaction.status === "failed" && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {transaction.dealTitle}
                            </p>
                            {transaction.recipient && (
                              <p className="text-xs text-muted-foreground mt-1">
                                To: {transaction.recipient}
                              </p>
                            )}
                          </div>

                          {/* Amount & Time */}
                          <div className="text-right">
                            {transaction.amount && (
                              <p className={`font-semibold mb-1 ${
                                transaction.type === "purchase" ? "text-red-600" : "text-green-600"
                              }`}>
                                {transaction.type === "purchase" ? "-" : "+"}${transaction.amount.toFixed(2)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {transaction.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {transactions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No transactions yet</h3>
                      <p className="text-muted-foreground">Your transaction history will appear here</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === "staking" && (
          <div className="animate-slide-up">
            <Card className="p-8 bg-gradient-to-br from-success/10 to-accent/10 border-success/30 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your Rewards</h2>
                <p className="text-foreground/60">Earn points by claiming and using deals</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                  <TrendingUp className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="text-3xl font-bold text-success mb-1">{stakingYield}%</p>
                  <p className="text-sm text-foreground/60">Rewards Rate</p>
                </div>
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                  <Award className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-primary mb-1">2,450</p>
                  <p className="text-sm text-foreground/60">Points Earned</p>
                </div>
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                  <Sparkles className="w-12 h-12 text-secondary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-secondary mb-1">Gold</p>
                  <p className="text-sm text-foreground/60">Member Tier</p>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-4">How to Earn More</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">Claim deals</p>
                      <p className="text-sm text-foreground/60">Earn 10 points per deal claimed</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-secondary">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">Redeem at merchants</p>
                      <p className="text-sm text-foreground/60">Earn 50 points per redemption</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-accent">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">Refer friends</p>
                      <p className="text-sm text-foreground/60">Earn 100 points per referral</p>
                    </div>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <Card className="p-8 text-center lg:col-span-1">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  JD
                </div>
                <h3 className="text-2xl font-bold mb-1">John Doe</h3>
                <p className="text-foreground/60 mb-4">john.doe@example.com</p>
                <div className="inline-flex items-center gap-2 bg-warning/20 text-warning px-4 py-2 rounded-full text-sm font-bold mb-6">
                  <Award className="w-4 h-4" />
                  Gold Member
                </div>
                <Button className="w-full" variant="outline">
                  Edit Profile
                </Button>
              </Card>

              {/* Stats */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Your Activity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">12</p>
                      <p className="text-xs text-foreground/60">Deals Claimed</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <p className="text-2xl font-bold text-success">8</p>
                      <p className="text-xs text-foreground/60">Redeemed</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">$247</p>
                      <p className="text-xs text-foreground/60">Saved</p>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <p className="text-2xl font-bold text-accent">3</p>
                      <p className="text-xs text-foreground/60">Referrals</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { icon: "🎯", name: "First Deal", desc: "Claimed your first deal" },
                      { icon: "🔥", name: "Hot Streak", desc: "5 deals in a week" },
                      { icon: "💎", name: "Big Saver", desc: "Saved over $200" },
                      { icon: "🌟", name: "Early Adopter", desc: "Joined in beta" },
                      { icon: "🤝", name: "Social Butterfly", desc: "Referred 3 friends" },
                      { icon: "⚡", name: "Speed Demon", desc: "Redeemed within 1 hour" },
                    ].map((achievement, i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg text-center hover:bg-primary/10 transition-colors cursor-pointer">
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <p className="font-semibold text-sm mb-1">{achievement.name}</p>
                        <p className="text-xs text-foreground/60">{achievement.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
