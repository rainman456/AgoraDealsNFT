import type { Promotion } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Clock, Verified, Star, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { TransactionBadge } from './TransactionBadge';

interface DealCardProps {
  deal: Promotion;
  isOwned?: boolean;
  onClaim?: () => void;
  onLike?: () => void;
}

export default function DealCard({ deal, isOwned = false, onClaim, onLike }: DealCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const daysUntilExpiry = Math.ceil((new Date(deal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 3;
  
  // Transaction sponsorship logic
  const transactionCount = parseInt(localStorage.getItem('transaction_count') || '0');
  const isFreeTransaction = transactionCount < 5;
  const isSponsoredByMerchant = deal._id.charCodeAt(0) % 3 === 0;
  
  const merchantName = deal.merchant?.businessName || deal.merchant?.name || 'Merchant';
  const imageUrl = deal.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop';

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.();
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClaim?.();
  };

  // Calculate savings (Groupon-style)
  const originalPrice = (deal.originalPrice || 100).toFixed(2);
  const discountedPrice = deal.discountedPrice || (deal.originalPrice || 100) * (100 - deal.discountPercentage) / 100;
  const currentPrice = discountedPrice.toFixed(2);
  const savings = ((deal.originalPrice || 100) - discountedPrice).toFixed(2);

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm hover:shadow-xl group cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-card rounded-2xl">
      <Link to={`/deals/${deal._id}`} className="block">
        {/* Hero Image - Airbnb-inspired beautiful imagery */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          
          {/* Subtle gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Like button - Top Right (Airbnb-style) */}
          <button
            onClick={handleLike}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:scale-110 transition-all duration-200 shadow-md"
            aria-label="Save to favorites"
          >
            <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'}`} />
          </button>
          
          {/* Badges - Bottom Left */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1.5 rounded-lg shadow-lg">
              <Verified className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">{merchantName}</span>
            </div>
            {isFreeTransaction && (
              <TransactionBadge type="subsidized" />
            )}
            {!isFreeTransaction && isSponsoredByMerchant && (
              <TransactionBadge type="sponsored" merchantName={merchantName} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 lg:p-6">
          {/* Title - Groupon-style clear and prominent */}
          <h3 className="font-bold text-xl lg:text-2xl mb-2 line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">
            {deal.title}
          </h3>
          
          {/* Description - Progressive disclosure */}
          <p className="text-base lg:text-lg font-medium text-muted-foreground mb-4 line-clamp-1">
            {deal.description}
          </p>

          {/* Savings Highlight - Groupon-inspired clear value */}
          <div className="mb-4 p-4 lg:p-5 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl lg:text-3xl font-bold text-foreground">${currentPrice}</span>
                <span className="text-sm lg:text-base text-muted-foreground line-through">${originalPrice}</span>
              </div>
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm lg:text-base font-bold">
                {deal.discountPercentage}%
              </div>
            </div>
            <p className="text-xs lg:text-sm font-medium text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Save ${savings}
            </p>
          </div>

          {/* Trust signals & Social proof - Airbnb-style */}
          <div className="flex items-center justify-between text-sm lg:text-base text-muted-foreground mb-4">
            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{deal.ratings?.average?.toFixed(1) || 'New'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{deal.currentSupply || 0} claimed</span>
              </div>
            </div>
            
            {/* Urgency indicator */}
            <div className={`flex items-center gap-1.5 font-medium ${
              isExpiringSoon ? 'text-red-500' : 'text-orange-500'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{daysUntilExpiry}d left</span>
            </div>
          </div>

          {/* Transaction Info - Show if available */}
          {deal.transactionSignature && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction</label>
                  <p className="text-xs font-mono truncate text-foreground mt-0.5">{deal.transactionSignature}</p>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${deal.transactionSignature}?cluster=custom&customUrl=http://localhost:8899`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                </a>
              </div>
            </div>
          )}

          {/* Action Button - Clear CTA */}
          {onClaim && (
            <Button
              onClick={handleClaim}
              disabled={isOwned}
              className={`w-full font-semibold transition-all duration-200 text-base lg:text-lg py-6 rounded-xl ${
                isOwned
                  ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-default border border-green-200 dark:border-green-800"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
              }`}
              size="lg"
            >
              {isOwned ? (
                <span className="flex items-center gap-2">
                  <Verified className="w-5 h-5" />
                  Claimed
                </span>
              ) : (
                "Get This Deal"
              )}
            </Button>
          )}
        </div>
      </Link>
    </Card>
  );
}
