Reasoning

This is a Solana smart contract written using the Anchor framework for a coupon/discount marketplace system. Let me analyze it comprehensively and then explain how to make it more modular according to the suggested structure.

Current Code Analysis

The code implements a discount marketplace with several key features:

Marketplace initialization - Sets up the main marketplace with authority and fee structure
Merchant registration - Allows merchants to register and create profiles
Promotion creation - Merchants can create coupon promotions with discount details
Coupon minting - Mints individual coupons from promotions
Coupon transfer - Allows transferring coupons between users
Coupon redemption - Enables users to redeem coupons with merchants
Secondary marketplace - List, buy, and cancel coupon listings

The current implementation has all code in a single file (lib.rs), which works but isn't very modular.

Features vs Requirements

Looking at the hackathon requirements:

✅ NFT Promotions/Coupons: Partially - The coupons are represented as accounts with ownership, but they're NOT actual NFTs (no Metaplex integration) ✅ Merchant Dashboard: Backend is there - merchants can create promotions ✅ User Wallet & Marketplace: Secondary marketplace for resale exists ❌ Deal Aggregator Feed: Not implemented - no external API integration ❌ Social Discovery Layer: Not implemented - no ratings, comments, or sharing ✅ Redemption Verification Flow: Basic on-chain redemption exists ❌ Reward Staking/Cashback: Not implemented

So the current code provides a foundational structure but is missing several key features to meet the full hackathon requirements.

Key Missing Features for Web3 Integration:

True NFT representation - Should use Metaplex Token Metadata for actual NFT minting

Metadata standards - Lacks structured metadata and URI storage for comprehensive coupon information

External integrations - Missing connections to real-world deal platforms and APIs

Social engagement - No mechanisms for user interactions, ratings, or community-driven features

Reputation tracking - Absence of a system to recognize and reward user loyalty and participation

The project needs significant enhancements to create a robust, interconnected Web3 coupon marketplace that goes beyond basic transactional functionality.

Code Analysis

Your Solana smart contract provides a solid foundation for a coupon marketplace but needs significant enhancements to meet the full hackathon requirements. Here's what it currently achieves:

✅ Features Implemented:
Marketplace infrastructure with fee collection (2.5%)
Merchant registration with profile tracking
Promotion creation with supply limits and expiry
Coupon minting as program-owned accounts
Transfer functionality for coupon ownership
Redemption tracking with merchant verification
Secondary marketplace for buying/selling coupons
❌ Missing Critical Features:
Real NFT implementation (no Metaplex integration - coupons are just accounts, not SPL tokens)
Metadata standards (no URI, images, or rich attributes)
External deal aggregation (no API integrations)
Social layer (no ratings, comments, sharing)
Reputation/loyalty system
Event emissions for off-chain indexing
Modular Restructuring

Here's how to refactor into the suggested structure:

1. lib.rs (Entry point)
use anchor_lang::prelude::*;

declare_id!("kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe");

pub mod accounts;
pub mod errors;
pub mod events;
pub mod instructions;

use accounts::*;
use errors::*;
use instructions::*;

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        name: String,
        category: String,
    ) -> Result<()> {
        instructions::register_merchant::handler(ctx, name, category)
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

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }
}

Rust
Download
Rust
Copy
2. errors.rs
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
}

Rust
Download
Rust
Copy
3. events.rs (NEW - Essential for indexing)
use anchor_lang::prelude::*;

#[event]
pub struct MerchantRegistered {
    pub merchant: Pubkey,
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
    pub price: u64,
    pub expiry_timestamp: i64,
}

#[event]
pub struct CouponMinted {
    pub coupon: Pubkey,
    pub promotion: Pubkey,
    pub owner: Pubkey,
    pub coupon_id: u64,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct CouponSold {
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
}

Rust
Download
Rust
Copy
4. accounts/mod.rs
pub mod marketplace;
pub mod merchant;
pub mod promotion;
pub mod coupon;
pub mod listing;

pub use marketplace::*;
pub use merchant::*;
pub use promotion::*;
pub use coupon::*;
pub use listing::*;

Rust
Download
Rust
Copy
5. accounts/marketplace.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub total_coupons: u64,
    pub total_merchants: u64,
    pub fee_basis_points: u16,
}

Rust
Download
Rust
Copy
6. accounts/coupon.rs (Enhanced for NFT compatibility)
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
    // Add for NFT integration:
    #[max_len(200)]
    pub metadata_uri: String,  // IPFS or Arweave link
    pub mint: Option<Pubkey>,  // SPL Token mint address
}

Rust
Download
Rust
Copy
7. instructions/mod.rs
pub mod initialize;
pub mod register_merchant;
pub mod create_coupon_promotion;
pub mod mint_coupon;
pub mod transfer_coupon;
pub mod redeem_coupon;
pub mod list_coupon_for_sale;
pub mod buy_listed_coupon;
pub mod cancel_listing;

pub use initialize::*;
pub use register_merchant::*;
pub use create_coupon_promotion::*;
pub use mint_coupon::*;
pub use transfer_coupon::*;
pub use redeem_coupon::*;
pub use list_coupon_for_sale::*;
pub use buy_listed_coupon::*;
pub use cancel_listing::*;

Rust
Download
Rust
Copy
8. instructions/mint_coupon.rs (With NFT integration)
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::programs::MPL_TOKEN_METADATA_ID;
use mpl_token_metadata::types::{Creator, DataV2};

use crate::accounts::*;
use crate::errors::*;
use crate::events::*;

pub fn handler(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
    let promotion = &mut ctx.accounts.promotion;
    require!(promotion.is_active, CouponError::PromotionInactive);
    require!(promotion.current_supply < promotion.max_supply, CouponError::SupplyExhausted);
    require!(promotion.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::PromotionExpired);

    // Initialize coupon account
    let coupon = &mut ctx.accounts.coupon;
    coupon.id = coupon_id;
    coupon.promotion = ctx.accounts.promotion.key();
    coupon.owner = ctx.accounts.recipient.key();
    coupon.merchant = ctx.accounts.merchant.key();
    coupon.discount_percentage = promotion.discount_percentage;
    coupon.expiry_timestamp = promotion.expiry_timestamp;
    coupon.is_redeemed = false;
    coupon.redeemed_at = 0;
    coupon.created_at = Clock::get()?.unix_timestamp;
    coupon.mint = Some(ctx.accounts.nft_mint.key());

    // TODO: Add Metaplex metadata creation here
    // Use mpl_token_metadata::instructions::CreateMetadataAccountV3

    // Update counters
    promotion.current_supply += 1;
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_created += 1;
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_coupons += 1;

    emit!(CouponMinted {
        coupon: ctx.accounts.coupon.key(),
        promotion: ctx.accounts.promotion.key(),
        owner: ctx.accounts.recipient.key(),
        coupon_id,
    });

    Ok(())
}

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
        mint::authority = coupon,
        mint::freeze_authority = coupon,
    )]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = promotion.is_active @ CouponError::PromotionInactive
    )]
    pub promotion: Account<'info, Promotion>,
    
    #[account(
        mut,
        constraint = merchant.key() == promotion.merchant @ CouponError::WrongMerchant
    )]
    pub merchant: Account<'info, Merchant>,
    
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    
    /// CHECK: Recipient of the coupon
    pub recipient: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: Metaplex program
    #[account(address = MPL_TOKEN_METADATA_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

Rust
Download
Rust
Copy
Cargo.toml additions
[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
mpl-token-metadata = "4.1.2"

TOML
Download
TOML
Copy
Key Improvements Needed

Would you like me to detail implementations for:

Social features (ratings, comments using PDAs)
Reputation system (NFT badges for user activity)
Oracle integration for off-chain deal aggregation
Geo-based discovery using account filters




















































Reasoning
Geo-Based Discovery Implementation
1. Add Location Accounts Structure
accounts/location.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Location {
    pub latitude: i32,      // Multiply by 1_000_000 to store as integer
    pub longitude: i32,     // e.g., 40.7128 → 40712800
    pub region_code: u16,   // Hierarchical region identifier
    pub country_code: u16,  // ISO country code as number
    pub city_hash: u64,     // Hash of city name for filtering
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
    
    // Calculate distance in meters using Haversine formula
    pub fn distance_to(&self, other: &Location) -> f64 {
        let (lat1, lon1) = self.to_coords();
        let (lat2, lon2) = other.to_coords();
        
        let r = 6371000.0; // Earth radius in meters
        let phi1 = lat1.to_radians();
        let phi2 = lat2.to_radians();
        let delta_phi = (lat2 - lat1).to_radians();
        let delta_lambda = (lon2 - lon1).to_radians();
        
        let a = (delta_phi / 2.0).sin().powi(2)
            + phi1.cos() * phi2.cos() * (delta_lambda / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
        
        r * c
    }
}

// Geographic grid cell for spatial indexing
#[account]
#[derive(InitSpace)]
pub struct GeoCell {
    pub cell_id: u64,           // Unique cell identifier
    pub min_latitude: i32,       // Bounding box
    pub max_latitude: i32,
    pub min_longitude: i32,
    pub max_longitude: i32,
    pub promotion_count: u32,    // Number of promotions in this cell
}

impl GeoCell {
    // Grid resolution: ~11km at equator
    pub const GRID_SIZE: i32 = 100_000; // 0.1 degrees
    
    pub fn from_coords(lat: f64, lon: f64) -> (i32, i32) {
        let lat_int = (lat * Location::PRECISION as f64) as i32;
        let lon_int = (lon * Location::PRECISION as f64) as i32;
        
        let cell_lat = lat_int / Self::GRID_SIZE;
        let cell_lon = lon_int / Self::GRID_SIZE;
        
        (cell_lat, cell_lon)
    }
    
    pub fn to_cell_id(cell_lat: i32, cell_lon: i32) -> u64 {
        // Encode as single u64: upper 32 bits = lat, lower 32 bits = lon
        ((cell_lat as u64) << 32) | ((cell_lon as u64) & 0xFFFFFFFF)
    }
}

Download
Rust
Copy
accounts/promotion.rs (Updated)
use anchor_lang::prelude::*;
use super::location::Location;

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

Download
Rust
Copy
accounts/merchant.rs (Updated)
use anchor_lang::prelude::*;
use super::location::Location;

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

Download
Rust
Copy
2. Update Instructions
instructions/register_merchant.rs (With location)
use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::errors::*;
use crate::events::*;

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
        merchant.has_physical_location = false;
    }

    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_merchants += 1;

    emit!(MerchantRegistered {
        merchant: merchant.key(),
        name,
        category,
        latitude,
        longitude,
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

Download
Rust
Copy
instructions/create_coupon_promotion.rs (With geo-indexing)
use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::errors::*;
use crate::events::*;

pub fn handler(
    ctx: Context<CreateCouponPromotion>,
    discount_percentage: u8,
    max_supply: u32,
    expiry_timestamp: i64,
    category: String,
    description: String,
    price: u64,
    latitude: Option<f64>,
    longitude: Option<f64>,
    radius_meters: u32,
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
    promotion.category = category.clone();
    promotion.description = description.clone();
    promotion.price = price;
    promotion.is_active = true;
    promotion.created_at = Clock::get()?.unix_timestamp;
    
    // Handle geographic data
    if let (Some(lat), Some(lon)) = (latitude, longitude) {
        require!(lat >= -90.0 && lat <= 90.0, CouponError::InvalidCoordinates);
        require!(lon >= -180.0 && lon <= 180.0, CouponError::InvalidCoordinates);
        
        promotion.location = Location::from_coords(lat, lon);
        promotion.is_location_based = true;
        promotion.radius_meters = radius_meters;
        
        // Calculate geo cell for indexing
        let (cell_lat, cell_lon) = GeoCell::from_coords(lat, lon);
        promotion.geo_cell_id = GeoCell::to_cell_id(cell_lat, cell_lon);
        
        // Update geo cell counter
        if let Some(geo_cell) = &mut ctx.accounts.geo_cell {
            geo_cell.promotion_count += 1;
        }
    } else {
        promotion.is_location_based = false;
        promotion.radius_meters = 0;
        promotion.geo_cell_id = 0;
    }

    emit!(PromotionCreated {
        promotion: promotion.key(),
        merchant: ctx.accounts.merchant.key(),
        discount_percentage,
        max_supply,
        price,
        expiry_timestamp,
        latitude,
        longitude,
        geo_cell_id: promotion.geo_cell_id,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CreateCouponPromotion<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Promotion::INIT_SPACE,
        seeds = [b"promotion", merchant.key().as_ref(), &merchant.total_coupons_created.to_le_bytes()],
        bump
    )]
    pub promotion: Account<'info, Promotion>,
    
    #[account(
        mut,
        constraint = merchant.authority == authority.key() @ CouponError::NotMerchantAuthority
    )]
    pub merchant: Account<'info, Merchant>,
    
    // Optional: Initialize geo cell if it doesn't exist
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + GeoCell::INIT_SPACE,
        seeds = [b"geocell", &promotion.geo_cell_id.to_le_bytes()],
        bump
    )]
    pub geo_cell: Option<Account<'info, GeoCell>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

