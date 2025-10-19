# Codebase Analysis: src
Generated: 2025-10-19 04:15:18
---

## 📂 Project Structure
```tree
📁 src
├── accounts/
│   ├── badge.rs
│   ├── comment.rs
│   ├── coupon.rs
│   ├── external_deal.rs
│   ├── listing.rs
│   ├── location.rs
│   ├── marketplace.rs
│   ├── merchant.rs
│   ├── mod.rs
│   ├── promotion.rs
│   └── rating.rs
├── instructions/
│   ├── add_comment.rs
│   ├── buy_listing.rs
│   ├── create_promotion.rs
│   ├── initialize.rs
│   ├── like_comment.rs
│   ├── list_for_sale.rs
│   ├── mint_badge.rs
│   ├── mint_coupon.rs
│   ├── mod.rs
│   ├── rate_promotion.rs
│   ├── redeem_coupon.rs
│   ├── register_merchant.rs
│   ├── transfer_coupon.rs
│   └── update_external_deal.rs
├── errors.rs
├── events.rs
└── lib.rs
```
---

## 📄 File Contents
### events.rs
- Size: 2.77 KB
- Lines: 153
- Last Modified: 2025-10-19 04:03:16

```rust
use anchor_lang::prelude::*;

// Re-export enums from accounts for use in events
pub use crate::accounts::{BadgeType, DealSource};

#[event]
pub struct MarketplaceInitialized {
    pub marketplace: Pubkey,
    pub authority: Pubkey,
    pub fee_basis_points: u16,
    pub timestamp: i64,
}

#[event]
pub struct MerchantRegistered {
    pub merchant: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub category: String,
    pub timestamp: i64,
}

#[event]
pub struct PromotionCreated {
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub max_supply: u32,
    pub expiry_timestamp: i64,
    pub price: u64,
}

#[event]
pub struct CouponMinted {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub promotion: Pubkey,
    pub recipient: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub redemption_code: String,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct ListingCancelled {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponSold {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub nft_mint: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
}

#[event]
pub struct MerchantRated {
    pub merchant: Pubkey,
    pub rater: Pubkey,
    pub rating: u8,
    pub review: String,
    pub timestamp: i64,
}

#[event]
pub struct RewardsStaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub duration: i64,
    pub expected_rewards: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub staker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PromotionRated {
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub stars: u8,
    pub is_update: bool,
}

#[event]
pub struct ExternalDealUpdated {
    pub deal: Pubkey,
    pub source: DealSource,
    pub external_id: String,
    pub price: u64,
    pub verified: bool,
}

#[event]
pub struct CommentLiked {
    pub comment: Pubkey,
    pub user: Pubkey,
}

#[event]
pub struct CommentAdded {
    pub comment: Pubkey,
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub content: String,
    pub is_reply: bool,
}

#[event]
pub struct BadgeEarned {
    pub user: Pubkey,
    pub badge_type: BadgeType,
    pub mint: Pubkey,
}
```

---
### lib.rs
- Size: 3.10 KB
- Lines: 112
- Last Modified: 2025-10-19 03:43:36

