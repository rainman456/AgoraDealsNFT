// src/state/merchant.rs
use anchor_lang::prelude::*;
use super::Location;

#[account]
#[derive(InitSpace)]
pub struct Merchant {
    pub authority: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(30)]
    pub category: String,
    pub total_coupons_created: u64,
    pub total_coupons_redeemed: u64,
    pub is_active: bool,
    pub created_at: i64,

    // Geographic data
    pub location: Location,
    pub has_physical_location: bool,
}