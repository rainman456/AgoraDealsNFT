import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Share2, Heart, MessageSquare, Star, Zap, Shield, Gift, ArrowLeft, Copy, Check, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupDealVisualization } from '@/components/shared/GroupDealVisualization';
import { RedemptionSuccess } from '@/components/shared/RedemptionSuccess';
import { promotionsAPI, couponsAPI, Promotion } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadDeal = async () => {
      if (!id || id === 'undefined') {
        toast({
          title: "Oops!",
          description: "We couldn't find that deal",
          variant: "destructive"
        });
        navigate('/deals');
        return;
      }
      
      try {
        setLoading(true);
        const response = await promotionsAPI.getDetails(id);
        
        if (response.success) {
          setDeal(response.data);
        } else {
          toast({
            title: "Deal not found",
            description: "This deal may have expired or been removed",
            variant: "destructive"
          });
          navigate('/deals');
        }
      } catch (error) {
        console.error('Failed to load deal:', error);
        toast({
          title: "Connection error",
          description: "Please check your internet and try again",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDeal();
  }, [id, toast, navigate]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this amazing ${deal.discountPercentage}% off deal: ${deal.title}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: shareText,
          url: shareUrl
        });
        toast({
          title: "Thanks for sharing! 🎉",
          description: "You just earned 5 bonus points",
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share this deal with your friends",
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      toast({
        title: "Saved! ❤️",
        description: "Find this deal in your favorites",
      });
    }
  };

  if (loading || !deal) {
    return (
      <main className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="aspect-[4/3] md:aspect-video bg-muted rounded-2xl" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleMintCoupon = async () => {
    if (!user?.walletAddress || !id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to claim this deal",
        variant: "destructive"
      });
      return;
    }

    try {
      setMinting(true);
      const response = await couponsAPI.mint({
        promotionId: id,
        recipientAddress: user.walletAddress,
        walletAddress: user.walletAddress
      });

      if (response.success) {
        setShowSuccess(true);
        toast({
          title: "Deal claimed! 🎉",
          description: "Check your profile to redeem it"
        });
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        toast({
          title: "Oops!",
          description: response.message || "Something went wrong. Try again?",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to mint coupon:', error);
      toast({
        title: "Connection error",
        description: "Please check your internet and try again",
        variant: "destructive"
      });
    } finally {
      setMinting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user?.walletAddress || !id || rating === 0) return;

    try {
      setSubmittingRating(true);
      const response = await promotionsAPI.rate({
        walletAddress: user.walletAddress,
        promotionId: id,
        rating
      });

      if (response.success) {
        toast({
          title: "Thanks for rating! ⭐",
          description: "Your feedback helps others discover great deals"
        });
        setRating(0);
        const dealResponse = await promotionsAPI.getDetails(id);
        if (dealResponse.success) {
          setDeal(dealResponse.data);
        }
      } else {
        toast({
          title: "Oops!",
          description: response.message || "Couldn't submit rating. Try again?",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast({
        title: "Connection error",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user?.walletAddress || !id || !comment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await promotionsAPI.addComment({
        walletAddress: user.walletAddress,
        promotionId: id,
        comment: comment.trim()
      });

      if (response.success) {
        toast({
          title: "Comment posted! 💬",
          description: "Thanks for sharing your thoughts"
        });
        setComment('');
      } else {
        toast({
          title: "Oops!",
          description: response.message || "Couldn't post comment. Try again?",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Connection error",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Mock group deal data
  const groupDealTiers = [
    { participants: 20, discount: 30, price: 84, unlocked: true },
    { participants: 50, discount: 40, price: 72, unlocked: true },
    { participants: 75, discount: 50, price: 60, unlocked: false },
    { participants: 100, discount: 60, price: 48, unlocked: false }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  const endsAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const originalPrice = deal.price || 100;
  const discountedPrice = (originalPrice * (1 - deal.discountPercentage / 100)).toFixed(2);
  const savings = (originalPrice - parseFloat(discountedPrice)).toFixed(2);
  
  // Safely extract merchant name as string
  const merchantName = typeof deal.merchant === 'string' 
    ? deal.merchant 
    : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant');

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-0">
      {showSuccess && (
        <RedemptionSuccess
          dealTitle={deal.title}
          merchantName={merchantName}
          savingsAmount={parseFloat(savings)}
          reputationGain={10}
          currentLevel={12}
          levelProgress={65}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Back Button - Mobile Friendly */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left Column - Deal Info */}
          <div>
            {/* Image - Mobile Optimized */}
            <div className="relative aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden mb-6 shadow-2xl">
              {deal.imageUrl ? (
                <img
                  src={deal.imageUrl}
                  alt={deal.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <Gift className="w-20 h-20 text-primary/40" />
                </div>
              )}
              
              {/* Floating Discount Badge */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-white font-bold text-xl md:text-2xl px-4 py-2 shadow-2xl animate-pulse-slow">
                  {deal.discountPercentage}% OFF
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleLike}
                  className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
                >
                  {copied ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Share2 className="w-6 h-6 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Group Deal Badge */}
              {deal.maxSupply > 10 && (
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-accent text-white font-bold text-sm px-3 py-1.5 shadow-lg">
                    <Users className="w-4 h-4 mr-1" />
                    Group Deal Active
                  </Badge>
                </div>
              )}
            </div>

            {/* Title & Quick Actions */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                {deal.title}
              </h1>
              
              {/* Merchant Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                    {merchantName}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-0 font-bold">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>

              {/* Trust Signals & Quick Info */}
              <div className="flex flex-wrap gap-3 md:gap-4 text-sm md:text-base mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {deal.stats?.averageRating > 0 ? deal.stats.averageRating.toFixed(1) : '4.8'} 
                    <span className="text-xs ml-1">({deal.stats?.totalRatings || 127} reviews)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="font-semibold">{deal.stats?.totalRedeemed || 234}+ claimed</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  <span className="font-semibold">Trending</span>
                </div>
              </div>

              {/* Location & Time */}
              <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {typeof deal.merchant === 'object' && deal.merchant?.location?.address 
                      ? deal.merchant.location.address 
                      : '0.5 mi away'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Valid until {new Date(deal.expiryTimestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Savings Highlight - Mobile Optimized */}
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">You Save</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">${savings}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground line-through mb-1">${originalPrice}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">${discountedPrice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                What You Get
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {deal.description || 'Experience an amazing offer from one of our trusted merchants. This exclusive deal provides exceptional value and quality service that you and your friends will love!'}
              </p>
            </div>

            {/* Share to Unlock More */}
            <Card className="mb-6 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-secondary/5">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Share & Earn Bonus Rewards!</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Share this deal with 3 friends and unlock an extra 5% off + bonus points
                    </p>
                    <Button
                      onClick={handleShare}
                      className="w-full md:w-auto bg-accent text-white hover:bg-accent/90 font-bold"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms - Collapsible on Mobile */}
            <details className="p-4 md:p-6 bg-muted/30 rounded-2xl">
              <summary className="font-bold text-base md:text-lg cursor-pointer">Terms & Conditions</summary>
              <ul className="text-sm text-muted-foreground space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Valid for new and existing customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>One redemption per person per deal</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Can be combined with group discounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Reservation recommended but not required</span>
                </li>
              </ul>
            </details>
          </div>

          {/* Right Column - Action Cards */}
          <div className="lg:sticky lg:top-8 h-fit space-y-6">
            {/* Group Deal Visualization */}
            {deal.maxSupply > 10 && (
              <Card className="border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Up & Save More! 🎉
                  </h3>
                  <p className="text-sm opacity-90 mt-1">The more friends join, the bigger the discount</p>
                </div>
                <CardContent className="p-6">
                  <GroupDealVisualization
                    dealTitle={deal.title}
                    originalPrice={originalPrice}
                    currentParticipants={47}
                    tiers={groupDealTiers}
                    endsAt={endsAt}
                    friendsJoined={['Sarah M.', 'Mike R.', 'Emma L.', 'David K.']}
                  />
                </CardContent>
              </Card>
            )}

            {/* Main CTA - Mobile Optimized */}
            <Card className="border-2 border-primary/30 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Current Price</p>
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-primary">
                      ${discountedPrice}
                    </span>
                    <span className="text-xl text-muted-foreground line-through">
                      ${originalPrice}
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0 font-bold text-base px-4 py-1">
                    Save ${savings}
                  </Badge>
                </div>

                <Button
                  onClick={handleMintCoupon}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 font-bold text-lg py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all mb-4"
                  disabled={minting || !user}
                >
                  {minting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Claim This Deal
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-xs text-center text-muted-foreground">
                    Sign in to claim this amazing deal
                  </p>
                )}

                {/* Availability Progress */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-medium">
                      {deal.currentSupply || 0} / {deal.maxSupply} claimed
                    </span>
                    {deal.maxSupply - (deal.currentSupply || 0) <= 10 && (
                      <Badge variant="destructive" className="text-xs font-bold animate-pulse">
                        <Zap className="w-3 h-3 mr-1" />
                        Almost Gone!
                      </Badge>
                    )}
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${Math.min(((deal.currentSupply || 0) / deal.maxSupply) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating & Comments */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Rate This Deal
                </h3>
                <div className="flex gap-2 justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-125 active:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 md:w-10 md:h-10 ${
                          star <= rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || submittingRating || !user}
                  className="w-full mb-6 bg-primary text-white hover:bg-primary/90"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>

                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Share Your Thoughts
                </h3>
                <Textarea
                  placeholder="Tell others what you think about this deal..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-4 min-h-[100px]"
                  rows={3}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || submittingComment || !user}
                  className="w-full bg-accent text-white hover:bg-accent/90"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
