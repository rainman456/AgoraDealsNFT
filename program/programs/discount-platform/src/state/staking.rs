use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub total_rewards_distributed: u64,
    pub reward_rate_per_day: u64, // Basis points (e.g., 100 = 1% per day)
    pub min_stake_duration: i64,   // Minimum seconds to stake
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub user: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub amount_staked: u64,       // Value locked (promotion price)
    pub staked_at: i64,
    pub unlock_at: i64,
    pub duration_days: u64,
    pub rewards_earned: u64,
    pub is_active: bool,
    pub claimed_at: Option<i64>,
}

impl StakeAccount {
    pub fn calculate_rewards(&self, current_time: i64, reward_rate: u64) -> u64 {
        if current_time < self.staked_at {
            return 0;
        }

        let elapsed_seconds = (current_time - self.staked_at) as u64;
        let elapsed_days = elapsed_seconds / 86400; // 86400 seconds per day

        // Calculate rewards: (amount * rate * days) / 10000
        // reward_rate is in basis points (e.g., 100 = 1%)
        (self.amount_staked * reward_rate * elapsed_days) / 10000
    }

    pub fn can_claim(&self, current_time: i64) -> bool {
        self.is_active && current_time >= self.unlock_at
    }
}