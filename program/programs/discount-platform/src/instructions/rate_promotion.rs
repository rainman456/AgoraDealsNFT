use anchor_lang::prelude::*;
use crate::state::{Rating, Promotion};
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
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
    require!(stars >= 1 && stars <= 5, CouponError::InvalidDiscount);

    let rating = &mut ctx.accounts.rating;
    rating.user = ctx.accounts.user.key();
    rating.promotion = ctx.accounts.promotion.key();
    rating.merchant = ctx.accounts.promotion.merchant;
    rating.stars = stars;
    rating.created_at = Clock::get()?.unix_timestamp;
    rating.updated_at = rating.created_at;

    emit!(PromotionRated {
        user: rating.user,
        promotion: rating.promotion,
        stars,
        is_update: false,
    });
    
    Ok(())
}