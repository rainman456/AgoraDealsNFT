use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub is_active: bool,
    pub created_at: i64,
}