```rust
// src/lib.rs
use anchor_lang::prelude::*;

pub mod accounts;
pub mod instructions;
pub mod errors;
pub mod events;

use instructions::*;

declare_id!("kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe");

#[program]
pub mod discount_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        name: String,
        category: String,
        latitude: Option<f64>,
        longitude: Option<f64>,
    ) -> Result<()> {
        instructions::register_merchant::handler(ctx, name, category, latitude, longitude)
    }

    pub fn create_coupon_promotion(
        ctx: Context<CreateCouponPromotion>,
        discount_percentage: u8,
        max_supply: u32,
        expiry_timestamp: i64,
        category: String,
        description: String,
        price: u64,
    ) -> Result<()> {
        instructions::create_coupon_promotion::handler(
            ctx,
            discount_percentage,
            max_supply,
            expiry_timestamp,
            category,
            description,
            price,
        )
    }

    pub fn mint_coupon(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
        instructions::mint_coupon::handler(ctx, coupon_id)
    }

    pub fn transfer_coupon(ctx: Context<TransferCoupon>) -> Result<()> {
        instructions::transfer_coupon::handler(ctx)
    }

    pub fn redeem_coupon(ctx: Context<RedeemCoupon>) -> Result<()> {
        instructions::redeem_coupon::handler(ctx)
    }

    pub fn list_coupon_for_sale(ctx: Context<ListCouponForSale>, price: u64) -> Result<()> {
        instructions::list_coupon_for_sale::handler(ctx, price)
    }

    pub fn buy_listed_coupon(ctx: Context<BuyListedCoupon>) -> Result<()> {
        instructions::buy_listed_coupon::handler(ctx)
    }

    pub fn add_comment(ctx: Context<AddComment>, content: String, parent_comment: Option<Pubkey>) -> Result<()> {
        instructions::add_comment::handler(ctx, content, parent_comment)
    }

    pub fn like_comment(ctx: Context<LikeComment>) -> Result<()> {
        instructions::like_comment::handler(ctx)
    }

    pub fn rate_promotion(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
        instructions::rate_promotion::handler(ctx, stars)
    }

    pub fn update_external_deal(
        ctx: Context<UpdateExternalDeal>,
        external_id: String,
        title: String,
        description: String,
        original_price: u64,
        discounted_price: u64,
        category: String,
        image_url: String,
        affiliate_url: String,
        expiry_timestamp: i64,
    ) -> Result<()> {
        instructions::update_external_deal::handler(
            ctx,
            external_id,
            title,
            description,
            original_price,
            discounted_price,
            category,
            image_url,
            affiliate_url,
            expiry_timestamp,
        )
    }

    pub fn mint_badge(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
        instructions::mint_badge::handler(ctx, badge_type)
    }
}
```

---
### errors.rs
- Size: 1.21 KB
- Lines: 47
- Last Modified: 2025-10-18 22:53:02

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum CouponError {
    #[msg("Name is too long")]
    NameTooLong,
    #[msg("Category is too long")]
    CategoryTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Invalid discount percentage")]
    InvalidDiscount,
    #[msg("Invalid supply amount")]
    InvalidSupply,
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Promotion is inactive")]
    PromotionInactive,
    #[msg("Supply exhausted")]
    SupplyExhausted,
    #[msg("Promotion expired")]
    PromotionExpired,
    #[msg("Coupon already redeemed")]
    CouponAlreadyRedeemed,
    #[msg("Coupon expired")]
    CouponExpired,
    #[msg("Not coupon owner")]
    NotCouponOwner,
    #[msg("Wrong merchant")]
    WrongMerchant,
    #[msg("Not merchant authority")]
    NotMerchantAuthority,
    #[msg("Not marketplace authority")]
    NotMarketplaceAuthority,
    #[msg("Listing inactive")]
    ListingInactive,
    #[msg("Wrong coupon")]
    WrongCoupon,
    #[msg("Not listing seller")]
    NotListingSeller,
     #[msg("Invalid coordinates")]
    InvalidCoordinates,
    #[msg("Location not supported")]
    LocationNotSupported,
}

```

---
### instructions/list_for_sale.rs
- Size: 2.26 KB
- Lines: 79
- Last Modified: 2025-10-19 04:00:41

```rust
use anchor_lang::prelude::*;
use crate::accounts::{Coupon, Listing};
use crate::errors::CouponError;
use crate::events::{CouponListed, ListingCancelled};

pub fn handler(
    ctx: Context<ListCouponForSale>,
    price: u64,
) -> Result<()> {
    require!(price > 0, CouponError::InvalidPrice);

    let coupon = &ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.seller.key(), CouponError::NotCouponOwner);

    let listing = &mut ctx.accounts.listing;
    listing.coupon = ctx.accounts.coupon.key();
    listing.seller = ctx.accounts.seller.key();
    listing.price = price;
    listing.is_active = true;
    listing.created_at = Clock::get()?.unix_timestamp;

    emit!(CouponListed {
        listing: listing.key(),
        coupon: listing.coupon,
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        seller: listing.seller,
        price,
    });

    Ok(())
}

pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, CouponError::ListingInactive);
    require!(listing.seller == ctx.accounts.seller.key(), CouponError::NotListingSeller);

    listing.is_active = false;

    emit!(ListingCancelled {
        listing: listing.key(),
        coupon: listing.coupon,
        seller: listing.seller,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ListCouponForSale<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", coupon.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        constraint = coupon.owner == seller.key() @ CouponError::NotCouponOwner
    )]
    pub coupon: Account<'info, Coupon>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        constraint = listing.seller == seller.key() @ CouponError::NotListingSeller
    )]
    pub listing: Account<'info, Listing>,
    pub seller: Signer<'info>,
}

