use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::state::{
    CouponAuction,
    Bid,
    AuctionType,
    Coupon,
    Marketplace,
    UserStats,
    ReputationTier,
};
use crate::errors::CouponError;
use crate::events::{
    AuctionCreated,
    BidPlaced,
    AuctionFinalized,
    AuctionCancelled,
};

// ============================================================================
// Create Auction
// ============================================================================

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct CreateAuction<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + CouponAuction::INIT_SPACE,
        seeds = [b"auction", coupon.key().as_ref(), &auction_id.to_le_bytes()],
        bump
    )]
    pub auction: Account<'info, CouponAuction>,
    
    #[account(
        constraint = coupon.owner == seller.key() @ CouponError::NotCouponOwner,
        constraint = !coupon.is_redeemed @ CouponError::CouponAlreadyRedeemed,
        constraint = coupon.expiry_timestamp > Clock::get()?.unix_timestamp @ CouponError::CouponExpired
    )]
    pub coupon: Account<'info, Coupon>,
    
    #[account(
        init_if_needed,
        payer = seller,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", seller.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_auction(
    ctx: Context<CreateAuction>,
    auction_id: u64,
    auction_type: AuctionType,
    starting_price: u64,
    reserve_price: u64,
    duration_seconds: i64,
    auto_extend: bool,
    min_bid_increment: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let coupon = &ctx.accounts.coupon;
    let clock = Clock::get()?;
    
    // Validation
    require!(starting_price > 0, CouponError::InvalidPrice);
    require!(reserve_price > 0, CouponError::InvalidPrice);
    require!(duration_seconds >= 300, CouponError::InvalidExpiry); // Min 5 minutes
    require!(duration_seconds <= 604800, CouponError::InvalidExpiry); // Max 7 days
    
    match auction_type {
        AuctionType::English => {
            require!(
                reserve_price <= starting_price,
                CouponError::InvalidPrice
            );
        },
        AuctionType::Dutch => {
            require!(
                reserve_price < starting_price,
                CouponError::InvalidPrice
            );
        },
        AuctionType::SealedBid => {
            require!(
                min_bid_increment > 0,
                CouponError::InvalidPrice
            );
        },
    }
    
    // Initialize auction
    auction.coupon = coupon.key();
    auction.seller = ctx.accounts.seller.key();
    auction.auction_type = auction_type;
    auction.start_time = clock.unix_timestamp;
    auction.end_time = clock.unix_timestamp + duration_seconds;
    auction.starting_price = starting_price;
    auction.reserve_price = reserve_price;
    auction.current_bid = if auction_type == AuctionType::English {
        starting_price
    } else {
        0
    };
    auction.highest_bidder = None;
    auction.bid_count = 0;
    auction.is_active = true;
    auction.is_finalized = false;
    auction.auto_extend = auto_extend;
    auction.extension_seconds = 300; // 5 minute extension
    auction.min_bid_increment = min_bid_increment;
    
    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.seller.key();
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
    
    user_stats.total_listings += 1;
    user_stats.add_reputation(5); // Reputation for creating auction
    user_stats.last_activity = clock.unix_timestamp;
    
    emit!(AuctionCreated {
        auction: auction.key(),
        coupon: coupon.key(),
        seller: auction.seller,
        auction_type,
        starting_price,
        reserve_price,
        end_time: auction.end_time,
    });
    
    // Fixed: Remove Debug format for auction_type
    msg!("✅ Auction created!");
    msg!("✅ Type: English/Dutch/SealedBid");
    msg!("✅ Duration: {} seconds", duration_seconds);
    msg!("✅ Starting price: {} lamports", starting_price);
    
    Ok(())
}

