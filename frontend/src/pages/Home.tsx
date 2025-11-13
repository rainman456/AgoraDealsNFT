import React, { useState, useEffect } from 'react';
import { DealCard } from '@/components/DealCard';
import { promotionsAPI, Promotion } from '@/lib/api';
import { useListData } from '@/hooks/useListData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, MapPin, TrendingUp, Users, Zap, Shield, Star, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import { SocialProofFeed } from '@/components/SocialProofFeed';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const categories = ['all', 'flights', 'hotels', 'restaurants', 'experiences', 'shopping'];

const trustStats = [
  { icon: Users, value: '2M+', label: 'Active Users' },
  { icon: Shield, value: '100%', label: 'Verified Deals' },
  { icon: Star, value: '4.9', label: 'Average Rating' },
  { icon: Check, value: '$50M+', label: 'Total Savings' },
];

const howItWorks = [
  {
    step: '1',
    title: 'Discover Deals',
    description: 'Browse exclusive offers from top brands and local businesses',
    image: 'https://assets-gen.codenut.dev/images/1762645143_fbcbe099.png',
  },
  {
    step: '2',
    title: 'Claim & Own',
    description: 'Secure your deal as a digital asset you truly own',
    image: 'https://assets-gen.codenut.dev/images/1762645159_747d5561.png',
  },
  {
    step: '3',
    title: 'Save & Trade',
    description: 'Redeem for savings or trade with others in the marketplace',
    image: 'https://assets-gen.codenut.dev/images/1762645173_f4cbf398.png',
  },
];

export const Home: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [claimingDealId, setClaimingDealId] = useState<string | null>(null);
  const { error, handleErrorResponse } = useErrorHandler();
  const navigate = useNavigate();

  // Main deals list with pagination and filters
  const promotions = useListData(
    (page, pageSize, params) =>
      promotionsAPI.listPromotions({
        page,
        limit: pageSize,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: debouncedSearch || undefined,
        ...params,
      }),
    {
      pageSize: 12,
      optimisticUpdates: false,
      deduplicateById: true,
      filterFn: (item: Promotion) => item.isActive,
      sortFn: (a: Promotion, b: Promotion) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    }
  );

  // Trending deals (sidebar)
  const [trendingDeals, setTrendingDeals] = useState<Promotion[]>([]);
  const [nearbyDeals, setNearbyDeals] = useState<Promotion[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Load initial deals
  useEffect(() => {
    promotions.fetch();
  }, [selectedCategory, debouncedSearch]);

  // Load trending deals
  useEffect(() => {
    const loadTrendingDeals = async () => {
      try {
        setTrendingLoading(true);
        const response = await promotionsAPI.listPromotions({
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        setTrendingDeals(response.data?.promotions || []);
      } catch (error) {
        console.error('Failed to load trending deals:', error);
      } finally {
        setTrendingLoading(false);
      }
    };
    loadTrendingDeals();
  }, []);

  // Load nearby deals
  useEffect(() => {
    const loadNearbyDeals = async () => {
      try {
        // Using New York coords as default
        const response = await promotionsAPI.listPromotions({
          latitude: 40.7128,
          longitude: -74.006,
          radius: 10,
          limit: 6,
        });
        setNearbyDeals(response.data?.promotions || []);
      } catch (error) {
        console.error('Failed to load nearby deals:', error);
      }
    };
    loadNearbyDeals();
  }, []);

  const handleSearch = () => {
    promotions.fetch();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleClaimDeal = async (dealId: string) => {
    try {
      setClaimingDealId(dealId);
      // Implement claim logic here - will be connected to backend
      toast.success('Deal claimed successfully!');
      navigate('/account');
    } catch (err: any) {
      handleErrorResponse(err, true);
    } finally {
      setClaimingDealId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Airbnb-inspired */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img
            src="https://assets-gen.codenut.dev/images/1762645127_252bf150.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="font-sans font-bold text-5xl md:text-7xl mb-6 leading-tight tracking-tight">
                  Discover deals
                  <br />
                  <span className="text-primary">worth owning</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  Exclusive offers you can claim, own, and trade. Real savings, real value.
                </p>
              </motion.div>

              {/* Search Bar - Airbnb style */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-2 shadow-xl border-0 bg-white">
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Search destinations, restaurants, experiences..."
                        className="pl-12 h-14 border-0 text-base focus-visible:ring-0"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button 
                      size="lg" 
                      onClick={handleSearch}
                      className="h-14 px-8 text-base font-semibold"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Trust Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
              >
                {trustStats.map((stat, index) => (
                  <div key={index} className="text-center md:text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Feed */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-3xl font-bold">Trending now</h2>
                <Badge className="bg-accent text-white border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Hot
                </Badge>
              </div>
            </div>
            <div className="lg:max-w-sm">
              <SocialProofFeed />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Deals - TikTok-inspired horizontal scroll */}
      {trendingDeals.length > 0 && (
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-3xl font-bold">Trending now</h2>
                <Badge className="bg-accent text-white border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Hot
                </Badge>
              </div>
              <Button variant="ghost" onClick={() => navigate('/marketplace')}>
                View all
              </Button>
            </div>
            
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              navigation
              className="pb-12"
            >
              {trendingDeals.map((deal) => (
                <SwiperSlide key={deal._id}>
                  <DealCard
                    deal={deal}
                    onClaim={handleClaimDeal}
                    isClaiming={claimingDealId === deal._id}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* How It Works - Airbnb-inspired trust building */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How DealChain works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start saving and owning your deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Near You - DoorDash-inspired location */}
      {nearbyDeals.length > 0 && (
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-accent rounded-full" />
                <h2 className="text-3xl font-bold">Near you</h2>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  New York, NY
                </Badge>
              </div>
              <Button variant="ghost" onClick={() => navigate('/geo-discovery')}>
                Explore map
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyDeals.slice(0, 6).map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  onClaim={handleClaimDeal}
                  isClaiming={claimingDealId === deal._id}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filters - Clean tabs */}
      <section className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
            <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category} 
                  className="capitalize text-base px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Deals Grid - Airbnb-inspired card layout */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              {selectedCategory === 'all' ? 'All deals' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/group-deals')}>
                <Users className="w-4 h-4 mr-2" />
                Group deals
              </Button>
            </div>
          </div>

          {promotions.isLoading && promotions.page === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (promotions.items || []).length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No deals found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              {promotions.error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{promotions.error.message}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.items.map((deal, index) => (
                  <motion.div
                    key={deal._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <DealCard
                      deal={deal}
                      onClaim={handleClaimDeal}
                      isLoading={claimingDealId === deal._id}
                    />
                  </motion.div>
                ))}
              </div>

              {promotions.hasMore && (
                <div className="text-center mt-12">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => promotions.loadMore()}
                    disabled={promotions.isLoading}
                    className="px-8"
                  >
                    {promotions.isLoading ? 'Loading...' : 'Show more deals'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join millions saving smarter
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Start discovering exclusive deals and turn your savings into digital assets you truly own
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/signup')}
              className="px-8 text-base font-semibold"
            >
              Get started for free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