```

---
### instructions/rate_promotion.rs
- Size: 1.17 KB
- Lines: 43
- Last Modified: 2025-10-19 03:21:28

```rust
use anchor_lang::prelude::*;
use crate::accounts::{Rating, Promotion};
use crate::errors::CouponError;
use crate::events::PromotionRated;

#[derive(Accounts)]
pub struct RatePromotion<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Rating::INIT_SPACE,
        seeds = [b"rating", user.key().as_ref(), promotion.key().as_ref()],
        bump
    )]
    pub rating: Account<'info, Rating>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
    require!(stars >= 1 && stars <= 5, CouponError::InvalidDiscount);

    let rating = &mut ctx.accounts.rating;
    rating.user = ctx.accounts.user.key();
    rating.promotion = ctx.accounts.promotion.key();
    rating.merchant = ctx.accounts.promotion.merchant;
    rating.stars = stars;
    rating.created_at = Clock::get()?.unix_timestamp;
    rating.updated_at = rating.created_at;

    emit!(PromotionRated {
        user: rating.user,
        promotion: rating.promotion,
        stars,
        is_update: false,
    });
    
    Ok(())
}
```

---
### instructions/like_comment.rs
- Size: 1.01 KB
- Lines: 41
- Last Modified: 2025-10-19 03:22:16

```rust
use anchor_lang::prelude::*;
use crate::accounts::{Comment, CommentLike};
use crate::errors::CouponError;
use crate::events::CommentLiked;

