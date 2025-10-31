import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Clock, TrendingUp, Zap, Share2, Bell, CheckCircle, Flame } from "lucide-react";

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

const mockGroupDeals: GroupDeal[] = [
  {
    id: "1",
    title: "Group Spa Day - 4 People",
    description: "Luxury spa package with massage, facial, and pool access",
    merchant: "Zen Wellness Spa",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop",
    discount: 60,
    currentParticipants: 3,
    targetParticipants: 4,
    maxParticipants: 6,
    timeLeft: 7200, // 2 hours
    pricePerPerson: 49,
    originalPrice: 120,
    category: "wellness",
    trending: true,
    tiers: [
      { minParticipants: 2, discountPercentage: 30, pricePerUnit: 84 },
      { minParticipants: 4, discountPercentage: 60, pricePerUnit: 49 },
      { minParticipants: 6, discountPercentage: 75, pricePerUnit: 30 }
    ],
    currentTier: 1
  },
  {
    id: "2",
    title: "Restaurant Group Dinner - 6 People",
    description: "3-course meal at Michelin-starred restaurant",
    merchant: "Culinary Delights",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    discount: 50,
    currentParticipants: 4,
    targetParticipants: 6,
    maxParticipants: 10,
    timeLeft: 10800, // 3 hours
    pricePerPerson: 75,
    originalPrice: 150,
    category: "dining",
    trending: true,
    tiers: [
      { minParticipants: 3, discountPercentage: 25, pricePerUnit: 112 },
      { minParticipants: 6, discountPercentage: 50, pricePerUnit: 75 },
      { minParticipants: 10, discountPercentage: 65, pricePerUnit: 52 }
    ],
    currentTier: 1
  },
  {
    id: "3",
    title: "Adventure Park - 8 People",
    description: "Full day access to theme park with fast passes",
    merchant: "Adventure World",
    image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=400&fit=crop",
    discount: 45,
    currentParticipants: 6,
    targetParticipants: 8,
    maxParticipants: 12,
    timeLeft: 14400, // 4 hours
    pricePerPerson: 55,
    originalPrice: 100,
    category: "entertainment",
    trending: false,
    tiers: [
      { minParticipants: 4, discountPercentage: 20, pricePerUnit: 80 },
      { minParticipants: 8, discountPercentage: 45, pricePerUnit: 55 },
      { minParticipants: 12, discountPercentage: 60, pricePerUnit: 40 }
    ],
    currentTier: 1
  },
  {
    id: "4",
    title: "Yoga Class Bundle - 10 People",
    description: "Month of unlimited yoga classes",
    merchant: "Flow Yoga Studio",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
    discount: 55,
    currentParticipants: 8,
    targetParticipants: 10,
    maxParticipants: 15,
    timeLeft: 5400, // 1.5 hours
    pricePerPerson: 45,
    originalPrice: 100,
    category: "fitness",
    trending: true,
    tiers: [
      { minParticipants: 5, discountPercentage: 30, pricePerUnit: 70 },
      { minParticipants: 10, discountPercentage: 55, pricePerUnit: 45 },
      { minParticipants: 15, discountPercentage: 70, pricePerUnit: 30 }
    ],
    currentTier: 1
  },
];

export default function GroupDeals() {
  const [deals, setDeals] = useState(mockGroupDeals);
  const [joinedDeals, setJoinedDeals] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setDeals(prevDeals =>
        prevDeals.map(deal => ({
          ...deal,
          timeLeft: Math.max(0, deal.timeLeft - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (seconds: number) => {
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

  const handleJoinDeal = (dealId: string) => {
    setJoinedDeals(prev => new Set(prev).add(dealId));
    
    // Simulate participant increase
    setDeals(prevDeals =>
      prevDeals.map(deal =>
        deal.id === dealId
          ? { ...deal, currentParticipants: Math.min(deal.currentParticipants + 1, deal.targetParticipants) }
          : deal
      )
    );

    toast({
      title: "🎉 You're In!",
      description: "Share with friends to unlock the deal faster",
    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => {
            const progressPercentage = getProgressPercentage(deal.currentParticipants, deal.targetParticipants);
            const spotsLeft = getSpotsLeft(deal.currentParticipants, deal.targetParticipants);
            const isJoined = joinedDeals.has(deal.id);
            const isFull = deal.currentParticipants >= deal.targetParticipants;
            const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
            const isUrgent = deal.timeLeft < 3600; // Less than 1 hour

            return (
              <Card key={deal.id} className="overflow-hidden card-hover border-0 shadow-lg relative">
                {/* Trending Badge */}
                {deal.trending && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-secondary to-warning text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                    <Flame className="w-3 h-3" />
                    TRENDING
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
                  
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full shadow-lg">
                    <span className="text-xl font-bold">{deal.discount}%</span>
                    <span className="text-xs ml-1">OFF</span>
                  </div>

                  {/* Timer - Bottom Left */}
                  <div className={`absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md ${
                    isUrgent ? 'bg-destructive/90 text-white animate-pulse' : 'bg-white/90 text-foreground'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-bold">{formatTimeLeft(deal.timeLeft)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{deal.title}</h3>
                    <p className="text-sm text-foreground/60 mb-2">{deal.merchant}</p>
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
                          <div key={idx} className="flex items-center gap-2">
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
                        <span className="text-xs font-bold text-warning animate-pulse">
                          Only {spotsLeft} spots left!
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

                  {/* Social Proof */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-foreground/60">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(4, deal.currentParticipants))].map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span>
                      {deal.currentParticipants > 0 && `${deal.currentParticipants} people are in`}
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