// ============================================================================
// Place Bid (English & Sealed Bid Auctions)
// ============================================================================

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(
        init,
        payer = bidder,
        space = 8 + Bid::INIT_SPACE,
        seeds = [
            b"bid",
            auction.key().as_ref(),
            bidder.key().as_ref(),
            &auction.bid_count.to_le_bytes()
        ],
        bump
    )]
    pub bid: Account<'info, Bid>,
    
    #[account(
        mut,
        constraint = auction.is_active @ CouponError::ListingInactive,
        constraint = auction.auction_type != AuctionType::Dutch @ CouponError::InvalidInput
    )]
    pub auction: Account<'info, CouponAuction>,
    
    /// CHECK: Escrow account for bid (PDA)
    #[account(
        mut,
        seeds = [b"auction_escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow: SystemAccount<'info>,
    
    /// CHECK: Previous highest bidder (for refund)
    #[account(mut)]
    pub previous_bidder: UncheckedAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = bidder,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", bidder.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub bidder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn place_bid(
    ctx: Context<PlaceBid>,
    bid_amount: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let bid = &mut ctx.accounts.bid;
    let clock = Clock::get()?;
    
    // Check auction is still active
    require!(!auction.is_expired(clock.unix_timestamp), CouponError::CouponExpired);
    
    // Validate bid amount
    match auction.auction_type {
        AuctionType::English => {
            let min_bid = auction.current_bid + auction.min_bid_increment;
            require!(bid_amount >= min_bid, CouponError::InvalidPrice);
        },
        AuctionType::SealedBid => {
            require!(bid_amount >= auction.starting_price, CouponError::InvalidPrice);
        },
        AuctionType::Dutch => {
            return Err(CouponError::InvalidInput.into());
        },
    }
    
    // Escrow the bid
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bidder.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        bid_amount,
    )?;
    
    // For English auctions, refund previous bidder
    if auction.auction_type == AuctionType::English {
        if let Some(_prev_bidder) = auction.highest_bidder {
            if auction.current_bid > 0 {
                // FIX: Store auction key before creating seeds
                let auction_key = auction.key();
                let escrow_seeds = &[
                    b"auction_escrow",
                    auction_key.as_ref(),
                    &[ctx.bumps.escrow],
                ];
                let signer_seeds = &[&escrow_seeds[..]];
                
                transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.system_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow.to_account_info(),
                            to: ctx.accounts.previous_bidder.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    auction.current_bid,
                )?;
                
                msg!("✅ Refunded previous bidder: {} lamports", auction.current_bid);
            }
        }
        
        // Update auction state
        auction.current_bid = bid_amount;
        auction.highest_bidder = Some(ctx.accounts.bidder.key());
    }
    
    // Initialize bid record
    bid.auction = auction.key();
    bid.bidder = ctx.accounts.bidder.key();
    bid.amount = bid_amount;
    bid.timestamp = clock.unix_timestamp;
    bid.is_winning = auction.auction_type == AuctionType::English;
    bid.is_refunded = false;
    
    auction.bid_count += 1;
    
    // Auto-extend if enabled and near end
    if auction.should_extend(clock.unix_timestamp) {
        auction.end_time += auction.extension_seconds;
        msg!("⏰ Auction extended by {} seconds", auction.extension_seconds);
    }
    
    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.bidder.key();
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
    
    user_stats.add_reputation(2); // Reputation for participating
    user_stats.last_activity = clock.unix_timestamp;
    
    emit!(BidPlaced {
        auction: auction.key(),
        bidder: ctx.accounts.bidder.key(),
        amount: bid_amount,
        bid_count: auction.bid_count,
        new_end_time: auction.end_time,
    });
    
    msg!("✅ Bid placed: {} lamports", bid_amount);
    msg!("✅ Total bids: {}", auction.bid_count);
    
    Ok(())
}

// ============================================================================
// Buy Now (Dutch Auction)
// ============================================================================