#[derive(Accounts)]
pub struct LikeComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + CommentLike::INIT_SPACE,
        seeds = [b"comment_like", user.key().as_ref(), comment.key().as_ref()],
        bump
    )]
    pub comment_like: Account<'info, CommentLike>,
    
    #[account(mut)]
    pub comment: Account<'info, Comment>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<LikeComment>) -> Result<()> {
    let comment = &mut ctx.accounts.comment;
    let like = &mut ctx.accounts.comment_like;
    
    like.user = ctx.accounts.user.key();
    like.comment = comment.key();
    like.created_at = Clock::get()?.unix_timestamp;
    
    comment.likes += 1;
    
    emit!(CommentLiked {
        comment: comment.key(),
        user: like.user,
    });
    
    Ok(())
}
```

---
### instructions/initialize.rs
- Size: 1.00 KB
- Lines: 36
- Last Modified: 2025-10-19 03:19:33

```rust
use anchor_lang::prelude::*;
use crate::accounts::Marketplace;
use crate::events::MarketplaceInitialized;
use crate::errors::CouponError;

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

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.authority = ctx.accounts.authority.key();
    marketplace.total_coupons = 0;
    marketplace.total_merchants = 0;
    marketplace.fee_basis_points = 250;

    emit!(MarketplaceInitialized {
        marketplace: marketplace.key(),
        authority: marketplace.authority,
        fee_basis_points: marketplace.fee_basis_points,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

---
### instructions/add_comment.rs
- Size: 1.50 KB
- Lines: 55
- Last Modified: 2025-10-19 03:22:33

```rust
use anchor_lang::prelude::*;
use crate::accounts::{Comment, Promotion};
use crate::errors::CouponError;
use crate::events::CommentAdded;

#[derive(Accounts)]
#[instruction(content: String)]
pub struct AddComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Comment::INIT_SPACE,
        seeds = [b"comment", user.key().as_ref(), promotion.key().as_ref()],
        bump
    )]
    pub comment: Account<'info, Comment>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddComment>,
    content: String,
    parent_comment: Option<Pubkey>,
) -> Result<()> {
    require!(content.len() <= 500, CouponError::DescriptionTooLong);
    require!(!content.is_empty(), CouponError::NameTooLong);

    let comment = &mut ctx.accounts.comment;
    comment.user = ctx.accounts.user.key();
    comment.promotion = ctx.accounts.promotion.key();
    comment.content = content.clone();
    comment.created_at = Clock::get()?.unix_timestamp;
    comment.likes = 0;
    comment.is_merchant_reply = false;
    comment.parent_comment = parent_comment;
    
    if ctx.accounts.promotion.merchant == ctx.accounts.user.key() {
        comment.is_merchant_reply = true;
    }
    
    emit!(CommentAdded {
        comment: comment.key(),
        user: comment.user,
        promotion: comment.promotion,
        content,
        is_reply: parent_comment.is_some(),
    });
    
    Ok(())
}
```

---
### instructions/transfer_coupon.rs
- Size: 1.17 KB
- Lines: 38
- Last Modified: 2025-10-19 03:19:51

```rust
use anchor_lang::prelude::*;
use crate::accounts::Coupon;
use crate::errors::CouponError;
use crate::events::CouponTransferred;

pub fn handler(ctx: Context<TransferCoupon>) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.from_authority.key(), CouponError::NotCouponOwner);

    let old_owner = coupon.owner;
    
    // Update coupon owner
    coupon.owner = ctx.accounts.new_owner.key();

    emit!(CouponTransferred {
        coupon: coupon.key(),
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        from: old_owner,
        to: coupon.owner,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct TransferCoupon<'info> {
    #[account(
        mut,
        constraint = coupon.owner == from_authority.key() @ CouponError::NotCouponOwner
    )]
    pub coupon: Account<'info, Coupon>,
    /// CHECK: This is the new owner
    pub new_owner: UncheckedAccount<'info>,
    pub from_authority: Signer<'info>,
}
```

---
### instructions/redeem_coupon.rs
- Size: 2.43 KB
- Lines: 77
- Last Modified: 2025-10-19 03:20:21

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, burn, Burn};
use crate::accounts::{Coupon, Merchant};
use crate::errors::CouponError;
use crate::events::CouponRedeemed;

pub fn handler(ctx: Context<RedeemCoupon>) -> Result<()> {
    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.user.key(), CouponError::NotCouponOwner);
    require!(coupon.merchant == ctx.accounts.merchant.key(), CouponError::WrongMerchant);

    // Mark as redeemed
    coupon.is_redeemed = true;
    coupon.redeemed_at = Clock::get()?.unix_timestamp;

    // Update merchant stats
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_redeemed += 1;

    // Burn the NFT
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.nft_mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        1,
    )?;

    emit!(CouponRedeemed {
        coupon: coupon.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        user: coupon.owner,
        merchant: coupon.merchant,
        discount_percentage: coupon.discount_percentage,
        redemption_code: format!("REDEEMED-{}", coupon.id),
        timestamp: coupon.redeemed_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RedeemCoupon<'info> {
    #[account(
        mut,
        constraint = coupon.owner == user.key() @ CouponError::NotCouponOwner,
        constraint = coupon.merchant == merchant.key() @ CouponError::WrongMerchant
    )]
    pub coupon: Account<'info, Coupon>,
    
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == nft_mint.key(),
        constraint = token_account.owner == user.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub merchant_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

---
### instructions/update_external_deal.rs
- Size: 2.11 KB
- Lines: 73
- Last Modified: 2025-10-19 03:21:59

```rust
use anchor_lang::prelude::*;
use crate::accounts::{ExternalDeal, DealSource};
use crate::errors::CouponError;
use crate::events::ExternalDealUpdated;

#[derive(Accounts)]
#[instruction(external_id: String)]
pub struct UpdateExternalDeal<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + ExternalDeal::INIT_SPACE,
        seeds = [b"external_deal", external_id.as_bytes()],
        bump
    )]
    pub external_deal: Account<'info, ExternalDeal>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpdateExternalDeal>,
    external_id: String,
    title: String,
    description: String,
    original_price: u64,
    discounted_price: u64,
    category: String,
    image_url: String,
    affiliate_url: String,
    expiry_timestamp: i64,
) -> Result<()> {
    let deal = &mut ctx.accounts.external_deal;
    let current_time = Clock::get()?.unix_timestamp;
    
    if deal.oracle_authority == Pubkey::default() {
        deal.oracle_authority = ctx.accounts.payer.key();
        deal.source = DealSource::Skyscanner;
        deal.external_id = external_id;
        deal.verification_count = 1;
        deal.is_verified = false;
    } else {
        require!(current_time - deal.last_updated >= 3600, CouponError::InvalidExpiry);
        deal.verification_count += 1;
    }
    
    deal.title = title;
    deal.description = description;
    deal.original_price = original_price;
    deal.discounted_price = discounted_price;
    deal.discount_percentage = ((original_price - discounted_price) * 100 / original_price) as u8;
    deal.category = category;
    deal.image_url = image_url;
    deal.affiliate_url = affiliate_url;
    deal.expiry_timestamp = expiry_timestamp;
    deal.last_updated = current_time;
    
    if deal.verification_count >= 1 {
        deal.is_verified = true;
    }
    
    emit!(ExternalDealUpdated {
        deal: deal.key(),
        source: deal.source,
        external_id: deal.external_id.clone(),
        price: discounted_price,
        verified: deal.is_verified,
    });
    
    Ok(())
}
```

