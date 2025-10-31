import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import DealCard from "@/components/shared/DealCard";
import NotificationBar from "@/components/shared/NotificationBar";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, MapPin, Star, Loader2, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Promotion } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { mockDeals, promotionToDeal } from "@/lib/mock-data";

export default function Deals() {
  const [deals, setDeals] = useState<Promotion[]>([]);
  const [displayedDeals, setDisplayedDeals] = useState<Promotion[]>([]);
  const [ownedDeals, setOwnedDeals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [minRating, setMinRating] = useState(0);
  const observerTarget = useRef(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load mock deals data
  useEffect(() => {
    setLoading(true);
    // Simulate API delay for smooth UX
    setTimeout(() => {
      // Convert mock deals to include both Promotion and Deal properties
      const dealsWithLegacyProps = mockDeals.map(promotionToDeal);
      setDeals(dealsWithLegacyProps as any);
      setLoading(false);
    }, 300);
  }, []);

  const ITEMS_PER_PAGE = 9;

  const categories = ["all", "flights", "hotels", "restaurants", "shopping", "wellness", "experiences"];

  // Get user location
  useEffect(() => {
    if (nearMeEnabled && !userLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            toast({
              title: "Location Enabled",
              description: "Showing deals near you",
            });
          },
          () => {
            // Fallback to mock coordinates (New York City)
            setUserLocation({ lat: 40.7128, lng: -74.0060 });
            toast({
              title: "Using Default Location",
              description: "Showing deals in New York City",
            });
          }
        );
      } else {
        setUserLocation({ lat: 40.7128, lng: -74.0060 });
      }
    }
  }, [nearMeEnabled, userLocation, toast]);

  const filteredDeals = deals
    .filter((deal) => {
      const merchantName = deal.merchant?.businessName || deal.merchant?.name || '';
      const matchesSearch =
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchantName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || deal.category === selectedCategory;
      
      const dealRating = deal.ratings?.average || 0;
      const matchesRating = dealRating >= minRating;
      
      return matchesSearch && matchesCategory && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return (b.ratings?.count || 0) - (a.ratings?.count || 0);
      if (sortBy === "expiry") return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sortBy === "discount") return b.discountPercentage - a.discountPercentage;
      if (sortBy === "rating") {
        const ratingA = a.ratings?.average || 0;
        const ratingB = b.ratings?.average || 0;
        return ratingB - ratingA;
      }
      return 0;
    });

  // Infinite scroll logic
  useEffect(() => {
    const loadMore = () => {
      setLoading(true);
      setTimeout(() => {
        const startIndex = 0;
        const endIndex = page * ITEMS_PER_PAGE;
        const newDeals = filteredDeals.slice(startIndex, endIndex);
        setDisplayedDeals(newDeals);
        setHasMore(endIndex < filteredDeals.length);
        setLoading(false);
      }, 500);
    };
    loadMore();
  }, [page, filteredDeals]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setDisplayedDeals([]);
  }, [searchTerm, selectedCategory, sortBy, minRating]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading]);

  const handleClaimDeal = useCallback(
    (dealId: string) => {
      if (!ownedDeals.includes(dealId)) {
        setOwnedDeals([...ownedDeals, dealId]);
        toast({
          title: "Deal Claimed!",
          description: "Deal added to your account",
        });
      }
    },
    [ownedDeals, toast]
  );

  const handleLike = useCallback(
    (dealId: string) => {
      // Like functionality would require backend endpoint
      toast({
        title: "Liked!",
        description: "Deal added to favorites",
      });
    },
    [deals]
  );

  const handleSendEmail = () => {
    if (emailInput) {
      toast({
        title: "Email Sent!",
        description: `Deal notifications will be sent to ${emailInput}`,
      });
      setEmailInput("");
      setShowEmailForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar type="buyer" />

      <div className="py-6 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header - Clean & Modern */}
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-primary" />
                  Discover Deals
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {filteredDeals.length} exclusive deals from trusted merchants
                </p>
              </div>
              <div className="relative">
                <Button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  variant="outline"
                  className="border-border hover:border-primary hover:bg-primary/5"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Get Alerts
                </Button>
                {showEmailForm && (
                  <div className="absolute top-14 right-0 bg-card border border-border rounded-xl p-4 w-72 shadow-xl z-10">
                    <h3 className="font-semibold mb-2 text-sm">Never miss a deal</h3>
                    <p className="text-xs text-muted-foreground mb-3">Get notified about new deals matching your interests</p>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="mb-3"
                    />
                    <Button
                      onClick={handleSendEmail}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      size="lg"
                    >
                      Subscribe
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters - Progressive disclosure */}
          <div className="mb-6 md:mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals or merchants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card border-border/50 h-11"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-card border border-border/50 text-foreground text-sm font-medium hover:border-primary/50 transition-colors min-w-[160px]"
                >
                  <option value="popular">Most Popular</option>
                  <option value="expiry">Expiring Soon</option>
                  <option value="discount">Best Savings</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters - Clean design */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Near Me Toggle */}
              <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 hover:border-primary/50 transition-colors">
                <MapPin className="h-4 w-4 text-primary" />
                <Label htmlFor="near-me" className="cursor-pointer text-sm font-medium">Near Me</Label>
                <Switch
                  id="near-me"
                  checked={nearMeEnabled}
                  onCheckedChange={setNearMeEnabled}
                />
              </div>

              {/* Minimum Rating Filter */}
              <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 hover:border-primary/50 transition-colors">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <select
                  id="min-rating"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value={0}>All Ratings</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.8}>4.8+ Stars</option>
                </select>
              </div>
            </div>

            {/* Category Filter - Modern pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 capitalize text-sm font-medium ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-card border border-border/50 text-foreground hover:border-primary/50 hover:shadow-sm"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count - Data visualization */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{displayedDeals.length}</span> of <span className="font-semibold text-foreground">{filteredDeals.length}</span> deals
              {nearMeEnabled && userLocation && " near you"}
            </p>
            {filteredDeals.length > 0 && (
              <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(displayedDeals.length / filteredDeals.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Deals Grid - TikTok-inspired feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayedDeals.map((deal, index) => (
              <div 
                key={deal._id}
                className="animate-slide-up"
                style={{ animationDelay: `${(index % 9) * 30}ms` }}
              >
                <DealCard
                  deal={deal}
                  isOwned={ownedDeals.includes(deal._id)}
                  onClaim={() => handleClaimDeal(deal._id)}
                  onLike={() => handleLike(deal._id)}
                />
              </div>
            ))}
          </div>

          {/* Loading Indicator - Smooth */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading more deals...</p>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="h-10" />

          {/* No More Results */}
          {!hasMore && displayedDeals.length > 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">You've seen all deals!</p>
              </div>
            </div>
          )}

          {filteredDeals.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No deals found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
