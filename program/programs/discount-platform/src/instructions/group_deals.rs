use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::state::{
    GroupDeal, 
    GroupParticipant, 
    DiscountTier, 
    Promotion, 
    Merchant,
    Coupon,
    Marketplace,
    UserStats,
    BadgeType,
    ReputationTier,
};
use crate::errors::CouponError;
use crate::events::{GroupDealCreated, GroupDealJoined, GroupDealFinalized, GroupDealRefunded};

// ============================================================================
// Create Group Deal
// ============================================================================

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct CreateGroupDeal<'info> {
    #[account(
        init,
        payer = organizer,
        space = 8 + GroupDeal::INIT_SPACE,
        seeds = [b"group_deal", promotion.key().as_ref(), &deal_id.to_le_bytes()],
        bump
    )]
    pub group_deal: Account<'info, GroupDeal>,
    
    /// CHECK: Escrow vault PDA - will be created by system program
    #[account(
        mut,
        seeds = [b"group_escrow", group_deal.key().as_ref()],
        bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(
        constraint = promotion.merchant == merchant.key() @ CouponError::WrongMerchant
    )]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_group_deal(
    ctx: Context<CreateGroupDeal>,
    deal_id: u64,
    target_participants: u32,
    max_participants: u32,
    base_price: u64,
    discount_tiers: Vec<DiscountTier>,
    duration_seconds: i64,
) -> Result<()> {
    let group_deal = &mut ctx.accounts.group_deal;
    let promotion = &ctx.accounts.promotion;
    let clock = Clock::get()?;
    
    // Validation
    require!(target_participants > 1, CouponError::InvalidSupply);
    require!(max_participants >= target_participants, CouponError::InvalidSupply);
    require!(max_participants <= promotion.max_supply, CouponError::SupplyExhausted);
    require!(base_price > 0, CouponError::InvalidPrice);
    require!(duration_seconds >= 3600, CouponError::InvalidExpiry); // Min 1 hour
    require!(discount_tiers.len() <= 5, CouponError::InvalidInput);
    
    // Validate discount tiers are in ascending order
    for i in 0..discount_tiers.len() {
        if i > 0 {
            require!(
                discount_tiers[i].min_participants > discount_tiers[i-1].min_participants,
                CouponError::InvalidInput
            );
        }
        require!(
            discount_tiers[i].discount_percentage <= 50, // Max 50% additional discount
            CouponError::InvalidDiscount
        );
    }
    
    // Initialize group deal
    group_deal.promotion = promotion.key();
    group_deal.merchant = ctx.accounts.merchant.key();
    group_deal.organizer = ctx.accounts.organizer.key();
    group_deal.target_participants = target_participants;
    group_deal.current_participants = 0;
    group_deal.max_participants = max_participants;
    group_deal.base_price = base_price;
    
    // Copy discount tiers (pad with defaults if less than 5)
    let mut tiers = [DiscountTier::default(); 5];
    for (i, tier) in discount_tiers.iter().enumerate() {
        tiers[i] = *tier;
    }
    group_deal.discount_tiers = tiers;
    
    group_deal.deadline = clock.unix_timestamp + duration_seconds;
    group_deal.is_active = true;
    group_deal.is_finalized = false;
    group_deal.escrow_vault = ctx.accounts.escrow_vault.key();
    group_deal.created_at = clock.unix_timestamp;
    group_deal.finalized_at = 0;
    group_deal.total_escrowed = 0;
    
    emit!(GroupDealCreated {
        group_deal: group_deal.key(),
        promotion: promotion.key(),
        merchant: group_deal.merchant,
        organizer: group_deal.organizer,
        target_participants,
        base_price,
        deadline: group_deal.deadline,
    });
    
    msg!("✅ Group deal created!");
    msg!("✅ Target: {} participants", target_participants);
    msg!("✅ Base price: {} lamports", base_price);
    msg!("✅ Deadline: {}", group_deal.deadline);
    
    Ok(())
}

// ============================================================================
// Join Group Deal (Escrow Payment)
// ============================================================================

