use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Rating {
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub stars: u8,              // 1-5 stars
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RatingStats {
    pub promotion: Pubkey,
    pub total_ratings: u32,
    pub sum_stars: u64,         // Sum of all ratings
    pub average_rating: u16,    // Multiply by 100 (e.g., 450 = 4.50 stars)
    pub distribution: [u32; 5], // Count of 1-star, 2-star, ..., 5-star
}