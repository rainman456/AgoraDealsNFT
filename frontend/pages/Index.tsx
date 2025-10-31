import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Utensils, Plane, Sparkles, Dumbbell, ShoppingBag, Flame, TrendingUp } from "lucide-react";
import HeroCarousel from "@/components/shared/HeroCarousel";
import TrendingSection from "@/components/shared/TrendingSection";
import DealCard from "@/components/shared/DealCard";
import AuctionCard from "@/components/shared/AuctionCard";
import CommunityActivity from "@/components/shared/CommunityActivity";
import { SocialProofFeed } from "@/components/shared/SocialProofFeed";
import { GeoDiscoveryMap } from "@/components/shared/GeoDiscoveryMap";
import { QuickOnboarding } from "@/components/onboarding/QuickOnboarding";
import { useToast } from "@/hooks/use-toast";
import { promotionsAPI, Promotion } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { id: "all", label: "All Deals", icon: ShoppingBag },
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "wellness", label: "Wellness", icon: Sparkles },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [location] = useState("San Francisco, CA");
  const [showMap, setShowMap] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deals, setDeals] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Only show onboarding once ever for new users
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('has_seen_onboarding', 'true');
    }
  }, []);

  // Load deals from backend
  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const response = await promotionsAPI.list({
          isActive: true,
          page: 1,
          limit: 50,
        });
        
        if (response.success) {
          setDeals(response.data);
        } else {
          // Fallback to mock data if backend fails
          const { mockDeals, promotionToDeal } = await import('@/lib/mock-data');
          const convertedDeals = mockDeals.map(promotionToDeal);
          setDeals(convertedDeals as any);
        }
      } catch (error) {
        console.error('Failed to load deals:', error);
        // Fallback to mock data on error
        try {
          const { mockDeals, promotionToDeal } = await import('@/lib/mock-data');
          const convertedDeals = mockDeals.map(promotionToDeal);
          setDeals(convertedDeals as any);
        } catch (mockError) {
          console.error('Failed to load mock data:', mockError);
        }
      } finally {
        setLoading(false);
      }
    };
    loadDeals();
  }, []);

  const handleClaimDeal = () => {
    toast({
      title: "Deal claimed!",
      description: "Check your account to view your new deal.",
    });
  };

  const handleLikeDeal = () => {
    toast({
      title: "Added to favorites",
      description: "You can view your liked deals in your profile.",
    });
  };

  const heroDeals = deals.slice(0, 3);
  const trendingDeals = deals.slice(0, 3);
  const nearbyDeals = deals.slice(3, 6);
  const liveAuctions: any[] = []; // Auctions will be implemented separately
  const filteredDeals = selectedCategory === "all" 
    ? deals 
    : deals.filter((d) => d.category === selectedCategory);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Hero Section - Simplified & Impactful */}
        <div className="mb-12 lg:mb-16">
          <div className="text-center mb-10">
            <h1 className="text-[40px] lg:text-[64px] font-black mb-6 leading-[1.1] tracking-tight hero-gradient-text">
              Save Big on Local Experiences
            </h1>
            <p className="text-lg lg:text-2xl font-semibold max-w-3xl mx-auto leading-relaxed hero-subtitle">
              Discover exclusive deals from trusted businesses near you. Up to 80% off dining, wellness, travel & more.
            </p>
          </div>
          <HeroCarousel deals={heroDeals} />
        </div>

        {/* Location-Based Deals - Airbnb-inspired clean cards */}
        <div className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[28px] lg:text-[40px] font-black flex items-center gap-3 tracking-tight section-heading">
                <MapPin className="w-7 h-7 text-primary" />
                Near You
              </h2>
              <p className="text-base lg:text-lg font-medium mt-2 section-subtitle">
                {location}
              </p>
            </div>
            <Button 
              variant="ghost" 
              className="text-primary font-medium hover:underline text-sm lg:text-base"
              onClick={() => setShowMap(true)}
            >
              View Map
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {nearbyDeals.map((deal) => {
              const merchantName = deal.merchant?.businessName || deal.merchant?.name || 'Merchant';
              return (
              <Link key={deal._id} to={`/deals/${deal._id}`}>
                <div className="bg-card border border-border/50 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg lg:text-xl mb-1.5 group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                        {deal.title}
                      </h3>
                      <p className="text-sm lg:text-base font-medium text-muted-foreground">{merchantName}</p>
                    </div>
                    <div className="bg-primary text-primary-foreground text-sm lg:text-base font-bold px-3 py-1.5 rounded-lg ml-3 flex-shrink-0">
                      {deal.discountPercentage}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      0.5 mi away
                    </span>
                    <span className="text-primary font-medium text-sm group-hover:underline">View Deal</span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        </div>

        {/* Category Filter - Clean & Modern */}
        <div className="mb-10 lg:mb-12">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl whitespace-nowrap transition-all duration-200 text-sm lg:text-base ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-md scale-105"
                      : "bg-card border border-border hover:border-primary/50 hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending Deals Section */}
        <TrendingSection deals={trendingDeals} />

        {/* Live Auctions Section - Exciting & Clear */}
        <div className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[28px] lg:text-[40px] font-black flex items-center gap-3 tracking-tight section-heading">
                <Flame className="w-7 h-7 text-orange-500" />
                Live Auctions
              </h2>
              <p className="text-base lg:text-lg font-medium mt-2 section-subtitle">Bid now and win exclusive deals</p>
            </div>
            <Link to="/marketplace">
              <Button variant="ghost" className="text-primary font-medium hover:underline text-sm lg:text-base">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {liveAuctions.map((auction, index) => (
              <div key={auction.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <AuctionCard auction={auction} />
              </div>
            ))}
          </div>
        </div>

        {/* Group Deals Preview - Social proof emphasis */}
        <div className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[28px] lg:text-[40px] font-black flex items-center gap-3 tracking-tight section-heading">
                <TrendingUp className="w-7 h-7 text-primary" />
                Group Deals
              </h2>
              <p className="text-base lg:text-lg font-medium mt-2 section-subtitle">Join others and unlock bigger savings</p>
            </div>
            <Link to="/group-deals">
              <Button variant="ghost" className="text-primary font-medium hover:underline text-sm lg:text-base">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {deals.slice(0, 2).map((deal) => (
              <div
                key={deal._id}
                className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={deal.imageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop"} 
                    alt={deal.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-sm lg:text-base font-bold px-4 py-2 rounded-lg shadow-lg">
                    {deal.discountPercentage}% OFF
                  </div>
                </div>

                <div className="p-5 lg:p-6">
                  <h3 className="font-bold text-xl lg:text-2xl mb-2 leading-snug">{deal.title}</h3>
                  <p className="text-base lg:text-lg font-medium text-muted-foreground mb-5">{deal.merchant?.businessName || deal.merchant?.name || 'Merchant'}</p>

                  {/* Progress Bar - Visual data */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base lg:text-lg font-bold text-foreground">
                        47 of 100 joined
                      </span>
                      <span className="text-sm lg:text-base font-bold text-orange-500">2h 45m left</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: "47%" }}
                      />
                    </div>
                  </div>

                  {/* Tier Info - Progressive disclosure */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-5 border border-primary/20">
                    <p className="text-base lg:text-lg font-bold text-foreground mb-1">
                      Unlock 50% off at 60 people
                    </p>
                    <p className="text-sm text-muted-foreground">
                      13 more needed
                    </p>
                  </div>

                  <Link to={`/deals/${deal._id}`}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm hover:shadow-md transition-all text-base lg:text-lg py-6 rounded-xl" size="lg">
                      Join This Deal
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Deals Grid - TikTok-inspired infinite scroll feel */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[28px] lg:text-[40px] font-black tracking-tight section-heading">Deals For You</h2>
            <span className="text-sm lg:text-base text-muted-foreground">
              {filteredDeals.length} available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filteredDeals.slice(0, 6).map((deal, index) => (
              <div key={deal._id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <DealCard
                  deal={deal}
                  onClaim={handleClaimDeal}
                  onLike={handleLikeDeal}
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/welcome">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm hover:shadow-md transition-all text-base lg:text-lg px-8 py-6 rounded-xl">
                Sign Up to See More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Geo Discovery Map Modal */}
        {showMap && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <GeoDiscoveryMap onClose={() => setShowMap(false)} />
            </div>
          </div>
        )}

        {/* Quick Onboarding */}
        <QuickOnboarding 
          isOpen={showOnboarding} 
          onComplete={() => setShowOnboarding(false)} 
        />

        {/* Social Proof Feed Widget */}
        <div className="mb-12 lg:mb-16">
          <h2 className="text-[28px] lg:text-[40px] font-black mb-6 tracking-tight section-heading">Live Activity</h2>
          <SocialProofFeed />
        </div>

        {/* Community Activity Widget */}
        <CommunityActivity />
      </div>
    </main>
  );
};

export default Index;
