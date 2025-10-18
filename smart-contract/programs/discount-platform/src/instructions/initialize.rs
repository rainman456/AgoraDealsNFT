use anchor_lang::prelude::*;
use crate::accounts::Marketplace;
use crate::events::MarketplaceInitialized;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.authority = ctx.accounts.authority.key();
    marketplace.total_coupons = 0;
    marketplace.total_merchants = 0;
    marketplace.fee_basis_points = 250; // 2.5% marketplace fee

    emit!(MarketplaceInitialized {
        authority: marketplace.authority,
        fee_basis_points: marketplace.fee_basis_points,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Marketplace::INIT_SPACE,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
