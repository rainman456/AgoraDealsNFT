// src/instructions/redemption_tickets.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, burn, Burn, close_account, CloseAccount};
use crate::state::{
    Coupon, 
    Merchant, 
    UserStats, 
    RedemptionTicket, 
    RedemptionLocation,
    BadgeType,
    ReputationTier,
};
use crate::errors::CouponError;
use crate::events::{TicketGenerated, TicketRedeemed, CouponRedeemed};

// ============================================================================
// Generate Redemption Ticket (User Side)
// ============================================================================

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct GenerateRedemptionTicket<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + RedemptionTicket::INIT_SPACE,
        seeds = [
            b"ticket",
            coupon.key().as_ref(),
            user.key().as_ref(),
            &nonce.to_le_bytes()
        ],
        bump
    )]
    pub ticket: Account<'info, RedemptionTicket>,
    
    #[account(
        constraint = coupon.owner == user.key() @ CouponError::NotCouponOwner,
        constraint = !coupon.is_redeemed @ CouponError::CouponAlreadyRedeemed,
        constraint = coupon.expiry_timestamp > Clock::get()?.unix_timestamp @ CouponError::CouponExpired
    )]
    pub coupon: Account<'info, Coupon>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn generate_redemption_ticket(
    ctx: Context<GenerateRedemptionTicket>,
    nonce: u64,
    latitude: Option<f64>,
    longitude: Option<f64>,
) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let coupon = &ctx.accounts.coupon;
    let clock = Clock::get()?;
    
    // Generate cryptographic hash for QR code
    let ticket_hash = RedemptionTicket::generate_hash(
        &coupon.key(),
        &ctx.accounts.user.key(),
        nonce,
    );
    
    ticket.coupon = coupon.key();
    ticket.user = ctx.accounts.user.key();
    ticket.merchant = coupon.merchant;
    ticket.ticket_hash = ticket_hash;
    ticket.created_at = clock.unix_timestamp;
    ticket.expires_at = clock.unix_timestamp + 300; // 5 minutes
    ticket.is_consumed = false;
    ticket.nonce = nonce;
    
    // Optional: Record location where ticket was generated
    if let (Some(lat), Some(lon)) = (latitude, longitude) {
        require!(lat >= -90.0 && lat <= 90.0, CouponError::InvalidCoordinates);
        require!(lon >= -180.0 && lon <= 180.0, CouponError::InvalidCoordinates);
        
        ticket.redemption_location = Some(RedemptionLocation {
            latitude: (lat * 1_000_000.0) as i32,
            longitude: (lon * 1_000_000.0) as i32,
            timestamp: clock.unix_timestamp,
        });
    }
    
    emit!(TicketGenerated {
        ticket: ticket.key(),
        coupon: coupon.key(),
        user: ticket.user,
        merchant: ticket.merchant,
        ticket_hash,
        expires_at: ticket.expires_at,
        nonce,
    });
    
    msg!("✓ Redemption ticket generated. Valid until: {}", ticket.expires_at);
    msg!("✓ Ticket hash (for QR): {:?}", ticket_hash);
    
    Ok(())
}

// ============================================================================
// Verify and Redeem with Ticket (Merchant Side)
// ============================================================================

