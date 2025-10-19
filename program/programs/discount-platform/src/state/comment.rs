// src/accounts/comment.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Comment {
    pub user: Pubkey,
    pub promotion: Pubkey,
    #[max_len(500)]
    pub content: String,
    pub created_at: i64,
    pub likes: u32,
    pub is_merchant_reply: bool,
    pub parent_comment: Option<Pubkey>,
}

#[account]
#[derive(InitSpace)]
pub struct CommentLike {
    pub user: Pubkey,
    pub comment: Pubkey,
    pub created_at: i64,
}