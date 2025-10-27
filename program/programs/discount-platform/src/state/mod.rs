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

// Export badge types explicitly (not ReputationTier from badge)
pub use badge::{BadgeType, BadgeNFT, UserReputation};

// Export user_stats with explicit ReputationTier
pub use user_stats::{UserStats, ReputationTier};