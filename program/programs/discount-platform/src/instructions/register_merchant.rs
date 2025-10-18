use anchor_lang::prelude::*;
use crate::accounts::{Marketplace, Merchant};
use crate::errors::CouponError;
use crate::events::MerchantRegistered;

pub fn register_merchant(
    ctx: Context<RegisterMerchant>,
    name: String,
    category: String,
) -> Result<()> {
    require!(name.len() <= 50, CouponError::NameTooLong);
    require!(category.len() <= 30, CouponError::CategoryTooLong);

    let merchant = &mut ctx.accounts.merchant;
    merchant.authority = ctx.accounts.authority.key();
    merchant.name = name.clone();
    merchant.category = category.clone();
    merchant.total_coupons_created = 0;
    merchant.total_coupons_redeemed = 0;
    merchant.is_active = true;
    merchant.created_at = Clock::get()?.unix_timestamp;

    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_merchants += 1;

    emit!(MerchantRegistered {
        merchant: merchant.key(),
        authority: merchant.authority,
        name,
        category,
        timestamp: merchant.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterMerchant<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Merchant::INIT_SPACE,
        seeds = [b"merchant", authority.key().as_ref()],
        bump
    )]
    pub merchant: Account<'info, Merchant>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
