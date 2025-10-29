// src/lib.rs
use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;
pub mod events;

use instructions::*;
use state::{BadgeType, DiscountTier, AuctionType};

declare_id!("9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3");

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

    pub fn create_promotion(
        ctx: Context<CreateCouponPromotion>,
        discount_percentage: u8,
        max_supply: u32,
        expiry_timestamp: i64,
        category: String,
        description: String,
        price: u64,
    ) -> Result<()> {
        instructions::create_promotion::handler(
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

    pub fn list_for_sale(ctx: Context<ListCouponForSale>, price: u64) -> Result<()> {
        instructions::list_for_sale::handler(ctx, price)
    }

    pub fn buy_listing(ctx: Context<BuyListedCoupon>) -> Result<()> {
        instructions::buy_listing::handler(ctx)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::list_for_sale::cancel_listing(ctx)
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

    pub fn initialize_staking(
        ctx: Context<InitializeStaking>,
        reward_rate_per_day: u64,
        min_stake_duration: i64,
    ) -> Result<()> {
        instructions::initialize_staking::handler(ctx, reward_rate_per_day, min_stake_duration)
    }

    pub fn stake_coupon(
        ctx: Context<StakeCoupon>,
        duration_days: u64,
    ) -> Result<()> {
        instructions::stake_coupon::handler(ctx, duration_days)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::claim_rewards::handler(ctx)
    }

    pub fn auto_award_badge(ctx: Context<AutoAwardBadge>, badge_type: BadgeType) -> Result<()> {
        instructions::auto_award_badge::handler(ctx, badge_type)
    }

    pub fn generate_redemption_ticket(
        ctx: Context<GenerateRedemptionTicket>,
        nonce: u64,  // Added nonce parameter
        latitude: Option<f64>,
        longitude: Option<f64>,
    ) -> Result<()> {
        instructions::redemption_tickets::handler_generate_ticket(ctx, nonce, latitude, longitude)
    }

    pub fn verify_and_redeem_ticket(
        ctx: Context<VerifyAndRedeemTicket>,
        expected_hash: [u8; 32],
    ) -> Result<()> {
        instructions::redemption_tickets::handler_verify_redeem_ticket(ctx, expected_hash)
    }

    pub fn cancel_redemption_ticket(
        ctx: Context<CancelRedemptionTicket>,
    ) -> Result<()> {
        instructions::redemption_tickets::handler_cancel_ticket(ctx)
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
        instructions::group_deals::handler_create_group_deal(
            ctx,
            deal_id,
            target_participants,
            max_participants,
            base_price,
            discount_tiers,
            duration_seconds,
        )
    }

    pub fn join_group_deal(
        ctx: Context<JoinGroupDeal>,
    ) -> Result<()> {
        instructions::group_deals::handler_join_group_deal(ctx)
    }

    pub fn finalize_group_deal(
        ctx: Context<FinalizeGroupDeal>,
    ) -> Result<()> {
        instructions::group_deals::handler_finalize_group_deal(ctx)
    }

    pub fn refund_group_deal(
        ctx: Context<RefundGroupDeal>,
    ) -> Result<()> {
        instructions::group_deals::handler_refund_group_deal(ctx)
    }

    pub fn mint_group_coupon(
        ctx: Context<MintGroupCoupon>,
        coupon_id: u64,
    ) -> Result<()> {
        instructions::group_deals::handler_mint_group_coupon(ctx, coupon_id)
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
        instructions::auctions::handler_create_auction(
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

    pub fn place_bid(
        ctx: Context<PlaceBid>,
        bid_amount: u64,
    ) -> Result<()> {
        instructions::auctions::handler_place_bid(ctx, bid_amount)
    }

    pub fn buy_dutch_auction(
        ctx: Context<BuyDutchAuction>,
    ) -> Result<()> {
        instructions::auctions::handler_buy_dutch_auction(ctx)
    }

    pub fn finalize_auction(
        ctx: Context<FinalizeAuction>,
    ) -> Result<()> {
        instructions::auctions::handler_finalize_auction(ctx)
    }

    pub fn cancel_auction(
        ctx: Context<CancelAuction>,
    ) -> Result<()> {
        instructions::auctions::handler_cancel_auction(ctx)
    }
}