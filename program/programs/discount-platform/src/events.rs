use anchor_lang::prelude::*;

#[event]
pub struct MerchantRegistered {
    pub merchant: Pubkey,
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
    pub price: u64,
    pub expiry_timestamp: i64,
}

#[event]
pub struct CouponMinted {
    pub coupon: Pubkey,
    pub promotion: Pubkey,
    pub owner: Pubkey,
    pub coupon_id: u64,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct CouponSold {
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
}