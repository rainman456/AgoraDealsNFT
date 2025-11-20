import { PublicKey } from '@solana/web3.js';
import { solanaService } from './solana.service';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';
import { blockchainSync } from './blockchain-sync.service';

export interface RedemptionRequest {
  couponAddress: string;
  userPublicKey: string;
  merchantPublicKey: string;
}

export interface RedemptionQRData {
  coupon: string;
  user: string;
  merchant: string;
  timestamp: number;
  signature?: string;
}

export class RedemptionService {
  /**
   * Generate QR code for coupon redemption
   */
  async generateRedemptionQR(
  couponAddress: string,
  userPublicKey: string,
  merchantPublicKey: string
): Promise<{ qrCode: string; ticketData: RedemptionQRData }> {
  try {
    // Generate nonce for ticket
    const nonce = Date.now();
    
    // Create hash for verification
    const dataToHash = `${couponAddress}${userPublicKey}${merchantPublicKey}${nonce}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const qrData: RedemptionQRData = {
      coupon: couponAddress,
      user: userPublicKey,
      merchant: merchantPublicKey,
      timestamp: nonce,
      signature: hash,
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    logger.info(`Generated QR code for coupon: ${couponAddress}`);
    
    return {
      qrCode: qrCodeDataUrl,
      ticketData: qrData,
    };
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    throw error;
  }
}


  /**
   * Verify coupon is valid for redemption
   */
  async verifyCouponForRedemption(couponAddress: string): Promise<{
  valid: boolean;
  reason?: string;
  coupon?: any;
  promotionData?: any;
}> {
  try {
    const couponPDA = new PublicKey(couponAddress);
    
    // Fetch coupon with error handling
    let coupon: any;
    try {
      coupon = await solanaService.getCoupon(couponPDA);
    } catch (error: any) {
      if (error.message?.includes('Account does not exist')) {
        return {
          valid: false,
          reason: 'Coupon does not exist',
        };
      }
      throw error;
    }

    // Check if already redeemed
    if (coupon.isRedeemed) {
      return {
        valid: false,
        reason: 'Coupon has already been redeemed',
        coupon,
      };
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (coupon.expiryTimestamp.toNumber() < now) {
      return {
        valid: false,
        reason: 'Coupon has expired',
        coupon,
      };
    }

    // Fetch promotion data for additional context
    let promotionData: any;
    try {
      promotionData = await solanaService.getPromotion(coupon.promotion);
      
      // Check if promotion is still active
      if (!promotionData.isActive) {
        return {
          valid: false,
          reason: 'Promotion is no longer active',
          coupon,
          promotionData,
        };
      }
    } catch (error) {
      logger.warn('Could not fetch promotion data:', error);
    }

    return {
      valid: true,
      coupon,
      promotionData,
    };
  } catch (error) {
    logger.error('Failed to verify coupon:', error);
    return {
      valid: false,
      reason: 'Failed to fetch coupon data',
    };
  }
}

  /**
   * Process coupon redemption
   */
  async redeemCoupon(request: RedemptionRequest): Promise<{
  success: boolean;
  signature?: string;
  redemptionCode?: string;
  error?: string;
}> {
  try {
    // Verify coupon first
    const verification = await this.verifyCouponForRedemption(request.couponAddress);
    if (!verification.valid) {
      return {
        success: false,
        error: verification.reason,
      };
    }

    const coupon = verification.coupon;

    // Verify merchant matches
    if (coupon.merchant.toString() !== request.merchantPublicKey) {
      return {
        success: false,
        error: 'Merchant mismatch - coupon belongs to different merchant',
      };
    }

    // Verify owner matches
    if (coupon.owner.toString() !== request.userPublicKey) {
      return {
        success: false,
        error: 'User is not the coupon owner',
      };
    }

    logger.info('Executing redemption on blockchain...', {
      coupon: request.couponAddress,
      user: request.userPublicKey,
      merchant: request.merchantPublicKey,
    });

    // Execute redemption on blockchain
    const result = await solanaService.redeemCoupon(
      new PublicKey(request.couponAddress),
      new PublicKey(request.userPublicKey),
      new PublicKey(request.merchantPublicKey)
    );

    // Generate redemption code
    const redemptionCode = `RDM-${Date.now()}-${result.signature.slice(0, 8).toUpperCase()}`;

    // Wait for confirmation
    const confirmed = await blockchainSync.waitForFinality(result.signature, 30);
    
    if (!confirmed) {
      logger.warn('Redemption transaction not finalized within timeout');
      // Still return success as it's confirmed, just not finalized
    }

    logger.info(`✅ Coupon redeemed successfully: ${request.couponAddress}`);
    
    return {
      success: true,
      signature: result.signature,
      redemptionCode,
    };
  } catch (error: any) {
    logger.error('Failed to redeem coupon:', error);
    
    // Parse program errors for better user feedback
    let errorMessage = error.message || 'Unknown error';
    
    if (error.logs) {
      const programError = error.logs.find((log: string) => 
        log.includes('Error') || log.includes('failed')
      );
      if (programError) {
        errorMessage = programError;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

  /**
   * Get redemption history for a merchant
   */
  async getMerchantRedemptions(merchantPublicKey: string) {
    try {
      const merchantPDA = new PublicKey(merchantPublicKey);
      const merchant = await solanaService.getMerchant(merchantPDA);

      return {
        totalRedeemed: merchant.totalCouponsRedeemed.toString(),
        totalCreated: merchant.totalCouponsCreated.toString(),
        redemptionRate: merchant.totalCouponsCreated.toNumber() > 0
          ? (Number(merchant.totalCouponsRedeemed) / Number(merchant.totalCouponsCreated) * 100).toFixed(2)
          : '0',
      };
    } catch (error) {
      logger.error('Failed to get merchant redemptions:', error);
      throw error;
    }
  }

  /**
   * Validate QR code data
   */
  validateQRData(qrDataString: string): RedemptionQRData | null {
  try {
    const qrData: RedemptionQRData = JSON.parse(qrDataString);

    // Validate required fields
    if (!qrData.coupon || !qrData.user || !qrData.merchant || !qrData.timestamp) {
      logger.warn('QR data missing required fields');
      return null;
    }

    // Validate timestamp (not older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (qrData.timestamp < fiveMinutesAgo) {
      logger.warn('QR code expired (older than 5 minutes)');
      return null;
    }

    // Validate signature if present
    if (qrData.signature) {
      const dataToHash = `${qrData.coupon}${qrData.user}${qrData.merchant}${qrData.timestamp}`;
      const expectedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      
      if (qrData.signature !== expectedHash) {
        logger.warn('QR code signature validation failed');
        return null;
      }
    }

    // Validate public key formats
    try {
      new PublicKey(qrData.coupon);
      new PublicKey(qrData.user);
      new PublicKey(qrData.merchant);
    } catch (error) {
      logger.warn('Invalid public key format in QR data');
      return null;
    }

    return qrData;
  } catch (error) {
    logger.error('Invalid QR data:', error);
    return null;
  }
}
}

export const redemptionService = new RedemptionService();
