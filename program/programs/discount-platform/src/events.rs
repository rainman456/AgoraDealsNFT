use anchor_lang::prelude::*;

#[event]
pub struct MarketplaceInitialized {
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
    pub category: String,
    pub price: u64,
    pub timestamp: i64,
}

#[event]
pub struct CouponMinted {
    pub coupon: Pubkey,
    pub promotion: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub expiry_timestamp: i64,
    pub timestamp: i64,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub timestamp: i64,
}

#[event]
pub struct CouponSold {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct ListingCancelled {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}
