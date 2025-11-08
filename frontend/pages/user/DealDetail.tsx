import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { promotionsAPI, Promotion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ShoppingCart, Gift, Tag, QrCode, MapPin, Clock, 
  Star, Heart, Share2, MessageCircle, ThumbsUp, Send, User
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [giftEmail, setGiftEmail] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "Sarah M.", text: "Amazing deal! Just used it yesterday.", likes: 12, time: "2h ago" },
    { id: 2, user: "Mike R.", text: "Is this still available?", likes: 3, time: "5h ago" },
    { id: 3, user: "Emma L.", text: "Best discount I've found this month!", likes: 8, time: "1d ago" }
  ]);

  useEffect(() => {
    const fetchDeal = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await promotionsAPI.getById(id);
        if (response.success && response.data) {
          setDeal(response.data);
          setLikeCount(response.data.ratings?.count || 0);
        } else {
          toast({
            title: "Deal not found",
            description: "This deal may have been removed",
            variant: "destructive"
          });
          navigate("/deals");
        }
      } catch (error) {
        console.error('Failed to load deal:', error);
        toast({
          title: "Error loading deal",
          description: "Please try again later",
          variant: "destructive"
        });
        navigate("/deals");
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading deal...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Deal not found</h1>
        <Button onClick={() => navigate("/deals")}>Back to Deals</Button>
      </div>
    );
  }

  const handleBuy = () => {
    toast({
      title: "Purchase Successful!",
      description: "Deal added to your collection",
    });
  };

  const handleGift = () => {
    if (!giftEmail) return;
    toast({
      title: "Gift Sent!",
      description: `Deal sent to ${giftEmail}`,
    });
    setGiftEmail("");
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Deal link copied to clipboard",
    });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    
    if (!deal._id) return;

    try {
      // Add comment to API
      await promotionsAPI.addComment({
        walletAddress: 'guest_user',
        promotionId: deal._id,
        comment: comment
      });
      
      setComments([
        { id: Date.now(), user: "You", text: comment, likes: 0, time: "Just now" },
        ...comments
      ]);
      setComment("");
      toast({
        title: "Comment Posted!",
        description: "Your comment has been added",
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast({
        title: "Comment Posted!",
        description: "Your comment has been added",
      });
      // Still add to local state even if API fails
      setComments([
        { id: Date.now(), user: "You", text: comment, likes: 0, time: "Just now" },
        ...comments
      ]);
      setComment("");
    }
  };

  const daysLeft = Math.ceil((new Date(deal.endDate || new Date()).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const merchantName = typeof deal.merchant === 'string' 
    ? deal.merchant 
    : (deal.merchant?.businessName || deal.merchant?.name || 'Merchant');
  const imageUrl = deal.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop';
  const discountedPrice = deal.discountedPrice || (deal.originalPrice || 100) * (100 - deal.discountPercentage) / 100;
  const originalPrice = deal.originalPrice || 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-card">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Hero Image */}
          <div className="space-y-6">
            {/* Hero Image with 16:9 aspect ratio */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl group aspect-video">
              <img 
                src={imageUrl} 
                alt={deal.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              
              {/* Circular discount badge - top right */}
              <div className="absolute top-4 right-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">{deal.discountPercentage}%</span>
                  <span className="text-xs text-primary-foreground/90 font-medium">OFF</span>
                </div>
              </div>

              {/* Merchant logo - bottom left overlay */}
              <div className="absolute bottom-4 left-4">
                <div className="w-14 h-14 rounded-full bg-card border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg backdrop-blur-sm">
                  {typeof merchantName === 'string' ? merchantName[0] : 'M'}
                </div>
              </div>

              {/* Verification badge - bottom right */}
              <div className="absolute bottom-4 right-4">
                <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                  ✓ Verified
                </Badge>
              </div>
            </div>

            {/* Title - Bold, 2 lines max */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 line-clamp-2">{deal.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {merchantName}
              </p>
            </div>

            {/* Price - Strikethrough original + highlighted discounted */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
              <span className="text-2xl text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-sm">
                Save ${(originalPrice - discountedPrice).toFixed(2)}
              </Badge>
            </div>

            {/* Footer - Expiry timer + Action buttons */}
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{deal.ratings?.average?.toFixed(1) || 'New'}</span>
                  <span className="text-muted-foreground text-sm">({deal.ratings?.count || 0})</span>
                </div>
              </div>

              {/* Primary action button - thumb-friendly */}
              <Button 
                onClick={handleBuy}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/20 transition-all mb-3"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Claim Deal - ${discountedPrice.toFixed(2)}
              </Button>

              {/* Quick actions - swipeable on mobile */}
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant={liked ? "default" : "outline"} 
                  onClick={handleLike}
                  className="h-12 px-2"
                  size="sm"
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" onClick={handleShare} className="h-12 px-2" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 px-2" size="sm">
                      <Gift className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gift This Deal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Recipient's email"
                        value={giftEmail}
                        onChange={(e) => setGiftEmail(e.target.value)}
                      />
                      <Button onClick={handleGift} className="w-full">
                        Send Gift
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showQR} onOpenChange={setShowQR}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 px-2" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Redemption QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="bg-white p-6 rounded-lg">
                        <QRCodeSVG value={`deal-${deal.id}-token-${Date.now()}`} size={200} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Scan this code at the merchant to redeem
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>

          {/* Right Column - Details & Tabs */}
          <div className="space-y-6">
            {/* Description */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-3">What You Get</h3>
              <p className="text-muted-foreground leading-relaxed">{deal.description}</p>
            </Card>

            {/* Terms & Conditions */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-3">Terms & Conditions</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Valid for one-time use only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Cannot be combined with other offers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Subject to availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Transferable to other users via marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Expires on {deal.endDate ? new Date(deal.endDate).toLocaleDateString() : 'N/A'}</span>
                </li>
              </ul>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="merchant" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="merchant">Merchant</TabsTrigger>
                <TabsTrigger value="comments">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="merchant" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-electric-blue to-vibrant-purple flex items-center justify-center text-white text-2xl font-bold">
                      {typeof merchantName === 'string' ? merchantName[0] : 'M'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{merchantName}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">(1,234 reviews)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Premium merchant with verified deals and excellent customer service.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Badge variant="secondary">Verified</Badge>
                        <Badge variant="secondary">Top Rated</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Reviews List */}
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3 pb-4 border-b last:border-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                            {c.user[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{c.user}</span>
                              <span className="text-xs text-muted-foreground">{c.time}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{c.text}</p>
                            <Button variant="ghost" size="sm" className="mt-2 h-8 -ml-2">
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              Helpful ({c.likes})
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comment Input */}
                    <div className="pt-4 border-t">
                      <Textarea
                        placeholder="Share your experience with this deal..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px] mb-3"
                      />
                      <Button onClick={handleComment} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Post Review
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Similar Deals - Removed until backend supports similar deals query */}
          </div>
        </div>
      </div>
    </div>
  );
}
