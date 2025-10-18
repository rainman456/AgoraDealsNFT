use anchor_lang::prelude::*;

#[error_code]
pub enum CouponError {
    #[msg("Name is too long")]
    NameTooLong,
    #[msg("Category is too long")]
    CategoryTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Invalid discount percentage")]
    InvalidDiscount,
    #[msg("Invalid supply amount")]
    InvalidSupply,
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Promotion is inactive")]
    PromotionInactive,
    #[msg("Supply exhausted")]
    SupplyExhausted,
    #[msg("Promotion expired")]
    PromotionExpired,
    #[msg("Coupon already redeemed")]
    CouponAlreadyRedeemed,
    #[msg("Coupon expired")]
    CouponExpired,
    #[msg("Not coupon owner")]
    NotCouponOwner,
    #[msg("Wrong merchant")]
    WrongMerchant,
    #[msg("Not merchant authority")]
    NotMerchantAuthority,
    #[msg("Not marketplace authority")]
    NotMarketplaceAuthority,
    #[msg("Listing inactive")]
    ListingInactive,
    #[msg("Wrong coupon")]
    WrongCoupon,
    #[msg("Not listing seller")]
    NotListingSeller,
     #[msg("Invalid coordinates")]
    InvalidCoordinates,
    #[msg("Location not supported")]
    LocationNotSupported,
}
