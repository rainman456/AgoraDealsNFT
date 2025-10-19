// src/instructions/mint_badge.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use mpl_token_metadata::instructions::CreateV1CpiBuilder;
use mpl_token_metadata::types::{TokenStandard, PrintSupply};
use crate::state::{BadgeNFT, BadgeType};
use crate::errors::CouponError;
use crate::events::BadgeEarned;

#[derive(Accounts)]
#[instruction(badge_type: BadgeType)]
pub struct MintBadge<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + BadgeNFT::INIT_SPACE,
        seeds = [b"badge", user.key().as_ref(), &[badge_type as u8]],
        bump
    )]
    pub badge_nft: Account<'info, BadgeNFT>,
    
    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: Metaplex Token Metadata Program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
    let badge = &mut ctx.accounts.badge_nft;
    badge.user = ctx.accounts.user.key();
    badge.badge_type = badge_type;
    badge.mint = ctx.accounts.mint.key();
    badge.metadata = ctx.accounts.metadata.key();
    badge.earned_at = Clock::get()?.unix_timestamp;
    badge.metadata_uri = "https://example.com/badge.json".to_string();

    // Create Metaplex metadata using new V1 builder pattern
    CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program.to_account_info())
        .metadata(&ctx.accounts.metadata.to_account_info())
        .mint(&ctx.accounts.mint.to_account_info(), true)
        .authority(&ctx.accounts.authority.to_account_info())
        .payer(&ctx.accounts.user.to_account_info())
        .update_authority(&ctx.accounts.authority.to_account_info(), true)
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Achievement Badge".to_string())
        .symbol("BADGE".to_string())
        .uri(badge.metadata_uri.clone())
        .seller_fee_basis_points(0)
        .token_standard(TokenStandard::NonFungible)
        .print_supply(PrintSupply::Zero)
        .invoke()?;

    emit!(BadgeEarned {
        user: badge.user,
        badge_type,
        mint: badge.mint,
    });

    Ok(())
}