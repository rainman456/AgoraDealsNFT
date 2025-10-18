#[account]
#[derive(InitSpace)]
pub struct ExternalDeal {
    pub oracle_authority: Pubkey,
    pub source: DealSource,
    #[max_len(100)]
    pub external_id: String,        // API reference ID
    #[max_len(200)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub original_price: u64,
    pub discounted_price: u64,
    pub discount_percentage: u8,
    #[max_len(50)]
    pub category: String,
    #[max_len(200)]
    pub image_url: String,
    #[max_len(200)]
    pub affiliate_url: String,
    pub expiry_timestamp: i64,
    pub last_updated: i64,
    pub is_verified: bool,
    pub verification_count: u32,    // Number of oracle updates
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DealSource {
    Skyscanner,
    BookingCom,
    Shopify,
    Amazon,
    Custom,
}

#[account]
#[derive(InitSpace)]
pub struct OracleConfig {
    pub authority: Pubkey,
    pub total_deals_imported: u64,
    pub allowed_sources: Vec<DealSource>, // Max 10
    pub min_verification_count: u32,
    pub update_interval: i64,           // Seconds between updates
}
