// src/instructions/mod.rs
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
pub mod initialize_staking;
pub mod stake_coupon;
pub mod claim_rewards;
pub mod auto_award_badge;




pub use initialize::*;
pub use register_merchant::*;
pub use create_promotion::*;
pub use mint_coupon::*;
pub use transfer_coupon::*;
pub use redeem_coupon::*;
pub use list_for_sale::*;
pub use buy_listing::*;
pub use mint_badge::*;
pub use rate_promotion::*;
pub use update_external_deal::*;
pub use like_comment::*;
pub use add_comment::*;
pub use initialize_staking::*;
pub use stake_coupon::*;
pub use claim_rewards::*;
pub use auto_award_badge::*;