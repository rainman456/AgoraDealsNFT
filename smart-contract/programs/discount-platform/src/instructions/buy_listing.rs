use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::accounts::{Coupon, Listing, Marketplace};
use crate::errors::CouponError;
use crate::events::CouponSold;

pub fn buy_listed_coupon(ctx: Context<BuyListedCoupon>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, CouponError::ListingInactive);

    let coupon = &mut ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);

    let marketplace = &ctx.accounts.marketplace;
    let marketplace_fee = (listing.price * marketplace.fee_basis_points as u64) / 10000;
    let seller_amount = listing.price - marketplace_fee;

    // Transfer payment to seller
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
        ),
        seller_amount,
    )?;

    // Transfer marketplace fee
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.marketplace_authority.to_account_info(),
            },
        ),
        marketplace_fee,
    )?;

    emit!(CouponSold {
        listing: listing.key(),
        coupon: coupon.key(),
        seller: listing.seller,
        buyer: ctx.accounts.buyer.key(),
        price: listing.price,
        marketplace_fee,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Update coupon owner and deactivate listing
    coupon.owner = ctx.accounts.buyer.key();
    listing.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct BuyListedCoupon<'info> {
    #[account(
        mut,
        constraint = listing.is_active @ CouponError::ListingInactive
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        constraint = coupon.key() == listing.coupon @ CouponError::WrongCoupon
    )]
    pub coupon: Account<'info, Coupon>,
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        constraint = listing.seller == seller.key() @ CouponError::NotListingSeller
    )]
    /// CHECK: Seller account for payment
    pub seller: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = marketplace.authority == marketplace_authority.key() @ CouponError::NotMarketplaceAuthority
    )]
    /// CHECK: Marketplace authority for fee collection
    pub marketplace_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
