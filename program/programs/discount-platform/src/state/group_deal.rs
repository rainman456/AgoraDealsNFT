use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GroupDeal {
    pub promotion: Pubkey,
    pub merchant: Pubkey,
    pub organizer: Pubkey,              // Who created the group deal
    pub target_participants: u32,       // Minimum to activate
    pub current_participants: u32,
    pub max_participants: u32,          // Maximum allowed
    pub base_price: u64,                // Price per person at target
    pub discount_tiers: [DiscountTier; 5], // Tiered discounts
    pub deadline: i64,                  // Must reach target by this time
    pub is_active: bool,
    pub is_finalized: bool,
    pub escrow_vault: Pubkey,           // PDA holding escrowed funds
    pub created_at: i64,
    pub finalized_at: i64,
    pub total_escrowed: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct DiscountTier {
    pub min_participants: u32,
    pub discount_percentage: u8,        // Additional discount at this tier
}

impl Default for DiscountTier {
    fn default() -> Self {
        Self {
            min_participants: 0,
            discount_percentage: 0,
        }
    }
}

#[account]
#[derive(InitSpace)]
pub struct GroupParticipant {
    pub group_deal: Pubkey,
    pub user: Pubkey,
    pub amount_escrowed: u64,
    pub joined_at: i64,
    pub is_refunded: bool,
    pub coupon_minted: Option<Pubkey>,  // Set after successful finalization
}

impl GroupDeal {
    pub fn get_current_discount(&self) -> u8 {
        let mut discount = 0u8;
        
        for tier in self.discount_tiers.iter() {
            if self.current_participants >= tier.min_participants 
                && tier.discount_percentage > discount {
                discount = tier.discount_percentage;
            }
        }
        
        discount
    }
    
    pub fn get_current_price(&self) -> u64 {
        let discount = self.get_current_discount();
        let discount_amount = (self.base_price * discount as u64) / 100;
        self.base_price.saturating_sub(discount_amount)
    }
    
    pub fn is_target_reached(&self) -> bool {
        self.current_participants >= self.target_participants
    }
    
    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.deadline
    }
    
    pub fn can_finalize(&self, current_time: i64) -> bool {
        self.is_active 
            && !self.is_finalized 
            && (self.is_target_reached() || self.is_expired(current_time))
    }
}