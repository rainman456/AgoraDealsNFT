import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DealCard from "@/components/shared/DealCard";
import HeroCarousel from "@/components/shared/HeroCarousel";
import TrendingSection from "@/components/shared/TrendingSection";
import AuctionCard from "@/components/shared/AuctionCard";
import CommunityActivity from "@/components/shared/CommunityActivity";
import { GeoDiscoveryMap } from "@/components/shared/GeoDiscoveryMap";
import { promotionsAPI, Promotion } from "@/lib/api";
import { Search, MapPin, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { id: "all", label: "All Deals", icon: Sparkles },
  { id: "food", label: "Food & Dining", icon: "🍕" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "services", label: "Services", icon: "💼" },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deals, setDeals] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await promotionsAPI.list({ isActive: true, limit: 20 });
        if (response.success && response.data?.promotions && Array.isArray(response.data.promotions)) {
          setDeals(response.data.promotions);
        } else {
          setDeals([]);
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
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



  const heroDeals = Array.isArray(deals) ? deals.slice(0, 3) : [];
  const trendingDeals = Array.isArray(deals) ? deals.slice(0, 3) : [];
  const nearbyDeals = Array.isArray(deals) ? deals.slice(3, 6) : [];
  const liveAuctions: any[] = [];

  const filteredDeals = Array.isArray(deals) ? deals.filter((deal) => {
    const matchesCategory = selectedCategory === "all" || deal.category === selectedCategory;
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold mb-2">Discover Amazing Deals</h1>
          <p className="text-lg text-muted-foreground mb-8">Save money, own your deals, trade with others</p>
          <HeroCarousel deals={heroDeals} />
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for deals, merchants, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-base glass-input shadow-sm rounded-full"
            />
          </div>
        </div>

        {/* Trending Section */}
        <TrendingSection deals={trendingDeals} />

        {/* Near You Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold">Near You</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 glass-button"
              onClick={() => setShowMap(!showMap)}
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'Hide Map' : 'View Map'}
            </Button>
          </div>
          
          {showMap && (
            <div className="mb-6">
              <GeoDiscoveryMap onClose={() => setShowMap(false)} />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyDeals.map((deal, index) => (
              <div key={deal._id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <DealCard
                  deal={deal}
                  onClaim={handleClaimDeal}
                  onLike={handleLikeDeal}
                />
              </div>
            ))}
          </div>

        </section>

        {/* Live Auctions Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">Live Auctions 🔨</h2>
              <p className="text-muted-foreground mt-1">Bid on exclusive deals and get amazing discounts</p>
            </div>
          </div>

          {/* Auction Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2">🏛️ English Auction</h3>
              <p className="text-sm text-muted-foreground">Highest bid wins. Price increases with each bid.</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2">🌷 Dutch Auction</h3>
              <p className="text-sm text-muted-foreground">Price starts high and decreases over time.</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2">🔒 Sealed Bid</h3>
              <p className="text-sm text-muted-foreground">Submit your bid privately. Highest bid wins.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveAuctions.map((auction, index) => (
              <div key={auction.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <AuctionCard auction={auction} />
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-8">
          <h3 className="text-xl font-heading font-bold mb-4">Browse by Category</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                    : "bg-card text-foreground border border-border hover:border-primary"
                }`}
              >
                {typeof category.icon === "string" ? (
                  <span>{category.icon}</span>
                ) : (
                  <category.icon className="w-4 h-4" />
                )}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* All Deals Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-bold mb-6">
            {selectedCategory === "all" ? "All Deals" : categories.find(c => c.id === selectedCategory)?.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal._id}
                deal={deal}
                onClaim={handleClaimDeal}
                onLike={handleLikeDeal}
              />
            ))}
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No deals found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </section>

        {/* Community Activity */}
        <CommunityActivity />
      </div>
    </main>
  );
}
