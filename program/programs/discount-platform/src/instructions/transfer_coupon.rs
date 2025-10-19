use anchor_lang::prelude::*;
use crate::state::Coupon;
use crate::errors::CouponError;
use crate::events::CouponTransferred;

pub fn handler(ctx: Context<TransferCoupon>) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.from_authority.key(), CouponError::NotCouponOwner);

    let old_owner = coupon.owner;
    
    // Update coupon owner
    coupon.owner = ctx.accounts.new_owner.key();

    emit!(CouponTransferred {
        coupon: coupon.key(),
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        from: old_owner,
        to: coupon.owner,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct TransferCoupon<'info> {
    #[account(
        mut,
        constraint = coupon.owner == from_authority.key() @ CouponError::NotCouponOwner
    )]
    pub coupon: Account<'info, Coupon>,
    /// CHECK: This is the new owner
    pub new_owner: UncheckedAccount<'info>,
    pub from_authority: Signer<'info>,
}