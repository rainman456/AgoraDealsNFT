use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, burn, Burn};
use crate::state::{Coupon, Merchant, UserStats, BadgeType,ReputationTier};
use crate::errors::CouponError;
use crate::events::CouponRedeemed;

pub fn handler(ctx: Context<RedeemCoupon>) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.user.key(), CouponError::NotCouponOwner);
    require!(coupon.merchant == ctx.accounts.merchant.key(), CouponError::WrongMerchant);

    let current_time = Clock::get()?.unix_timestamp;

    // Initialize UserStats if first time
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.user.key();
        user_stats.total_purchases = 0;
        user_stats.total_redemptions = 0;
        user_stats.total_ratings_given = 0;
        user_stats.total_comments = 0;
        user_stats.total_listings = 0;
        user_stats.reputation_score = 0;
        user_stats.tier = ReputationTier::Bronze;
        user_stats.badges_earned = Vec::new();
        user_stats.joined_at = current_time;
        user_stats.last_activity = current_time;
    }

    // Update user stats for redemption
    user_stats.total_redemptions += 1;
    user_stats.add_reputation(10); // 10 points per redemption
    user_stats.last_activity = current_time;

    // Check for badge eligibility
    if user_stats.total_redemptions == 10 && !user_stats.has_badge(BadgeType::TenRedemptions as u8) {
        msg!("🏆 User eligible for TenRedemptions badge! Total redemptions: {}", user_stats.total_redemptions);
    }
    
    if user_stats.total_redemptions == 50 && !user_stats.has_badge(BadgeType::FiftyRedemptions as u8) {
        msg!("🏆 User eligible for FiftyRedemptions badge! Total redemptions: {}", user_stats.total_redemptions);
    }

    // Mark as redeemed
    coupon.is_redeemed = true;
    coupon.redeemed_at = current_time;

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

    msg!("Redemption complete! Reputation: {} | Tier: {:?}", 
        user_stats.reputation_score, user_stats.tier);

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
    
    /// CHECK: SPL Token Mint
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,
    
    /// CHECK: SPL Token Account
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
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub merchant_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}