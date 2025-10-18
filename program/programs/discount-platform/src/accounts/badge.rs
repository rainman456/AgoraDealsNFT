
#[account]
#[derive(InitSpace)]
pub struct UserReputation {
    pub user: Pubkey,
    pub total_purchases: u32,
    pub total_redemptions: u32,
    pub total_ratings_given: u32,
    pub total_comments: u32,
    pub reputation_score: u64,     // Calculated score
    pub tier: ReputationTier,
    pub badges_earned: Vec<BadgeType>, // Use u8 array with max length
    pub joined_at: i64,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ReputationTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BadgeType {
    FirstPurchase = 0,
    TenRedemptions = 1,
    FiftyRedemptions = 2,
    TopReviewer = 3,
    EarlyAdopter = 4,
    MerchantPartner = 5,
    CommunityModerator = 6,
    // Add more...
}

#[account]
#[derive(InitSpace)]
pub struct BadgeNFT {
    pub user: Pubkey,
    pub badge_type: BadgeType,
    pub mint: Pubkey,              // SPL Token mint
    pub metadata: Pubkey,          // Metaplex metadata account
    pub earned_at: i64,
    #[max_len(200)]
    pub metadata_uri: String,      // IPFS link to badge image
}