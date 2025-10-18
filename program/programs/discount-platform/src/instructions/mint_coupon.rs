use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::programs::MPL_TOKEN_METADATA_ID;
use mpl_token_metadata::types::{Creator, DataV2};

use crate::accounts::*;
use crate::errors::*;
use crate::events::*;

pub fn handler(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
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
    coupon.mint = Some(ctx.accounts.nft_mint.key());

    // TODO: Add Metaplex metadata creation here
    // Use mpl_token_metadata::instructions::CreateMetadataAccountV3

    // Update counters
    promotion.current_supply += 1;
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_created += 1;
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_coupons += 1;

     // Update user reputation
    let reputation = &mut ctx.accounts.user_reputation;
    reputation.total_purchases += 1;
    reputation.reputation_score += 10; // Award points
    
    // Check tier upgrade
    update_reputation_tier(reputation);

    emit!(CouponMinted {
        coupon: ctx.accounts.coupon.key(),
        promotion: ctx.accounts.promotion.key(),
        owner: ctx.accounts.recipient.key(),
        coupon_id,
    });

    Ok(())
}


fn update_reputation_tier(reputation: &mut UserReputation) {
    let score = reputation.reputation_score;
    reputation.tier = match score {
        0..=99 => ReputationTier::Bronze,
        100..=499 => ReputationTier::Silver,
        500..=1999 => ReputationTier::Gold,
        2000..=4999 => ReputationTier::Platinum,
        _ => ReputationTier::Diamond,
    };
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
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = coupon,
        mint::freeze_authority = coupon,
    )]
    pub nft_mint: Account<'info, Mint>,
    
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
    
    /// CHECK: Recipient of the coupon
    pub recipient: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: Metaplex program
    #[account(address = MPL_TOKEN_METADATA_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}