use anchor_lang::prelude::*;
use crate::accounts::{Comment, Promotion};
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

    let comment = &mut ctx.accounts.comment;
    comment.user = ctx.accounts.user.key();
    comment.promotion = ctx.accounts.promotion.key();
    comment.content = content.clone();
    comment.created_at = Clock::get()?.unix_timestamp;
    comment.likes = 0;
    comment.is_merchant_reply = false;
    comment.parent_comment = parent_comment;
    
    if ctx.accounts.promotion.merchant == ctx.accounts.user.key() {
        comment.is_merchant_reply = true;
    }
    
    emit!(CommentAdded {
        comment: comment.key(),
        user: comment.user,
        promotion: comment.promotion,
        content,
        is_reply: parent_comment.is_some(),
    });
    
    Ok(())
}