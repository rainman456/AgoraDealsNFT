
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3,
    CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::{Creator, DataV2};

pub fn handler(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
    let reputation = &mut ctx.accounts.user_reputation;
    
    // Check eligibility
    let is_eligible = match badge_type {
        BadgeType::FirstPurchase => reputation.total_purchases >= 1,
        BadgeType::TenRedemptions => reputation.total_redemptions >= 10,
        BadgeType::FiftyRedemptions => reputation.total_redemptions >= 50,
        BadgeType::TopReviewer => reputation.total_ratings_given >= 50,
        _ => false,
    };
    
    require!(is_eligible, ReputationError::BadgeNotEarned);
    
    // Check if already earned
    require!(
        !reputation.badges_earned.contains(&badge_type),
        ReputationError::BadgeAlreadyEarned
    );
    
    let badge = &mut ctx.accounts.badge_nft;
    badge.user = ctx.accounts.user.key();
    badge.badge_type = badge_type;
    badge.mint = ctx.accounts.mint.key();
    badge.earned_at = Clock::get()?.unix_timestamp;
    
    // Generate metadata URI based on badge type
    badge.metadata_uri = get_badge_metadata_uri(badge_type);
    
    // Create Metaplex NFT metadata
    let seeds = &[
        b"badge",
        ctx.accounts.user.key().as_ref(),
        &[badge_type as u8],
        &[ctx.bumps.badge_nft],
    ];
    let signer = &[&seeds[..]];
    
    let metadata_infos = vec![
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.badge_nft.to_account_info(),
        ctx.accounts.user.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    
    let metadata_ix = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.badge_nft.key(),
        payer: ctx.accounts.user.key(),
        update_authority: (ctx.accounts.badge_nft.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };
    
    let metadata_data = DataV2 {
        name: get_badge_name(badge_type),
        symbol: "BADGE".to_string(),
        uri: badge.metadata_uri.clone(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: ctx.accounts.marketplace.key(),
            verified: false,
            share: 100,
        }]),
        collection: None,
        uses: None,
    };
    
    CreateMetadataAccountV3Cpi::new(
        &ctx.accounts.token_metadata_program,
        CreateMetadataAccountV3CpiAccounts {
            metadata: &ctx.accounts.metadata,
            mint: &ctx.accounts.mint,
            mint_authority: &ctx.accounts.badge_nft,
            payer: &ctx.accounts.user,
            update_authority: (&ctx.accounts.badge_nft, true),
            system_program: &ctx.accounts.system_program,
            rent: Some(&ctx.accounts.rent),
        },
        CreateMetadataAccountV3InstructionArgs {
            data: metadata_data,
            is_mutable: false,
            collection_details: None,
        },
    )
    .invoke_signed(signer)?;
    
    // Update reputation
    reputation.badges_earned.push(badge_type);
    
    emit!(BadgeEarned {
        user: badge.user,
        badge_type,
        mint: badge.mint,
    });
    
    Ok(())
}

fn get_badge_name(badge_type: BadgeType) -> String {
    match badge_type {
        BadgeType::FirstPurchase => "First Purchase Badge".to_string(),
        BadgeType::TenRedemptions => "10 Redemptions Badge".to_string(),
        BadgeType::TopReviewer => "Top Reviewer Badge".to_string(),
        _ => "Achievement Badge".to_string(),
    }
}

fn get_badge_metadata_uri(badge_type: BadgeType) -> String {
    // Point to IPFS with pre-uploaded badge images
    format!("https://ipfs.io/ipfs/Qm.../badge_{}.json", badge_type as u8)
}

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
        mut,
        seeds = [b"reputation", user.key().as_ref()],
        bump
    )]
    pub user_reputation: Account<'info, UserReputation>,
    
    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = badge_nft,
        mint::freeze_authority = badge_nft,
    )]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    pub marketplace: Account<'info, Marketplace>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: Metaplex program
    pub token_metadata_program: UncheckedAccount<'info>,
}