import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TrendingUp, Users, Zap, Verified } from "lucide-react";

interface Auction {
  id: string | number;
  title: string;
  merchant: string;
  description: string;
  image: string;
  startingBid: number;
  currentBid: number;
  bids: number;
  timeRemaining: string;
  highestBidder: string;
  auctionType: string;
  status: string;
  finalPrice?: number;
}

export default function AuctionCard({ auction }: { auction: Auction }) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState(auction.currentBid + 10);

  const isLive = auction.status === "live";
  const timeArray = auction.timeRemaining.split(":");
  const isEnding = Number.parseInt(timeArray[0]) === 0 && Number.parseInt(timeArray[1]) < 30;
  
  // Calculate bid increment (Robinhood-style data visualization)
  const bidIncrement = ((auction.currentBid - auction.startingBid) / auction.startingBid * 100).toFixed(0);

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 hover:-translate-y-1 group">
      {/* Image - Beautiful imagery */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={auction.image || "/placeholder.svg"} 
          alt={auction.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
        
        {/* Urgency badge */}
        {isEnding && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Ending Soon
          </div>
        )}
        
        {/* Verified merchant */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1.5 rounded-lg shadow-lg">
          <Verified className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{auction.merchant}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 lg:p-6">
        {/* Title */}
        <h3 className="font-semibold text-lg lg:text-xl mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
          {auction.title}
        </h3>

        {/* Current Bid - Robinhood-style data viz */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 lg:p-5 mb-4 border border-primary/20">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs lg:text-sm text-muted-foreground mb-1">Current Bid</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">${auction.currentBid}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-primary text-sm lg:text-base font-semibold">
                <TrendingUp className="w-4 h-4" />
                +{bidIncrement}%
              </div>
              <p className="text-xs lg:text-sm text-muted-foreground">from start</p>
            </div>
          </div>
          
          {/* Progress bar - visual data */}
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(bidIncrement), 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {auction.bids} bids
            </span>
            <span className="text-muted-foreground">Started at ${auction.startingBid}</span>
          </div>
        </div>

        {/* Leading bidder - Trust signal */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
            {auction.highestBidder.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {auction.highestBidder} is winning
            </p>
          </div>
        </div>

        {/* Time Remaining - Clear urgency */}
        {isLive && (
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            isEnding 
              ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' 
              : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="text-sm lg:text-base font-semibold">
              {auction.timeRemaining} remaining
            </span>
          </div>
        )}

        {!isLive && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 mb-3 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Auction Ended</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sold for ${auction.finalPrice}</p>
          </div>
        )}

        {/* Bid Button - Clear CTA */}
        {isLive ? (
          <>
            {!showBidForm ? (
              <Button 
                onClick={() => setShowBidForm(true)} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm hover:shadow-md transition-all"
                size="lg"
              >
                Place Your Bid
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Your Bid Amount
                  </label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={auction.currentBid + 1}
                    className="text-lg font-semibold"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Minimum bid: ${auction.currentBid + 1}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowBidForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    Confirm ${bidAmount}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Button 
            className="w-full" 
            variant="outline" 
            disabled
          >
            Auction Ended
          </Button>
        )}
      </div>
    </div>
  );
}
