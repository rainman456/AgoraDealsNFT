use anchor_lang::prelude::*;

// Re-export enums from state for use in events
pub use crate::state::{BadgeType, DealSource, AuctionType};  

#[event]
pub struct MarketplaceInitialized {
    pub marketplace: Pubkey,
    pub authority: Pubkey,
    pub fee_basis_points: u16,
    pub timestamp: i64,
}

#[event]
pub struct MerchantRegistered {
    pub merchant: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub category: String,
    pub timestamp: i64,
}

#[event]
pub struct PromotionCreated {
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub max_supply: u32,
    pub expiry_timestamp: i64,
    pub price: u64,
}

#[event]
pub struct CouponMinted {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub promotion: Pubkey,
    pub recipient: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub redemption_code: String,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct ListingCancelled {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponSold {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
}

#[event]
pub struct MerchantRated {
    pub merchant: Pubkey,
    pub rater: Pubkey,
    pub rating: u8,
    pub review: String,
    pub timestamp: i64,
}

#[event]
pub struct RewardsStaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub duration: i64,
    pub expected_rewards: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub staker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PromotionRated {
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub stars: u8,
    pub is_update: bool,
}

#[event]
pub struct ExternalDealUpdated {
    pub deal: Pubkey,
    pub source: DealSource,
    pub external_id: String,
    pub price: u64,
    pub verified: bool,
}

#[event]
pub struct CommentLiked {
    pub comment: Pubkey,
    pub user: Pubkey,
}

#[event]
pub struct CommentAdded {
    pub comment: Pubkey,
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub content: String,
    pub is_reply: bool,
}

#[event]
pub struct BadgeEarned {
    pub user: Pubkey,
    pub badge_type: BadgeType,
    pub mint: Pubkey,
}

#[event]
pub struct TicketGenerated {
    pub ticket: Pubkey,
    pub coupon: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub ticket_hash: [u8; 32],
    pub expires_at: i64,
    pub nonce: u64,
}

#[event]
pub struct TicketRedeemed {
    pub ticket: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub redeemed_at: i64,
}

#[event]
pub struct GroupDealCreated {
    pub group_deal: Pubkey,
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub organizer: Pubkey,
    pub target_participants: u32,
    pub base_price: u64,
    pub deadline: i64,
}

#[event]
pub struct GroupDealJoined {
    pub group_deal: Pubkey,
    pub user: Pubkey,
    pub participants_count: u32,
    pub amount_escrowed: u64,
    pub current_discount: u8,
}

#[event]
pub struct GroupDealFinalized {
    pub group_deal: Pubkey,
    pub participants_count: u32,
    pub final_discount: u8,
    pub total_revenue: u64,
    pub finalized_at: i64,
}

#[event]
pub struct GroupDealRefunded {
    pub group_deal: Pubkey,
    pub user: Pubkey,
    pub refund_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AuctionCreated {
    pub auction: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub auction_type: AuctionType,
    pub starting_price: u64,
    pub reserve_price: u64,
    pub end_time: i64,
}

#[event]
pub struct BidPlaced {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
    pub bid_count: u32,
    pub new_end_time: i64,
}

#[event]
pub struct AuctionFinalized {
    pub auction: Pubkey,
    pub winner: Pubkey,
    pub final_price: u64,
    pub auction_type: AuctionType,
    pub finalized_at: i64,
}

#[event]
pub struct AuctionCancelled {
    pub auction: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}