import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  timestamp: string;
  helpful: number;
  userHelpful?: boolean;
}

interface RatingsReviewsProps {
  dealId: string;
  averageRating: number;
  totalRatings: number;
  reviews?: Review[];
}

// Mock data removed - reviews should be loaded from API
const mockReviews: Review[] = [];

export default function RatingsReviews({ dealId, averageRating, totalRatings, reviews = [] }: RatingsReviewsProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSubmitReview = () => {
    if (userRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback"
    });

    setUserRating(0);
    setReviewText('');
  };

  const handleHelpful = (reviewId: string) => {
    setHelpfulReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });

    toast({
      title: helpfulReviews.has(reviewId) ? "Removed" : "Marked as Helpful",
      description: helpfulReviews.has(reviewId) ? "Feedback removed" : "Thanks for your feedback"
    });
  };

  const ratingDistribution = [
    { stars: 5, count: Math.floor(totalRatings * 0.6) },
    { stars: 4, count: Math.floor(totalRatings * 0.25) },
    { stars: 3, count: Math.floor(totalRatings * 0.1) },
    { stars: 2, count: Math.floor(totalRatings * 0.03) },
    { stars: 1, count: Math.floor(totalRatings * 0.02) }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Summary */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalRatings} ratings
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-2">
                <span className="text-sm w-8">{dist.stars}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${(dist.count / totalRatings) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {dist.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Write Review */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Write a Review</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setUserRating(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= (hoverRating || userRating)
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
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitReview}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Submit Review
          </Button>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Customer Reviews</h3>
        {reviews.map((review) => (
          <Card key={review.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                {review.user.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <code className="text-sm font-medium">{review.user}</code>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.timestamp).toLocaleDateString()}
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
                <p className="text-sm mb-3">{review.comment}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className={helpfulReviews.has(review.id) ? 'text-primary' : ''}
                >
                  <ThumbsUp className={`w-4 h-4 mr-2 ${helpfulReviews.has(review.id) ? 'fill-current' : ''}`} />
                  Helpful ({review.helpful + (helpfulReviews.has(review.id) ? 1 : 0)})
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
