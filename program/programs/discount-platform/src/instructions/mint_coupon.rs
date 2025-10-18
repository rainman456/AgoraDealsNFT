use anchor_lang::prelude::*;
use crate::accounts::{Coupon, Marketplace, Merchant, Promotion};
use crate::errors::CouponError;
use crate::events::CouponMinted;

pub fn mint_coupon(
    ctx: Context<MintCoupon>,
    coupon_id: u64,
) -> Result<()> {
    let promotion = &mut ctx.accounts.promotion;
    require!(promotion.is_active, CouponError::PromotionInactive);
    require!(promotion.current_supply < promotion.max_supply, CouponError::SupplyExhausted);
    require!(promotion.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::PromotionExpired);

    // Initialize coupon account
    let coupon = &mut ctx.accounts.coupon;
    coupon.id = coupon_id;
    coupon.promotion = ctx.accounts.promotion.key();
    coupon.owner = ctx.accounts.recipient.key();
    coupon.merchant = ctx.accounts.merchant.key();
    coupon.discount_percentage = promotion.discount_percentage;
    coupon.expiry_timestamp = promotion.expiry_timestamp;
    coupon.is_redeemed = false;
    coupon.redeemed_at = 0;
    coupon.created_at = Clock::get()?.unix_timestamp;

    // Update counters
    promotion.current_supply += 1;
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_created += 1;
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_coupons += 1;

    emit!(CouponMinted {
        coupon: coupon.key(),
        promotion: coupon.promotion,
        owner: coupon.owner,
        merchant: coupon.merchant,
        discount_percentage: coupon.discount_percentage,
        expiry_timestamp: coupon.expiry_timestamp,
        timestamp: coupon.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MintCoupon<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Coupon::INIT_SPACE,
        seeds = [b"coupon", promotion.key().as_ref(), &promotion.current_supply.to_le_bytes()],
        bump
    )]
    pub coupon: Account<'info, Coupon>,
    #[account(
        mut,
        constraint = promotion.is_active @ CouponError::PromotionInactive
    )]
    pub promotion: Account<'info, Promotion>,
    #[account(
        mut,
        constraint = merchant.key() == promotion.merchant @ CouponError::WrongMerchant
    )]
    pub merchant: Account<'info, Merchant>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    /// CHECK: This is the recipient of the coupon
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
