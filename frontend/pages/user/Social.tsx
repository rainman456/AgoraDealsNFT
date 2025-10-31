import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, Heart, Share2, Eye, Star, MessageCircle, 
  Flame, Clock, ThumbsUp, Twitter, Facebook, Link2,
  Award, Users, Zap
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SocialDeal {
  id: string;
  title: string;
  merchant: string;
  image: string;
  discount: number;
  category: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  rating: number;
  totalRatings: number;
  trending: boolean;
  timeframe: '24h' | '7d' | '30d';
}

interface Review {
  id: string;
  dealId: string;
  user: string;
  rating: number;
  comment: string;
  timestamp: string;
  helpful: number;
}

const mockTrendingDeals: SocialDeal[] = [
  {
    id: '1',
    title: '70% Off Luxury Spa Day',
    merchant: 'Zen Wellness Spa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
    discount: 70,
    category: 'Wellness',
    views: 12500,
    likes: 3400,
    shares: 890,
    comments: 234,
    rating: 4.8,
    totalRatings: 567,
    trending: true,
    timeframe: '24h'
  },
  {
    id: '2',
    title: '50% Off Michelin Star Dinner',
    merchant: 'Culinary Delights',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    discount: 50,
    category: 'Dining',
    views: 9800,
    likes: 2100,
    shares: 650,
    comments: 189,
    rating: 4.9,
    totalRatings: 423,
    trending: true,
    timeframe: '24h'
  },
  {
    id: '3',
    title: '60% Off Adventure Park',
    merchant: 'Adventure World',
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=400&fit=crop',
    discount: 60,
    category: 'Entertainment',
    views: 8900,
    likes: 1800,
    shares: 520,
    comments: 145,
    rating: 4.7,
    totalRatings: 389,
    trending: true,
    timeframe: '7d'
  },
  {
    id: '4',
    title: '80% Off Yoga Classes',
    merchant: 'Flow Yoga Studio',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    discount: 80,
    category: 'Fitness',
    views: 7600,
    likes: 1500,
    shares: 430,
    comments: 98,
    rating: 4.6,
    totalRatings: 312,
    trending: false,
    timeframe: '7d'
  }
];

const mockReviews: Review[] = [
  {
    id: '1',
    dealId: '1',
    user: '0x1234...5678',
    rating: 5,
    comment: 'Amazing deal! The spa experience was absolutely worth it. Highly recommend!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    helpful: 45
  },
  {
    id: '2',
    dealId: '1',
    user: '0xabcd...efgh',
    rating: 4,
    comment: 'Great value for money. The massage was relaxing and the staff was professional.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    helpful: 32
  },
  {
    id: '3',
    dealId: '2',
    user: '0x9876...5432',
    rating: 5,
    comment: 'Best dining experience ever! The food was exquisite and the ambiance perfect.',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    helpful: 67
  }
];

export default function Social() {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedDeal, setSelectedDeal] = useState<SocialDeal | null>(null);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [likedDeals, setLikedDeals] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredDeals = mockTrendingDeals.filter(deal => 
    timeframe === '24h' ? true : deal.timeframe === timeframe || deal.timeframe === '24h'
  );

  const handleLike = (dealId: string) => {
    setLikedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });

    toast({
      title: likedDeals.has(dealId) ? "Removed from favorites" : "Added to favorites",
      description: likedDeals.has(dealId) ? "Deal removed from your favorites" : "Deal added to your favorites"
    });
  };

  const handleShare = (platform: string, deal: SocialDeal) => {
    toast({
      title: `Shared on ${platform}!`,
      description: `"${deal.title}" has been shared successfully`
    });
  };

  const handleSubmitReview = () => {
    if (!newReview.trim()) return;

    toast({
      title: "Review Posted!",
      description: "Thank you for sharing your experience"
    });

    setNewReview('');
    setNewRating(5);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Social Feed</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Discover trending deals, share your favorites, and read reviews
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockTrendingDeals.filter(d => d.trending).length}</p>
            <p className="text-xs text-muted-foreground">Trending Now</p>
          </Card>
          <Card className="p-4 text-center">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatNumber(mockTrendingDeals.reduce((sum, d) => sum + d.views, 0))}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </Card>
          <Card className="p-4 text-center">
            <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatNumber(mockTrendingDeals.reduce((sum, d) => sum + d.likes, 0))}</p>
            <p className="text-xs text-muted-foreground">Total Likes</p>
          </Card>
          <Card className="p-4 text-center">
            <Share2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatNumber(mockTrendingDeals.reduce((sum, d) => sum + d.shares, 0))}</p>
            <p className="text-xs text-muted-foreground">Total Shares</p>
          </Card>
        </div>

        <Tabs defaultValue="trending" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="popular">
              <Award className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageCircle className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {/* Timeframe Filter */}
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  onClick={() => setTimeframe(tf)}
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {tf === '24h' ? 'Today' : tf === '7d' ? 'This Week' : 'This Month'}
                </Button>
              ))}
            </div>

            {/* Trending Deals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDeals.map((deal, index) => (
                <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video">
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {deal.trending && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3" />
                        #{index + 1} TRENDING
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold">
                      {deal.discount}% OFF
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-3 text-white text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(deal.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {formatNumber(deal.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          {formatNumber(deal.shares)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{deal.title}</h3>
                        <p className="text-sm text-muted-foreground">{deal.merchant}</p>
                      </div>
                      <Badge variant="outline">{deal.category}</Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(deal.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{deal.rating}</span>
                      <span className="text-xs text-muted-foreground">({deal.totalRatings} reviews)</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={likedDeals.has(deal.id) ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLike(deal.id)}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${likedDeals.has(deal.id) ? 'fill-current' : ''}`} />
                        {likedDeals.has(deal.id) ? 'Liked' : 'Like'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {deal.comments}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {mockTrendingDeals
                .sort((a, b) => b.likes - a.likes)
                .map((deal, index) => (
                  <Card key={deal.id} className="p-5 flex gap-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-xl">
                      #{index + 1}
                    </div>
                    <img src={deal.image} alt={deal.title} className="w-24 h-24 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{deal.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{deal.merchant}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          {formatNumber(deal.likes)} likes
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          {deal.rating} ({deal.totalRatings})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        {deal.discount}% OFF
                      </Badge>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {/* Write Review */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setNewRating(rating)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= newRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                  <Textarea
                    placeholder="Share your experience with this deal..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitReview} disabled={!newReview.trim()}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Post Review
                </Button>
              </div>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {mockReviews.map((review) => {
                const deal = mockTrendingDeals.find(d => d.id === review.dealId);
                return (
                  <Card key={review.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {review.user.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <code className="text-sm font-medium">{review.user}</code>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {deal && (
                          <p className="text-sm font-medium text-primary mb-2">{deal.title}</p>
                        )}
                        <p className="text-sm mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Helpful ({review.helpful})
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Share Deal</h3>
            <p className="text-sm text-muted-foreground mb-6">{selectedDeal.title}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                onClick={() => handleShare('Twitter', selectedDeal)}
                className="flex items-center gap-2"
              >
                <Twitter className="w-5 h-5 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('Facebook', selectedDeal)}
                className="flex items-center gap-2"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('Copy Link', selectedDeal)}
                className="flex items-center gap-2 col-span-2"
              >
                <Link2 className="w-5 h-5" />
                Copy Link
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSelectedDeal(null)}>
              Close
            </Button>
          </Card>
        </div>
      )}
    </main>
  );
}
