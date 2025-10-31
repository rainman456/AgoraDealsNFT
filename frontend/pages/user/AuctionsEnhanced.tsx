import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Gavel, Clock, TrendingUp, Zap, Users, DollarSign, 
  ArrowUp, Bell, History, Trophy, Timer, ShoppingCart 
} from "lucide-react";

interface Bid {
  bidder: string;
  amount: number;
  timestamp: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  couponDiscount: number;
  startingPrice: number;
  currentBid: number;
  reservePrice: number;
  buyNowPrice: number;
  timeLeft: number; // seconds
  totalBids: number;
  status: 'live' | 'ending_soon' | 'ended' | 'settled';
  extendOnBid: boolean;
  extensionTime: number; // seconds
  bids: Bid[];
  winner?: string;
  merchantName: string;
}

const mockAuctions: Auction[] = [
  {
    id: '1',
    title: '70% Off Luxury Spa Package',
    description: 'Premium spa day with massage, facial, and pool access',
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
    couponDiscount: 70,
    startingPrice: 10,
    currentBid: 45,
    reservePrice: 30,
    buyNowPrice: 80,
    timeLeft: 3600,
    totalBids: 12,
    status: 'live',
    extendOnBid: true,
    extensionTime: 300,
    merchantName: 'Zen Wellness Spa',
    bids: [
      { bidder: '0x1234...5678', amount: 45, timestamp: new Date(Date.now() - 120000).toISOString() },
      { bidder: '0xabcd...efgh', amount: 42, timestamp: new Date(Date.now() - 240000).toISOString() },
      { bidder: '0x9876...5432', amount: 38, timestamp: new Date(Date.now() - 360000).toISOString() }
    ]
  },
  {
    id: '2',
    title: '50% Off Michelin Star Dinner',
    description: '5-course tasting menu for two at award-winning restaurant',
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    couponDiscount: 50,
    startingPrice: 20,
    currentBid: 65,
    reservePrice: 50,
    buyNowPrice: 100,
    timeLeft: 1800,
    totalBids: 18,
    status: 'ending_soon',
    extendOnBid: true,
    extensionTime: 300,
    merchantName: 'Culinary Delights',
    bids: [
      { bidder: '0xdef0...1234', amount: 65, timestamp: new Date(Date.now() - 60000).toISOString() },
      { bidder: '0x5678...9abc', amount: 60, timestamp: new Date(Date.now() - 180000).toISOString() }
    ]
  },
  {
    id: '3',
    title: '60% Off Adventure Park Tickets',
    description: 'Full day access with fast passes for 4 people',
    category: 'Entertainment',
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=400&fit=crop',
    couponDiscount: 60,
    startingPrice: 15,
    currentBid: 55,
    reservePrice: 40,
    buyNowPrice: 90,
    timeLeft: 7200,
    totalBids: 9,
    status: 'live',
    extendOnBid: true,
    extensionTime: 300,
    merchantName: 'Adventure World',
    bids: [
      { bidder: '0xaaa1...bbb2', amount: 55, timestamp: new Date(Date.now() - 300000).toISOString() }
    ]
  },
  {
    id: '4',
    title: '80% Off Luxury Hotel Stay',
    description: '2-night stay in presidential suite with breakfast',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
    couponDiscount: 80,
    startingPrice: 50,
    currentBid: 120,
    reservePrice: 100,
    buyNowPrice: 200,
    timeLeft: 0,
    totalBids: 24,
    status: 'ended',
    extendOnBid: false,
    extensionTime: 0,
    merchantName: 'Grand Hotel',
    winner: '0x1234...5678',
    bids: [
      { bidder: '0x1234...5678', amount: 120, timestamp: new Date(Date.now() - 600000).toISOString() },
      { bidder: '0xabcd...efgh', amount: 115, timestamp: new Date(Date.now() - 720000).toISOString() }
    ]
  }
];

