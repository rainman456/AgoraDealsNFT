// src/state/promotion.rs
use anchor_lang::prelude::*;
use super::Location;

#[account]
#[derive(InitSpace)]
pub struct Promotion {
    pub merchant: Pubkey,
    pub discount_percentage: u8,
    pub max_supply: u32,
    pub current_supply: u32,
    pub expiry_timestamp: i64,
    #[max_len(30)]
    pub category: String,
    #[max_len(200)]
    pub description: String,
    pub price: u64,
    pub is_active: bool,
    pub created_at: i64,

    // Geographic data
    pub location: Location,
    pub geo_cell_id: u64,
    pub radius_meters: u32,
    pub is_location_based: bool,
}