Download
Rust
Copy
3. Client-Side Filtering (TypeScript/JavaScript)
SDK Example: Nearby Promotions
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

interface Location {
  latitude: number;
  longitude: number;
}

interface Promotion {
  publicKey: PublicKey;
  account: {
    location: {
      latitude: number;
      longitude: number;
    };
    radiusMeters: number;
    isLocationBased: boolean;
    category: string;
    discountPercentage: number;
    price: string;
    // ... other fields
  };
}

class GeoDiscovery {
  constructor(
    private program: Program,
    private connection: Connection
  ) {}

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert lat/lon to geo cell coordinates
   */
  private getGeoCellId(lat: number, lon: number): bigint {
    const PRECISION = 1_000_000;
    const GRID_SIZE = 100_000;

    const latInt = Math.floor(lat * PRECISION);
    const lonInt = Math.floor(lon * PRECISION);

    const cellLat = Math.floor(latInt / GRID_SIZE);
    const cellLon = Math.floor(lonInt / GRID_SIZE);

    // Convert to u64
    return (BigInt(cellLat) << 32n) | (BigInt(cellLon) & 0xFFFFFFFFn);
  }

  /**
   * Get surrounding cell IDs (3x3 grid)
   */
  private getSurroundingCells(lat: number, lon: number): bigint[] {
    const PRECISION = 1_000_000;
    const GRID_SIZE = 100_000;

    const latInt = Math.floor(lat * PRECISION);
    const lonInt = Math.floor(lon * PRECISION);

    const cellLat = Math.floor(latInt / GRID_SIZE);
    const cellLon = Math.floor(lonInt / GRID_SIZE);

    const cells: bigint[] = [];
    
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLon = -1; dLon <= 1; dLon++) {
        const lat = cellLat + dLat;
        const lon = cellLon + dLon;
        cells.push((BigInt(lat) << 32n) | (BigInt(lon) & 0xFFFFFFFFn));
      }
    }

    return cells;
  }

  /**
   * Find promotions near a location
   */
  async findNearbyPromotions(
    userLocation: Location,
    radiusMeters: number,
    filters?: {
      category?: string;
      maxPrice?: number;
      minDiscount?: number;
    }
  ): Promise<Promotion[]> {
    // Step 1: Get all promotions (with pagination)
    const allPromotions = await this.program.account.promotion.all();

    // Step 2: Filter by location
    const nearbyPromotions = allPromotions.filter((promo) => {
      const promotion = promo.account as any;

      // Skip non-location-based promotions
      if (!promotion.isLocationBased) return false;

      // Convert stored integers to decimals
      const promoLat = promotion.location.latitude / 1_000_000;
      const promoLon = promotion.location.longitude / 1_000_000;

      // Calculate distance
      const distance = this.calculateDistance(
        userLocation,
        { latitude: promoLat, longitude: promoLon }
      );

      // Check if within range (user radius + promotion radius)
      return distance <= radiusMeters + promotion.radiusMeters;
    });

    // Step 3: Apply additional filters
    let filtered = nearbyPromotions;

    if (filters?.category) {
      filtered = filtered.filter(
        (p) => p.account.category === filters.category
      );
    }

    if (filters?.maxPrice) {
      filtered = filtered.filter(
        (p) => Number(p.account.price) <= filters.maxPrice!
      );
    }

    if (filters?.minDiscount) {
      filtered = filtered.filter(
        (p) => p.account.discountPercentage >= filters.minDiscount!
      );
    }

    // Step 4: Sort by distance
    return filtered.sort((a, b) => {
      const distA = this.calculateDistance(userLocation, {
        latitude: a.account.location.latitude / 1_000_000,
        longitude: a.account.location.longitude / 1_000_000,
      });
      const distB = this.calculateDistance(userLocation, {
        latitude: b.account.location.latitude / 1_000_000,
        longitude: b.account.location.longitude / 1_000_000,
      });
      return distA - distB;
    }) as Promotion[];
  }

  /**
   * Optimized: Use geo-cell filtering (requires indexer)
   */
  async findNearbyPromotionsOptimized(
    userLocation: Location,
    radiusMeters: number
  ): Promise<Promotion[]> {
    // Get surrounding cells
    const cellIds = this.getSurroundingCells(
      userLocation.latitude,
      userLocation.longitude
    );

    // Fetch promotions only from relevant cells
    const promotions: Promotion[] = [];

    for (const cellId of cellIds) {
      const cellPromotions = await this.program.account.promotion.all([
        {
          memcmp: {
            offset: 8 + 32 + 1 + 4 + 4 + 8 + 30 + 200 + 8 + 1 + 8 + 32, // Offset to geo_cell_id
            bytes: cellId.toString(),
          },
        },
      ]);

      promotions.push(...(cellPromotions as Promotion[]));
    }

    // Filter by exact distance
    return promotions.filter((promo) => {
      const promoLat = promo.account.location.latitude / 1_000_000;
      const promoLon = promo.account.location.longitude / 1_000_000;

      const distance = this.calculateDistance(userLocation, {
        latitude: promoLat,
        longitude: promoLon,
      });

      return distance <= radiusMeters + promo.account.radiusMeters;
    });
  }
}

// Usage Example
const geoDiscovery = new GeoDiscovery(program, connection);

const userLocation = {
  latitude: 40.7128, // New York
  longitude: -74.006,
};

const nearby = await geoDiscovery.findNearbyPromotions(
  userLocation,
  5000, // 5km radius
  {
    category: 'restaurant',
    minDiscount: 20,
  }
);

console.log(`Found ${nearby.length} nearby promotions`);

Download
TypeScript
Copy
4. Add Error Codes
errors.rs (Add to existing)
#[error_code]
pub enum CouponError {
    // ... existing errors ...
    
    #[msg("Invalid coordinates")]
    InvalidCoordinates,
    #[msg("Location not supported")]
    LocationNotSupported,
}

Download
Rust
Copy
5. Indexer Integration (Recommended)

For production, use Helius or Solana RPC filters with geo-indexing:

// Use RPC filters for efficient querying
const promotions = await connection.getProgramAccounts(programId, {
  filters: [
    {
      dataSize: promotionAccountSize, // Exact size
    },
    {
      memcmp: {
        offset: geoCellIdOffset,
        bytes: bs58.encode(cellIdBuffer),
      },
    },
  ],
});

Download
TypeScript
Copy
Detailed Instructions for Other Features
🌟 Social Features (Ratings & Comments)
Architecture Overview

Account Structure:

User → Rating PDA (per promotion)
User → Comment PDA (per promotion)
Promotion → Stats PDA (aggregate ratings)

Download
Plain text
Copy
Implementation Steps:
1. Create Account Structs

accounts/rating.rs:

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

Download
Rust
Copy

accounts/comment.rs:

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
    pub parent_comment: Option<Pubkey>, // For threaded replies
}

#[account]
#[derive(InitSpace)]
pub struct CommentLike {
    pub user: Pubkey,
    pub comment: Pubkey,
    pub created_at: i64,
}

Download
Rust
Copy
2. Create Instructions

instructions/rate_promotion.rs:

