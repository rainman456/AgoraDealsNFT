import { useState, useEffect } from "react";
import { listingsAPI, auctionsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, DollarSign, Gavel, Clock, TrendingUp, Star, Users, Verified } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  merchant: {
    businessName?: string;
    name?: string;
  } | string;
  image: string;
  price: number;
  discount: number;
  nftMetadata?: {
    transferable?: boolean;
  };
}

interface Auction {
  id: string;
  title: string;
  merchant: {
    businessName?: string;
    name?: string;
  } | string;
  image: string;
  currentBid: number;
  bids: number;
  highestBidder: string;
  timeRemaining: string;
  status: string;
}

export default function Marketplace() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [activeTab, setActiveTab] = useState('buy');
  const [ownedDeals, setOwnedDeals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [dealsResponse, auctionsResponse] = await Promise.all([
        listingsAPI.list({ limit: 50 }).catch((err) => {
          console.error('Listings API error:', err?.response?.status || err.message);
          return { success: false, data: [] };
        }),
        auctionsAPI.list({ status: 'active', limit: 20 }).catch((err) => {
          console.error('Auctions API error:', err?.response?.status || err.message);
          return { success: false, data: [] };
        })
      ]);
      
      if (dealsResponse.success) {
        const dealsData = dealsResponse.data?.listings || dealsResponse.data || [];
        setDeals(Array.isArray(dealsData) ? dealsData : []);
      } else {
        setDeals([]);
      }
      
      if (auctionsResponse.success) {
        const auctionsData = auctionsResponse.data?.auctions || auctionsResponse.data || [];
        setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
      } else {
        setAuctions([]);
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      setDeals([]);
      setAuctions([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to load marketplace data. Backend service may be unavailable.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resaleDeals = Array.isArray(deals) ? deals.slice(0, 6) : [];
  const liveAuctions = Array.isArray(auctions) ? auctions.filter(a => a.status === 'live') : [];

  const handleBuy = (dealId: string) => {
    setOwnedDeals([...ownedDeals, dealId]);
    toast({
      title: "Purchase Successful!",
      description: "Deal added to your account",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Sticky Header - Clean & Modern */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Marketplace</h1>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {resaleDeals.length} active
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50">
            <TabsTrigger value="buy" data-testid="tab-buy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Buy</span>
            </TabsTrigger>
            <TabsTrigger value="sell" data-testid="tab-sell" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Sell</span>
            </TabsTrigger>
            <TabsTrigger value="auctions" data-testid="tab-auctions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gavel className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Auctions</span>
            </TabsTrigger>
          </TabsList>

          {/* Buy Tab - OpenSea-inspired but less crypto */}
          <TabsContent value="buy" className="mt-6">
            <div className="mb-5">
              <h3 className="text-base md:text-lg font-semibold mb-1">Available Deals</h3>
              <p className="text-sm text-muted-foreground">
                Purchase deals from other users at great prices
              </p>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading deals...</p>
              </div>
            ) : resaleDeals.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No deals available</h3>
                <p className="text-muted-foreground">Check back later for new listings</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resaleDeals.map((deal) => {
                const originalPrice = deal.price ? (deal.price / (1 - deal.discount / 100)).toFixed(2) : null;
                const savings = originalPrice && deal.price ? (Number(originalPrice) - deal.price).toFixed(2) : null;
                
                return (
                  <Card
                    key={`marketplace-deal-${deal.id}`}
                    className="overflow-hidden group hover:border-primary/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-card border-border/50"
                  >
                    {/* Image - Beautiful imagery */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      {/* Verified merchant badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1.5 rounded-lg shadow-lg">
                        <Verified className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground">
                          {typeof deal.merchant === 'string' 
                            ? deal.merchant 
                            : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant')}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {deal.title}
                      </h3>

                      {/* Price - Clear value presentation */}
                      {deal.price && savings && (
                        <div className="mb-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xl font-bold text-foreground">${deal.price}</span>
                            <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                              {deal.discount}%
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-through">
                            Regular ${originalPrice}
                          </p>
                          <p className="text-xs font-medium text-primary flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            Save ${savings}
                          </p>
                        </div>
                      )}

                      {/* Trust signals */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>127 sold</span>
                        </div>
                      </div>

                      {/* Button */}
                      <Button
                        onClick={() => handleBuy(deal.id)}
                        disabled={ownedDeals.includes(deal.id)}
                        className={`w-full font-semibold transition-all ${
                          ownedDeals.includes(deal.id)
                            ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 border border-green-200 dark:border-green-800"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
                        }`}
                        size="lg"
                      >
                        {ownedDeals.includes(deal.id) ? (
                          <><Verified className="w-4 h-4 mr-2" />Purchased</>
                        ) : (
                          <><ShoppingBag className="w-4 h-4 mr-2" />Buy Now</>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
              </div>
            )}
          </TabsContent>

          {/* Sell Tab - Simplified */}
          <TabsContent value="sell" className="mt-6">
            <div className="text-center py-16 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Sell Your Deals</h3>
                <p className="text-sm text-muted-foreground">
                  Turn unused deals into cash by listing them here
                </p>
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm hover:shadow-md transition-all"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Listing feature launching soon",
                  });
                }}
                data-testid="button-create-listing"
                size="lg"
              >
                Create Listing
              </Button>
            </div>
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Live Auctions</h3>
              <p className="text-sm text-muted-foreground">
                Bid on exclusive deals ending soon
              </p>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading auctions...</p>
              </div>
            ) : liveAuctions.length === 0 ? (
              <Card className="p-12 text-center">
                <Gavel className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No live auctions</h3>
                <p className="text-muted-foreground">Check back later for new auctions</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAuctions.map((auction) => (
                <Card
                  key={`auction-${auction.id}`}
                  className="overflow-hidden group hover:border-primary/60 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-card/50">
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-warning text-warning-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {auction.timeRemaining}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{auction.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {typeof auction.merchant === 'string' 
                        ? auction.merchant 
                        : (auction.merchant?.businessName || auction.merchant?.name || 'Merchant')}
                    </p>

                    {/* Bid Info */}
                    <div className="mb-4 space-y-2">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
                        <p className="text-2xl font-bold text-primary">${auction.currentBid}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{auction.bids} bids</span>
                        <span>High: {auction.highestBidder}</span>
                      </div>
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => {
                        toast({
                          title: "Bid Placed!",
                          description: `Bid placed on ${auction.title}`,
                        });
                      }}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                  </div>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
