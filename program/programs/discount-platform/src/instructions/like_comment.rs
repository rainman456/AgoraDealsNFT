use anchor_lang::prelude::*;
use crate::state::{Comment, CommentLike};
use crate::errors::CouponError;
use crate::events::CommentLiked;

#[derive(Accounts)]
pub struct LikeComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + CommentLike::INIT_SPACE,
        seeds = [b"comment_like", user.key().as_ref(), comment.key().as_ref()],
        bump
    )]
    pub comment_like: Account<'info, CommentLike>,
    
    #[account(mut)]
    pub comment: Account<'info, Comment>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<LikeComment>) -> Result<()> {
    let comment = &mut ctx.accounts.comment;
    let like = &mut ctx.accounts.comment_like;
    
    like.user = ctx.accounts.user.key();
    like.comment = comment.key();
    like.created_at = Clock::get()?.unix_timestamp;
    
    comment.likes += 1;
    
    emit!(CommentLiked {
        comment: comment.key(),
        user: like.user,
    });
    
    Ok(())
}