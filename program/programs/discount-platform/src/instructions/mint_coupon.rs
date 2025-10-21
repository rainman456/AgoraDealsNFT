// src/instructions/mint_coupon.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, mint_to, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::CreateV1CpiBuilder;
use mpl_token_metadata::types::{TokenStandard, PrintSupply};
use crate::state::{Coupon, Promotion, Merchant, Marketplace};
use crate::errors::CouponError;
use crate::events::CouponMinted;

#[derive(Accounts)]
pub struct MintCoupon<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Coupon::INIT_SPACE,
        seeds = [b"coupon", promotion.key().as_ref(), &promotion.current_supply.to_le_bytes()],
        bump
    )]
    pub coupon: Account<'info, Coupon>,
    
    /// CHECK: SPL Token Mint for NFT
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub nft_mint: Account<'info, Mint>,
    
    /// CHECK: Associated Token Account for recipient
    #[account(
        init,
        payer = payer,
        associated_token::mint = nft_mint,
        associated_token::authority = recipient
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    
    /// CHECK: Recipient of the NFT
    pub recipient: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex Token Metadata Program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
    let promotion = &mut ctx.accounts.promotion;
    require!(promotion.is_active, CouponError::PromotionInactive);
    require!(promotion.current_supply < promotion.max_supply, CouponError::SupplyExhausted);
    require!(promotion.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::PromotionExpired);

    let coupon = &mut ctx.accounts.coupon;
    coupon.id = coupon_id;
    coupon.promotion = promotion.key();
    coupon.owner = ctx.accounts.recipient.key();
    coupon.merchant = ctx.accounts.merchant.key();
    coupon.discount_percentage = promotion.discount_percentage;
    coupon.expiry_timestamp = promotion.expiry_timestamp;
    coupon.is_redeemed = false;
    coupon.redeemed_at = 0;
    coupon.created_at = Clock::get()?.unix_timestamp;
    coupon.mint = Some(ctx.accounts.nft_mint.key());
    coupon.metadata_uri = "https://example.com/metadata.json".to_string();

    // Mint NFT to recipient
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.nft_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1,
    )?;

    // Create Metaplex metadata using new V1 builder pattern
    CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program.to_account_info())
        .metadata(&ctx.accounts.metadata.to_account_info())
        .mint(&ctx.accounts.nft_mint.to_account_info(), true)
        .authority(&ctx.accounts.authority.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .update_authority(&ctx.accounts.authority.to_account_info(), true)
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Discount Coupon".to_string())
        .symbol("DC".to_string())
        .uri(coupon.metadata_uri.clone())
        .seller_fee_basis_points(0)
        .token_standard(TokenStandard::NonFungible)
        .print_supply(PrintSupply::Zero)
        .invoke()?;

    promotion.current_supply += 1;
    ctx.accounts.merchant.total_coupons_created += 1;
    ctx.accounts.marketplace.total_coupons += 1;

    emit!(CouponMinted {
        coupon: coupon.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        promotion: promotion.key(),
        recipient: ctx.accounts.recipient.key(),
        merchant: coupon.merchant,
        discount_percentage: coupon.discount_percentage,
    });

    Ok(())
}