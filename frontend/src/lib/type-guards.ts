import { Merchant, User, Promotion } from './api';

/**
 * Type guard to check if a value is a Merchant object
 */
export function isMerchant(value: string | Merchant | undefined): value is Merchant {
  return typeof value === 'object' && value !== null && 'email' in value;
}

/**
 * Type guard to check if a value is a User object
 */
export function isUser(value: string | User | undefined): value is User {
  return typeof value === 'object' && value !== null && 'walletAddress' in value;
}

/**
 * Type guard to check if a value is a Promotion object
 */
export function isPromotion(value: string | Promotion | undefined): value is Promotion {
  return typeof value === 'object' && value !== null && 'onChainAddress' in value;
}

/**
 * Get merchant name safely
 */
export function getMerchantName(merchant: string | Merchant | undefined): string {
  if (!merchant) return 'Merchant';
  return isMerchant(merchant) ? merchant.name : 'Merchant';
}

/**
 * Get merchant logo safely
 */
export function getMerchantLogo(merchant: string | Merchant | undefined): string {
  if (!merchant) return '/placeholder-merchant.png';
  return isMerchant(merchant) ? (merchant.logo || '/placeholder-merchant.png') : '/placeholder-merchant.png';
}

/**
 * Get user name safely
 */
export function getUserName(user: string | User | undefined): string {
  if (!user) return 'User';
  return isUser(user) ? (user.name || user.username || 'User') : 'User';
}

/**
 * Get user address safely
 */
export function getUserAddress(user: string | User | undefined): string {
  if (!user) return '';
  return isUser(user) ? (user.address || user.walletAddress || '') : '';
}
