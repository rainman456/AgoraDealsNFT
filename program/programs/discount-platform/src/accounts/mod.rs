// src/accounts/mod.rs
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

pub use marketplace::*;
pub use merchant::*;
pub use promotion::*;
pub use coupon::*;
pub use listing::*;
pub use badge::*;
pub use comment::*;
pub use external_deal::*;
pub use location::*;
pub use rating::*;