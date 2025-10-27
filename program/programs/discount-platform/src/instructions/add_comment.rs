use anchor_lang::prelude::*;
use crate::state::{Comment, Promotion, Merchant, UserStats,BadgeType,ReputationTier};
use crate::errors::CouponError;
use crate::events::CommentAdded;

#[derive(Accounts)]
#[instruction(content: String)]
pub struct AddComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Comment::INIT_SPACE,
        seeds = [b"comment", user.key().as_ref(), promotion.key().as_ref()],
        bump
    )]
    pub comment: Account<'info, Comment>,
    
    pub promotion: Account<'info, Promotion>,
    
    /// CHECK: Merchant account to verify if user is the merchant authority
    pub merchant: UncheckedAccount<'info>,
    
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

pub fn handler(
    ctx: Context<AddComment>,
    content: String,
    parent_comment: Option<Pubkey>,
) -> Result<()> {
    require!(content.len() <= 500, CouponError::DescriptionTooLong);
    require!(!content.is_empty(), CouponError::NameTooLong);

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

    // Update user stats for comment
    user_stats.total_comments += 1;
    user_stats.add_reputation(1); // 1 point per comment
    user_stats.last_activity = current_time;

    let comment = &mut ctx.accounts.comment;
    comment.user = ctx.accounts.user.key();
    comment.promotion = ctx.accounts.promotion.key();
    comment.content = content.clone();
    comment.created_at = current_time;
    comment.likes = 0;
    comment.is_merchant_reply = false;
    comment.parent_comment = parent_comment;
    
    // Check if the user is the merchant authority
    if ctx.accounts.merchant.key() == ctx.accounts.promotion.merchant {
        let merchant_data = ctx.accounts.merchant.try_borrow_data()?;
        let merchant = Merchant::try_deserialize(&mut &merchant_data[..])?;
        if merchant.authority == ctx.accounts.user.key() {
            comment.is_merchant_reply = true;
        }
    }
    
    emit!(CommentAdded {
        comment: comment.key(),
        user: comment.user,
        promotion: comment.promotion,
        content,
        is_reply: parent_comment.is_some(),
    });
    
    msg!("Comment added! Total comments: {} | Reputation: {} | Tier: {:?}", 
        user_stats.total_comments, user_stats.reputation_score, user_stats.tier);
    
    Ok(())
}