#[derive(Accounts)]
pub struct BuyDutchAuction<'info> {
    #[account(
        mut,
        constraint = auction.is_active @ CouponError::ListingInactive,
        constraint = auction.auction_type == AuctionType::Dutch @ CouponError::InvalidInput
    )]
    pub auction: Account<'info, CouponAuction>,
    
    #[account(
        mut,
        constraint = coupon.key() == auction.coupon @ CouponError::WrongCoupon
    )]
    pub coupon: Account<'info, Coupon>,
    
    pub marketplace: Account<'info, Marketplace>,
    
    /// CHECK: Seller receiving payment
    #[account(
        mut,
        constraint = auction.seller == seller.key() @ CouponError::NotListingSeller
    )]
    pub seller: SystemAccount<'info>,
    
    /// CHECK: Marketplace authority
    #[account(
        mut,
        constraint = marketplace.authority == marketplace_authority.key() @ CouponError::NotMarketplaceAuthority
    )]
    pub marketplace_authority: SystemAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + UserStats::INIT_SPACE,
        seeds = [b"user_stats", buyer.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn buy_dutch_auction(ctx: Context<BuyDutchAuction>) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let coupon = &mut ctx.accounts.coupon;
    let clock = Clock::get()?;
    
    // Check not expired
    require!(!auction.is_expired(clock.unix_timestamp), CouponError::CouponExpired);
    
    // Calculate current Dutch price
    let current_price = auction.calculate_dutch_price(clock.unix_timestamp);
    
    msg!("✅ Current Dutch auction price: {} lamports", current_price);
    
    // Calculate fees
    let marketplace = &ctx.accounts.marketplace;
    let marketplace_fee = (current_price * marketplace.fee_basis_points as u64) / 10000;
    let seller_amount = current_price - marketplace_fee;
    
    // Pay seller
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
        ),
        seller_amount,
    )?;
    
    // Pay marketplace fee
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.marketplace_authority.to_account_info(),
            },
        ),
        marketplace_fee,
    )?;
    
    // Transfer coupon ownership
    coupon.owner = ctx.accounts.buyer.key();
    
    // Finalize auction
    auction.is_active = false;
    auction.is_finalized = true;
    auction.current_bid = current_price;
    auction.highest_bidder = Some(ctx.accounts.buyer.key());
    
    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.buyer.key();
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
    
    user_stats.total_purchases += 1;
    user_stats.add_reputation(5);
    user_stats.last_activity = clock.unix_timestamp;
    
    emit!(AuctionFinalized {
        auction: auction.key(),
        winner: ctx.accounts.buyer.key(),
        final_price: current_price,
        auction_type: AuctionType::Dutch,
        finalized_at: clock.unix_timestamp,
    });
    
    msg!("✅ Dutch auction completed at {} lamports", current_price);
    
    Ok(())
}

// ============================================================================
// Finalize Auction (English & Sealed Bid)
// ============================================================================

#[derive(Accounts)]
pub struct FinalizeAuction<'info> {
    #[account(
        mut,
        constraint = auction.can_finalize(Clock::get()?.unix_timestamp) @ CouponError::InvalidExpiry
    )]
    pub auction: Account<'info, CouponAuction>,
    
    #[account(
        mut,
        constraint = coupon.key() == auction.coupon @ CouponError::WrongCoupon
    )]
    pub coupon: Account<'info, Coupon>,
    
    pub marketplace: Account<'info, Marketplace>,
    
    /// CHECK: Escrow account
    #[account(
        mut,
        seeds = [b"auction_escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow: SystemAccount<'info>,
    
    /// CHECK: Seller receiving payment
    #[account(
        mut,
        constraint = auction.seller == seller.key() @ CouponError::NotListingSeller
    )]
    pub seller: SystemAccount<'info>,
    
    /// CHECK: Winner receiving coupon
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,
    
    /// CHECK: Marketplace authority
    #[account(
        mut,
        constraint = marketplace.authority == marketplace_authority.key() @ CouponError::NotMarketplaceAuthority
    )]
    pub marketplace_authority: SystemAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"user_stats", winner.key().as_ref()],
        bump
    )]
    pub winner_stats: Account<'info, UserStats>,
    
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn finalize_auction(ctx: Context<FinalizeAuction>) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let coupon = &mut ctx.accounts.coupon;
    let clock = Clock::get()?;
    
    // Check if reserve price met
    if auction.current_bid < auction.reserve_price {
        msg!("⚠️ Reserve price not met. Auction cancelled.");
        
        // Refund highest bidder if exists
        if let Some(_bidder) = auction.highest_bidder {
            if auction.current_bid > 0 {
                // FIX: Store auction key before creating seeds
                let auction_key = auction.key();
                let escrow_seeds = &[
                    b"auction_escrow",
                    auction_key.as_ref(),
                    &[ctx.bumps.escrow],
                ];
                let signer_seeds = &[&escrow_seeds[..]];
                
                transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.system_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow.to_account_info(),
                            to: ctx.accounts.winner.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    auction.current_bid,
                )?;
                
                msg!("✅ Refunded bidder: {} lamports", auction.current_bid);
            }
        }
        
        auction.is_active = false;
        auction.is_finalized = true;
        
        emit!(AuctionCancelled {
            auction: auction.key(),
            reason: "Reserve price not met".to_string(),
            timestamp: clock.unix_timestamp,
        });
        
        return Ok(());
    }
    
    // Reserve price met - complete sale
    let winner_key = auction.highest_bidder.ok_or(CouponError::InvalidInput)?;
    require!(winner_key == ctx.accounts.winner.key(), CouponError::NotCouponOwner);
    
    let final_price = auction.current_bid;
    
    // Calculate fees
    let marketplace = &ctx.accounts.marketplace;
    let marketplace_fee = (final_price * marketplace.fee_basis_points as u64) / 10000;
    let seller_amount = final_price - marketplace_fee;
    
    // FIX: Store auction key before creating seeds
    let auction_key = auction.key();
    let escrow_seeds = &[
        b"auction_escrow",
        auction_key.as_ref(),
        &[ctx.bumps.escrow],
    ];
    let signer_seeds = &[&escrow_seeds[..]];
    
    // Pay seller
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer_seeds,
        ),
        seller_amount,
    )?;
    
    // Pay marketplace fee
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.marketplace_authority.to_account_info(),
            },
            signer_seeds,
        ),
        marketplace_fee,
    )?;
    
    // Transfer coupon to winner
    coupon.owner = winner_key;
    
    // Update winner stats
    let winner_stats = &mut ctx.accounts.winner_stats;
    winner_stats.total_purchases += 1;
    winner_stats.add_reputation(5);
    winner_stats.last_activity = clock.unix_timestamp;
    
    // Finalize auction
    auction.is_active = false;
    auction.is_finalized = true;
    
    emit!(AuctionFinalized {
        auction: auction.key(),
        winner: winner_key,
        final_price,
        auction_type: auction.auction_type,
        finalized_at: clock.unix_timestamp,
    });
    
    msg!("✅ Auction finalized!");
    msg!("✅ Winner: {}", winner_key);
    msg!("✅ Final price: {} lamports", final_price);
    msg!("✅ Seller received: {} lamports", seller_amount);
    
    Ok(())
}