export default function AuctionsEnhanced() {
  const [auctions, setAuctions] = useState(mockAuctions);
  const [filter, setFilter] = useState<'all' | 'live' | 'ending_soon' | 'ended'>('all');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prev => prev.map(auction => ({
        ...auction,
        timeLeft: Math.max(0, auction.timeLeft - 1),
        status: auction.timeLeft <= 300 && auction.timeLeft > 0 ? 'ending_soon' : 
                auction.timeLeft === 0 ? 'ended' : auction.status
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (seconds: number) => {
    if (seconds === 0) return 'Ended';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handlePlaceBid = (auctionId: string) => {
    const amount = parseFloat(bidAmount);
    const auction = auctions.find(a => a.id === auctionId);
    
    if (!auction) return;
    
    if (amount <= auction.currentBid) {
      toast({
        title: "Bid Too Low",
        description: `Your bid must be higher than $${auction.currentBid}`,
        variant: "destructive"
      });
      return;
    }

    setAuctions(prev => prev.map(a => 
      a.id === auctionId 
        ? {
            ...a,
            currentBid: amount,
            totalBids: a.totalBids + 1,
            timeLeft: a.extendOnBid && a.timeLeft < a.extensionTime ? a.timeLeft + a.extensionTime : a.timeLeft,
            bids: [
              { bidder: '0xYou...1234', amount, timestamp: new Date().toISOString() },
              ...a.bids
            ]
          }
        : a
    ));

    toast({
      title: "🎉 Bid Placed!",
      description: `Your bid of $${amount} has been placed successfully`
    });

    setBidAmount('');
    setSelectedAuction(null);
  };

  const handleBuyNow = (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) return;

    toast({
      title: "🎊 Purchase Successful!",
      description: `You bought the coupon for $${auction.buyNowPrice}`
    });

    setAuctions(prev => prev.map(a => 
      a.id === auctionId 
        ? { ...a, status: 'settled' as const, winner: '0xYou...1234' }
        : a
    ));
    setSelectedAuction(null);
  };

  const filteredAuctions = auctions.filter(a => 
    filter === 'all' || a.status === filter
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      ending_soon: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse',
      ended: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
      settled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return variants[status as keyof typeof variants];
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Live Auctions</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Bid on exclusive coupon deals and win amazing discounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Gavel className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{auctions.filter(a => a.status === 'live').length}</p>
            <p className="text-xs text-muted-foreground">Live Auctions</p>
          </Card>
          <Card className="p-4 text-center">
            <Timer className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{auctions.filter(a => a.status === 'ending_soon').length}</p>
            <p className="text-xs text-muted-foreground">Ending Soon</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{auctions.reduce((sum, a) => sum + a.totalBids, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Bids</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{auctions.filter(a => a.status === 'ended').length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'live', 'ending_soon', 'ended'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize whitespace-nowrap"
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <Card key={auction.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative aspect-video">
                <img src={auction.image} alt={auction.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Discount Badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                  {auction.couponDiscount}% OFF
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={getStatusBadge(auction.status)}>
                    {auction.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Timer */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">{formatTimeLeft(auction.timeLeft)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{auction.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{auction.merchantName}</p>

                {/* Current Bid */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Current Bid</span>
                    {auction.currentBid >= auction.reservePrice && (
                      <Badge variant="outline" className="text-xs">Reserve Met</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">${auction.currentBid}</span>
                    <span className="text-sm text-muted-foreground">({auction.totalBids} bids)</span>
                  </div>
                </div>

                {/* Buy Now Price */}
                <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">Buy Now</span>
                  <span className="text-sm font-bold">${auction.buyNowPrice}</span>
                </div>

                {/* Actions */}
                {auction.status === 'live' || auction.status === 'ending_soon' ? (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => setSelectedAuction(auction)}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleBuyNow(auction.id)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                ) : auction.winner ? (
                  <Button disabled className="w-full">
                    <Trophy className="w-4 h-4 mr-2" />
                    {auction.winner === '0xYou...1234' ? 'You Won!' : 'Auction Ended'}
                  </Button>
                ) : (
                  <Button disabled className="w-full">Auction Ended</Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <Gavel className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
            <p className="text-muted-foreground">Check back soon for new auctions</p>
          </div>
        )}
      </div>

      {/* Bid Dialog */}
      <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
          </DialogHeader>

          {selectedAuction && (
            <div className="space-y-6">
              {/* Auction Info */}
              <div className="flex gap-4">
                <img 
                  src={selectedAuction.image} 
                  alt={selectedAuction.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{selectedAuction.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedAuction.merchantName}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadge(selectedAuction.status)}>
                      {selectedAuction.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatTimeLeft(selectedAuction.timeLeft)} left
                    </span>
                  </div>
                </div>
              </div>

              {/* Bid Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
                  <p className="text-xl font-bold text-primary">${selectedAuction.currentBid}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reserve Price</p>
                  <p className="text-xl font-bold">${selectedAuction.reservePrice}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Buy Now</p>
                  <p className="text-xl font-bold">${selectedAuction.buyNowPrice}</p>
                </div>
              </div>

              {/* Bid Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Bid Amount</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder={`Min: $${selectedAuction.currentBid + 1}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="pl-9"
                      min={selectedAuction.currentBid + 1}
                      step="0.01"
                    />
                  </div>
                  <Button onClick={() => setBidAmount((selectedAuction.currentBid + 5).toString())}>
                    +$5
                  </Button>
                  <Button onClick={() => setBidAmount((selectedAuction.currentBid + 10).toString())}>
                    +$10
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedAuction.extendOnBid && `⏱️ Bidding extends auction by ${selectedAuction.extensionTime / 60} minutes`}
                </p>
              </div>

              {/* Bid History */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Bid History ({selectedAuction.bids.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedAuction.bids.map((bid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-green-500" />
                        <code className="text-xs">{bid.bidder}</code>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${bid.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handlePlaceBid(selectedAuction.id)}
                  disabled={!bidAmount || parseFloat(bidAmount) <= selectedAuction.currentBid}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Place Bid
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBuyNow(selectedAuction.id)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now ${selectedAuction.buyNowPrice}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
