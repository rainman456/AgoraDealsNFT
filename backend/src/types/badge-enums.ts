/**
 * Badge type enum helpers for Anchor program
 */

export type BadgeTypeEnum = 
  | { firstPurchase: Record<string, never> }
  | { tenRedemptions: Record<string, never> }
  | { fiftyRedemptions: Record<string, never> }
  | { topReviewer: Record<string, never> }
  | { earlyAdopter: Record<string, never> }
  | { merchantPartner: Record<string, never> }
  | { communityModerator: Record<string, never> };

export type ReputationTierEnum =
  | { bronze: Record<string, never> }
  | { silver: Record<string, never> }
  | { gold: Record<string, never> }
  | { platinum: Record<string, never> }
  | { diamond: Record<string, never> };

export type AuctionTypeEnum =
  | { english: Record<string, never> }
  | { dutch: Record<string, never> }
  | { sealedBid: Record<string, never> };

export const BADGE_NAMES: Record<string, string> = {
  firstPurchase: 'First Purchase',
  tenRedemptions: '10 Redemptions',
  fiftyRedemptions: '50 Redemptions',
  topReviewer: 'Top Reviewer',
  earlyAdopter: 'Early Adopter',
  merchantPartner: 'Merchant Partner',
  communityModerator: 'Community Moderator',
};

export const BADGE_DESCRIPTIONS: Record<string, string> = {
  firstPurchase: 'Made your first purchase',
  tenRedemptions: 'Redeemed 10 coupons',
  fiftyRedemptions: 'Redeemed 50 coupons',
  topReviewer: 'Top reviewer in the community',
  earlyAdopter: 'Early platform adopter',
  merchantPartner: 'Verified merchant partner',
  communityModerator: 'Community moderator',
};

export const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

export enum ReputationTier {
  Bronze = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
  Diamond = 4,
}
