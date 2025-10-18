use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Coupon {
    pub id: u64,
    pub promotion: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub expiry_timestamp: i64,
    pub is_redeemed: bool,
    pub redeemed_at: i64,
    pub created_at: i64,
}
