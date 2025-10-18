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