use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use mpl_token_metadata::instructions::CreateV1CpiBuilder;
use mpl_token_metadata::types::{TokenStandard, PrintSupply};
use crate::state::{BadgeNFT, BadgeType, UserStats};
use crate::errors::CouponError;
use crate::events::BadgeEarned;

const METADATA_PROGRAM_ID: Pubkey = pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const SYSVAR_INSTRUCTIONS_ID: Pubkey = pubkey!("Sysvar1nstructions1111111111111111111111111");

#[derive(Accounts)]
#[instruction(badge_type: BadgeType)]
pub struct AutoAwardBadge<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + BadgeNFT::INIT_SPACE,
        seeds = [b"badge", user.key().as_ref(), &[badge_type as u8]],
        bump
    )]
    pub badge_nft: Account<'info, BadgeNFT>,

    #[account(
        mut,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,

    /// CHECK: User receiving the badge
    pub user: UncheckedAccount<'info>,

    /// CHECK: SPL Token Mint for Badge NFT
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Master Edition account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,

    /// CHECK: Metaplex Token Metadata Program
    #[account(address = METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Sysvar Instructions
    #[account(address = SYSVAR_INSTRUCTIONS_ID)]
    pub sysvar_instructions: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<AutoAwardBadge>, badge_type: BadgeType) -> Result<()> {
    let user_stats = &mut ctx.accounts.user_stats;
    let badge = &mut ctx.accounts.badge_nft;

    // Check if user already has this badge
    require!(
        !user_stats.has_badge(badge_type as u8),
        CouponError::InvalidInput
    );

    // Verify user qualifies for badge
    let qualifies = match badge_type {
        BadgeType::FirstPurchase => user_stats.total_purchases >= 1,
        BadgeType::TenRedemptions => user_stats.total_redemptions >= 10,
        BadgeType::FiftyRedemptions => user_stats.total_redemptions >= 50,
        BadgeType::TopReviewer => user_stats.total_ratings_given >= 20,
        BadgeType::EarlyAdopter => true, // Manually awarded
        BadgeType::MerchantPartner => true, // Manually awarded
        BadgeType::CommunityModerator => true, // Manually awarded
    };

    require!(qualifies, CouponError::InvalidInput);

    // Initialize badge NFT
    badge.user = ctx.accounts.user.key();
    badge.badge_type = badge_type;
    badge.mint = ctx.accounts.mint.key();
    badge.metadata = ctx.accounts.metadata.key();
    badge.earned_at = Clock::get()?.unix_timestamp;
    
    let badge_name = match badge_type {
        BadgeType::FirstPurchase => "First Purchase Badge",
        BadgeType::TenRedemptions => "10 Redemptions Badge",
        BadgeType::FiftyRedemptions => "50 Redemptions Badge",
        BadgeType::TopReviewer => "Top Reviewer Badge",
        BadgeType::EarlyAdopter => "Early Adopter Badge",
        BadgeType::MerchantPartner => "Merchant Partner Badge",
        BadgeType::CommunityModerator => "Community Moderator Badge",
    };
    
    badge.metadata_uri = format!("https://api.dealdiscovery.com/badges/{}.json", badge_type as u8);

    // Create Metaplex metadata
    CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program.to_account_info())
        .metadata(&ctx.accounts.metadata.to_account_info())
        .master_edition(Some(&ctx.accounts.master_edition.to_account_info()))
        .mint(&ctx.accounts.mint.to_account_info(), true)
        .authority(&ctx.accounts.authority.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .update_authority(&ctx.accounts.authority.to_account_info(), true)
        .system_program(&ctx.accounts.system_program.to_account_info())
        .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
        .spl_token_program(Some(&ctx.accounts.token_program.to_account_info()))
        .name(badge_name.to_string())
        .symbol("BADGE".to_string())
        .uri(badge.metadata_uri.clone())
        .seller_fee_basis_points(0)
        .token_standard(TokenStandard::NonFungible)
        .print_supply(PrintSupply::Zero)
        .invoke()?;

    // Update user stats
    user_stats.add_badge(badge_type as u8);
    
    // Award reputation points
    let reputation_points = match badge_type {
        BadgeType::FirstPurchase => 10,
        BadgeType::TenRedemptions => 50,
        BadgeType::FiftyRedemptions => 200,
        BadgeType::TopReviewer => 100,
        BadgeType::EarlyAdopter => 500,
        BadgeType::MerchantPartner => 300,
        BadgeType::CommunityModerator => 1000,
    };
    user_stats.add_reputation(reputation_points);

    emit!(BadgeEarned {
        user: badge.user,
        badge_type,
        mint: badge.mint,
    });

    msg!("Badge awarded: {} (+{} reputation)", badge_name, reputation_points);

    Ok(())
}