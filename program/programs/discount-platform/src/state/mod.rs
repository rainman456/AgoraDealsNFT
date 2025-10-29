// src/state/mod.rs
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
pub mod staking;
pub mod user_stats;
pub mod redemption_ticket;
pub mod group_deal;
pub mod auctions;

pub use marketplace::*;
pub use merchant::*;
pub use promotion::*;
pub use coupon::*;
pub use listing::*;
pub use comment::*;
pub use external_deal::*;
pub use location::*;
pub use rating::*;
pub use staking::*;
pub use redemption_ticket::*;
pub use group_deal::*;
pub use auctions::*;

// Export badge types explicitly (not ReputationTier from badge)
pub use badge::{BadgeType, BadgeNFT, UserReputation};

// Export user_stats with explicit ReputationTier
pub use user_stats::{UserStats, ReputationTier};