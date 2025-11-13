import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Clock, Users, TrendingUp, DollarSign, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { auctionsAPI } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonCard';

interface Auction {
  id: string;
  _id?: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  highestBid?: number;
  startingPrice?: number;
  minBid: number;
  bidIncrement: number;
  currency: string;
  endsAt: string;
  endTime?: string;
  totalBids: number;
  bidCount?: number;
  category: string;
  merchant: {
    id: string;
    name: string;
    logo: string;
  };
  seller?: {
    walletAddress: string;
    username?: string;
  };
  coupon?: {
    id: string;
    promotion: {
      title: string;
      description: string;
      category: string;
      imageUrl?: string;
    };
  };
  status: 'active' | 'ending-soon' | 'ended' | 'completed' | 'cancelled';
}

export const Auctions: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingBid, setIsPlacingBid] = useState<Record<string, boolean>>({});

  // Load auctions from API
  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      setIsLoading(true);
      const response = await auctionsAPI.listAuctions({ status: 'active' });

      // Transform backend data to match frontend interface
      const transformedAuctions = (response.items || []).map((auction: any) => {
        const auctionId = auction._id || auction.id;
        const title = auction.coupon?.promotion?.title || auction.title || 'Untitled Auction';
        const description = auction.coupon?.promotion?.description || auction.description || '';
        const category = auction.coupon?.promotion?.category || auction.category || 'general';
        const imageUrl = auction.coupon?.promotion?.imageUrl || auction.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80';

        return {
          id: auctionId,
          _id: auctionId,
          title,
          description,
          imageUrl,
          currentBid: auction.highestBid || auction.startingPrice || auction.currentBid || 0,
          minBid: auction.startingPrice || auction.minBid || 0,
          bidIncrement: auction.bidIncrement || 10,
          currency: 'USD',
          endsAt: auction.endTime || auction.endsAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          totalBids: auction.bidCount || auction.totalBids || 0,
          category,
          merchant: auction.merchant || auction.seller ? {
            id: auction.merchant?.id || auction.seller?.walletAddress || 'unknown',
            name: auction.merchant?.name || auction.seller?.username || 'Unknown Seller',
            logo: auction.merchant?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${auction.seller?.username || 'U'}`,
          } : {
            id: 'unknown',
            name: 'Unknown Seller',
            logo: 'https://api.dicebear.com/7.x/initials/svg?seed=U',
          },
          status: determineAuctionStatus(auction.endTime || auction.endsAt, auction.status),
          seller: auction.seller,
          coupon: auction.coupon,
        };
      });

      setAuctions(transformedAuctions);
    } catch (error: any) {
      console.error('Failed to load auctions:', error);
      toast.error(error.response?.data?.message || 'Failed to load auctions');
    } finally {
      setIsLoading(false);
    }
  };

  const determineAuctionStatus = (endTime: string, backendStatus?: string): 'active' | 'ending-soon' | 'ended' => {
    if (backendStatus === 'completed' || backendStatus === 'cancelled') {
      return 'ended';
    }
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;

    if (distance < 0) return 'ended';
    if (distance < 2 * 60 * 60 * 1000) return 'ending-soon'; // Less than 2 hours
    return 'active';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {};
      auctions.forEach((auction) => {
        const now = new Date().getTime();
        const end = new Date(auction.endsAt).getTime();
        const distance = end - now;

        if (distance < 0) {
          newTimeRemaining[auction.id] = 'Ended';
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          newTimeRemaining[auction.id] = `${hours}h ${minutes}m ${seconds}s`;
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  const handlePlaceBid = async (auctionId: string) => {
    const auction = auctions.find((a) => a.id === auctionId);
    const bidAmount = bidAmounts[auctionId];
    const walletAddress = localStorage.getItem('walletAddress');

    if (!walletAddress) {
      toast.error('Please connect your wallet to place a bid');
      return;
    }

    if (!auction || !bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }

    if (bidAmount < auction.currentBid + auction.bidIncrement) {
      toast.error(`Minimum bid is ${auction.currency} ${auction.currentBid + auction.bidIncrement}`);
      return;
    }

    try {
      setIsPlacingBid((prev) => ({ ...prev, [auctionId]: true }));

      await auctionsAPI.placeBid(auctionId, walletAddress, bidAmount);

      toast.success('Bid placed successfully!');
      setBidAmounts((prev) => ({ ...prev, [auctionId]: 0 }));

      // Reload auctions to get updated data
      await loadAuctions();
    } catch (error: any) {
      console.error('Failed to place bid:', error);
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setIsPlacingBid((prev) => ({ ...prev, [auctionId]: false }));
    }
  };

  const filteredAuctions = selectedCategory === 'all'
    ? auctions
    : auctions.filter((a) => a.category === selectedCategory);

  const categories = ['all', 'experiences', 'hotels', 'restaurants', 'shopping'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Live Auctions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bid on exclusive deals and experiences. The highest bidder wins!
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{auctions.filter(a => a.status === 'active').length}</p>
                  <p className="text-sm text-gray-600">Active Auctions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{auctions.filter(a => a.status === 'ending-soon').length}</p>
                  <p className="text-sm text-gray-600">Ending Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{auctions.reduce((sum, a) => sum + a.totalBids, 0)}</p>
                  <p className="text-sm text-gray-600">Total Bids</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${auctions.reduce((sum, a) => sum + a.currentBid, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={auction.imageUrl}
                    alt={auction.title}
                    className="w-full h-48 object-cover"
                  />
                  {auction.status === 'ending-soon' && (
                    <Badge className="absolute top-3 right-3 bg-red-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Ending Soon
                    </Badge>
                  )}
                  <Badge className="absolute top-3 left-3 capitalize">
                    {auction.category}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">{auction.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {auction.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Current Bid */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Current Bid</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {auction.currency} {auction.currentBid.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-semibold text-red-600">
                      {timeRemaining[auction.id] || 'Calculating...'}
                    </span>
                  </div>

                  {/* Bid Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-semibold">{auction.totalBids}</span>
                  </div>

                  {/* Bid Input */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`Min: ${auction.currentBid + auction.bidIncrement}`}
                        value={bidAmounts[auction.id] || ''}
                        onChange={(e) =>
                          setBidAmounts((prev) => ({
                            ...prev,
                            [auction.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        min={auction.currentBid + auction.bidIncrement}
                        step={auction.bidIncrement}
                      />
                      <Button onClick={() => handlePlaceBid(auction.id)}>
                        Bid
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum increment: {auction.currency} {auction.bidIncrement}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <div className="flex items-center gap-2 w-full">
                    <img
                      src={auction.merchant.logo}
                      alt={auction.merchant.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-600">{auction.merchant.name}</span>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No auctions found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};