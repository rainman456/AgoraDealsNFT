import React, { useState, useEffect } from 'react';
import { marketplaceAPI, MarketplaceListing } from '@/lib/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Filter, Tag, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

export const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'auctions'>('buy');
  
  // Filters
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadListings();
  }, [category]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const response = await marketplaceAPI.getListings({
        category: category === 'all' ? undefined : category,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        limit: 20,
      });
      setListings(response.listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
      toast.error('Failed to load marketplace listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (listingId: string) => {
    try {
      setBuyingId(listingId);
      await marketplaceAPI.buyNFT(listingId);
      toast.success('Deal purchased successfully! Check your account.');
      loadListings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purchase deal');
    } finally {
      setBuyingId(null);
    }
  };

  const applyFilters = () => {
    loadListings();
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Marketplace</h1>
          <p className="text-muted-foreground">
            Buy and sell deals from other users
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mb-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          {showFilters && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="flights">Flights</SelectItem>
                      <SelectItem value="hotels">Hotels</SelectItem>
                      <SelectItem value="restaurants">Restaurants</SelectItem>
                      <SelectItem value="experiences">Experiences</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={applyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'buy' && (
          <>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No listings available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={listing.nft?.deal?.imageUrl || '/placeholder-merchant.png'}
                    alt={listing.nft?.deal?.title || 'Deal'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-accent text-accent-foreground font-bold">
                      {listing.nft?.deal?.discount || listing.nft?.deal?.discountPercentage || 0}% OFF
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2">
                    {listing.nft?.deal?.title || 'Deal'}
                  </h3>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="font-medium">
                        {typeof listing.seller === 'object' ? (listing.seller.name || `${listing.seller.address?.slice(0, 6)}...${listing.seller.address?.slice(-4)}`) : 'Seller'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deal ID:</span>
                      <span className="font-mono">#{listing.nft?.tokenId || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Listed:</span>
                      <span>{listing.listedAt ? formatDistanceToNow(new Date(listing.listedAt), { addSuffix: true }) : 'Recently'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{listing.nft?.deal?.expiresAt ? formatDistanceToNow(new Date(listing.nft.deal.expiresAt), { addSuffix: true }) : 'No expiry'}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-heading font-bold text-primary">
                      ${listing.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {listing.currency}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(listing.id)}
                    disabled={buyingId === listing.id}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {buyingId === listing.id ? 'Purchasing...' : 'Buy Now'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'sell' && (
          <Card className="p-8 text-center">
            <Tag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-heading font-bold mb-2">List Your Deals</h3>
            <p className="text-muted-foreground mb-6">
              Go to your Account to list your deals for sale on the marketplace.
            </p>
            <Button onClick={() => window.location.href = '/account'}>
              Go to My Account
            </Button>
          </Card>
        )}

        {activeTab === 'auctions' && (
          <Card className="p-8 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-heading font-bold mb-2">Auctions Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              Bid on exclusive deals in live auctions. This feature is coming soon!
            </p>
            <Badge variant="secondary" className="text-sm">
              Coming Soon
            </Badge>
          </Card>
        )}
      </div>
    </div>
  );
};
