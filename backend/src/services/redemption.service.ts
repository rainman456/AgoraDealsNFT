import { PublicKey } from '@solana/web3.js';
import { solanaService } from './solana.service';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

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
  ): Promise<string> {
    try {
      const qrData: RedemptionQRData = {
        coupon: couponAddress,
        user: userPublicKey,
        merchant: merchantPublicKey,
        timestamp: Date.now(),
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      });

      logger.info(`Generated QR code for coupon: ${couponAddress}`);
      return qrCodeDataUrl;
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
  }> {
    try {
      const couponPDA = new PublicKey(couponAddress);
      const coupon = await solanaService.getCoupon(couponPDA);

      // Check if already redeemed
      if (coupon.isRedeemed) {
        return {
          valid: false,
          reason: 'Coupon has already been redeemed',
        };
      }

      // Check if expired
      const now = Math.floor(Date.now() / 1000);
      if (coupon.expiryTimestamp.toNumber() < now) {
        return {
          valid: false,
          reason: 'Coupon has expired',
        };
      }

      return {
        valid: true,
        coupon: coupon,
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

      // Verify merchant matches
      const coupon = verification.coupon;
      if (coupon.merchant.toString() !== request.merchantPublicKey) {
        return {
          success: false,
          error: 'Merchant mismatch',
        };
      }

      // Verify owner matches
      if (coupon.owner.toString() !== request.userPublicKey) {
        return {
          success: false,
          error: 'User is not the coupon owner',
        };
      }

      // Execute redemption on blockchain
      const result = await solanaService.redeemCoupon(
        new PublicKey(request.couponAddress),
        new PublicKey(request.userPublicKey),
        new PublicKey(request.merchantPublicKey)
      );

      logger.info(`Coupon redeemed successfully: ${request.couponAddress}`);
      return {
        success: true,
        signature: result.signature,
      };
    } catch (error) {
      logger.error('Failed to redeem coupon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
        return null;
      }

      // Validate timestamp (not older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (qrData.timestamp < fiveMinutesAgo) {
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
