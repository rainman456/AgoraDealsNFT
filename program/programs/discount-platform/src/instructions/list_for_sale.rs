use anchor_lang::prelude::*;
use crate::accounts::{Coupon, Listing};
use crate::errors::CouponError;
use crate::events::{CouponListed, ListingCancelled};

pub fn handler(
    ctx: Context<ListCouponForSale>,
    price: u64,
) -> Result<()> {
    require!(price > 0, CouponError::InvalidPrice);

    let coupon = &ctx.accounts.coupon;
    require!(!coupon.is_redeemed, CouponError::CouponAlreadyRedeemed);
    require!(coupon.expiry_timestamp > Clock::get()?.unix_timestamp, CouponError::CouponExpired);
    require!(coupon.owner == ctx.accounts.seller.key(), CouponError::NotCouponOwner);

    let listing = &mut ctx.accounts.listing;
    listing.coupon = ctx.accounts.coupon.key();
    listing.seller = ctx.accounts.seller.key();
    listing.price = price;
    listing.is_active = true;
    listing.created_at = Clock::get()?.unix_timestamp;

    emit!(CouponListed {
        listing: listing.key(),
        coupon: listing.coupon,
        nft_mint: coupon.mint.unwrap_or(Pubkey::default()),
        seller: listing.seller,
        price,
    });

    Ok(())
}

pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, CouponError::ListingInactive);
    require!(listing.seller == ctx.accounts.seller.key(), CouponError::NotListingSeller);

    listing.is_active = false;

    emit!(ListingCancelled {
        listing: listing.key(),
        coupon: listing.coupon,
        seller: listing.seller,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ListCouponForSale<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", coupon.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        constraint = coupon.owner == seller.key() @ CouponError::NotCouponOwner
    )]
    pub coupon: Account<'info, Coupon>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        constraint = listing.seller == seller.key() @ CouponError::NotListingSeller
    )]
    pub listing: Account<'info, Listing>,
    pub seller: Signer<'info>,
}