---
### instructions/create_promotion.rs
- Size: 1.87 KB
- Lines: 60
- Last Modified: 2025-10-19 00:56:36

```rust
use anchor_lang::prelude::*;
use crate::{accounts::Promotion, errors::CouponError, events::PromotionCreated};

#[derive(Accounts)]
pub struct CreateCouponPromotion<'info> {
    #[account(
        init,
        payer = authority,
        space = Promotion::INIT_SPACE,
        seeds = [b"promotion", merchant.key().as_ref(), &merchant.total_coupons_created.to_le_bytes()],
        bump
    )]
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateCouponPromotion>,
    discount_percentage: u8,
    max_supply: u32,
    expiry_timestamp: i64,
    category: String,
    description: String,
    price: u64,
) -> Result<()> {
    require!(discount_percentage > 0 && discount_percentage <= 100, CouponError::InvalidDiscount);
    require!(max_supply > 0, CouponError::InvalidSupply);
    require!(expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::InvalidExpiry);
    require!(category.len() <= 30, CouponError::CategoryTooLong);
    require!(description.len() <= 200, CouponError::DescriptionTooLong);

    let promotion = &mut ctx.accounts.promotion;
    promotion.merchant = ctx.accounts.merchant.key();
    promotion.discount_percentage = discount_percentage;
    promotion.max_supply = max_supply;
    promotion.current_supply = 0;
    promotion.expiry_timestamp = expiry_timestamp;
    promotion.category = category;
    promotion.description = description;
    promotion.price = price;
    promotion.is_active = true;
    promotion.created_at = Clock::get()?.unix_timestamp;

    emit!(PromotionCreated {
        promotion: promotion.key(),
        merchant: promotion.merchant,
        discount_percentage,
        max_supply,
        expiry_timestamp,
        price,
    });

    Ok(())
}
```

---
### instructions/mint_coupon.rs
- Size: 4.44 KB
- Lines: 129
- Last Modified: 2025-10-19 03:32:50

```rust
// src/instructions/mint_coupon.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, mint_to, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::CreateV1CpiBuilder;
use mpl_token_metadata::types::{TokenStandard, PrintSupply};
use crate::accounts::{Coupon, Promotion, Merchant, Marketplace};
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
    
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub nft_mint: Account<'info, Mint>,
    
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
```

---
### instructions/register_merchant.rs
- Size: 2.14 KB
- Lines: 73
- Last Modified: 2025-10-19 04:03:41

```rust
// src/instructions/register_merchant.rs
use anchor_lang::prelude::*;
use crate::accounts::{Merchant, Marketplace, Location};
use crate::errors::CouponError;
use crate::events::MerchantRegistered;

pub fn handler(
    ctx: Context<RegisterMerchant>,
    name: String,
    category: String,
    latitude: Option<f64>,
    longitude: Option<f64>,
) -> Result<()> {
    require!(name.len() <= 50, CouponError::NameTooLong);
    require!(category.len() <= 30, CouponError::CategoryTooLong);

    let merchant = &mut ctx.accounts.merchant;
    merchant.authority = ctx.accounts.authority.key();
    merchant.name = name.clone();
    merchant.category = category.clone();
    merchant.total_coupons_created = 0;
    merchant.total_coupons_redeemed = 0;
    merchant.is_active = true;
    merchant.created_at = Clock::get()?.unix_timestamp;
    
    // Set location
    if let (Some(lat), Some(lon)) = (latitude, longitude) {
        require!(lat >= -90.0 && lat <= 90.0, CouponError::InvalidCoordinates);
        require!(lon >= -180.0 && lon <= 180.0, CouponError::InvalidCoordinates);
        
        merchant.location = Location::from_coords(lat, lon);
        merchant.has_physical_location = true;
    } else {
        merchant.location = Location {
            latitude: 0,
            longitude: 0,
            region_code: 0,
            country_code: 0,
            city_hash: 0,
        };
        merchant.has_physical_location = false;
    }

    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_merchants += 1;

    emit!(MerchantRegistered {
        merchant: merchant.key(),
        authority: merchant.authority,
        name,
        category,
        timestamp: merchant.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterMerchant<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Merchant::INIT_SPACE,
        seeds = [b"merchant", authority.key().as_ref()],
        bump
    )]
    pub merchant: Account<'info, Merchant>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

---
### instructions/buy_listing.rs
- Size: 2.78 KB
- Lines: 88
- Last Modified: 2025-10-19 03:21:08

```rust
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::accounts::{Coupon, Listing, Marketplace};
use crate::errors::CouponError;
use crate::events::CouponSold;