// ============================================================================
// Cancel Auction (Before any bids)
// ============================================================================

#[derive(Accounts)]
pub struct CancelAuction<'info> {
    #[account(
        mut,
        constraint = auction.is_active @ CouponError::ListingInactive,
        constraint = auction.bid_count == 0 @ CouponError::InvalidInput,
        constraint = auction.seller == seller.key() @ CouponError::NotListingSeller,
        close = seller
    )]
    pub auction: Account<'info, CouponAuction>,
    
    #[account(mut)]
    pub seller: Signer<'info>,
}

pub fn cancel_auction(ctx: Context<CancelAuction>) -> Result<()> {
    let auction = &ctx.accounts.auction;
    
    emit!(AuctionCancelled {
        auction: auction.key(),
        reason: "Cancelled by seller".to_string(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("✅ Auction cancelled and account closed");
    
    Ok(())
}

// ============================================================================
// Handlers for lib.rs
// ============================================================================

pub fn handler_create_auction(
    ctx: Context<CreateAuction>,
    auction_id: u64,
    auction_type: AuctionType,
    starting_price: u64,
    reserve_price: u64,
    duration_seconds: i64,
    auto_extend: bool,
    min_bid_increment: u64,
) -> Result<()> {
    create_auction(
        ctx,
        auction_id,
        auction_type,
        starting_price,
        reserve_price,
        duration_seconds,
        auto_extend,
        min_bid_increment,
    )
}

pub fn handler_place_bid(
    ctx: Context<PlaceBid>,
    bid_amount: u64,
) -> Result<()> {
    place_bid(ctx, bid_amount)
}

pub fn handler_buy_dutch_auction(ctx: Context<BuyDutchAuction>) -> Result<()> {
    buy_dutch_auction(ctx)
}

pub fn handler_finalize_auction(ctx: Context<FinalizeAuction>) -> Result<()> {
    finalize_auction(ctx)
}

pub fn handler_cancel_auction(ctx: Context<CancelAuction>) -> Result<()> {
    cancel_auction(ctx)
}