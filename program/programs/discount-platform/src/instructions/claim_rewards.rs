use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer as system_transfer, Transfer as SystemTransfer};
use anchor_spl::token::{Token, TokenAccount, Mint, transfer, Transfer};
use crate::state::{StakingPool, StakeAccount};
use crate::errors::CouponError;
use crate::events::RewardsClaimed;

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"stake", stake_account.coupon.as_ref(), user.key().as_ref()],
        bump,
        constraint = stake_account.user == user.key() @ CouponError::NotCouponOwner,
        constraint = stake_account.is_active @ CouponError::PromotionInactive
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    /// CHECK: NFT Mint
    #[account(
        constraint = nft_mint.key() == stake_account.nft_mint
    )]
    pub nft_mint: Account<'info, Mint>,

    /// CHECK: Staking vault token account (PDA)
    #[account(
        mut,
        seeds = [b"stake_vault", nft_mint.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    /// CHECK: User's token account
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Reward pool authority
    #[account(
        mut,
        constraint = reward_pool.key() == staking_pool.authority @ CouponError::NotMarketplaceAuthority
    )]
    pub reward_pool: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRewards>) -> Result<()> {
    let stake_account = &mut ctx.accounts.stake_account;
    let staking_pool = &mut ctx.accounts.staking_pool;
    let current_time = Clock::get()?.unix_timestamp;

    // Verify staking period is complete
    require!(
        stake_account.can_claim(current_time),
        CouponError::InvalidExpiry
    );

    // Calculate final rewards
    let rewards = stake_account.calculate_rewards(
        current_time,
        staking_pool.reward_rate_per_day
    );

    require!(rewards > 0, CouponError::InvalidPrice);

    // Transfer NFT back to user
    let nft_mint_key = ctx.accounts.nft_mint.key();
    let vault_seeds = &[
        b"stake_vault",
        nft_mint_key.as_ref(),
        &[ctx.bumps.stake_vault],
    ];
    let vault_signer = &[&vault_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.stake_vault.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.stake_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer);
    transfer(cpi_ctx, 1)?;

    // Transfer rewards (SOL) to user
    let cpi_accounts = SystemTransfer {
        from: ctx.accounts.reward_pool.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    system_transfer(cpi_ctx, rewards)?;

    // Update stake account
    stake_account.rewards_earned = rewards;
    stake_account.is_active = false;
    stake_account.claimed_at = Some(current_time);

    // Update pool stats
    staking_pool.total_staked -= stake_account.amount_staked;
    staking_pool.total_rewards_distributed += rewards;

    emit!(RewardsClaimed {
        staker: ctx.accounts.user.key(),
        amount: rewards,
        timestamp: current_time,
    });

    msg!("Rewards claimed: {} lamports", rewards);

    Ok(())
}