pub fn handler(ctx: Context<BuyListedCoupon>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, CouponError::ListingInactive);

    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);

    let marketplace = &ctx.accounts.marketplace;
    let marketplace_fee = (listing.price * marketplace.fee_basis_points as u64) / 10000;
    let seller_amount = listing.price - marketplace_fee;

    // Transfer payment to seller
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

    // Transfer marketplace fee
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

    emit!(CouponSold {
        listing: listing.key(),
        coupon: coupon.key(),
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        seller: listing.seller,
        buyer: ctx.accounts.buyer.key(),
        price: listing.price,
        marketplace_fee,
    });

    // Update coupon owner and deactivate listing
    coupon.owner = ctx.accounts.buyer.key();
    listing.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct BuyListedCoupon<'info> {
    #[account(
        mut,
        constraint = listing.is_active @ CouponError::ListingInactive
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        constraint = coupon.key() == listing.coupon @ CouponError::WrongCoupon
    )]
    pub coupon: Account<'info, Coupon>,
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        constraint = listing.seller == seller.key() @ CouponError::NotListingSeller
    )]
    /// CHECK: Seller account for payment
    pub seller: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = marketplace.authority == marketplace_authority.key() @ CouponError::NotMarketplaceAuthority
    )]
    /// CHECK: Marketplace authority for fee collection
    pub marketplace_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
```

---
### instructions/mint_badge.rs
- Size: 2.67 KB
- Lines: 90
- Last Modified: 2025-10-19 03:59:58

```rust
// src/instructions/mint_badge.rs (Fixed import)
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use mpl_token_metadata::instructions::CreateV1CpiBuilder;
use mpl_token_metadata::types::{TokenStandard, PrintSupply};
use crate::accounts::{BadgeNFT, BadgeType};
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
    
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
    let badge = &mut ctx.accounts.badge_nft;
    badge.user = ctx.accounts.user.key();
    badge.badge_type = badge_type;
    badge.mint = ctx.accounts.mint.key();
    badge.earned_at = Clock::get()?.unix_timestamp;
    badge.metadata_uri = "https://example.com/badge.json".to_string();

    // Metaplex metadata CPI
    let data = DataV2 {
        name: "Badge".to_string(),
        symbol: "BDG".to_string(),
        uri: badge.metadata_uri.clone(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: Pubkey::default(),
            verified: false,
            share: 100,
        }]),
        collection: None,
        uses: None,
    };
    create_metadata_accounts_v3(
        CpiContext::new(
            mpl_token_metadata::id(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        data,
        false,
        true,
        None,
    )?;

    emit!(BadgeEarned {
        user: badge.user,
        badge_type,
        mint: badge.mint,
    });

    Ok(())
}
```

---
### instructions/mod.rs
- Size: 0.56 KB
- Lines: 25
- Last Modified: 2025-10-19 00:14:49

```rust
pub mod initialize;
pub mod register_merchant;
pub mod create_promotion;
pub mod mint_coupon;
pub mod transfer_coupon;
pub mod redeem_coupon;
pub mod list_for_sale;
pub mod buy_listing;
pub mod mint_badge;
pub mod rate_promotion;
pub mod update_external_deal;
pub mod like_comment;
pub mod add_comment;

//pub mod cancel_listing;

pub use initialize::*;
pub use register_merchant::*;
pub use create_promotion::*;
pub use mint_coupon::*;
pub use transfer_coupon::*;
pub use redeem_coupon::*;
pub use list_for_sale::*;
pub use buy_listing::*;
//pub use cancel_listing::*;
```

---
### accounts/merchant.rs
- Size: 0.40 KB
- Lines: 19
- Last Modified: 2025-10-18 22:48:43

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Merchant {
    pub authority: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(30)]
    pub category: String,
    pub total_coupons_created: u64,
    pub total_coupons_redeemed: u64,
    pub is_active: bool,
    pub created_at: i64,

     // Geographic data
    pub location: Location,
    pub has_physical_location: bool,
}

```

---
### accounts/marketplace.rs
- Size: 0.20 KB
- Lines: 10
- Last Modified: 2025-10-18 20:25:22

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub total_coupons: u64,
    pub total_merchants: u64,
    pub fee_basis_points: u16,
}

