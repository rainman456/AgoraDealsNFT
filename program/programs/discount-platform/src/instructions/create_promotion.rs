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