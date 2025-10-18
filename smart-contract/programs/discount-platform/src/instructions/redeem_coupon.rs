use anchor_lang::prelude::*;
use crate::accounts::{Coupon, Merchant};
use crate::errors::CouponError;
use crate::events::CouponRedeemed;

pub fn redeem_coupon(ctx: Context<RedeemCoupon>) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.user.key(), CouponError::NotCouponOwner);
    require!(coupon.merchant == ctx.accounts.merchant.key(), CouponError::WrongMerchant);

    // Mark as redeemed
    coupon.is_redeemed = true;
    coupon.redeemed_at = Clock::get()?.unix_timestamp;

    // Update merchant stats
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_redeemed += 1;

    emit!(CouponRedeemed {
        coupon: coupon.key(),
        owner: coupon.owner,
        merchant: coupon.merchant,
        discount_percentage: coupon.discount_percentage,
        timestamp: coupon.redeemed_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RedeemCoupon<'info> {
    #[account(
        mut,
        constraint = coupon.owner == user.key() @ CouponError::NotCouponOwner,
        constraint = coupon.merchant == merchant.key() @ CouponError::WrongMerchant
    )]
    pub coupon: Account<'info, Coupon>,
    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant: Account<'info, Merchant>,
    pub user: Signer<'info>,
    pub merchant_authority: Signer<'info>,
}