```

---
### accounts/promotion.rs
- Size: 0.59 KB
- Lines: 24
- Last Modified: 2025-10-18 22:48:22

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Promotion {
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub max_supply: u32,
    pub current_supply: u32,
    pub expiry_timestamp: i64,
    #[max_len(30)]
    pub category: String,
    #[max_len(200)]
    pub description: String,
    pub price: u64,
    pub is_active: bool,
    pub created_at: i64,

     // Geographic data
    pub location: Location,
    pub geo_cell_id: u64,       // For spatial indexing
    pub radius_meters: u32,     // Service radius (0 = online only)
    pub is_location_based: bool,
}

```

---
### accounts/location.rs
- Size: 1.98 KB
- Lines: 74
- Last Modified: 2025-10-19 01:31:12

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Location {
    pub latitude: i32,
    pub longitude: i32,
    pub region_code: u16,
    pub country_code: u16,
    pub city_hash: u64,
}

impl Location {
    pub const PRECISION: i32 = 1_000_000;
    
    pub fn from_coords(lat: f64, lon: f64) -> Self {
        Self {
            latitude: (lat * Self::PRECISION as f64) as i32,
            longitude: (lon * Self::PRECISION as f64) as i32,
            region_code: 0,
            country_code: 0,
            city_hash: 0,
        }
    }
    
    pub fn to_coords(&self) -> (f64, f64) {
        (
            self.latitude as f64 / Self::PRECISION as f64,
            self.longitude as f64 / Self::PRECISION as f64,
        )
    }
    
    pub fn distance_to(&self, other: &Location) -> f64 {
        let (lat1, lon1) = self.to_coords();
        let (lat2, lon2) = other.to_coords();
        
        let r = 6371000.0;
        let phi1 = lat1.to_radians();
        let phi2 = lat2.to_radians();
        let delta_phi = (lat2 - lat1).to_radians();
        let delta_lambda = (lon2 - lon1).to_radians();
        
        let a = (delta_phi / 2.0).sin().powi(2) + phi1.cos() * phi2.cos() * (delta_lambda / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
        
        r * c
    }
}

#[account]
#[derive(InitSpace)]
pub struct GeoCell {
    pub cell_id: u64,
    pub min_latitude: i32,
    pub max_latitude: i32,
    pub min_longitude: i32,
    pub max_longitude: i32,
    pub promotion_count: u32,
}

impl GeoCell {
    pub const GRID_SIZE: i32 = 100_000;
    
    pub fn from_coords(lat: f64, lon: f64) -> (i32, i32) {
        let lat_int = (lat * Location::PRECISION as f64) as i32;
        let lon_int = (lon * Location::PRECISION as f64) as i32;
        
        (lat_int / Self::GRID_SIZE, lon_int / Self::GRID_SIZE)
    }
    
