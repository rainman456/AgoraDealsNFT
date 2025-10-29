use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CouponAuction {
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub auction_type: AuctionType,
    pub start_time: i64,
    pub end_time: i64,
    pub starting_price: u64,
    pub reserve_price: u64,           // Minimum acceptable price
    pub current_bid: u64,
    pub highest_bidder: Option<Pubkey>,
    pub bid_count: u32,
    pub is_active: bool,
    pub is_finalized: bool,
    pub auto_extend: bool,            // Extend if bid in last 5 mins
    pub extension_seconds: i64,       // How much to extend
    pub min_bid_increment: u64,       // Minimum increase per bid
}

// Added Debug derive to fix the error
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AuctionType {
    English,      // Traditional ascending bid
    Dutch,        // Descending price over time
    SealedBid,    // Blind bids revealed at end
}

impl anchor_lang::Space for AuctionType {
    const INIT_SPACE: usize = 1;
}

#[account]
#[derive(InitSpace)]
pub struct Bid {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub is_winning: bool,
    pub is_refunded: bool,
}

impl CouponAuction {
    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.end_time
    }
    
    pub fn can_finalize(&self, current_time: i64) -> bool {
        self.is_active && !self.is_finalized && self.is_expired(current_time)
    }
    
    pub fn should_extend(&self, current_time: i64) -> bool {
        self.auto_extend 
            && (self.end_time - current_time) < 300 // Less than 5 mins left
            && self.bid_count > 0
    }
    
    pub fn calculate_dutch_price(&self, current_time: i64) -> u64 {
        if current_time <= self.start_time {
            return self.starting_price;
        }
        
        if current_time >= self.end_time {
            return self.reserve_price;
        }
        
        let elapsed = (current_time - self.start_time) as u64;
        let duration = (self.end_time - self.start_time) as u64;
        let price_drop = self.starting_price - self.reserve_price;
        
        let current_drop = (price_drop * elapsed) / duration;
        self.starting_price - current_drop
    }
}