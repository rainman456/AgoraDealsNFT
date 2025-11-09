import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Deal } from '@/lib/api';
import { MapPin, Clock, Star, Users, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cardHover, buttonPress, hapticFeedback } from '@/lib/animations';

interface DealCardProps {
  deal: Deal;
  onClaim?: (dealId: string) => void;
  isLoading?: boolean;
  isClaiming?: boolean;
}

const categoryColors: Record<string, string> = {
  flights: 'bg-blue-100 text-blue-800',
  hotels: 'bg-purple-100 text-purple-800',
  restaurants: 'bg-orange-100 text-orange-800',
  experiences: 'bg-green-100 text-green-800',
  shopping: 'bg-pink-100 text-pink-800',
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onClaim, isLoading, isClaiming }) => {
  const navigate = useNavigate();
  const expiresIn = deal.expiresAt ? formatDistanceToNow(new Date(deal.expiresAt), { addSuffix: true }) : 'No expiry';
  const [isClaimSuccess, setIsClaimSuccess] = useState(false);

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('medium');
    onClaim?.(deal.id);
    setIsClaimSuccess(true);
    setTimeout(() => setIsClaimSuccess(false), 2000);
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={cardHover}
      className="h-full"
    >
    <Card className="overflow-hidden cursor-pointer group h-full flex flex-col rounded-2xl border-0 shadow-md">
      <div 
        className="relative aspect-[16/9] overflow-hidden"
        onClick={() => navigate(`/deals/${deal.id}`)}
      >
        {/* Hero Image with Gradient Overlay */}
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Circular Discount Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
              <div className="text-center">
                <div className="text-white font-bold text-xl leading-none">{deal.discount}%</div>
                <div className="text-white text-[10px] font-medium">OFF</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Merchant Logo - Bottom Left Overlay */}
        <div className="absolute bottom-4 left-4">
          <div className="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden bg-white">
            <img 
              src={typeof deal.merchant === 'object' ? deal.merchant.logo || '/placeholder-merchant.png' : '/placeholder-merchant.png'} 
              alt={typeof deal.merchant === 'object' ? deal.merchant.name : 'Merchant'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Verification Badge - Bottom Right */}
        {deal.maxRedemptions && deal.redemptionCount !== undefined && (
          <div className="absolute bottom-4 right-4">
            <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-md">
              <Users className="w-3 h-3 mr-1" />
              {deal.redemptionCount}/{deal.maxRedemptions}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5 flex-1 flex flex-col" onClick={() => navigate(`/deals/${deal.id}`)}>
        {/* Title - Bold, 2 lines max */}
        <div className="mb-3">
          <h3 className="font-heading font-bold text-xl line-clamp-2 leading-tight mb-2">
            {deal.title}
          </h3>
          <Badge className={`${categoryColors[deal.category] || 'bg-gray-100 text-gray-800'} text-xs`}>
            {deal.category}
          </Badge>
        </div>

        {/* Merchant Name */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold text-sm text-gray-700">{typeof deal.merchant === 'object' ? deal.merchant.name : 'Merchant'}</span>
          <Check className="w-4 h-4 text-green-500" />
        </div>

        {/* Location & Expiry */}
        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          {deal.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{deal.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Expires {expiresIn}</span>
          </div>
        </div>

        {/* Rating */}
        {deal.rating && (
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">{deal.rating.toFixed(1)}</span>
            {deal.reviewCount && (
              <span className="text-sm text-muted-foreground">({deal.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price - Strikethrough original + highlighted discounted */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-primary">
              ${deal.price}
            </span>
            {deal.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${deal.originalPrice}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-3">
        <motion.div className="flex-1" variants={buttonPress} whileTap="tap">
          <Button
            className="w-full h-12 font-semibold rounded-xl relative overflow-hidden"
            onClick={handleClaim}
            disabled={isLoading || isClaiming || isClaimSuccess}
          >
            <AnimatePresence mode="wait">
              {isClaimSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Claimed!</span>
                </motion.div>
              ) : (
                <motion.span
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isLoading || isClaiming ? 'Claiming...' : 'Claim Deal'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
    </motion.div>
  );
};