    pub fn to_cell_id(cell_lat: i32, cell_lon: i32) -> u64 {
        ((cell_lat as u64) << 32) | ((cell_lon as u64) & 0xFFFFFFFF)
    }
}
```

---
### accounts/badge.rs
- Size: 1.04 KB
- Lines: 49
- Last Modified: 2025-10-19 04:02:50

```rust
// src/accounts/badge.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserReputation {
    pub user: Pubkey,
    pub total_purchases: u32,
    pub total_redemptions: u32,
    pub total_ratings_given: u32,
    pub total_comments: u32,
    pub reputation_score: u64,
    pub tier: ReputationTier,
    #[max_len(10)]
    pub badges_earned: Vec<BadgeType>,
    pub joined_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ReputationTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BadgeType {
    FirstPurchase = 0,
    TenRedemptions = 1,
    FiftyRedemptions = 2,
    TopReviewer = 3,
    EarlyAdopter = 4,
    MerchantPartner = 5,
    CommunityModerator = 6,
}

#[account]
#[derive(InitSpace)]
pub struct BadgeNFT {
    pub user: Pubkey,
    pub badge_type: BadgeType,
    pub mint: Pubkey,
    pub metadata: Pubkey,
    pub earned_at: i64,
    #[max_len(200)]
    pub metadata_uri: String,
}
```

---
### accounts/comment.rs
- Size: 0.44 KB
- Lines: 23
- Last Modified: 2025-10-19 03:33:25

```rust
// src/accounts/comment.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Comment {
    pub user: Pubkey,
    pub promotion: Pubkey,
    #[max_len(500)]
    pub content: String,
    pub created_at: i64,
    pub likes: u32,
    pub is_merchant_reply: bool,
    pub parent_comment: Option<Pubkey>,
}

#[account]
#[derive(InitSpace)]
pub struct CommentLike {
    pub user: Pubkey,
    pub comment: Pubkey,
    pub created_at: i64,
}
```

---
### accounts/coupon.rs
- Size: 0.44 KB
- Lines: 18
- Last Modified: 2025-10-18 22:43:38

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Coupon {
    pub id: u64,
    pub promotion: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub expiry_timestamp: i64,
    pub is_redeemed: bool,
    pub redeemed_at: i64,
    pub created_at: i64,
      #[max_len(200)]
    pub metadata_uri: String,  // IPFS or Arweave link
    pub mint: Option<Pubkey>,  // SPL Token mint address
}

```

---
### accounts/listing.rs
- Size: 0.20 KB
- Lines: 11
- Last Modified: 2025-10-18 20:25:22

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub is_active: bool,
    pub created_at: i64,
}

```

---
### accounts/rating.rs
- Size: 0.56 KB
- Lines: 22
- Last Modified: 2025-10-19 01:58:48

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Rating {
    pub user: Pubkey,
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub stars: u8,              // 1-5 stars
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RatingStats {
    pub promotion: Pubkey,
    pub total_ratings: u32,
    pub sum_stars: u64,         // Sum of all ratings
    pub average_rating: u16,    // Multiply by 100 (e.g., 450 = 4.50 stars)
    pub distribution: [u32; 5], // Count of 1-star, 2-star, ..., 5-star
}
```

---
### accounts/mod.rs
- Size: 0.40 KB
- Lines: 22
- Last Modified: 2025-10-19 03:23:05

```rust
// src/accounts/mod.rs
pub mod marketplace;
pub mod merchant;
pub mod promotion;
pub mod coupon;
pub mod listing;
pub mod badge;
pub mod comment;
pub mod external_deal;
pub mod location;
pub mod rating;

pub use marketplace::*;
pub use merchant::*;
pub use promotion::*;
pub use coupon::*;
pub use listing::*;
pub use badge::*;
pub use comment::*;
pub use external_deal::*;
pub use location::*;
pub use rating::*;
```

---
### accounts/external_deal.rs
- Size: 1.07 KB
- Lines: 48
- Last Modified: 2025-10-19 04:07:11

```rust
// src/accounts/external_deal.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ExternalDeal {
    pub oracle_authority: Pubkey,
    pub source: DealSource,
    #[max_len(100)]
    pub external_id: String,
    #[max_len(200)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub original_price: u64,
    pub discounted_price: u64,
    pub discount_percentage: u8,
    #[max_len(50)]
    pub category: String,
    #[max_len(200)]
    pub image_url: String,
    #[max_len(200)]
    pub affiliate_url: String,
    pub expiry_timestamp: i64,
    pub last_updated: i64,
    pub is_verified: bool,
    pub verification_count: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DealSource {
    Skyscanner,
    BookingCom,
    Shopify,
    Amazon,
    Custom,
}

#[account]
#[derive(InitSpace)]
pub struct OracleConfig {
    pub authority: Pubkey,
    pub total_deals_imported: u64,
    #[max_len(10)]
    pub allowed_sources: Vec<DealSource>,
    pub min_verification_count: u32,
    pub update_interval: i64,
}
```

---

---
## 📊 Summary
- Total files: 28
- Total size: 41.51 KB
- File types: .rs
