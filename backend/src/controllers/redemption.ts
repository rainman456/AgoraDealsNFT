import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Coupon } from '../models/coupon';
import { Promotion } from '../models/promotion';
import { Merchant } from '../models/merchant';
import { logger } from '../utils/logger';
import { generateQRCode } from '../utils/qr-generator';
import crypto from 'crypto';

export class RedemptionController {
  /**
   * POST /api/v1/redemption/generate-qr
   * Generate QR code for redemption
   */
  async generateQR(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, merchantId } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !merchantId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, merchantId, walletAddress',
        });
      }

      const coupon = await Coupon.findOne({
        $or: [{ _id: couponId }, { onChainAddress: couponId }],
      });

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
      }

      if (coupon.owner !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not coupon owner',
        });
      }

      if (coupon.isRedeemed) {
        res.status(400).json({
          success: false,
          error: 'Coupon already redeemed',
        });
      }

      const qrData = {
        couponId: coupon.onChainAddress,
        merchantId,
        userId: walletAddress,
        timestamp: Date.now(),
      };

      const qrCode = await generateQRCode(JSON.stringify(qrData));

      res.json({
        success: true,
        data: {
          qrCode,
        },
      });
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/redemption/redeem
   * Redeem a coupon
   */
  async redeem(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, merchantId, qrData } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !merchantId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, merchantId, walletAddress',
        });
      }

      // Validate QR data if provided
      if (qrData) {
        try {
          const parsed = JSON.parse(qrData);
          if (parsed.couponId !== couponId || parsed.merchantId !== merchantId) {
            res.status(400).json({
              success: false,
              error: 'Invalid QR data',
            });
          }
        } catch {
          res.status(400).json({
            success: false,
            error: 'Invalid QR data format',
          });
        }
      }

      const [coupon, merchant] = await Promise.all([
        Coupon.findOne({
          $or: [{ _id: couponId }, { onChainAddress: couponId }],
        }),
        Merchant.findOne({
          $or: [{ _id: merchantId }, { onChainAddress: merchantId }, { walletAddress: walletAddress }],
        }),
      ]);

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
      }

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      if (coupon.merchant !== merchant.onChainAddress) {
        res.status(403).json({
          success: false,
          error: 'Coupon does not belong to this merchant',
        });
      }

      if (coupon.isRedeemed) {
        res.status(400).json({
          success: false,
          error: 'Coupon already redeemed',
        });
      }

      if (new Date(coupon.expiryTimestamp) < new Date()) {
        res.status(400).json({
          success: false,
          error: 'Coupon expired',
        });
      }

      const couponPDA = new PublicKey(coupon.onChainAddress);
      const userPubkey = new PublicKey(coupon.owner);
      const merchantAuthority = new PublicKey(merchant.authority);

      // Restore merchant keypair for signing
      const { walletService } = await import('../services/wallet.service');
      const merchantKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: merchant.encryptedPrivateKey,
        iv: merchant.iv,
        authTag: merchant.authTag,
      });

      // Redeem on-chain
      const result = await solanaService.redeemCoupon(couponPDA, userPubkey, merchantAuthority, merchantKeypair);

      // Generate redemption code
      const redemptionCode = `REDEEMED-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Update database
      await Promise.all([
        Coupon.updateOne(
          { _id: coupon._id },
          {
            $set: {
              isRedeemed: true,
              redeemedAt: new Date(),
              redemptionCode,
            },
          }
        ),
        Promotion.updateOne(
          { onChainAddress: coupon.promotion },
          { $inc: { 'stats.totalRedeemed': 1 } }
        ),
        Merchant.updateOne(
          { _id: merchant._id },
          { $inc: { totalCouponsRedeemed: 1 } }
        ),
      ]);

      res.json({
        success: true,
        data: {
          success: true,
          transactionSignature: result.signature,
          redemptionCode,
        },
      });
    } catch (error) {
      logger.error('Failed to redeem coupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/redemption/:couponId/status
   * Check redemption status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findOne({
        $or: [{ _id: couponId }, { onChainAddress: couponId }],
      });

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
      }

      res.json({
        success: true,
        data: {
          isRedeemed: coupon.isRedeemed,
          redeemedAt: coupon.redeemedAt || null,
          redemptionCode: coupon.redemptionCode || null,
        },
      });
    } catch (error) {
      logger.error('Failed to get redemption status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const redemptionController = new RedemptionController();
