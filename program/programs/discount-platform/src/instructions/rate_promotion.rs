
pub fn handler(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
    require!(stars >= 1 && stars <= 5, SocialError::InvalidRating);
    
    let rating = &mut ctx.accounts.rating;
    let stats = &mut ctx.accounts.rating_stats;
    
    // Check if updating existing rating
    let is_update = rating.stars != 0;
    
    if is_update {
        // Remove old rating from sum
        stats.sum_stars -= rating.stars as u64;
        stats.distribution[(rating.stars - 1) as usize] -= 1;
    } else {
        // New rating
        stats.total_ratings += 1;
    }
    
    // Update rating
    rating.user = ctx.accounts.user.key();
    rating.promotion = ctx.accounts.promotion.key();
    rating.merchant = ctx.accounts.promotion.merchant;
    rating.stars = stars;
    rating.updated_at = Clock::get()?.unix_timestamp;
    
    if !is_update {
        rating.created_at = rating.updated_at;
    }
    
    // Update stats
    stats.sum_stars += stars as u64;
    stats.distribution[(stars - 1) as usize] += 1;
    stats.average_rating = ((stats.sum_stars * 100) / stats.total_ratings as u64) as u16;
    
    emit!(PromotionRated {
        user: rating.user,
        promotion: rating.promotion,
        stars,
        is_update,
    });
    
    Ok(())
}

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
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + RatingStats::INIT_SPACE,
        seeds = [b"rating_stats", promotion.key().as_ref()],
        bump
    )]
    pub rating_stats: Account<'info, RatingStats>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}