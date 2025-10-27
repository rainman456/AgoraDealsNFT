use anchor_lang::prelude::*;
use crate::state::{Rating, Promotion, UserStats, BadgeType,ReputationTier};
use crate::errors::CouponError;
use crate::events::PromotionRated;

#[derive(Accounts)]
pub struct RatePromotion<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Rating::INIT_SPACE,
        seeds = [b"rating", user.key().as_ref(), promotion.key().as_ref()],
        bump
    )]
    pub rating: Account<'info, Rating>,
    
    pub promotion: Account<'info, Promotion>,
    
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
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
    require!(stars >= 1 && stars <= 5, CouponError::InvalidDiscount);

    let rating = &mut ctx.accounts.rating;
    let current_time = Clock::get()?.unix_timestamp;
    let is_update = rating.user != Pubkey::default();

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

    if !is_update {
        // New rating - increment count and add reputation
        rating.user = ctx.accounts.user.key();
        rating.promotion = ctx.accounts.promotion.key();
        rating.merchant = ctx.accounts.promotion.merchant;
        rating.created_at = current_time;
        
        // Update user stats
        user_stats.total_ratings_given += 1;
        user_stats.add_reputation(2); // 2 points per rating
        
        // Check for TopReviewer badge at 20 ratings
        if user_stats.total_ratings_given == 20 && !user_stats.has_badge(BadgeType::TopReviewer as u8) {
            msg!("🏆 User eligible for TopReviewer badge! Total ratings: {}", user_stats.total_ratings_given);
        }
        
        msg!("New rating added! Total ratings: {} | Reputation: {}", 
            user_stats.total_ratings_given, user_stats.reputation_score);
    } else {
        msg!("Rating updated (no reputation change)");
    }
    
    // Always update these fields
    rating.stars = stars;
    rating.updated_at = current_time;
    user_stats.last_activity = current_time;

    emit!(PromotionRated {
        user: rating.user,
        promotion: rating.promotion,
        stars,
        is_update,
    });
    
    Ok(())
}