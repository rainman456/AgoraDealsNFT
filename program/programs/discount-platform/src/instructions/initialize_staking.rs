use anchor_lang::prelude::*;
use crate::state::StakingPool;

#[derive(Accounts)]
pub struct InitializeStaking<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeStaking>,
    reward_rate_per_day: u64,
    min_stake_duration: i64,
) -> Result<()> {
    let staking_pool = &mut ctx.accounts.staking_pool;

    staking_pool.authority = ctx.accounts.authority.key();
    staking_pool.total_staked = 0;
    staking_pool.total_rewards_distributed = 0;
    staking_pool.reward_rate_per_day = reward_rate_per_day; // e.g., 100 = 1% per day
    staking_pool.min_stake_duration = min_stake_duration;   // e.g., 86400 = 1 day minimum
    staking_pool.is_active = true;
    staking_pool.created_at = Clock::get()?.unix_timestamp;

    msg!("Staking pool initialized with {}% daily rewards", reward_rate_per_day as f64 / 100.0);

    Ok(())
}