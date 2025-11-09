import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Clock, Users, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  minBid: number;
  bidIncrement: number;
  currency: string;
  endsAt: string;
  totalBids: number;
  category: string;
  merchant: {
    id: string;
    name: string;
    logo: string;
  };
  status: 'active' | 'ending-soon' | 'ended';
}

const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'Exclusive VIP Concert Tickets - Front Row',
    description: 'Premium front row seats for the biggest concert of the year. Includes backstage pass and meet & greet.',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    currentBid: 850,
    minBid: 500,
    bidIncrement: 50,
    currency: 'USD',
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    totalBids: 23,
    category: 'experiences',
    merchant: {
      id: 'm1',
      name: 'LiveEvents Pro',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LE',
    },
    status: 'ending-soon',
  },
  {
    id: '2',
    title: 'Luxury Weekend Getaway - 5-Star Resort',
    description: '3 nights at an exclusive beachfront resort with all-inclusive amenities, spa access, and private butler service.',
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    currentBid: 1200,
    minBid: 800,
    bidIncrement: 100,
    currency: 'USD',
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    totalBids: 45,
    category: 'hotels',
    merchant: {
      id: 'm2',
      name: 'Paradise Resorts',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PR',
    },
    status: 'active',
  },
  {
    id: '3',
    title: 'Private Chef Experience for 6 People',
    description: 'Michelin-starred chef will prepare a 7-course tasting menu in your home with wine pairings.',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    currentBid: 650,
    minBid: 400,
    bidIncrement: 25,
    currency: 'USD',
    endsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    totalBids: 18,
    category: 'restaurants',
    merchant: {
      id: 'm3',
      name: 'Gourmet Experiences',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GE',
    },
    status: 'active',
  },
  {
    id: '4',
    title: 'Limited Edition Designer Handbag',
    description: 'Rare limited edition luxury handbag from exclusive collection. Only 100 made worldwide.',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    currentBid: 2400,
    minBid: 2000,
    bidIncrement: 100,
    currency: 'USD',
    endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    totalBids: 67,
    category: 'shopping',
    merchant: {
      id: 'm4',
      name: 'Luxury Fashion House',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LF',
    },
    status: 'active',
  },
];

export const Auctions: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

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

  const handlePlaceBid = (auctionId: string) => {
    const auction = auctions.find((a) => a.id === auctionId);
    const bidAmount = bidAmounts[auctionId];

    if (!auction || !bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }

    if (bidAmount < auction.currentBid + auction.bidIncrement) {
      toast.error(`Minimum bid is ${auction.currency} ${auction.currentBid + auction.bidIncrement}`);
      return;
    }

    // Update auction with new bid
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? { ...a, currentBid: bidAmount, totalBids: a.totalBids + 1 }
          : a
      )
    );

    toast.success('Bid placed successfully!');
    setBidAmounts((prev) => ({ ...prev, [auctionId]: 0 }));
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
