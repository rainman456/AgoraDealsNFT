use anchor_lang::prelude::*;
use crate::state::{Coupon, Listing, UserStats,ReputationTier};
use crate::errors::CouponError;
use crate::events::{CouponListed, ListingCancelled};

pub fn handler(
    ctx: Context<ListCouponForSale>,
    price: u64,
) -> Result<()> {
    require!(price > 0, CouponError::InvalidPrice);

    let coupon = &ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.seller.key(), CouponError::NotCouponOwner);

    let current_time = Clock::get()?.unix_timestamp;

    // Initialize UserStats if first time
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.seller.key();
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

    // Update user stats for listing
    user_stats.total_listings += 1;
    user_stats.add_reputation(3); // 3 points per listing
    user_stats.last_activity = current_time;

    let listing = &mut ctx.accounts.listing;
    listing.coupon = ctx.accounts.coupon.key();
    listing.seller = ctx.accounts.seller.key();
    listing.price = price;
    listing.is_active = true;
    listing.created_at = current_time;

    emit!(CouponListed {
        listing: listing.key(),
        coupon: listing.coupon,
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        seller: listing.seller,
        price,
    });

    msg!("Coupon listed! Total listings: {} | Reputation: {} | Tier: {:?}", 
        user_stats.total_listings, user_stats.reputation_score, user_stats.tier);

    Ok(())
}

pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, CouponError::ListingInactive);
    require!(listing.seller == ctx.accounts.seller.key(), CouponError::NotListingSeller);

    listing.is_active = false;

    emit!(ListingCancelled {
        listing: listing.key(),
        coupon: listing.coupon,
        seller: listing.seller,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ListCouponForSale<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", coupon.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        constraint = coupon.owner == seller.key() @ CouponError::NotCouponOwner
    )]
    pub coupon: Account<'info, Coupon>,
    
    #[account(
        init_if_needed,
        payer = seller,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", seller.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        constraint = listing.seller == seller.key() @ CouponError::NotListingSeller
    )]
    pub listing: Account<'info, Listing>,
    pub seller: Signer<'info>,
}