#[derive(Accounts)]
pub struct JoinGroupDeal<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + GroupParticipant::INIT_SPACE,
        seeds = [b"participant", group_deal.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, GroupParticipant>,
    
    #[account(
        mut,
        constraint = group_deal.is_active @ CouponError::PromotionInactive,
        constraint = !group_deal.is_finalized @ CouponError::ListingInactive,
        constraint = group_deal.current_participants < group_deal.max_participants @ CouponError::SupplyExhausted
    )]
    pub group_deal: Account<'info, GroupDeal>,
    
    /// CHECK: Escrow vault
    #[account(
        mut,
        seeds = [b"group_escrow", group_deal.key().as_ref()],
        bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn join_group_deal(ctx: Context<JoinGroupDeal>) -> Result<()> {
    let group_deal = &mut ctx.accounts.group_deal;
    let participant = &mut ctx.accounts.participant;
    let clock = Clock::get()?;
    
    // Check deadline
    require!(
        !group_deal.is_expired(clock.unix_timestamp),
        CouponError::CouponExpired
    );
    
    // Calculate current price based on tiers
    let current_price = group_deal.get_current_price();
    
    // Escrow payment to vault
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
            },
        ),
        current_price,
    )?;
    
    // Initialize participant
    participant.group_deal = group_deal.key();
    participant.user = ctx.accounts.user.key();
    participant.amount_escrowed = current_price;
    participant.joined_at = clock.unix_timestamp;
    participant.is_refunded = false;
    participant.coupon_minted = None;
    
    // Update group deal
    group_deal.current_participants += 1;
    group_deal.total_escrowed += current_price;
    
    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.user.key();
        user_stats.total_purchases = 0;
        user_stats.total_redemptions = 0;
        user_stats.total_ratings_given = 0;
        user_stats.total_comments = 0;
        user_stats.total_listings = 0;
        user_stats.reputation_score = 0;
        user_stats.tier = ReputationTier::Bronze;
        user_stats.badges_earned = Vec::new();
        user_stats.joined_at = clock.unix_timestamp;
    }
    
    user_stats.add_reputation(3); // Reputation for joining group deals
    user_stats.last_activity = clock.unix_timestamp;
    
    emit!(GroupDealJoined {
        group_deal: group_deal.key(),
        user: ctx.accounts.user.key(),
        participants_count: group_deal.current_participants,
        amount_escrowed: current_price,
        current_discount: group_deal.get_current_discount(),
    });
    
    msg!("✅ Joined group deal!");
    msg!("✅ Participants: {}/{}", group_deal.current_participants, group_deal.target_participants);
    msg!("✅ Current discount: {}%", group_deal.get_current_discount());
    msg!("✅ Price paid: {} lamports", current_price);
    
    if group_deal.is_target_reached() {
        msg!("🎉 Target reached! Deal can be finalized.");
    }
    
    Ok(())
}

// ============================================================================
// Finalize Group Deal (Success: Mint Coupons)
// ============================================================================

#[derive(Accounts)]
pub struct FinalizeGroupDeal<'info> {
    #[account(
        mut,
        constraint = group_deal.can_finalize(Clock::get()?.unix_timestamp) @ CouponError::InvalidExpiry
    )]
    pub group_deal: Account<'info, GroupDeal>,
    
    #[account(mut)]
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    
    /// CHECK: Escrow vault
    #[account(
        mut,
        seeds = [b"group_escrow", group_deal.key().as_ref()],
        bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    
    /// CHECK: Merchant receives payment
    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant_authority: UncheckedAccount<'info>,
    
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn finalize_group_deal(ctx: Context<FinalizeGroupDeal>) -> Result<()> {
    let group_deal = &mut ctx.accounts.group_deal;
    let clock = Clock::get()?;
    
    require!(
        group_deal.is_target_reached(),
        CouponError::InvalidSupply
    );
    
    // Calculate payments
    let marketplace = &ctx.accounts.marketplace;
    let marketplace_fee = (group_deal.total_escrowed * marketplace.fee_basis_points as u64) / 10000;
    let merchant_payment = group_deal.total_escrowed - marketplace_fee;
    
    // Transfer to merchant - Store group_deal key before creating seeds
    let group_deal_key = group_deal.key();
    let escrow_seeds = &[
        b"group_escrow",
        group_deal_key.as_ref(),
        &[ctx.bumps.escrow_vault],
    ];
    let signer_seeds = &[&escrow_seeds[..]];
    
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.merchant_authority.to_account_info(),
            },
            signer_seeds,
        ),
        merchant_payment,
    )?;
    
    // Update promotion supply
    let promotion = &mut ctx.accounts.promotion;
    promotion.current_supply += group_deal.current_participants;
    
    // Update merchant stats
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_created += group_deal.current_participants as u64;
    
    // Mark as finalized
    group_deal.is_finalized = true;
    group_deal.finalized_at = clock.unix_timestamp;
    
    emit!(GroupDealFinalized {
        group_deal: group_deal.key(),
        participants_count: group_deal.current_participants,
        final_discount: group_deal.get_current_discount(),
        total_revenue: merchant_payment,
        finalized_at: clock.unix_timestamp,
    });
    
    msg!("✅ Group deal finalized successfully!");
    msg!("✅ Participants: {}", group_deal.current_participants);
    msg!("✅ Final discount: {}%", group_deal.get_current_discount());
    msg!("✅ Merchant revenue: {} lamports", merchant_payment);
    
    Ok(())
}

// ============================================================================
// Refund Group Deal (Failed to reach target)
// ============================================================================

