use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, burn, Burn};
use crate::accounts::{Coupon, Merchant};
use crate::errors::CouponError;
use crate::events::CouponRedeemed;

pub fn handler(ctx: Context<RedeemCoupon>) -> Result<()> {
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

    // Burn the NFT
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.nft_mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        1,
    )?;

    emit!(CouponRedeemed {
        coupon: coupon.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        user: coupon.owner,
        merchant: coupon.merchant,
        discount_percentage: coupon.discount_percentage,
        redemption_code: format!("REDEEMED-{}", coupon.id),
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
    
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == nft_mint.key(),
        constraint = token_account.owner == user.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub merchant_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}