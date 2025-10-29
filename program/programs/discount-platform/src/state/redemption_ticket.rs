use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RedemptionTicket {
    pub coupon: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub ticket_hash: [u8; 32],        // Hash for QR code verification
    pub created_at: i64,
    pub expires_at: i64,               // 5 minute expiry window
    pub is_consumed: bool,
    pub nonce: u64,                    // Prevents replay attacks
    pub redemption_location: Option<RedemptionLocation>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct RedemptionLocation {
    pub latitude: i32,
    pub longitude: i32,
    pub timestamp: i64,
}

impl RedemptionTicket {
    pub fn is_valid(&self, current_time: i64) -> bool {
        !self.is_consumed && current_time < self.expires_at
    }

    pub fn generate_hash(
        coupon_key: &Pubkey,
        user_key: &Pubkey,
        nonce: u64,
    ) -> [u8; 32] {
        let data = [
            coupon_key.as_ref(),
            user_key.as_ref(),
            &nonce.to_le_bytes(),
        ].concat();
        
        anchor_lang::solana_program::hash::hash(&data).to_bytes()
    }
}