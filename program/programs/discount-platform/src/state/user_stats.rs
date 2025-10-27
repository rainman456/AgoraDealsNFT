use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserStats {
    pub user: Pubkey,
    pub total_purchases: u32,
    pub total_redemptions: u32,
    pub total_ratings_given: u32,
    pub total_comments: u32,
    pub total_listings: u32,
    pub reputation_score: u64,
    pub tier: ReputationTier,
    #[max_len(10)]
    pub badges_earned: Vec<u8>, // Store BadgeType as u8
    pub joined_at: i64,
    pub last_activity: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ReputationTier {
    Bronze = 0,
    Silver = 1,
    Gold = 2,
    Platinum = 3,
    Diamond = 4,
}

impl anchor_lang::Space for ReputationTier {
    const INIT_SPACE: usize = 1;
}

impl UserStats {
    pub fn has_badge(&self, badge_type: u8) -> bool {
        self.badges_earned.contains(&badge_type)
    }

    pub fn add_badge(&mut self, badge_type: u8) {
        if !self.has_badge(badge_type) && self.badges_earned.len() < 10 {
            self.badges_earned.push(badge_type);
        }
    }

    pub fn update_tier(&mut self) {
        self.tier = match self.reputation_score {
            0..=99 => ReputationTier::Bronze,
            100..=499 => ReputationTier::Silver,
            500..=1999 => ReputationTier::Gold,
            2000..=9999 => ReputationTier::Platinum,
            _ => ReputationTier::Diamond,
        };
    }

    pub fn add_reputation(&mut self, points: u64) {
        self.reputation_score = self.reputation_score.saturating_add(points);
        self.update_tier();
    }
}