import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Heart, MessageCircle, Star, ThumbsUp, Share2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  dealId: string;
  dealTitle: string;
  rating: number;
  comment: string;
  images?: string[];
  likes: number;
  replies: number;
  createdAt: string;
  verified: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    dealId: 'd1',
    dealTitle: '50% Off Business Class Flights to Tokyo',
    rating: 5,
    comment: 'Amazing deal! The flight was comfortable and the service was exceptional. Saved over $1000 with this deal. Highly recommend!',
    images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80'],
    likes: 45,
    replies: 3,
    createdAt: '2024-01-15T10:30:00Z',
    verified: true,
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Michael Chen',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    dealId: 'd2',
    dealTitle: 'Luxury Resort Stay - 3 Nights in Bali',
    rating: 5,
    comment: 'The resort exceeded all expectations. Private beach, amazing spa, and incredible food. This deal was an absolute steal!',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
    ],
    likes: 67,
    replies: 8,
    createdAt: '2024-01-14T15:20:00Z',
    verified: true,
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Emma Davis',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    dealId: 'd3',
    dealTitle: 'Gourmet Dining Experience',
    rating: 4,
    comment: 'Great food and ambiance. The only downside was the wait time, but overall worth it for the price.',
    likes: 23,
    replies: 2,
    createdAt: '2024-01-13T18:45:00Z',
    verified: false,
  },
];

const mockComments: Comment[] = [
  {
    id: 'c1',
    userId: 'u4',
    userName: 'Alex Thompson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'Just redeemed this deal and it was fantastic! The merchant was very professional and the experience was seamless.',
    likes: 12,
    createdAt: '2024-01-15T12:00:00Z',
    replies: [
      {
        id: 'r1',
        userId: 'u5',
        userName: 'Lisa Wang',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
        content: 'Thanks for sharing! I was considering this deal.',
        createdAt: '2024-01-15T13:30:00Z',
      },
    ],
  },
  {
    id: 'c2',
    userId: 'u6',
    userName: 'David Martinez',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'Has anyone tried the group deal option? Wondering if it\'s worth coordinating with friends.',
    likes: 8,
    createdAt: '2024-01-14T09:15:00Z',
    replies: [
      {
        id: 'r2',
        userId: 'u7',
        userName: 'Rachel Green',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel',
        content: 'Yes! We did a group deal for a restaurant and saved even more. Totally worth it!',
        createdAt: '2024-01-14T10:45:00Z',
      },
      {
        id: 'r3',
        userId: 'u8',
        userName: 'Tom Wilson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
        content: 'Group deals are great but make sure everyone commits upfront.',
        createdAt: '2024-01-14T11:20:00Z',
      },
    ],
  },
];

export const Social: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [newComment, setNewComment] = useState('');
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleLikeReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              likes: likedReviews.has(reviewId) ? review.likes - 1 : review.likes + 1,
            }
          : review
      )
    );

    setLikedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              likes: likedComments.has(commentId) ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );

    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    const review: Review = {
      id: `r${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      dealId: 'selected-deal',
      dealTitle: 'Selected Deal',
      rating: newReview.rating,
      comment: newReview.comment,
      likes: 0,
      replies: 0,
      createdAt: new Date().toISOString(),
      verified: false,
    };

    setReviews((prev) => [review, ...prev]);
    setNewReview({ rating: 5, comment: '' });
    toast.success('Review posted successfully!');
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: newComment,
      likes: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment('');
    toast.success('Comment posted successfully!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
              Community Reviews & Discussions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Share your experiences and connect with other deal hunters
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{comments.length}</p>
                  <p className="text-sm text-gray-600">Discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            {/* Write Review */}
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
                <CardDescription>Share your experience with the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= newReview.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your experience..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={4}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleSubmitReview} className="w-full">
                  Post Review
                </Button>
              </CardFooter>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback>{review.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{review.userName}</p>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm font-medium text-purple-600">{review.dealTitle}</p>
                      <p className="text-gray-700">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {review.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review ${idx + 1}`}
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-4 border-t pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeReview(review.id)}
                        className={likedReviews.has(review.id) ? 'text-red-500' : ''}
                      >
                        <Heart
                          className={`w-4 h-4 mr-1 ${
                            likedReviews.has(review.id) ? 'fill-current' : ''
                          }`}
                        />
                        {review.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {review.replies}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discussions" className="space-y-6">
            {/* New Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Start a Discussion</CardTitle>
                <CardDescription>Ask questions or share tips with the community</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="What's on your mind?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleSubmitComment} className="w-full">
                  Post Comment
                </Button>
              </CardFooter>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{comment.userName}</p>
                          <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{comment.content}</p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t pt-4">
                      <div className="flex gap-4 w-full">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeComment(comment.id)}
                          className={likedComments.has(comment.id) ? 'text-blue-500' : ''}
                        >
                          <ThumbsUp
                            className={`w-4 h-4 mr-1 ${
                              likedComments.has(comment.id) ? 'fill-current' : ''
                            }`}
                          />
                          {comment.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Reply
                        </Button>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="w-full space-y-3 pl-4 border-l-2 border-gray-200">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={reply.userAvatar} />
                                <AvatarFallback>{reply.userName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{reply.userName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(reply.createdAt)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
