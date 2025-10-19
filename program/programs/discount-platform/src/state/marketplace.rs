use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub total_coupons: u64,
    pub total_merchants: u64,
    pub fee_basis_points: u16,
}
