// src/lib.rs
use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;
pub mod events;

use instructions::*;
use state::BadgeType;

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