import { useState, useEffect } from "react";
import { couponsAPI, userStatsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Gift, TrendingUp, Award, Clock, Sparkles, Grid3x3, List, Share2, QrCode, AlertCircle, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, DollarSign, CreditCard, Zap, Settings, ChevronRight, Info, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Transaction {
  id: string;
  type: "claim" | "redeem" | "gift" | "list" | "purchase";
  dealTitle: string;
  amount?: number;
  recipient?: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  sponsored?: boolean;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  merchant: string;
  image: string;
  price: number;
  discount: number;
  expiry: string;
}

interface UserStats {
  dealsClaimed: number;
  dealsRedeemed: number;
  totalSavings: number;
  referrals: number;
  rewardsRate: number;
  pointsEarned: number;
  memberTier: string;
}

export default function MyDeals() {
  const [activeTab, setActiveTab] = useState<"nfts" | "staking" | "profile">("nfts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [ownedDeals, setOwnedDeals] = useState<Deal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    dealsClaimed: 0,
    dealsRedeemed: 0,
    totalSavings: 0,
    referrals: 0,
    rewardsRate: 0,
    pointsEarned: 0,
    memberTier: 'Bronze'
  });
  const [loading, setLoading] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [walletBalance] = useState(50.00);
  const [freeTransactionsLeft] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const walletAddress = localStorage.getItem('walletAddress') || '';
      
      // Load coupons
      const couponsResponse = await couponsAPI.list({ status: 'active', limit: 50 });
      
      // Load user stats only if wallet address exists
      let statsResponse = null;
      if (walletAddress && walletAddress.trim()) {
        try {
          statsResponse = await userStatsAPI.getUserStats(walletAddress.trim());
        } catch (statsError) {
          console.warn('Failed to load user stats:', statsError);
        }
      }
      
      if (couponsResponse.success && Array.isArray(couponsResponse.data)) {
        setOwnedDeals(couponsResponse.data);
      } else {
        setOwnedDeals([]);
      }
      
      if (statsResponse?.success && statsResponse?.data) {
        setUserStats(statsResponse.data);
      }
      // Load transactions if available
      // setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setOwnedDeals([]);
      toast({
        title: "Error",
        description: "Failed to load your deals",
        variant: "destructive"
      });
      setOwnedDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedDealForTransfer, setSelectedDealForTransfer] = useState<string | null>(null);
  const [transferRecipient, setTransferRecipient] = useState("");

  const handleTransfer = (dealId: string) => {
    setSelectedDealForTransfer(dealId);
    setTransferDialogOpen(true);
  };

  const confirmTransfer = () => {
    if (!transferRecipient) {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid account address or email",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Transfer Initiated",
      description: `Coupon transferred to ${transferRecipient}`,
    });
    setTransferDialogOpen(false);
    setTransferRecipient("");
    setSelectedDealForTransfer(null);
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

  const handleAddFunds = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Funds Added Successfully",
      description: `$${fundAmount} has been added to your account`,
    });
    setShowAddFunds(false);
    setFundAmount("");
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
        {/* Header with Balance & Add Funds */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                My <span className="neon-text">Deals</span>
              </h1>
              <p className="text-foreground/60 text-lg">Your deals, rewards, and savings in one place</p>
            </div>

            {/* Balance & Add Funds Card */}
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Balance</p>
                  <p className="text-2xl font-bold">${walletBalance.toFixed(2)}</p>
                  {freeTransactionsLeft > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600 font-semibold">
                        {freeTransactionsLeft} free transactions left
                      </span>
                    </div>
                  )}
                </div>
                <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Funds to Your Account</DialogTitle>
                      <DialogDescription>
                        Add money to your account using your credit card. Funds are instantly available.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="50.00"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          min="1"
                          step="0.01"
                        />
                      </div>
                      
                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 25, 50, 100].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setFundAmount(amount.toString())}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>

                      {/* Info Card */}
                      <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-900 dark:text-blue-100">
                            <p className="font-semibold mb-1">Instant & Secure</p>
                            <p>Your payment is processed securely. Funds appear immediately in your account.</p>
                          </div>
                        </div>
                      </Card>

                      {advancedMode && (
                        <Card className="p-3 bg-muted">
                          <p className="text-xs text-muted-foreground mb-2">Advanced Details</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Conversion Rate:</span>
                              <span className="font-mono">1 USD = 0.0045 SOL</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Network Fee:</span>
                              <span className="text-green-600">Included</span>
                            </div>
                          </div>
                        </Card>
                      )}

                      <Button onClick={handleAddFunds} className="w-full" size="lg">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add ${fundAmount || "0.00"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>

          {/* Advanced Mode Toggle */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {advancedMode ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="font-semibold">Advanced Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {advancedMode ? "Showing technical details and transaction info" : "Simplified view for easy use"}
                  </p>
                </div>
              </div>
              <Switch
                checked={advancedMode}
                onCheckedChange={setAdvancedMode}
              />
            </div>
          </Card>
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
            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your deals...</p>
              </div>
            ) : (
              <>
            {/* View Toggle & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/30">
                  <span className="text-2xl font-bold">{ownedDeals.length}</span>
                  <span className="text-sm ml-2">Active Deals</span>
                </div>
                <div className="bg-success/10 text-success px-4 py-2 rounded-lg border border-success/30">
                  <span className="text-2xl font-bold">${userStats.totalSavings}</span>
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
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedDeals.map((deal) => {
                  const daysLeft = getDaysUntilExpiry(deal.expiry);
                  const expiryStatus = getExpiryStatus(daysLeft);

                  return (
                    <Card key={deal.id} className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-200 hover:shadow-xl group">
                      {/* Deal Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={deal.image}
                          alt={deal.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Discount Badge */}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-white px-3 py-1.5 rounded-full shadow-lg">
                          <span className="text-lg font-bold">{deal.discount}%</span>
                          <span className="text-xs ml-1">OFF</span>
                        </div>

                        {/* Expiry Warning */}
                        <div className={`absolute top-3 left-3 ${expiryStatus.bg} ${expiryStatus.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm`}>
                          <Clock className="w-3 h-3" />
                          {expiryStatus.label}
                        </div>

                        {/* Merchant Badge */}
                        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
                          {typeof deal.merchant === 'string' 
                            ? deal.merchant 
                            : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant')}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{deal.title}</h3>
                        <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{deal.description}</p>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleList(deal.id)}
                            className="w-full"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            List
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRedeem(deal.id)}
                            className="w-full bg-primary hover:bg-primary-dark"
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
            {viewMode === "list" && (
              <div className="space-y-4">
                {ownedDeals.map((deal) => {
                  const daysLeft = getDaysUntilExpiry(deal.expiry);
                  const expiryStatus = getExpiryStatus(daysLeft);

                  return (
                    <Card key={deal.id} className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary/30">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        <div className="relative w-full md:w-48 aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-sm font-bold">
                            {deal.discount}% OFF
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold mb-1">{deal.title}</h3>
                              <p className="text-sm text-foreground/60">
                                {typeof deal.merchant === 'string' 
                                  ? deal.merchant 
                                  : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant')}
                              </p>
                            </div>
                            <div className={`${expiryStatus.bg} ${expiryStatus.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                              <Clock className="w-3 h-3" />
                              {expiryStatus.label}
                            </div>
                          </div>

                          <p className="text-foreground/70 mb-4">{deal.description}</p>

                          <div className="flex items-center gap-3 flex-wrap">
                            <Button
                              size="lg"
                              onClick={() => handleRedeem(deal.id)}
                              className="bg-primary hover:bg-primary-dark"
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Redeem Now
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleList(deal.id)}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              List for Sale
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleGift(deal.id)}
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

            {ownedDeals.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No deals yet</h3>
                <p className="text-foreground/60 mb-6">Start exploring and claim your first deal</p>
                <Button size="lg" className="bg-primary hover:bg-primary-dark">
                  Browse Deals
                </Button>
              </Card>
            )}
              </>
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
                              {transaction.sponsored && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                  <Zap className="w-3 h-3" />
                                  Free
                                </span>
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
                            {advancedMode && transaction.sponsored && (
                              <p className="text-xs text-green-600 mt-1">
                                Transaction fee sponsored by merchant
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
                  <p className="text-3xl font-bold text-success mb-1">{userStats.rewardsRate}%</p>
                  <p className="text-sm text-foreground/60">Rewards Rate</p>
                </div>
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                  <Award className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-primary mb-1">{userStats.pointsEarned}</p>
                  <p className="text-sm text-foreground/60">Points Earned</p>
                </div>
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                  <Sparkles className="w-12 h-12 text-secondary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-secondary mb-1">{userStats.memberTier}</p>
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
                <Button className="w-full mb-3" variant="outline">
                  Edit Profile
                </Button>
                
                {advancedMode && (
                  <Card className="p-4 bg-muted mt-4 text-left">
                    <p className="text-xs font-semibold mb-2">Wallet Details</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="font-mono">0x7a...3f2c</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network:</span>
                        <span>Solana</span>
                      </div>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                        Export Private Key →
                      </Button>
                    </div>
                  </Card>
                )}
              </Card>

              {/* Stats */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Your Activity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{userStats.dealsClaimed}</p>
                      <p className="text-xs text-foreground/60">Deals Claimed</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <p className="text-2xl font-bold text-success">{userStats.dealsRedeemed}</p>
                      <p className="text-xs text-foreground/60">Redeemed</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">${userStats.totalSavings}</p>
                      <p className="text-xs text-foreground/60">Saved</p>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <p className="text-2xl font-bold text-accent">{userStats.referrals}</p>
                      <p className="text-xs text-foreground/60">Referrals</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Achievements would be loaded from API */}
                    {[].map((achievement: any, i: number) => (
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
