import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Clock, TrendingUp, Zap, Share2, Bell, CheckCircle, Flame } from "lucide-react";
import { groupDealsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Tier {
  minParticipants: number;
  discountPercentage: number;
  pricePerUnit: number;
}

interface GroupDeal {
  id: string;
  title: string;
  description: string;
  merchant: string;
  image: string;
  discount: number;
  currentParticipants: number;
  targetParticipants: number;
  maxParticipants: number;
  timeLeft: number; // in seconds
  pricePerPerson: number;
  originalPrice: number;
  category: string;
  trending: boolean;
  tiers: Tier[];
  currentTier: number;
}

export default function GroupDeals() {
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [joinedDeals, setJoinedDeals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await groupDealsAPI.list({ limit: 50 });
      setDeals(response.data || []);
    } catch (error) {
      console.error('Failed to load group deals:', error);
      toast({
        title: "Error",
        description: "Failed to load group deals",
        variant: "destructive"
      });
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Update countdown timers
  useEffect(() => {
    if (deals.length === 0) return;
    
    const interval = setInterval(() => {
      setDeals(prevDeals =>
        prevDeals.map(deal => ({
          ...deal,
          timeLeft: Math.max(0, (deal.timeLeft || 0) - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [deals.length]);

  const formatTimeLeft = (seconds: number) => {
    if (!seconds || seconds < 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleJoinDeal = async (dealId: string) => {
    if (!user?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to join a group deal",
        variant: "destructive"
      });
      return;
    }

    try {
      await groupDealsAPI.join(dealId, { userAddress: user.walletAddress });
      setJoinedDeals(prev => new Set(prev).add(dealId));
      loadDeals();

      toast({
        title: "🎉 You're In!",
        description: "Share with friends to unlock the deal faster",
      });
    } catch (error) {
      console.error('Failed to join group deal:', error);
      toast({
        title: "Error",
        description: "Failed to join group deal",
        variant: "destructive"
      });
    }
  };

  const handleShare = (deal: GroupDeal) => {
    toast({
      title: "Share Link Copied!",
      description: "Send to friends to fill the group faster",
    });
  };

  const handleNotify = (dealId: string) => {
    toast({
      title: "🔔 Notifications Enabled",
      description: "We'll alert you when the group fills up",
    });
  };

  const getProgressPercentage = (current: number, target: number) => {
    return (current / target) * 100;
  };

  const getSpotsLeft = (current: number, target: number) => {
    return target - current;
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4 border border-secondary/30">
            <Flame className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm">HOT DEALS ENDING SOON</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Group <span className="neon-text">Deals</span>
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
            Team up with others to unlock massive discounts. The more people join, the better the deal!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">2,847</p>
            <p className="text-xs text-foreground/60">Active Participants</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-success/10 to-success/5 border-success/30">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">156</p>
            <p className="text-xs text-foreground/60">Deals Unlocked Today</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
            <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary">$47K</p>
            <p className="text-xs text-foreground/60">Total Savings</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30">
            <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning">12</p>
            <p className="text-xs text-foreground/60">Deals Ending Soon</p>
          </Card>
        </div>

        {/* Group Deals Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No group deals available</h3>
            <p className="text-muted-foreground">Check back soon for new group deals</p>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => {
            const progressPercentage = getProgressPercentage(deal.currentParticipants, deal.targetParticipants);
            const spotsLeft = getSpotsLeft(deal.currentParticipants, deal.targetParticipants);
            const isJoined = joinedDeals.has(deal.id);
            const isFull = deal.currentParticipants >= deal.targetParticipants;
            const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
            const isUrgent = deal.timeLeft < 3600; // Less than 1 hour

            return (
              <Card key={deal.id || `group-deal-${index}`} className="overflow-hidden card-hover border-0 shadow-lg relative">
                {/* Trending Badge */}
                {deal.trending && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-xl animate-pulse">
                    <Flame className="w-4 h-4" />
                    🔥 HOT DEAL
                  </div>
                )}

                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Discount Badge - More prominent */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-full shadow-2xl transform hover:scale-110 transition-transform">
                    <span className="text-2xl font-black">{deal.discount}%</span>
                    <span className="text-sm ml-1 font-bold">OFF</span>
                  </div>

                  {/* Timer - Bottom Left with urgency */}
                  <div className={`absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md shadow-lg ${
                    isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-bold">
                      {isUrgent ? '🔥 ' : ''}{formatTimeLeft(deal.timeLeft)} left!
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{deal.title}</h3>
                    <p className="text-sm text-foreground/60 mb-2">
                      {typeof deal.merchant === 'string' 
                        ? deal.merchant 
                        : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant')}
                    </p>
                    <p className="text-sm text-foreground/70 line-clamp-2">{deal.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-primary">${deal.pricePerPerson}</span>
                    <span className="text-sm text-foreground/50 line-through">${deal.originalPrice}</span>
                    <span className="text-xs text-success font-semibold">per person</span>
                  </div>

                  {/* Tier Progress */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">TIER PROGRESSION</span>
                      <span className="text-xs font-bold text-primary">Tier {deal.currentTier + 1} of {deal.tiers.length}</span>
                    </div>
                    <div className="space-y-2">
                      {deal.tiers.map((tier, idx) => {
                        const isUnlocked = deal.currentParticipants >= tier.minParticipants;
                        const isCurrent = idx === deal.currentTier;
                        return (
                          <div key={`tier-${idx}`} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isUnlocked ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                              {isUnlocked ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{tier.minParticipants}+ people</span>
                                <span className={`text-xs font-bold ${
                                  isUnlocked ? 'text-success' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                  {tier.discountPercentage}% off (${tier.pricePerUnit})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">
                          {deal.currentParticipants} / {deal.targetParticipants} joined
                        </span>
                      </div>
                      {isAlmostFull && (
                        <span className="text-xs font-bold text-red-500 animate-pulse flex items-center gap-1">
                          ⚠️ Only {spotsLeft} spots left!
                        </span>
                      )}
                    </div>
                    
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                          isFull ? 'bg-gradient-to-r from-success to-accent' : 'bg-gradient-to-r from-primary to-secondary'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                      {/* Animated shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>

                  {/* Social Proof - More exciting */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(5, deal.currentParticipants))].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-white text-xs font-bold shadow-md"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="font-semibold text-foreground">
                      {deal.currentParticipants > 0 && (
                        <>
                          <span className="text-primary">{deal.currentParticipants}</span> {deal.currentParticipants === 1 ? 'person' : 'people'} joined! 🎉
                        </>
                      )}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isFull ? (
                      <Button
                        disabled
                        className="flex-1 bg-success/20 text-success hover:bg-success/20 cursor-default"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Deal Unlocked!
                      </Button>
                    ) : isJoined ? (
                      <>
                        <Button
                          disabled
                          className="flex-1 bg-primary/20 text-primary hover:bg-primary/20 cursor-default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          You're In!
                        </Button>
                        <Button
                          onClick={() => handleShare(deal)}
                          variant="outline"
                          size="icon"
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleJoinDeal(deal.id)}
                          className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-xl transition-all duration-200"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Join Group Deal
                        </Button>
                        <Button
                          onClick={() => handleNotify(deal.id)}
                          variant="outline"
                          size="icon"
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* FOMO Message */}
                  {isAlmostFull && !isJoined && (
                    <p className="text-xs text-center mt-3 text-warning font-semibold animate-pulse">
                      ⚡ Almost full! Join now before it's too late
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        )}

        {/* How It Works */}
        <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h2 className="text-2xl font-bold mb-6 text-center">How Group Deals Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Join a Deal</h3>
              <p className="text-sm text-foreground/60">Pick a group deal and reserve your spot</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Share with Friends</h3>
              <p className="text-sm text-foreground/60">Invite others to fill the group faster</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-success">3</span>
              </div>
              <h3 className="font-semibold mb-2">Unlock & Save</h3>
              <p className="text-sm text-foreground/60">When the group fills, everyone gets the deal!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
