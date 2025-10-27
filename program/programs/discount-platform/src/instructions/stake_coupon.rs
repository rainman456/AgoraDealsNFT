use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, transfer, Transfer};
use crate::state::{Coupon, StakingPool, StakeAccount};
use crate::errors::CouponError;
use crate::events::RewardsStaked;

#[derive(Accounts)]
pub struct StakeCoupon<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", coupon.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        constraint = coupon.owner == user.key() @ CouponError::NotCouponOwner,
        constraint = !coupon.is_redeemed @ CouponError::CouponAlreadyRedeemed
    )]
    pub coupon: Account<'info, Coupon>,

    /// CHECK: NFT Mint
    #[account(
        constraint = nft_mint.key() == coupon.mint.unwrap() @ CouponError::WrongCoupon
    )]
    pub nft_mint: Account<'info, Mint>,

    /// CHECK: User's token account
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Staking vault token account (PDA)
    #[account(
        mut,
        seeds = [b"stake_vault", nft_mint.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<StakeCoupon>,
    duration_days: u64,
) -> Result<()> {
    let staking_pool = &mut ctx.accounts.staking_pool;
    let stake_account = &mut ctx.accounts.stake_account;
    let coupon = &ctx.accounts.coupon;
    let current_time = Clock::get()?.unix_timestamp;

    require!(staking_pool.is_active, CouponError::PromotionInactive);
    require!(duration_days > 0, CouponError::InvalidInput);
    
    let duration_seconds = (duration_days * 86400) as i64;
    require!(
        duration_seconds >= staking_pool.min_stake_duration,
        CouponError::InvalidExpiry
    );

    // Transfer NFT to staking vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.stake_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    transfer(cpi_ctx, 1)?;

    // Initialize stake account
    stake_account.user = ctx.accounts.user.key();
    stake_account.coupon = coupon.key();
    stake_account.nft_mint = ctx.accounts.nft_mint.key();
    stake_account.amount_staked = 1_000_000; // Base value for NFT
    stake_account.staked_at = current_time;
    stake_account.unlock_at = current_time + duration_seconds;
    stake_account.duration_days = duration_days;
    stake_account.rewards_earned = 0;
    stake_account.is_active = true;
    stake_account.claimed_at = None;

    // Update pool stats
    staking_pool.total_staked += stake_account.amount_staked;

    // Calculate expected rewards
    let expected_rewards = stake_account.calculate_rewards(
        stake_account.unlock_at,
        staking_pool.reward_rate_per_day
    );

    emit!(RewardsStaked {
        staker: ctx.accounts.user.key(),
        amount: stake_account.amount_staked,
        duration: duration_seconds,
        expected_rewards,
        timestamp: current_time,
    });

    msg!("Coupon staked for {} days. Expected rewards: {}", duration_days, expected_rewards);

    Ok(())
}
