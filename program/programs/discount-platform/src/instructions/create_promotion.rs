// src/instructions/create_promotion.rs
use anchor_lang::prelude::*;
use crate::state::{Promotion, Merchant};
use crate::errors::CouponError;
use crate::events::PromotionCreated;

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
    
    // Initialize location data (default to no location)
    promotion.location = crate::state::Location {
        latitude: 0,
        longitude: 0,
        region_code: 0,
        country_code: 0,
        city_hash: 0,
    };
    promotion.geo_cell_id = 0;
    promotion.radius_meters = 0;
    promotion.is_location_based = false;

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