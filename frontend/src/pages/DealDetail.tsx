import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dealsAPI, socialAPI, Deal } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { MapPin, Clock, Star, Share2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: string;
  user: { name: string; avatar?: string };
  comment: string;
  createdAt: string;
}

export const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (id) {
      loadDeal();
      loadComments();
    }
  }, [id]);

  useEffect(() => {
    if (!deal) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiry = deal.expiresAt ? new Date(deal.expiresAt) : new Date();
      
      if (expiry <= now) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = differenceInDays(expiry, now);
      const hours = differenceInHours(expiry, now) % 24;
      const minutes = differenceInMinutes(expiry, now) % 60;
      const seconds = differenceInSeconds(expiry, now) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deal]);

  const loadDeal = async () => {
    try {
      setIsLoading(true);
      const data = await dealsAPI.getDealById(id!);
      setDeal(data);
    } catch (error) {
      console.error('Failed to load deal:', error);
      toast.error('Failed to load deal details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await socialAPI.getComments(id!);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await dealsAPI.claimDeal(id!);
      toast.success('Deal claimed successfully! Check your account.');
      navigate('/account');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to claim deal');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShare = async (platform: string) => {
    try {
      await socialAPI.shareDeal(id!, platform);
      toast.success(`Shared on ${platform}!`);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await socialAPI.addComment(id!, newComment);
      setNewComment('');
      loadComments();
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleRate = async (newRating: number) => {
    try {
      await dealsAPI.rateDeal(id!, newRating);
      setRating(newRating);
      toast.success('Rating submitted!');
      loadDeal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to rate deal');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </div>
      </div>
    );
  }

  if (!deal) return null;

  const expiresIn = deal.expiresAt ? formatDistanceToNow(new Date(deal.expiresAt), { addSuffix: true }) : 'No expiry';
  const isExpired = deal.expiresAt ? new Date(deal.expiresAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Image */}
        <div className="relative h-96 rounded-xl overflow-hidden mb-8 shadow-2xl">
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Discount Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-accent text-accent-foreground font-bold text-2xl px-4 py-2 shadow-lg">
              {deal.discount || deal.discountPercentage || 0}% OFF
            </Badge>
          </div>

          {/* Countdown Timer */}
          {!isExpired && (
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Deal ends in:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-1">
                      <span className="text-white font-bold text-2xl">{timeLeft.days}</span>
                    </div>
                    <span className="text-white/80 text-xs">Days</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-1">
                      <span className="text-white font-bold text-2xl">{timeLeft.hours}</span>
                    </div>
                    <span className="text-white/80 text-xs">Hours</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-1">
                      <span className="text-white font-bold text-2xl">{timeLeft.minutes}</span>
                    </div>
                    <span className="text-white/80 text-xs">Mins</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-1">
                      <span className="text-white font-bold text-2xl">{timeLeft.seconds}</span>
                    </div>
                    <span className="text-white/80 text-xs">Secs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expired Overlay */}
          {isExpired && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <p className="text-white font-bold text-3xl mb-2">Deal Expired</p>
                <p className="text-white/80">This offer is no longer available</p>
              </div>
            </div>
          )}
        </div>

        {/* Deal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">
                    {deal.title}
                  </h1>
                  <Badge className="mb-4">{deal.category}</Badge>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {deal.description}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <img
                  src={typeof deal.merchant === 'object' ? deal.merchant.logo || '/placeholder-merchant.png' : '/placeholder-merchant.png'}
                  alt={typeof deal.merchant === 'object' ? deal.merchant.name : 'Merchant'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{typeof deal.merchant === 'object' ? deal.merchant.name : 'Merchant'}</p>
                  <p className="text-sm text-muted-foreground">Verified Merchant</p>
                </div>
              </div>

              {deal.location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-5 h-5" />
                  <span>{deal.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="w-5 h-5" />
                <span>Expires {expiresIn}</span>
              </div>

              {deal.rating && (
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer ${
                        star <= (rating || deal.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      onClick={() => handleRate(star)}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {deal.rating.toFixed(1)} ({deal.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Social Sharing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold text-lg mb-4">Share this deal</h3>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleShare('twitter')}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('facebook')}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </h3>

                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.user.avatar || '/placeholder-avatar.png'}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{comment.user.name}</p>
                        <p className="text-sm text-muted-foreground mb-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                        <p>{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-heading font-bold text-primary">
                      ${deal.price}
                    </span>
                    {deal.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${deal.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{deal.currency}</p>
                </div>

                {deal.maxRedemptions && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Claimed</span>
                      <span className="font-medium">
                        {deal.redemptionCount}/{deal.maxRedemptions}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${((deal.redemptionCount || 0) / deal.maxRedemptions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full mb-3"
                  size="lg"
                  onClick={handleClaim}
                  disabled={isClaiming || isExpired}
                >
                  {isClaiming ? 'Claiming...' : isExpired ? 'Expired' : 'Claim Deal'}
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Browse More Deals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