pub fn handler(ctx: Context<RatePromotion>, stars: u8) -> Result<()> {
    require!(stars >= 1 && stars <= 5, SocialError::InvalidRating);
    
    let rating = &mut ctx.accounts.rating;
    let stats = &mut ctx.accounts.rating_stats;
    
    // Check if updating existing rating
    let is_update = rating.stars != 0;
    
    if is_update {
        // Remove old rating from sum
        stats.sum_stars -= rating.stars as u64;
        stats.distribution[(rating.stars - 1) as usize] -= 1;
    } else {
        // New rating
        stats.total_ratings += 1;
    }
    
    // Update rating
    rating.user = ctx.accounts.user.key();
    rating.promotion = ctx.accounts.promotion.key();
    rating.merchant = ctx.accounts.promotion.merchant;
    rating.stars = stars;
    rating.updated_at = Clock::get()?.unix_timestamp;
    
    if !is_update {
        rating.created_at = rating.updated_at;
    }
    
    // Update stats
    stats.sum_stars += stars as u64;
    stats.distribution[(stars - 1) as usize] += 1;
    stats.average_rating = ((stats.sum_stars * 100) / stats.total_ratings as u64) as u16;
    
    emit!(PromotionRated {
        user: rating.user,
        promotion: rating.promotion,
        stars,
        is_update,
    });
    
    Ok(())
}

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
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + RatingStats::INIT_SPACE,
        seeds = [b"rating_stats", promotion.key().as_ref()],
        bump
    )]
    pub rating_stats: Account<'info, RatingStats>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

Download
Rust
Copy

instructions/add_comment.rs:

