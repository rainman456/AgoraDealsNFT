import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Heart, Shield, Users, Share2, Star, Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promotionsAPI, Promotion } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

const features = [
  {
    icon: Users,
    title: "Team Up & Save More",
    description: "Join friends to unlock bigger discounts together"
  },
  {
    icon: Gift,
    title: "Earn Rewards",
    description: "Collect badges and unlock exclusive perks"
  },
  {
    icon: Shield,
    title: "100% Verified",
    description: "Every deal is checked and guaranteed"
  },
  {
    icon: Share2,
    title: "Share the Love",
    description: "Send deals to friends and earn bonus rewards"
  }
];

const Index = () => {
  const [deals, setDeals] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await promotionsAPI.list({
          isActive: true,
          page: 1,
          limit: 12,
        });
        
        if (response.success) {
          const dealsData = response.data?.promotions || response.data || [];
          if (Array.isArray(dealsData)) {
            setDeals(dealsData);
          } else {
            console.warn('API response data is not an array:', response);
            setDeals([]);
          }
        } else {
          setDeals([]);
        }
      } catch (error) {
        console.error('Failed to load deals:', error);
        setError(true);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    loadDeals();
  }, [toast]);

  const handleShare = (deal: Promotion, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: deal.title,
        text: `Check out this amazing ${deal.discountPercentage}% off deal!`,
        url: window.location.origin + `/deals/${deal._id || deal.id}`
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + `/deals/${deal._id || deal.id}`);
      toast({
        title: "Link copied!",
        description: "Share this deal with your friends",
      });
    }
  };

  const featuredDeals = Array.isArray(deals) ? deals.slice(0, 6) : [];

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      {/* Hero Section - Mobile First */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[url('https://assets-gen.codenut.dev/images/1762269011_2e7ae569.png')] bg-cover bg-center opacity-5" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-primary text-white border-0 px-4 py-2 text-sm font-bold animate-bounce-subtle">
              <Sparkles className="w-4 h-4 mr-2" />
              Join 10,000+ Happy Savers
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="text-primary">Save Big</span> on Everything
              <br />
              <span className="text-foreground">You Love ❤️</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed px-4">
              Team up with friends for exclusive group discounts. The more who join, the bigger the savings!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
              <Link to={isAuthenticated ? "/deals" : "/user/login"} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold shadow-lg hover:shadow-xl transition-all text-base md:text-lg px-8 py-6 rounded-2xl">
                  {isAuthenticated ? "Browse Deals" : "Start Saving Now"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/merchant/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-base md:text-lg px-8 py-6 rounded-2xl border-2 hover:bg-primary/5">
                  For Merchants
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-semibold">100% Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">50k+ Deals Claimed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Mobile Optimized */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-primary">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Three simple steps to start saving money today
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 border-border/50 bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 mx-auto animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Deals Section - Mobile First */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-primary flex items-center gap-3">
                <TrendingUp className="w-7 h-7 md:w-8 md:h-8" />
                Hot Deals 🔥
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Grab them before they're gone!
              </p>
            </div>
            <Link to="/deals" className="hidden md:block">
              <Button variant="ghost" className="text-primary font-semibold hover:underline">
                See All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <CardContent className="p-4 md:p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3 mb-4" />
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 md:p-12 border-2 border-border">
              <ErrorState
                type="server"
                title="Unable to Load Deals"
                message="We're having trouble connecting to our servers. Please try again in a moment."
                onRetry={() => window.location.reload()}
              />
            </Card>
          ) : featuredDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featuredDeals.map((deal, index) => {
                const originalPrice = deal.price || 100;
                const discountedPrice = (originalPrice * (1 - deal.discountPercentage / 100)).toFixed(2);
                
                return (
                  <Link key={deal._id || deal.id || index} to={`/deals/${deal._id || deal.id}`}>
                    <Card className="overflow-hidden border-2 border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                        {deal.imageUrl ? (
                          <img 
                            src={deal.imageUrl} 
                            alt={deal.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                            <Gift className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary text-white font-bold text-base md:text-lg px-3 py-1.5 shadow-lg animate-pulse-slow">
                            {deal.discountPercentage}% OFF
                          </Badge>
                        </div>

                        {/* Share Button */}
                        <button
                          onClick={(e) => handleShare(deal, e)}
                          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
                        >
                          <Share2 className="w-5 h-5 text-primary" />
                        </button>

                        {/* Group Deal Indicator */}
                        {deal.maxSupply > 10 && (
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-accent text-white font-bold text-xs px-2 py-1 shadow-lg">
                              <Users className="w-3 h-3 mr-1" />
                              Group Deal
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg md:text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors flex-1">
                            {deal.title}
                          </h3>
                        </div>
                        
                        <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-2">
                          {deal.description}
                        </p>
                        
                        {/* Trust Signals */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-bold text-green-700">Verified</span>
                          </div>
                          {deal.stats?.totalRedeemed > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-bold text-blue-700">{deal.stats.totalRedeemed}+ claimed</span>
                            </div>
                          )}
                          {deal.stats?.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold">{deal.stats.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Pricing */}
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground line-through">
                              ${originalPrice}
                            </p>
                            <p className="text-2xl md:text-3xl font-bold text-primary">
                              ${discountedPrice}
                            </p>
                          </div>
                          <Button className="bg-primary text-white hover:bg-primary/90 font-bold shadow-lg hover:shadow-xl transition-all">
                            Claim Deal
                          </Button>
                        </div>
                        
                        {/* Availability */}
                        <div className="pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">
                              {deal.currentSupply || 0} / {deal.maxSupply} claimed
                            </span>
                            {deal.maxSupply - (deal.currentSupply || 0) <= 5 && (
                              <Badge variant="destructive" className="text-xs font-bold animate-pulse">
                                <Zap className="w-3 h-3 mr-1" />
                                Almost Gone!
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                              style={{ width: `${((deal.currentSupply || 0) / deal.maxSupply) * 100}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 md:p-12 border-2 border-dashed border-border">
              <EmptyState
                type="deals"
                title="No Deals Available Yet"
                message="Be the first to know when amazing deals drop! Check back soon or become a merchant to list your business."
                actionLabel="List Your Business"
                actionLink="/merchant/onboarding"
              />
            </Card>
          )}

          <div className="text-center mt-8 md:mt-12">
            <Link to="/deals">
              <Button size="lg" className="w-full md:w-auto bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 font-bold text-base md:text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                Explore All Deals
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              People Love Saving Together 💙
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Join thousands of happy savers in your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10">
            <Card className="p-6 md:p-8 text-center border-2 hover:shadow-xl transition-all">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">$2.5M+</div>
              <p className="text-base md:text-lg text-muted-foreground font-semibold">Total Saved</p>
            </Card>
            <Card className="p-6 md:p-8 text-center border-2 hover:shadow-xl transition-all">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">50K+</div>
              <p className="text-base md:text-lg text-muted-foreground font-semibold">Deals Claimed</p>
            </Card>
            <Card className="p-6 md:p-8 text-center border-2 hover:shadow-xl transition-all">
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">10K+</div>
              <p className="text-base md:text-lg text-muted-foreground font-semibold">Happy Users</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-accent text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Ready to Start Saving? 🎉
          </h2>
          <p className="text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto opacity-95 px-4">
            Join your friends and neighbors discovering exclusive deals every day
          </p>
          <Link to={isAuthenticated ? "/deals" : "/welcome"}>
            <Button size="lg" className="w-full md:w-auto bg-white text-primary hover:bg-white/90 font-bold shadow-2xl hover:shadow-3xl transition-all text-base md:text-lg px-10 py-7 rounded-2xl">
              {isAuthenticated ? "Browse Deals Now" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-6 text-sm md:text-base opacity-90">
            No credit card required • Free forever • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  );
};

export default Index;
