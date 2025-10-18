use anchor_lang::prelude::*;
use crate::accounts::{Merchant, Promotion};
use crate::errors::CouponError;
use crate::events::PromotionCreated;

pub fn create_coupon_promotion(
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
    promotion.category = category.clone();
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
        category,
        price,
        timestamp: promotion.created_at,
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
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