pub fn handler(
    ctx: Context<AddComment>,
    content: String,
    parent_comment: Option<Pubkey>,
) -> Result<()> {
    require!(content.len() <= 500, SocialError::CommentTooLong);
    require!(!content.is_empty(), SocialError::CommentEmpty);
    
    let comment = &mut ctx.accounts.comment;
    comment.user = ctx.accounts.user.key();
    comment.promotion = ctx.accounts.promotion.key();
    comment.content = content.clone();
    comment.created_at = Clock::get()?.unix_timestamp;
    comment.likes = 0;
    comment.is_merchant_reply = false;
    comment.parent_comment = parent_comment;
    
    // Check if merchant is replying
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

#[derive(Accounts)]
#[instruction(content: String)]
pub struct AddComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Comment::INIT_SPACE,
        seeds = [
            b"comment",
            user.key().as_ref(),
            promotion.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub comment: Account<'info, Comment>,
    
    pub promotion: Account<'info, Promotion>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

Download
Rust
Copy

instructions/like_comment.rs:

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

Download
Rust
Copy
3. Client-Side Integration
// Rate a promotion
await program.methods
  .ratePromotion(5) // 5 stars
  .accounts({
    rating: ratingPDA,
    ratingStats: ratingStatsPDA,
    promotion: promotionPubkey,
    user: wallet.publicKey,
  })
  .rpc();

// Fetch ratings for a promotion
const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
console.log(`Average: ${stats.averageRating / 100} stars`);
console.log(`Total: ${stats.totalRatings} ratings`);

// Add comment
await program.methods
  .addComment("Great deal!", null)
  .accounts({
    comment: commentPDA,
    promotion: promotionPubkey,
    user: wallet.publicKey,
  })
  .rpc();

// Fetch all comments for a promotion
const comments = await program.account.comment.all([
  {
    memcmp: {
      offset: 8 + 32, // After discriminator + user pubkey
      bytes: promotionPubkey.toBase58(),
    },
  },
]);

Download
TypeScript
Copy
🏆 Reputation System (NFT Badges)
Architecture Overview

Badge Types:

Achievement Badges: First purchase, 10 redemptions, top reviewer
Tier Badges: Bronze, Silver, Gold, Platinum
Special Badges: Early adopter, merchant partner, community moderator
Implementation Steps:
1. Create Badge Account Structure

accounts/badge.rs:

#[account]
#[derive(InitSpace)]
pub struct UserReputation {
    pub user: Pubkey,
    pub total_purchases: u32,
    pub total_redemptions: u32,
    pub total_ratings_given: u32,
    pub total_comments: u32,
    pub reputation_score: u64,     // Calculated score
    pub tier: ReputationTier,
    pub badges_earned: Vec<BadgeType>, // Use u8 array with max length
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
    // Add more...
}

#[account]
#[derive(InitSpace)]
pub struct BadgeNFT {
    pub user: Pubkey,
    pub badge_type: BadgeType,
    pub mint: Pubkey,              // SPL Token mint
    pub metadata: Pubkey,          // Metaplex metadata account
    pub earned_at: i64,
    #[max_len(200)]
    pub metadata_uri: String,      // IPFS link to badge image
}

Download
Rust
Copy
2. Badge Minting Logic

instructions/mint_badge.rs:

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

Download
Rust
Copy
3. Automatic Reputation Updates

Modify existing instructions to update reputation:

// In mint_coupon.rs
pub fn handler(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
    // ... existing code ...
    
    // Update user reputation
    let reputation = &mut ctx.accounts.user_reputation;
    reputation.total_purchases += 1;
    reputation.reputation_score += 10; // Award points
    
    // Check tier upgrade
    update_reputation_tier(reputation);
    
    Ok(())
}

fn update_reputation_tier(reputation: &mut UserReputation) {
    let score = reputation.reputation_score;
    reputation.tier = match score {
        0..=99 => ReputationTier::Bronze,
        100..=499 => ReputationTier::Silver,
        500..=1999 => ReputationTier::Gold,
        2000..=4999 => ReputationTier::Platinum,
        _ => ReputationTier::Diamond,
    };
}

Download
Rust
Copy
4. Client-Side Badge Display
// Fetch user badges
const badges = await program.account.badgeNft.all([
  {
    memcmp: {
      offset: 8,
      bytes: userPubkey.toBase58(),
    },
  },
]);

// Check badge eligibility
const reputation = await program.account.userReputation.fetch(reputationPDA);

const eligibleBadges = [];
if (reputation.totalPurchases >= 1 && !hasBadge(BadgeType.FirstPurchase)) {
  eligibleBadges.push(BadgeType.FirstPurchase);
}

// Mint badge
await program.methods
  .mintBadge(BadgeType.FirstPurchase)
  .accounts({
    badgeNft: badgePDA,
    userReputation: reputationPDA,
    mint: mintPubkey,
    metadata: metadataPDA,
    marketplace: marketplacePDA,
    user: wallet.publicKey,
  })
  .rpc();

Download
TypeScript
Copy
🔮 Oracle Integration for Deal Aggregation
Architecture Overview

Components:

Off-chain Aggregator Service (Node.js/Python)
Oracle Account (stores external deal data)
Verification Mechanism (Pyth/Switchboard or custom)
Implementation Steps:
1. Oracle Account Structure

accounts/external_deal.rs:

#[account]
#[derive(InitSpace)]
pub struct ExternalDeal {
    pub oracle_authority: Pubkey,
    pub source: DealSource,
    #[max_len(100)]
    pub external_id: String,        // API reference ID
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
    pub verification_count: u32,    // Number of oracle updates
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
    pub allowed_sources: Vec<DealSource>, // Max 10
    pub min_verification_count: u32,
    pub update_interval: i64,           // Seconds between updates
}

Download
Rust
Copy
2. Oracle Update Instruction

instructions/update_external_deal.rs:

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
    require!(
        ctx.accounts.oracle_authority.key() == ctx.accounts.oracle_config.authority,
        OracleError::UnauthorizedOracle
    );
    
    let deal = &mut ctx.accounts.external_deal;
    let current_time = Clock::get()?.unix_timestamp;
    
    // First-time initialization
    if deal.oracle_authority == Pubkey::default() {
        deal.oracle_authority = ctx.accounts.oracle_authority.key();
        deal.source = DealSource::Skyscanner; // Or pass as param
        deal.external_id = external_id;
        deal.verification_count = 1;
        deal.is_verified = false;
    } else {
        // Update existing deal
        require!(
            current_time - deal.last_updated >= ctx.accounts.oracle_config.update_interval,
            OracleError::UpdateTooFrequent
        );
        deal.verification_count += 1;
    }
    
    // Update deal data
    deal.title = title.clone();
    deal.description = description;
    deal.original_price = original_price;
    deal.discounted_price = discounted_price;
    deal.discount_percentage = ((original_price - discounted_price) * 100 / original_price) as u8;
    deal.category = category;
    deal.image_url = image_url;
    deal.affiliate_url = affiliate_url;
    deal.expiry_timestamp = expiry_timestamp;
    deal.last_updated = current_time;
    
    // Mark as verified after threshold
    if deal.verification_count >= ctx.accounts.oracle_config.min_verification_count {
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
    
    pub oracle_config: Account<'info, OracleConfig>,
    
    pub oracle_authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

Download
Rust
Copy
3. Off-Chain Aggregator Service

aggregator.ts (Node.js service):

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import axios from 'axios';
import cron from 'node-cron';

interface ExternalDeal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  category: string;
  imageUrl: string;
  affiliateUrl: string;
  expiryTimestamp: number;
}

class DealAggregator {
  constructor(
    private program: Program,
    private oracleKeypair: Keypair,
    private apiKeys: {
      skyscanner?: string;
      booking?: string;
      shopify?: string;
    }
  ) {}

  /**
   * Fetch deals from Skyscanner API
   */
  async fetchSkyscannerDeals(): Promise<ExternalDeal[]> {
    try {
      const response = await axios.get('https://api.skyscanner.net/v1/deals', {
        headers: {
          'X-API-Key': this.apiKeys.skyscanner,
        },
        params: {
          market: 'US',
          currency: 'USD',
          limit: 50,
        },
      });

      return response.data.deals.map((deal: any) => ({
        id: `skyscanner_${deal.id}`,
        title: `${deal.origin} → ${deal.destination}`,
        description: `Flight deal from ${deal.airline}`,
        originalPrice: deal.regularPrice,
        discountedPrice: deal.price,
        category: 'flights',
        imageUrl: deal.imageUrl || 'https://default-flight.jpg',
        affiliateUrl: deal.deeplink,
        expiryTimestamp: new Date(deal.expiryDate).getTime() / 1000,
      }));
    } catch (error) {
      console.error('Skyscanner fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch deals from Booking.com API
   */
  async fetchBookingDeals(): Promise<ExternalDeal[]> {
    try {
      const response = await axios.get('https://api.booking.com/v1/deals', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.booking}`,
        },
        params: {
          city: 'New York',
          checkin: '2025-11-01',
          checkout: '2025-11-05',
        },
      });

      return response.data.hotels.map((hotel: any) => ({
        id: `booking_${hotel.id}`,
        title: hotel.name,
        description: `${hotel.starRating}-star hotel in ${hotel.city}`,
        originalPrice: hotel.regularPrice,
        discountedPrice: hotel.discountPrice,
        category: 'hotels',
        imageUrl: hotel.image,
        affiliateUrl: hotel.bookingUrl,
        expiryTimestamp: Date.now() / 1000 + 7 * 24 * 60 * 60, // 7 days
      }));
    } catch (error) {
      console.error('Booking fetch error:', error);
      return [];
    }
  }

  /**
   * Update deal on-chain
   */
  async pushDealToChain(deal: ExternalDeal): Promise<void> {
    try {
      const [externalDealPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('external_deal'), Buffer.from(deal.id)],
        this.program.programId
      );

      const [oracleConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('oracle_config')],
        this.program.programId
      );

      await this.program.methods
        .updateExternalDeal(
          deal.id,
          deal.title,
          deal.description,
          BigInt(deal.originalPrice * 1e9), // Convert to lamports
          BigInt(deal.discountedPrice * 1e9),
          deal.category,
          deal.imageUrl,
          deal.affiliateUrl,
          BigInt(deal.expiryTimestamp)
        )
        .accounts({
          externalDeal: externalDealPDA,
          oracleConfig: oracleConfigPDA,
          oracleAuthority: this.oracleKeypair.publicKey,
          payer: this.oracleKeypair.publicKey,
        })
        .signers([this.oracleKeypair])
        .rpc();

      console.log(`✅ Updated deal: ${deal.title}`);
    } catch (error) {
      console.error(`❌ Failed to update deal ${deal.id}:`, error);
    }
  }

  /**
   * Run aggregation cycle
   */
  async runAggregation(): Promise<void> {
    console.log('🔄 Starting deal aggregation...');

    const [skyscannerDeals, bookingDeals] = await Promise.all([
      this.fetchSkyscannerDeals(),
      this.fetchBookingDeals(),
    ]);

    const allDeals = [...skyscannerDeals, ...bookingDeals];
    console.log(`📊 Found ${allDeals.length} deals`);

    // Push deals to chain (with rate limiting)
    for (const deal of allDeals) {
      await this.pushDealToChain(deal);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
    }

    console.log('✅ Aggregation complete');
  }

  /**
   * Start scheduled aggregation
   */
  startScheduler(): void {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      await this.runAggregation();
    });

    console.log('⏰ Scheduler started (runs hourly)');
  }
}

// Usage
const aggregator = new DealAggregator(program, oracleKeypair, {
  skyscanner: process.env.SKYSCANNER_API_KEY,
  booking: process.env.BOOKING_API_KEY,
});

aggregator.startScheduler();

// Manual run
await aggregator.runAggregation();

Download
TypeScript
Copy
4. Client-Side Integration
// Fetch external deals
const externalDeals = await program.account.externalDeal.all([
  {
    memcmp: {
      offset: 8 + 32 + 1, // After discriminator + authority + source
      bytes: bs58.encode(Buffer.from([1])), // is_verified = true
    },
  },
]);

// Filter by category
const flightDeals = externalDeals.filter(
  deal => deal.account.category === 'flights'
);

// Convert to promotion (user action)
await program.methods
  .convertExternalDealToPromotion(externalDealId)
  .accounts({
    externalDeal: externalDealPDA,
    promotion: promotionPDA,
    merchant: merchantPDA,
    authority: wallet.publicKey,
  })
  .rpc();

Download
TypeScript
Copy
🚀 Production Deployment Checklist
1. Infrastructure
 Deploy oracle service on AWS/GCP with auto-scaling
 Set up Redis for caching API responses
 Use Helius RPC for better indexing
 Configure Cloudflare for CDN
2. Security
 Implement rate limiting on oracle updates
 Multi-signature for marketplace authority
 Audit smart contracts (Sec3, OtterSec)
 Encrypt API keys in environment
3. Monitoring
 Set up Sentry for error tracking
 Monitor oracle uptime (99.9% SLA)
 Track gas costs and optimize
 Alert system for failed transactions

Would you like me to elaborate on any specific feature or provide more code examples?



































































































































































Reasoning
Comprehensive Anchor Test Suite
tests/my_program.spec.ts
import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
} from "@solana/spl-token";
import { assert, expect } from "chai";

describe("Coupon Marketplace", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProgram as Program<MyProgram>;
  const connection = provider.connection;

  // Test accounts
  let marketplaceAuthority: Keypair;
  let merchant1: Keypair;
  let merchant2: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let oracleAuthority: Keypair;

  // PDAs
  let marketplacePDA: PublicKey;
  let marketplaceBump: number;
  let merchant1PDA: PublicKey;
  let merchant1Bump: number;
  let merchant2PDA: PublicKey;
  let oracleConfigPDA: PublicKey;

  // Test data
  const merchantName = "Test Restaurant";
  const merchantCategory = "restaurant";
  const merchantLatitude = 40.7128;
  const merchantLongitude = -74.006;

  const promotionCategory = "food";
  const promotionDescription = "50% off all pizzas";
  const discountPercentage = 50;
  const maxSupply = 100;
  const price = new BN(5 * LAMPORTS_PER_SOL);
  const radiusMeters = 5000;

  // Helper function: Airdrop SOL
  async function airdrop(publicKey: PublicKey, amount: number = 10) {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
  }

  // Helper function: Get current timestamp
  function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Helper function: Get expiry timestamp (7 days from now)
  function getExpiryTimestamp(daysFromNow: number = 7): BN {
    return new BN(getCurrentTimestamp() + daysFromNow * 24 * 60 * 60);
  }

  // Helper function: Derive PDA
  function derivePDA(seeds: (Buffer | Uint8Array)[]): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  before(async () => {
    // Initialize test accounts
    marketplaceAuthority = Keypair.generate();
    merchant1 = Keypair.generate();
    merchant2 = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    oracleAuthority = Keypair.generate();

    // Airdrop SOL to all accounts
    await Promise.all([
      airdrop(marketplaceAuthority.publicKey),
      airdrop(merchant1.publicKey),
      airdrop(merchant2.publicKey),
      airdrop(user1.publicKey),
      airdrop(user2.publicKey),
      airdrop(oracleAuthority.publicKey),
    ]);

    // Derive PDAs
    [marketplacePDA, marketplaceBump] = derivePDA([Buffer.from("marketplace")]);
    [merchant1PDA, merchant1Bump] = derivePDA([
      Buffer.from("merchant"),
      merchant1.publicKey.toBuffer(),
    ]);
    [merchant2PDA] = derivePDA([
      Buffer.from("merchant"),
      merchant2.publicKey.toBuffer(),
    ]);
    [oracleConfigPDA] = derivePDA([Buffer.from("oracle_config")]);
  });

  describe("Marketplace Initialization", () => {
    it("Initializes the marketplace", async () => {
      await program.methods
        .initialize()
        .accounts({
          marketplace: marketplacePDA,
          authority: marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([marketplaceAuthority])
        .rpc();

      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      
      assert.equal(
        marketplace.authority.toString(),
        marketplaceAuthority.publicKey.toString()
      );
      assert.equal(marketplace.totalCoupons.toNumber(), 0);
      assert.equal(marketplace.totalMerchants.toNumber(), 0);
      assert.equal(marketplace.feeBasisPoints, 250); // 2.5%
    });

    it("Fails to initialize marketplace twice", async () => {
      try {
        await program.methods
          .initialize()
          .accounts({
            marketplace: marketplacePDA,
            authority: marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([marketplaceAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Merchant Registration", () => {
    it("Registers a merchant with location", async () => {
      await program.methods
        .registerMerchant(
          merchantName,
          merchantCategory,
          merchantLatitude,
          merchantLongitude
        )
        .accounts({
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const merchant = await program.account.merchant.fetch(merchant1PDA);
      
      assert.equal(merchant.name, merchantName);
      assert.equal(merchant.category, merchantCategory);
      assert.equal(merchant.authority.toString(), merchant1.publicKey.toString());
      assert.equal(merchant.hasPhysicalLocation, true);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 0);
      assert.equal(merchant.totalCouponsRedeemed.toNumber(), 0);
      assert.equal(merchant.isActive, true);

      // Check location data
      const lat = merchant.location.latitude / 1_000_000;
      const lon = merchant.location.longitude / 1_000_000;
      assert.approximately(lat, merchantLatitude, 0.000001);
      assert.approximately(lon, merchantLongitude, 0.000001);

      // Check marketplace counter updated
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      assert.equal(marketplace.totalMerchants.toNumber(), 1);
    });

    it("Registers a merchant without location (online only)", async () => {
      await program.methods
        .registerMerchant(
          "Online Store",
          "ecommerce",
          null,
          null
        )
        .accounts({
          merchant: merchant2PDA,
          marketplace: marketplacePDA,
          authority: merchant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant2])
        .rpc();

      const merchant = await program.account.merchant.fetch(merchant2PDA);
      assert.equal(merchant.hasPhysicalLocation, false);
    });

    it("Fails with name too long", async () => {
      const longName = "A".repeat(51);
      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [merchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      try {
        await program.methods
          .registerMerchant(longName, "test", null, null)
          .accounts({
            merchant: merchantPDA,
            marketplace: marketplacePDA,
            authority: testMerchant.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMerchant])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NameTooLong");
      }
    });

    it("Fails with invalid coordinates", async () => {
      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [merchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      try {
        await program.methods
          .registerMerchant("Test", "test", 91.0, 0.0) // Invalid latitude
          .accounts({
            merchant: merchantPDA,
            marketplace: marketplacePDA,
            authority: testMerchant.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMerchant])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidCoordinates");
      }
    });
  });

  describe("Promotion Creation", () => {
    let promotionPDA: PublicKey;
    let geoCellPDA: PublicKey;
    const expiryTimestamp = getExpiryTimestamp(30);

    it("Creates a location-based promotion", async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      // Calculate geo cell ID
      const PRECISION = 1_000_000;
      const GRID_SIZE = 100_000;
      const latInt = Math.floor(merchantLatitude * PRECISION);
      const lonInt = Math.floor(merchantLongitude * PRECISION);
      const cellLat = Math.floor(latInt / GRID_SIZE);
      const cellLon = Math.floor(lonInt / GRID_SIZE);
      const geoCellId = new BN(cellLat).shln(32).or(new BN(cellLon));

      [geoCellPDA] = derivePDA([
        Buffer.from("geocell"),
        Buffer.from(geoCellId.toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          discountPercentage,
          maxSupply,
          expiryTimestamp,
          promotionCategory,
          promotionDescription,
          price,
          merchantLatitude,
          merchantLongitude,
          radiusMeters
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchant1PDA,
          geoCell: geoCellPDA,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const promotion = await program.account.promotion.fetch(promotionPDA);
      
      assert.equal(promotion.merchant.toString(), merchant1PDA.toString());
      assert.equal(promotion.discountPercentage, discountPercentage);
      assert.equal(promotion.maxSupply, maxSupply);
      assert.equal(promotion.currentSupply, 0);
      assert.equal(promotion.category, promotionCategory);
      assert.equal(promotion.description, promotionDescription);
      assert.equal(promotion.price.toString(), price.toString());
      assert.equal(promotion.isActive, true);
      assert.equal(promotion.isLocationBased, true);
      assert.equal(promotion.radiusMeters, radiusMeters);
    });

    it("Fails with invalid discount percentage", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .createCouponPromotion(
            101, // Invalid: > 100
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidDiscount");
      }
    });

    it("Fails with expired timestamp", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(2).toArray("le", 8)),
      ]);

      const pastTimestamp = new BN(getCurrentTimestamp() - 3600); // 1 hour ago

      try {
        await program.methods
          .createCouponPromotion(
            50,
            maxSupply,
            pastTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidExpiry");
      }
    });

    it("Fails when non-authority tries to create promotion", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(3).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .createCouponPromotion(
            50,
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: user1.publicKey, // Wrong authority
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotMerchantAuthority");
      }
    });
  });

  describe("Coupon Minting", () => {
    let promotionPDA: PublicKey;
    let couponPDA: PublicKey;
    let mintKeypair: Keypair;
    let metadataPDA: PublicKey;
    const couponId = new BN(1);

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Mints a coupon successfully", async () => {
      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)), // current_supply = 0
      ]);

      mintKeypair = Keypair.generate();

      // Derive metadata PDA (Metaplex standard)
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );
      [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintCoupon(couponId)
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user1, mintKeypair])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      
      assert.equal(coupon.id.toString(), couponId.toString());
      assert.equal(coupon.promotion.toString(), promotionPDA.toString());
      assert.equal(coupon.owner.toString(), user1.publicKey.toString());
      assert.equal(coupon.merchant.toString(), merchant1PDA.toString());
      assert.equal(coupon.discountPercentage, discountPercentage);
      assert.equal(coupon.isRedeemed, false);

      // Check promotion supply updated
      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 1);

      // Check merchant counter updated
      const merchant = await program.account.merchant.fetch(merchant1PDA);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 1);

      // Check marketplace counter updated
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      assert.equal(marketplace.totalCoupons.toNumber(), 1);
    });

    it("Mints multiple coupons", async () => {
      for (let i = 1; i < 5; i++) {
        const [newCouponPDA] = derivePDA([
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(i).toArray("le", 8)),
        ]);

        const newMint = Keypair.generate();

        await program.methods
          .mintCoupon(new BN(i + 1))
          .accounts({
            coupon: newCouponPDA,
            nftMint: newMint.publicKey,
            promotion: promotionPDA,
            merchant: merchant1PDA,
            marketplace: marketplacePDA,
            recipient: user2.publicKey,
            payer: user2.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user2, newMint])
          .rpc();
      }

      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 5);
    });

    it("Fails when supply is exhausted", async () => {
      // Create promotion with max_supply = 1
      const [limitedPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          50,
          1, // max_supply = 1
          getExpiryTimestamp(30),
          "test",
          "Limited supply test",
          price,
          null,
          null,
          0
        )
        .accounts({
          promotion: limitedPromotionPDA,
          merchant: merchant1PDA,
          geoCell: null,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      // Mint first coupon (should succeed)
      const [firstCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        limitedPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const firstMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(100))
        .accounts({
          coupon: firstCouponPDA,
          nftMint: firstMint.publicKey,
          promotion: limitedPromotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, firstMint])
        .rpc();

      // Try to mint second coupon (should fail)
      const [secondCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        limitedPromotionPDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      const secondMint = Keypair.generate();

      try {
        await program.methods
          .mintCoupon(new BN(101))
          .accounts({
            coupon: secondCouponPDA,
            nftMint: secondMint.publicKey,
            promotion: limitedPromotionPDA,
            merchant: merchant1PDA,
            marketplace: marketplacePDA,
            recipient: user1.publicKey,
            payer: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user1, secondMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("SupplyExhausted");
      }
    });
  });

  describe("Coupon Transfer", () => {
    let couponPDA: PublicKey;

    before(async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Transfers coupon to another user", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.owner.toString(), user1.publicKey.toString());

      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: user2.publicKey,
          fromAuthority: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.owner.toString(), user2.publicKey.toString());
    });

    it("Fails when non-owner tries to transfer", async () => {
      try {
        await program.methods
          .transferCoupon()
          .accounts({
            coupon: couponPDA,
            newOwner: merchant1.publicKey,
            fromAuthority: user1.publicKey, // No longer owner
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotCouponOwner");
      }
    });

    it("Transfers back to original owner", async () => {
      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: user1.publicKey,
          fromAuthority: user2.publicKey,
        })
        .signers([user2])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), user1.publicKey.toString());
    });
  });

  describe("Coupon Redemption", () => {
    let couponPDA: PublicKey;

    before(async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Redeems coupon successfully", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.isRedeemed, false);

      const merchantBefore = await program.account.merchant.fetch(merchant1PDA);
      const redeemedCountBefore = merchantBefore.totalCouponsRedeemed.toNumber();

      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: couponPDA,
          merchant: merchant1PDA,
          user: user1.publicKey,
          merchantAuthority: merchant1.publicKey,
        })
        .signers([user1, merchant1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.isRedeemed, true);
      assert.isAbove(couponAfter.redeemedAt.toNumber(), 0);

      const merchantAfter = await program.account.merchant.fetch(merchant1PDA);
      assert.equal(
        merchantAfter.totalCouponsRedeemed.toNumber(),
        redeemedCountBefore + 1
      );
    });

    it("Fails to redeem already redeemed coupon", async () => {
      try {
        await program.methods
          .redeemCoupon()
          .accounts({
            coupon: couponPDA,
            merchant: merchant1PDA,
            user: user1.publicKey,
            merchantAuthority: merchant1.publicKey,
          })
          .signers([user1, merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CouponAlreadyRedeemed");
      }
    });

    it("Fails when wrong merchant tries to redeem", async () => {
      // Mint a new coupon for user2
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(5).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(200))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user2.publicKey,
          payer: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user2, newMint])
        .rpc();

      // Try to redeem with wrong merchant
      try {
        await program.methods
          .redeemCoupon()
          .accounts({
            coupon: newCouponPDA,
            merchant: merchant2PDA, // Wrong merchant
            user: user2.publicKey,
            merchantAuthority: merchant2.publicKey,
          })
          .signers([user2, merchant2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("WrongMerchant");
      }
    });
  });

  describe("Coupon Listing & Marketplace", () => {
    let couponPDA: PublicKey;
    let listingPDA: PublicKey;
    const listingPrice = new BN(3 * LAMPORTS_PER_SOL);

    before(async () => {
      // Mint a fresh coupon for user1
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(6).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(300))
        .accounts({
          coupon: couponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      [listingPDA] = derivePDA([
        Buffer.from("listing"),
        couponPDA.toBuffer(),
      ]);
    });

    it("Lists coupon for sale", async () => {
      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const listing = await program.account.listing.fetch(listingPDA);
      
      assert.equal(listing.coupon.toString(), couponPDA.toString());
      assert.equal(listing.seller.toString(), user1.publicKey.toString());
      assert.equal(listing.price.toString(), listingPrice.toString());
      assert.equal(listing.isActive, true);
    });

    it("Fails to list with zero price", async () => {
      // Mint another coupon
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(7).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(400))
        .accounts({
          coupon: testCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      try {
        await program.methods
          .listCouponForSale(new BN(0))
          .accounts({
            listing: testListingPDA,
            coupon: testCouponPDA,
            seller: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidPrice");
      }
    });

    it("Buys listed coupon", async () => {
      const sellerBalanceBefore = await connection.getBalance(user1.publicKey);
      const buyerBalanceBefore = await connection.getBalance(user2.publicKey);
      const marketplaceAuthorityBalanceBefore = await connection.getBalance(
        marketplaceAuthority.publicKey
      );

      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      const fee = listingPrice.mul(new BN(marketplace.feeBasisPoints)).div(new BN(10000));
      const sellerAmount = listingPrice.sub(fee);

      await program.methods
        .buyListedCoupon()
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          marketplace: marketplacePDA,
          seller: user1.publicKey,
          buyer: user2.publicKey,
          marketplaceAuthority: marketplaceAuthority.publicKey,
        })
        .signers([user2])
        .rpc();

      // Verify ownership transferred
      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), user2.publicKey.toString());

      // Verify listing deactivated
      const listing = await program.account.listing.fetch(listingPDA);
      assert.equal(listing.isActive, false);

      // Verify balances (approximately, accounting for transaction fees)
      const sellerBalanceAfter = await connection.getBalance(user1.publicKey);
      const marketplaceAuthorityBalanceAfter = await connection.getBalance(
        marketplaceAuthority.publicKey
      );

      // Seller should receive sellerAmount
      const sellerDiff = sellerBalanceAfter - sellerBalanceBefore;
      assert.approximately(sellerDiff, sellerAmount.toNumber(), LAMPORTS_PER_SOL * 0.01);

      // Marketplace authority should receive fee
      const feeDiff = marketplaceAuthorityBalanceAfter - marketplaceAuthorityBalanceBefore;
      assert.approximately(feeDiff, fee.toNumber(), LAMPORTS_PER_SOL * 0.01);
    });

    it("Fails to buy inactive listing", async () => {
      try {
        await program.methods
          .buyListedCoupon()
          .accounts({
            listing: listingPDA,
            coupon: couponPDA,
            marketplace: marketplacePDA,
            seller: user1.publicKey,
            buyer: user1.publicKey,
            marketplaceAuthority: marketplaceAuthority.publicKey,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ListingInactive");
      }
    });

    it("Cancels listing", async () => {
      // Create new listing
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(8).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(500))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [newListingPDA] = derivePDA([
        Buffer.from("listing"),
        newCouponPDA.toBuffer(),
      ]);

      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: newListingPDA,
          coupon: newCouponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      // Cancel listing
      await program.methods
        .cancelListing()
        .accounts({
          listing: newListingPDA,
          seller: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const listing = await program.account.listing.fetch(newListingPDA);
      assert.equal(listing.isActive, false);
    });

    it("Fails to cancel listing by non-seller", async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(9).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(600))
        .accounts({
          coupon: testCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      try {
        await program.methods
          .cancelListing()
          .accounts({
            listing: testListingPDA,
            seller: user2.publicKey, // Wrong seller
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotListingSeller");
      }
    });
  });

  describe("Rating System", () => {
    let promotionPDA: PublicKey;
    let ratingPDA: PublicKey;
    let ratingStatsPDA: PublicKey;

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [ratingPDA] = derivePDA([
        Buffer.from("rating"),
        user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      [ratingStatsPDA] = derivePDA([
        Buffer.from("rating_stats"),
        promotionPDA.toBuffer(),
      ]);
    });

    it("Rates a promotion", async () => {
      await program.methods
        .ratePromotion(5)
        .accounts({
          rating: ratingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const rating = await program.account.rating.fetch(ratingPDA);
      assert.equal(rating.stars, 5);
      assert.equal(rating.user.toString(), user1.publicKey.toString());
      assert.equal(rating.promotion.toString(), promotionPDA.toString());

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 1);
      assert.equal(stats.sumStars.toNumber(), 5);
      assert.equal(stats.averageRating, 500); // 5.00 * 100
      assert.deepEqual(stats.distribution, [0, 0, 0, 0, 1]);
    });

    it("Updates existing rating", async () => {
      await program.methods
        .ratePromotion(3)
        .accounts({
          rating: ratingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const rating = await program.account.rating.fetch(ratingPDA);
      assert.equal(rating.stars, 3);

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 1); // Still 1 rating
      assert.equal(stats.sumStars.toNumber(), 3);
      assert.equal(stats.averageRating, 300); // 3.00 * 100
      assert.deepEqual(stats.distribution, [0, 0, 1, 0, 0]);
    });

    it("Calculates average from multiple ratings", async () => {
      const [user2RatingPDA] = derivePDA([
        Buffer.from("rating"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      await program.methods
        .ratePromotion(4)
        .accounts({
          rating: user2RatingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 2);
      assert.equal(stats.sumStars.toNumber(), 7); // 3 + 4
      assert.equal(stats.averageRating, 350); // 3.50 * 100
      assert.deepEqual(stats.distribution, [0, 0, 1, 1, 0]);
    });

    it("Fails with invalid rating", async () => {
      const [testRatingPDA] = derivePDA([
        Buffer.from("rating"),
        merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      try {
        await program.methods
          .ratePromotion(6) // Invalid: > 5
          .accounts({
            rating: testRatingPDA,
            ratingStats: ratingStatsPDA,
            promotion: promotionPDA,
            user: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidRating");
      }
    });
  });

  describe("Comment System", () => {
    let promotionPDA: PublicKey;
    let commentPDA: PublicKey;
    let commentLikePDA: PublicKey;
    const commentContent = "Great deal! Highly recommend.";

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Adds a comment", async () => {
      const timestamp = getCurrentTimestamp();
      
      [commentPDA] = derivePDA([
        Buffer.from("comment"),
        user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      await program.methods
        .addComment(commentContent, null)
        .accounts({
          comment: commentPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.content, commentContent);
      assert.equal(comment.user.toString(), user1.publicKey.toString());
      assert.equal(comment.promotion.toString(), promotionPDA.toString());
      assert.equal(comment.likes, 0);
      assert.equal(comment.isMerchantReply, false);
      assert.isNull(comment.parentComment);
    });

    it("Merchant adds a reply", async () => {
      const timestamp = getCurrentTimestamp() + 1;
      
      const [replyPDA] = derivePDA([
        Buffer.from("comment"),
        merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      await program.methods
        .addComment("Thank you for your feedback!", commentPDA)
        .accounts({
          comment: replyPDA,
          promotion: promotionPDA,
          user: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const reply = await program.account.comment.fetch(replyPDA);
      assert.equal(reply.isMerchantReply, true);
      assert.equal(reply.parentComment.toString(), commentPDA.toString());
    });

    it("Likes a comment", async () => {
      [commentLikePDA] = derivePDA([
        Buffer.from("comment_like"),
        user2.publicKey.toBuffer(),
        commentPDA.toBuffer(),
      ]);

      await program.methods
        .likeComment()
        .accounts({
          commentLike: commentLikePDA,
          comment: commentPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.likes, 1);

      const like = await program.account.commentLike.fetch(commentLikePDA);
      assert.equal(like.user.toString(), user2.publicKey.toString());
      assert.equal(like.comment.toString(), commentPDA.toString());
    });

    it("Fails to add empty comment", async () => {
      const timestamp = getCurrentTimestamp() + 2;
      
      const [testCommentPDA] = derivePDA([
        Buffer.from("comment"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .addComment("", null)
          .accounts({
            comment: testCommentPDA,
            promotion: promotionPDA,
            user: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CommentEmpty");
      }
    });

    it("Fails to add comment that's too long", async () => {
      const longComment = "A".repeat(501);
      const timestamp = getCurrentTimestamp() + 3;
      
      const [testCommentPDA] = derivePDA([
        Buffer.from("comment"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .addComment(longComment, null)
          .accounts({
            comment: testCommentPDA,
            promotion: promotionPDA,
            user: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CommentTooLong");
      }
    });
  });

  describe("Reputation & Badge System", () => {
    let userReputationPDA: PublicKey;
    let badgePDA: PublicKey;
    let badgeMint: Keypair;
    let badgeMetadataPDA: PublicKey;

    before(async () => {
      [userReputationPDA] = derivePDA([
        Buffer.from("reputation"),
        user1.publicKey.toBuffer(),
      ]);
    });

    it("Initializes user reputation", async () => {
      await program.methods
        .initializeReputation()
        .accounts({
          userReputation: userReputationPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.equal(reputation.user.toString(), user1.publicKey.toString());
      assert.equal(reputation.totalPurchases, 0);
      assert.equal(reputation.totalRedemptions, 0);
      assert.equal(reputation.reputationScore.toNumber(), 0);
    });

    it("Updates reputation after purchase", async () => {
      // This would be called automatically in mint_coupon
      // For testing, we'll call a helper instruction
      await program.methods
        .updateReputationPurchase()
        .accounts({
          userReputation: userReputationPDA,
          user: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.equal(reputation.totalPurchases, 1);
      assert.isAbove(reputation.reputationScore.toNumber(), 0);
    });

    it("Mints achievement badge", async () => {
      // First, ensure user is eligible (has 1+ purchase)
      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.isAtLeast(reputation.totalPurchases, 1);

      const badgeType = 0; // FirstPurchase badge

      [badgePDA] = derivePDA([
        Buffer.from("badge"),
        user1.publicKey.toBuffer(),
        Buffer.from([badgeType]),
      ]);

      badgeMint = Keypair.generate();

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      [badgeMetadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          badgeMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintBadge(badgeType)
        .accounts({
          badgeNft: badgePDA,
          userReputation: userReputationPDA,
          mint: badgeMint.publicKey,
          metadata: badgeMetadataPDA,
          marketplace: marketplacePDA,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user1, badgeMint])
        .rpc();

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), user1.publicKey.toString());
      assert.equal(badge.badgeType, badgeType);
      assert.equal(badge.mint.toString(), badgeMint.publicKey.toString());

      const reputationAfter = await program.account.userReputation.fetch(userReputationPDA);
      assert.include(reputationAfter.badgesEarned, badgeType);
    });

    it("Fails to mint badge twice", async () => {
      const badgeType = 0; // FirstPurchase badge
      const newMint = Keypair.generate();

      try {
        await program.methods
          .mintBadge(badgeType)
          .accounts({
            badgeNft: badgePDA,
            userReputation: userReputationPDA,
            mint: newMint.publicKey,
            metadata: badgeMetadataPDA,
            marketplace: marketplacePDA,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user1, newMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("BadgeAlreadyEarned");
      }
    });

    it("Fails to mint badge without meeting requirements", async () => {
      // Try to mint TenRedemptions badge without 10 redemptions
      const badgeType = 1; // TenRedemptions badge

      const [unqualifiedBadgePDA] = derivePDA([
        Buffer.from("badge"),
        user2.publicKey.toBuffer(),
        Buffer.from([badgeType]),
      ]);

      // Initialize reputation for user2
      const [user2ReputationPDA] = derivePDA([
        Buffer.from("reputation"),
        user2.publicKey.toBuffer(),
      ]);

      await program.methods
        .initializeReputation()
        .accounts({
          userReputation: user2ReputationPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const newMint = Keypair.generate();

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      const [metadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          newMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      try {
        await program.methods
          .mintBadge(badgeType)
          .accounts({
            badgeNft: unqualifiedBadgePDA,
            userReputation: user2ReputationPDA,
            mint: newMint.publicKey,
            metadata: metadata,
            marketplace: marketplacePDA,
            user: user2.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([user2, newMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("BadgeNotEarned");
      }
    });
  });

  describe("Oracle & External Deals", () => {
    let externalDealPDA: PublicKey;
    const externalDealId = "skyscanner_deal_123";

    before(async () => {
      [externalDealPDA] = derivePDA([
        Buffer.from("external_deal"),
        Buffer.from(externalDealId),
      ]);

      // Initialize oracle config
      await program.methods
        .initializeOracle()
        .accounts({
          oracleConfig: oracleConfigPDA,
          authority: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();
    });

    it("Updates external deal from oracle", async () => {
      const title = "NYC to LAX - $199";
      const description = "Round trip flight deal";
      const originalPrice = new BN(500 * LAMPORTS_PER_SOL);
      const discountedPrice = new BN(199 * LAMPORTS_PER_SOL);
      const category = "flights";
      const imageUrl = "https://example.com/flight.jpg";
      const affiliateUrl = "https://skyscanner.com/deal/123";
      const expiryTimestamp = getExpiryTimestamp(7);

      await program.methods
        .updateExternalDeal(
          externalDealId,
          title,
          description,
          originalPrice,
          discountedPrice,
          category,
          imageUrl,
          affiliateUrl,
          expiryTimestamp
        )
        .accounts({
          externalDeal: externalDealPDA,
          oracleConfig: oracleConfigPDA,
          oracleAuthority: oracleAuthority.publicKey,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      const deal = await program.account.externalDeal.fetch(externalDealPDA);
      assert.equal(deal.externalId, externalDealId);
      assert.equal(deal.title, title);
      assert.equal(deal.description, description);
      assert.equal(deal.originalPrice.toString(), originalPrice.toString());
      assert.equal(deal.discountedPrice.toString(), discountedPrice.toString());
      assert.equal(deal.category, category);
      assert.equal(deal.verificationCount, 1);
      assert.equal(deal.isVerified, false); // Not verified until threshold
    });

    it("Updates deal multiple times for verification", async () => {
      // Update 2 more times to reach verification threshold (assuming threshold is 3)
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait to respect update interval

        await program.methods
          .updateExternalDeal(
            externalDealId,
            "NYC to LAX - $199",
            "Round trip flight deal",
            new BN(500 * LAMPORTS_PER_SOL),
            new BN(199 * LAMPORTS_PER_SOL),
            "flights",
            "https://example.com/flight.jpg",
            "https://skyscanner.com/deal/123",
            getExpiryTimestamp(7)
          )
          .accounts({
            externalDeal: externalDealPDA,
            oracleConfig: oracleConfigPDA,
            oracleAuthority: oracleAuthority.publicKey,
            payer: oracleAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracleAuthority])
          .rpc();
      }

      const deal = await program.account.externalDeal.fetch(externalDealPDA);
      assert.equal(deal.verificationCount, 3);
      assert.equal(deal.isVerified, true); // Now verified
    });

    it("Fails when unauthorized oracle tries to update", async () => {
      const unauthorizedOracle = Keypair.generate();
      await airdrop(unauthorizedOracle.publicKey);

      try {
        await program.methods
          .updateExternalDeal(
            externalDealId,
            "Fake Deal",
            "This should fail",
            new BN(100),
            new BN(50),
            "test",
            "url",
            "url",
            getExpiryTimestamp(1)
          )
          .accounts({
            externalDeal: externalDealPDA,
            oracleConfig: oracleConfigPDA,
            oracleAuthority: unauthorizedOracle.publicKey,
            payer: unauthorizedOracle.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedOracle])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedOracle");
      }
    });
  });

  describe("Integration Tests", () => {
    it("Complete user journey: Register → Buy → Redeem", async () => {
      // 1. Merchant registers
      const newMerchant = Keypair.generate();
      await airdrop(newMerchant.publicKey);

      const [newMerchantPDA] = derivePDA([
        Buffer.from("merchant"),
        newMerchant.publicKey.toBuffer(),
      ]);

      await program.methods
        .registerMerchant("Integration Test Store", "test", null, null)
        .accounts({
          merchant: newMerchantPDA,
          marketplace: marketplacePDA,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      // 2. Merchant creates promotion
      const [newPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        newMerchantPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          25,
          10,
          getExpiryTimestamp(30),
          "test",
          "Integration test promotion",
          new BN(1 * LAMPORTS_PER_SOL),
          null,
          null,
          0
        )
        .accounts({
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          geoCell: null,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      // 3. User buys coupon
      const newUser = Keypair.generate();
      await airdrop(newUser.publicKey);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        newPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(1000))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          marketplace: marketplacePDA,
          recipient: newUser.publicKey,
          payer: newUser.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([newUser, newMint])
        .rpc();

      // 4. User redeems coupon
      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: newCouponPDA,
          merchant: newMerchantPDA,
          user: newUser.publicKey,
          merchantAuthority: newMerchant.publicKey,
        })
        .signers([newUser, newMerchant])
        .rpc();

      // 5. Verify final state
      const coupon = await program.account.coupon.fetch(newCouponPDA);
      assert.equal(coupon.isRedeemed, true);

      const merchant = await program.account.merchant.fetch(newMerchantPDA);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 1);
      assert.equal(merchant.totalCouponsRedeemed.toNumber(), 1);

      const promotion = await program.account.promotion.fetch(newPromotionPDA);
      assert.equal(promotion.currentSupply, 1);
    });

    it("Complete marketplace flow: List → Buy → Verify ownership", async () => {
      // Setup: Create merchant, promotion, and mint coupon
      const seller = Keypair.generate();
      const buyer = Keypair.generate();
      await Promise.all([
        airdrop(seller.publicKey),
        airdrop(buyer.publicKey),
      ]);

      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [testMerchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      await program.methods
        .registerMerchant("Marketplace Test", "test", null, null)
        .accounts({
          merchant: testMerchantPDA,
          marketplace: marketplacePDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        testMerchantPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          50,
          5,
          getExpiryTimestamp(30),
          "test",
          "Marketplace flow test",
          new BN(2 * LAMPORTS_PER_SOL),
          null,
          null,
          0
        )
        .accounts({
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          geoCell: null,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        testPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const testMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(2000))
        .accounts({
          coupon: testCouponPDA,
          nftMint: testMint.publicKey,
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          marketplace: marketplacePDA,
          recipient: seller.publicKey,
          payer: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([seller, testMint])
        .rpc();

      // Verify seller owns coupon
      let coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), seller.publicKey.toString());

      // List coupon
      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      const salePrice = new BN(1.5 * LAMPORTS_PER_SOL);

      await program.methods
        .listCouponForSale(salePrice)
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          seller: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      // Buy coupon
      await program.methods
        .buyListedCoupon()
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          marketplace: marketplacePDA,
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          marketplaceAuthority: marketplaceAuthority.publicKey,
        })
        .signers([buyer])
        .rpc();

      // Verify buyer now owns coupon
      coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), buyer.publicKey.toString());

      // Verify listing is inactive
      const listing = await program.account.listing.fetch(testListingPDA);
      assert.equal(listing.isActive, false);
    });
  });
});

Download
TypeScript
Copy
package.json (Test dependencies)
{
  "scripts": {
    "test": "anchor test"
  },
  "devDependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/spl-token": "^0.3.9",
    "@solana/web3.js": "^1.87.6",
    "@types/chai": "^4.3.11",
    "@types/mocha": "^10.0.6",
    "chai": "^4.4.1",
    "mocha": "^10.2.0",
    "ts-mocha": "^10.0.0",
    "typescript": "^5.3.3"
  }
}

JSON
Download
JSON
Copy
Running the Tests
# Install dependencies
npm install

# Build program
anchor build

# Run all tests
anchor test

# Run specific test file
anchor test --skip-build --skip-deploy

# Run with verbose logging
RUST_LOG=debug anchor test

# Run tests against localnet
anchor test --skip-local-validator

Bash
Download
Bash
Copy
Test Coverage Summary

✅ Marketplace Initialization (2 tests) ✅ Merchant Registration (4 tests) ✅ Promotion Creation (4 tests) ✅ Coupon Minting (3 tests) ✅ Coupon Transfer (3 tests) ✅ Coupon Redemption (3 tests) ✅ Listing & Marketplace (6 tests) ✅ Rating System (4 tests) ✅ Comment System (4 tests) ✅ Reputation & Badges (4 tests) ✅ Oracle Integration (3 tests) ✅ Integration Tests (2 tests)

Total: 42 comprehensive test cases

These tests cover success paths, failure scenarios, edge cases, and complete user journeys! 🚀


































































































































































































// src/lib.rs
use anchor_lang::prelude::*;

pub mod accounts;
pub mod instructions;
pub mod errors;
pub mod events;

use accounts::*;
use instructions::*;
use errors::*;

declare_id!("kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        name: String,
        category: String,
    ) -> Result<()> {
        instructions::register_merchant::handler(ctx, name, category)
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

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }
}

// src/errors.rs
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
}

// src/events.rs
use anchor_lang::prelude::*;

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
    pub promotion: Pubkey,
    pub recipient: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
}

#[event]
pub struct CouponTransferred {
    pub coupon: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
}

#[event]
pub struct CouponRedeemed {
    pub coupon: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub timestamp: i64,
}

#[event]
pub struct CouponListed {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct CouponSold {
    pub listing: Pubkey,
    pub coupon: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub marketplace_fee: u64,
}

// src/accounts/mod.rs
pub mod marketplace;
pub mod merchant;
pub mod promotion;
pub mod coupon;
pub mod listing;

pub use marketplace::*;
pub use merchant::*;
pub use promotion::*;
pub use coupon::*;
pub use listing::*;

// src/accounts/marketplace.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub total_coupons: u64,
    pub total_merchants: u64,
    pub fee_basis_points: u16,
}

// src/accounts/merchant.rs
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
}

// src/accounts/promotion.rs
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
}

// src/accounts/coupon.rs
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
    // Future: Add mint address when converting to NFT
    pub mint: Option<Pubkey>,
}

// src/accounts/listing.rs
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

// src/instructions/mod.rs
pub mod initialize;
pub mod register_merchant;
pub mod create_coupon_promotion;
pub mod mint_coupon;
pub mod transfer_coupon;
pub mod redeem_coupon;
pub mod list_coupon_for_sale;
pub mod buy_listed_coupon;
pub mod cancel_listing;

// src/instructions/initialize.rs
use anchor_lang::prelude::*;
use crate::accounts::*;

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
    marketplace.fee_basis_points = 250; // 2.5% marketplace fee
    Ok(())
}

// src/instructions/register_merchant.rs
use anchor_lang::prelude::*;
use crate::{accounts::*, errors::CouponError, events::MerchantRegistered};

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

pub fn handler(
    ctx: Context<RegisterMerchant>,
    name: String,
    category: String,
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

    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_merchants += 1;

    emit!(MerchantRegistered {
        merchant: ctx.accounts.merchant.key(),
        authority: ctx.accounts.authority.key(),
        name,
        category,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// src/instructions/mint_coupon.rs - WITH METAPLEX INTEGRATION READY
use anchor_lang::prelude::*;
use crate::{accounts::*, errors::CouponError, events::CouponMinted};
// Future imports for Metaplex:
// use mpl_token_metadata::program::Metaplex;
// use anchor_spl::{token::Token, associated_token::AssociatedToken};

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
        mut,
        constraint = promotion.is_active @ CouponError::PromotionInactive
    )]
    pub promotion: Account<'info, Promotion>,
    #[account(
        mut,
        constraint = merchant.key() == promotion.merchant @ CouponError::WrongMerchant
    )]
    pub merchant: Account<'info, Merchant>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    /// CHECK: This is the recipient of the coupon
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    
    // Future NFT accounts:
    // pub mint: Account<'info, Mint>,
    // pub metadata: Account<'info, MetadataAccount>,
    // pub master_edition: Account<'info, MasterEdition>,
    // pub token_account: Account<'info, TokenAccount>,
    // pub token_program: Program<'info, Token>,
    // pub associated_token_program: Program<'info, AssociatedToken>,
    // pub metadata_program: Program<'info, Metaplex>,
}

pub fn handler(ctx: Context<MintCoupon>, coupon_id: u64) -> Result<()> {
    let promotion = &mut ctx.accounts.promotion;
    require!(promotion.is_active, CouponError::PromotionInactive);
    require!(promotion.current_supply < promotion.max_supply, CouponError::SupplyExhausted);
    require!(promotion.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::PromotionExpired);

    // Initialize coupon account
    let coupon = &mut ctx.accounts.coupon;
    coupon.id = coupon_id;
    coupon.promotion = ctx.accounts.promotion.key();
    coupon.owner = ctx.accounts.recipient.key();
    coupon.merchant = ctx.accounts.merchant.key();
    coupon.discount_percentage = promotion.discount_percentage;
    coupon.expiry_timestamp = promotion.expiry_timestamp;
    coupon.is_redeemed = false;
    coupon.redeemed_at = 0;
    coupon.created_at = Clock::get()?.unix_timestamp;
    coupon.mint = None; // Will be populated when NFT is minted

    // TODO: Add Metaplex NFT minting logic here
    // This would include:
    // 1. Create mint account
    // 2. Create metadata account with rich JSON metadata
    // 3. Create master edition for uniqueness
    // 4. Mint token to recipient

    // Update counters
    promotion.current_supply += 1;
    let merchant = &mut ctx.accounts.merchant;
    merchant.total_coupons_created += 1;
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_coupons += 1;

    emit!(CouponMinted {
        coupon: ctx.accounts.coupon.key(),
        promotion: ctx.accounts.promotion.key(),
        recipient: ctx.accounts.recipient.key(),
        merchant: ctx.accounts.merchant.key(),
        discount_percentage: promotion.discount_percentage,
    });

    Ok(())
}




























































































































































Below, I'll provide a detailed analysis of whether the provided code satisfies the requirements of the task you described. I'm basing this on the code snippets you shared (which appear to be a partial implementation of a Solana-based smart contract using Anchor for a "coupon marketplace" program). I'll break it down step-by-step, mapping the code to the key features, Web3 integration challenges, bonus ideas, and judging criteria from the task. I'll be honest and objective—highlighting what's well-covered, what's partially addressed, what's missing, and any potential improvements.

To summarize upfront: The code is a strong start toward satisfying the task's core requirements, especially on the smart contract backend for NFT-based coupons, merchant controls, transfers, redemptions, and a basic marketplace. It directly addresses the "core problem statement" of creating a trustless, transparent deal economy with verifiable NFT promotions. However, it's incomplete in several areas (e.g., no frontend/UI, incomplete handlers for some instructions, no external API integrations, and staking is for lamports rather than NFTs). It covers about 60-70% of the key features but would need expansion for a full hackathon submission, especially on UX, scalability, and bonus elements.

1. Mapping to Key Features
The task emphasizes building a platform with NFT-wrapped promotions, merchant controls, user marketplaces, aggregation, social elements, redemption, and staking. Here's how the code stacks up:

NFT Promotions / Coupons**:
  Well-covered. The code implements coupons as NFTs using Metaplex Token Metadata (via create_metadata_accounts_v3 in mint_coupon.rs). Each coupon is minted as a non-fungible token (decimals=0) with metadata like name, symbol, URI, discount percentage, expiry, minimum purchase, and terms. It includes verifiable ownership (tracked via Coupon account's owner field) and limits (e.g., max_supply in Promotion). Errors like SupplyExhausted and PromotionExpired enforce merchant controls. This directly solves the core problem of making promotions verifiable, transferable digital assets.
  Gaps: No explicit support for "bundles" or "flash sales" in promotions; metadata is basic (could use more standards like ERC-721 equivalents on Solana for richer attributes).

Merchant Dashboard**:
  Partially covered (backend only). Merchants can register (register_merchant) with details like name, category, description, and website. They can create promotions (create_coupon_promotion) that define NFT parameters (discount, supply, expiry, etc.). The mint_coupon_nft instruction allows minting NFTs tied to promotions. Authority checks (e.g., NotMerchantAuthority) ensure merchants control issuance.
  Gaps: This is all on-chain logic—no user-friendly interface (e.g., web dashboard) is provided. The task calls for a "user-friendly interface," so you'd need a frontend (e.g., React app interacting via Anchor's IDL) to make this accessible.

User Wallet & Marketplace**:
  Partially covered. Users can mint/receive NFTs (mint_coupon_nft), transfer them (transfer_coupon instruction exists, though handler code isn't shown), list for sale (list_coupon_for_sale), buy (buy_listed_coupon), and cancel listings (cancel_listing). There's a Marketplace account tracking totals and fees (2.5% default). Events like CouponListed and CouponSold enable off-chain indexing for a marketplace UI. This enables resale and gifting, addressing liquidity.
  Gaps: No browsing/claiming logic (e.g., a public feed of promotions). Wallet integration isn't handled here (that's frontend territory). Handlers for transfer/buy aren't fully shown, so completeness is unclear. No fiat payments abstraction.

Deal Aggregator Feed**:
  Minimally covered. There's a create_deal_aggregation instruction with params like external_api_data and deal_type, but the handler isn't provided (only the mod declaration). This could integrate external APIs (e.g., Skyscanner or Booking.com) by storing aggregated data on-chain.
  Gaps: No actual integration code (e.g., oracles like Chainlink for pulling live data). Without this, there's no "critical mass of offers" from real-world sources.

Social Discovery Layer**:
  Partially covered. Rating merchants (rate_merchant) with scores (1-5) and reviews, plus events for community tracking. This could foster virality via off-chain apps.
  Gaps: No sharing/commenting features (e.g., no on-chain posts or social feeds). No user ratings for deals themselves—only merchants.

Redemption Verification Flow**:
  Well-covered. The redeem_coupon instruction handles single-use redemptions with checks for ownership, expiry, and prior redemption. It generates a redemption code (hash-based in utils.rs) for off-chain verification (e.g., QR code scan by merchant). Requires merchant authority signature for security, and emits an event for on-chain tracking. This ensures "single-use" and verifiable redemption.
  Gaps: Code assumes a simple code check; no full off-chain flow (e.g., integrating with merchant POS systems). Could be enhanced with zero-knowledge proofs for privacy.

Reward Staking / Cashback**:
  Partially covered. stake_for_rewards and claim_staking_rewards allow staking lamports (SOL) for rewards based on APY (default 5%), with duration and reward calculation in utils.rs. Events track staking/claiming. This incentivizes engagement.
  Gaps: The task suggests "staking NFTs for rewards," but this stakes lamports, not NFTs. No cashback tied to redemptions. Handler for claiming isn't fully shown.

2. Mapping to Web3 Integration Challenges
The task highlights specific Web3 hurdles. The code addresses some technically but assumes off-chain complements.

NFT Representation and Metadata Standards**: Uses Metaplex (industry standard on Solana) with DataV2 for metadata, including creators and URI. Solid choice for verifiability and interoperability.

Redemption Flow**: Hybrid—on-chain state updates (e.g., is_redeemed) with off-chain code generation/verification. Smart-contract logic enforces rules; off-chain attestation could be added via events.

Abstracting Web3 for UX**: Not addressed in code (this is backend). You'd need a frontend with wallet connectors (e.g., Phantom) and gas abstractions (e.g., relayers) for mainstream users.

Onboarding for Small Businesses**: Easy on-chain registration and promotion creation, but no tools for leveraging existing catalogs (e.g., Shopify integration).

Marketplaces for Unused Coupons**: Supported via listing/buying instructions, enabling resale liquidity.

3. Bonus Challenge Ideas
On-Chain Reputation/Loyalty**: Partially via merchant ratings and average_rating. Could extend to user badges (not implemented).
Travel-Specific Subset**: Not addressed (e.g., no geo or event-based logic).
Geo-Based Discovery**: Missing.
Partner with NFT Marketplaces**: Events could enable this (e.g., indexing on OpenSea), but no direct integration.
Group Deals**: Not implemented.

The code doesn't tackle many bonuses, which could boost "innovation" in judging.

4. Evaluation Against Judging Criteria
Innovation and Creativity (8/10)**: Leverages Web3 well for NFTs, transfers, and staking in a novel "deal economy." Creative use of redemption codes and events for transparency. But it's a straightforward implementation without unique twists (e.g., no AI-driven deal matching).

Technical Implementation (7/10)**: Solid Anchor structure with accounts, instructions, errors, events, and utils. Uses best practices (e.g., bumps, CPI for minting/metadata). However, not all handlers are provided (e.g., transfer, buy, aggregation), and some are incomplete. Potential bugs: Staking uses lamports directly (risky without token wrappers); redemption code generation is simplistic (could collide). Tested on Solana (~1.16.0 deps).

User Experience (UX) (4/10)**: Backend-only—no UI, so merchants/users can't interact intuitively. Web3 complexities (e.g., signing txns) aren't abstracted.

Feasibility and Scalability (7/10)**: Feasible for Solana (low fees, fast txns). Scalable with on-chain counters and events for indexing (e.g., via The Graph). Real-world adoption possible, but needs API integrations and merchant onboarding tools. Assumes Solana ecosystem (e.g., Metaplex), limiting borderless appeal if not multi-chain.

Completeness (6/10)**: Covers core backend for NFTs, marketplace, redemption, and staking. Addresses ~5/7 key features partially, but misses aggregator integrations, social layers, and UX. Web3 challenges are backend-focused; bonuses largely ignored.

Recommendations to Fully Satisfy the Task
This code is a great foundation for a hackathon project—focus on completing it and adding layers:
Complete Missing Handlers**: Implement full logic for transfer, buy, aggregation, etc.
Add Frontend**: Build a web app (e.g., Next.js + Anchor) for merchant dashboard, user marketplace, and wallet integration.
Enhance Integrations**: Add oracle calls for external APIs in create_deal_aggregation.
NFT Staking**: Modify staking to lock NFTs instead of lamports (e.g., transfer NFT ownership to a program account).
Testing/Security**: Add unit tests, audit for vulnerabilities (e.g., reentrancy in transfers).
Bonus Polish**: Implement geo-discovery using off-chain indexing or on-chain oracles.
Deployment**: Deploy to Solana devnet and provide a demo video/link for judging.

If this is for a hackathon, it's promising—emphasize the "user-owned, borderless" aspect in your pitch. If you share more code (e.g., missing handlers or a repo), I can refine this analysis. What specific part concerns you most, or do you want help expanding it?