#[derive(Accounts)]
pub struct VerifyAndRedeemTicket<'info> {
    #[account(
        mut,
        constraint = !ticket.is_consumed @ CouponError::CouponAlreadyRedeemed,
        constraint = ticket.merchant == merchant.key() @ CouponError::WrongMerchant,
        constraint = ticket.coupon == coupon.key() @ CouponError::WrongCoupon
    )]
    pub ticket: Account<'info, RedemptionTicket>,
    
    #[account(
        mut,
        constraint = coupon.key() == ticket.coupon @ CouponError::WrongCoupon,
        constraint = !coupon.is_redeemed @ CouponError::CouponAlreadyRedeemed,
        constraint = coupon.merchant == merchant.key() @ CouponError::WrongMerchant
    )]
    pub coupon: Account<'info, Coupon>,
    
    /// CHECK: NFT Mint
    #[account(
        mut,
        constraint = nft_mint.key() == coupon.mint.unwrap() @ CouponError::WrongCoupon
    )]
    pub nft_mint: Account<'info, Mint>,
    
    /// CHECK: Token account holding the NFT
    #[account(
        mut,
        constraint = token_account.mint == nft_mint.key(),
        constraint = token_account.owner == ticket.user
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant: Account<'info, Merchant>,
    
    #[account(
        mut,
        seeds = [b"user_stats", ticket.user.as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    // CHANGED: User must be a Signer to authorize NFT burning
    #[account(
        mut,
        constraint = user.key() == ticket.user @ CouponError::NotCouponOwner
    )]
    pub user: Signer<'info>,
    
    pub merchant_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn verify_and_redeem_ticket(
    ctx: Context<VerifyAndRedeemTicket>,
    expected_hash: [u8; 32],
) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let coupon = &mut ctx.accounts.coupon;
    let clock = Clock::get()?;
    
    // Validate ticket hasn't expired
    require!(
        ticket.is_valid(clock.unix_timestamp),
        CouponError::CouponExpired
    );
    
    // Verify the hash matches (prevents tampering)
    require!(
        ticket.ticket_hash == expected_hash,
        CouponError::InvalidInput
    );
    
    // Verify hash integrity
    let computed_hash = RedemptionTicket::generate_hash(
        &ticket.coupon,
        &ticket.user,
        ticket.nonce,
    );
    require!(
        computed_hash == ticket.ticket_hash,
        CouponError::InvalidInput
    );
    
    // Mark ticket as consumed (prevents double-redemption)
    ticket.is_consumed = true;
    
    // Mark coupon as redeemed
    coupon.is_redeemed = true;
    coupon.redeemed_at = clock.unix_timestamp;
    
    // Update merchant stats
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_redeemed += 1;
    
    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.total_redemptions += 1;
    user_stats.add_reputation(10);
    user_stats.last_activity = clock.unix_timestamp;
    
    // Check for badge eligibility
    if user_stats.total_redemptions == 10 && !user_stats.has_badge(BadgeType::TenRedemptions as u8) {
        msg!("🏆 User eligible for TenRedemptions badge!");
    }
    
    if user_stats.total_redemptions == 50 && !user_stats.has_badge(BadgeType::FiftyRedemptions as u8) {
        msg!("🏆 User eligible for FiftyRedemptions badge!");
    }
    
    // Burn the NFT (permanent on-chain proof)
    let cpi_accounts = Burn {
        mint: ctx.accounts.nft_mint.to_account_info(),
        from: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    burn(cpi_ctx, 1)?;
    
    // Close the token account to reclaim rent
    let close_accounts = CloseAccount {
        account: ctx.accounts.token_account.to_account_info(),
        destination: ctx.accounts.user.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let close_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        close_accounts,
    );
    
    close_account(close_ctx)?;
    
    emit!(TicketRedeemed {
        ticket: ticket.key(),
        coupon: coupon.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        user: ticket.user,
        merchant: merchant.key(),
        redeemed_at: clock.unix_timestamp,
    });
    
    emit!(CouponRedeemed {
        coupon: coupon.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        user: ticket.user,
        merchant: merchant.key(),
        discount_percentage: coupon.discount_percentage,
        redemption_code: format!("TICKET-{}", ticket.nonce),
        timestamp: clock.unix_timestamp,
    });
    
    msg!("✓ Coupon redeemed successfully via ticket!");
    msg!("✓ User reputation: {} | Tier: {:?}", user_stats.reputation_score, user_stats.tier);
    msg!("✓ Merchant total redemptions: {}", merchant.total_coupons_redeemed);
    
    Ok(())
}

// ============================================================================
// Cancel Ticket (User can cancel if not yet redeemed)
// ============================================================================

#[derive(Accounts)]
pub struct CancelRedemptionTicket<'info> {
    #[account(
        mut,
        constraint = ticket.user == user.key() @ CouponError::NotCouponOwner,
        constraint = !ticket.is_consumed @ CouponError::CouponAlreadyRedeemed,
        close = user
    )]
    pub ticket: Account<'info, RedemptionTicket>,
    
    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn cancel_redemption_ticket(ctx: Context<CancelRedemptionTicket>) -> Result<()> {
    msg!("✓ Redemption ticket cancelled and account closed");
    msg!("✓ Rent refunded to user");
    
    Ok(())
}

// ============================================================================
// Handler wrapper for lib.rs
// ============================================================================

pub fn handler_generate_ticket(
    ctx: Context<GenerateRedemptionTicket>,
    nonce: u64,
    latitude: Option<f64>,
    longitude: Option<f64>,
) -> Result<()> {
    generate_redemption_ticket(ctx, nonce, latitude, longitude)
}

pub fn handler_verify_redeem_ticket(
    ctx: Context<VerifyAndRedeemTicket>,
    expected_hash: [u8; 32],
) -> Result<()> {
    verify_and_redeem_ticket(ctx, expected_hash)
}

pub fn handler_cancel_ticket(ctx: Context<CancelRedemptionTicket>) -> Result<()> {
    cancel_redemption_ticket(ctx)
}