#[derive(Accounts)]
pub struct RefundGroupDeal<'info> {
    #[account(
        mut,
        constraint = group_deal.is_expired(Clock::get()?.unix_timestamp) @ CouponError::InvalidExpiry,
        constraint = !group_deal.is_target_reached() @ CouponError::InvalidSupply,
        constraint = !group_deal.is_finalized @ CouponError::ListingInactive
    )]
    pub group_deal: Account<'info, GroupDeal>,
    
    #[account(
        mut,
        constraint = participant.group_deal == group_deal.key() @ CouponError::WrongCoupon,
        constraint = !participant.is_refunded @ CouponError::CouponAlreadyRedeemed
    )]
    pub participant: Account<'info, GroupParticipant>,
    
    /// CHECK: Escrow vault
    #[account(
        mut,
        seeds = [b"group_escrow", group_deal.key().as_ref()],
        bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    
    /// CHECK: User receiving refund
    #[account(
        mut,
        constraint = participant.user == user.key() @ CouponError::NotCouponOwner
    )]
    pub user: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn refund_group_deal(ctx: Context<RefundGroupDeal>) -> Result<()> {
    let participant = &mut ctx.accounts.participant;
    let group_deal = &ctx.accounts.group_deal;
    
    let refund_amount = participant.amount_escrowed;
    
    // Refund from escrow - Store group_deal key before creating seeds
    let group_deal_key = group_deal.key();
    let escrow_seeds = &[
        b"group_escrow",
        group_deal_key.as_ref(),
        &[ctx.bumps.escrow_vault],
    ];
    let signer_seeds = &[&escrow_seeds[..]];
    
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer_seeds,
        ),
        refund_amount,
    )?;
    
    participant.is_refunded = true;
    
    emit!(GroupDealRefunded {
        group_deal: group_deal.key(),
        user: participant.user,
        refund_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("✅ Refund processed: {} lamports", refund_amount);
    
    Ok(())
}

// ============================================================================
// Mint Coupon for Participant (After Finalization)
// ============================================================================

#[derive(Accounts)]
pub struct MintGroupCoupon<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Coupon::INIT_SPACE,
        seeds = [
            b"group_coupon",
            group_deal.key().as_ref(),
            participant.user.as_ref()
        ],
        bump
    )]
    pub coupon: Account<'info, Coupon>,
    
    #[account(
        constraint = group_deal.is_finalized @ CouponError::PromotionInactive
    )]
    pub group_deal: Account<'info, GroupDeal>,
    
    #[account(
        mut,
        constraint = participant.group_deal == group_deal.key() @ CouponError::WrongCoupon,
        constraint = participant.coupon_minted.is_none() @ CouponError::CouponAlreadyRedeemed
    )]
    pub participant: Account<'info, GroupParticipant>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn mint_group_coupon(ctx: Context<MintGroupCoupon>, coupon_id: u64) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    let participant = &mut ctx.accounts.participant;
    let promotion = &ctx.accounts.promotion;
    let clock = Clock::get()?;
    
    // Initialize coupon
    coupon.id = coupon_id;
    coupon.promotion = promotion.key();
    coupon.owner = participant.user;
    coupon.merchant = promotion.merchant;
    coupon.discount_percentage = promotion.discount_percentage 
        + ctx.accounts.group_deal.get_current_discount();
    coupon.expiry_timestamp = promotion.expiry_timestamp;
    coupon.is_redeemed = false;
    coupon.redeemed_at = 0;
    coupon.created_at = clock.unix_timestamp;
    coupon.mint = None;
    coupon.metadata_uri = "https://example.com/group-coupon.json".to_string();
    
    // Mark as minted
    participant.coupon_minted = Some(coupon.key());
    
    msg!("✅ Group coupon minted with {}% discount!", coupon.discount_percentage);
    
    Ok(())
}

// ============================================================================
// Handlers for lib.rs
// ============================================================================

pub fn handler_create_group_deal(
    ctx: Context<CreateGroupDeal>,
    deal_id: u64,
    target_participants: u32,
    max_participants: u32,
    base_price: u64,
    discount_tiers: Vec<DiscountTier>,
    duration_seconds: i64,
) -> Result<()> {
    create_group_deal(
        ctx,
        deal_id,
        target_participants,
        max_participants,
        base_price,
        discount_tiers,
        duration_seconds,
    )
}

pub fn handler_join_group_deal(ctx: Context<JoinGroupDeal>) -> Result<()> {
    join_group_deal(ctx)
}

pub fn handler_finalize_group_deal(ctx: Context<FinalizeGroupDeal>) -> Result<()> {
    finalize_group_deal(ctx)
}

pub fn handler_refund_group_deal(ctx: Context<RefundGroupDeal>) -> Result<()> {
    refund_group_deal(ctx)
}

pub fn handler_mint_group_coupon(
    ctx: Context<MintGroupCoupon>,
    coupon_id: u64,
) -> Result<()> {
    mint_group_coupon(ctx, coupon_id)
}