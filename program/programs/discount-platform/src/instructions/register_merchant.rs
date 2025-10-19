// src/instructions/register_merchant.rs
use anchor_lang::prelude::*;
use crate::state::{Merchant, Marketplace, Location};
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