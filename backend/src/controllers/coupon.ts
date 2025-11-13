import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Coupon } from '../models/coupon';
import { Promotion } from '../models/promotion';
import { Merchant } from '../models/merchant';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class CouponController {
  /**
   * GET /api/v1/coupons
   * List all coupons with filters
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, category } = req.query;

      const filter: any = {};

      if (status === 'active') {
        filter.isRedeemed = false;
        filter.expiryTimestamp = { $gt: new Date() };
      } else if (status === 'redeemed') {
        filter.isRedeemed = true;
      } else if (status === 'expired') {
        filter.expiryTimestamp = { $lte: new Date() };
      }

      if (category) {
        // Need to join with promotions to filter by category
        const promotions = await Promotion.find({ category });
        const promotionAddresses = promotions.map(p => p.onChainAddress);
        filter.promotion = { $in: promotionAddresses };
      }

      const [coupons, total] = await Promise.all([
        Coupon.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Coupon.countDocuments(filter),
      ]);

      // Populate promotion details
      const promotionIds = [...new Set(coupons.map((c) => c.promotion))];
      const promotions = await Promotion.find({ onChainAddress: { $in: promotionIds } });
      const promotionMap = new Map(promotions.map((p) => [p.onChainAddress, p]));

      res.json({
        success: true,
        data: {
          coupons: coupons.map((c) => {
            const promotion = promotionMap.get(c.promotion);
            return {
              id: c._id,
              onChainAddress: c.onChainAddress,
              nftMint: c.nftMint,
              couponId: c.couponId,
              owner: c.owner,
              promotion: promotion ? {
                id: promotion._id,
                title: promotion.title,
                description: promotion.description,
                category: promotion.category,
              } : null,
              discountPercentage: c.discountPercentage,
              expiryTimestamp: c.expiryTimestamp,
              isRedeemed: c.isRedeemed,
              redeemedAt: c.redeemedAt,
              isListed: c.isListed,
              listingPrice: c.listingPrice,
              createdAt: c.createdAt,
            };
          }),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Failed to list coupons:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/coupons/mint
   * Mint a new coupon
   */
  async mint(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId, walletAddress, recipientAddress } = req.body;
      const finalRecipientAddress = recipientAddress || walletAddress;

      if (!promotionId || !finalRecipientAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: promotionId, and either walletAddress or recipientAddress',
        });
        return;
      }

      const promotion = await Promotion.findOne({
        $or: [{ _id: promotionId }, { onChainAddress: promotionId }],
      });

      if (!promotion) {
        res.status(404).json({
          success: false,
          error: 'Promotion not found',
        });
        return;
      }

      if (promotion.currentSupply >= promotion.maxSupply) {
        res.status(400).json({
          success: false,
          error: 'Promotion supply exhausted',
        });
        return;
      }

      const merchant = await Merchant.findOne({ onChainAddress: promotion.merchant });
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
        return;
      }

      // Validate on-chain addresses before creating PublicKey
      if (!promotion.onChainAddress || !merchant.authority) {
        res.status(400).json({
          success: false,
          error: 'Invalid promotion or merchant on-chain configuration',
        });
        return;
      }

      const promotionPDA = new PublicKey(promotion.onChainAddress);
      const recipientPubkey = new PublicKey(finalRecipientAddress);
      const merchantAuthority = new PublicKey(merchant.authority);
      const couponId = promotion.currentSupply + 1;

      // Restore merchant keypair for signing
      const { walletService } = await import('../services/wallet.service');
      const merchantKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: merchant.encryptedPrivateKey,
        iv: merchant.iv,
        authTag: merchant.authTag,
      });

      // BLOCKCHAIN-FIRST: Mint on-chain FIRST
      let result;
      try {
        result = await solanaService.mintCoupon(
          promotionPDA,
          recipientPubkey,
          merchantAuthority,
          couponId,
          merchantKeypair
        );
        logger.info(`✅ Coupon minted on-chain: ${result.coupon}`);
      } catch (blockchainError) {
        logger.error('Blockchain minting failed:', blockchainError);
        res.status(500).json({
          success: false,
          error: 'Blockchain transaction failed. Please try again.',
          details: blockchainError instanceof Error ? blockchainError.message : 'Unknown error',
        });
        return;
      }

      // Save to database AFTER blockchain success
      const coupon = await Coupon.create({
        onChainAddress: result.coupon,
        couponId,
        nftMint: result.mint,
        promotion: promotion.onChainAddress,
        owner: finalRecipientAddress,
        merchant: promotion.merchant,
        discountPercentage: promotion.discountPercentage,
        expiryTimestamp: promotion.expiryTimestamp,
        isRedeemed: false,
        isListed: false,
        transferHistory: [],
        transactionSignature: result.signature,
      });

      // Update promotion
      await Promotion.updateOne(
        { _id: promotion._id },
        {
          $inc: { currentSupply: 1, 'stats.totalMinted': 1 },
        }
      );

      res.status(201).json({
        success: true,
        data: {
          coupon: {
            id: coupon._id,
            onChainAddress: coupon.onChainAddress,
            nftMint: coupon.nftMint,
            couponId: coupon.couponId,
            owner: coupon.owner,
            discountPercentage: coupon.discountPercentage,
            expiryTimestamp: coupon.expiryTimestamp,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error: any) {
      // Check if headers were already sent before trying to send response
      if (!res.headersSent) {
        logger.error('Coupon minting failed:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        logger.error('Error occurred after headers sent:', error);
      }
    }
  }

  /**
   * GET /api/v1/coupons/my-coupons?page=1&limit=20
   * Get user's coupons
   */
  async getMyCoupons(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.query.walletAddress || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing walletAddress',
        });
        return;
      }

      const { page, limit, skip } = getPaginationParams(req.query);

      const filter = { owner: walletAddress };

      const [coupons, total] = await Promise.all([
        Coupon.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Coupon.countDocuments(filter),
      ]);

      // Populate promotion details
      const promotionIds = [...new Set(coupons.map((c) => c.promotion))];
      const promotions = await Promotion.find({ onChainAddress: { $in: promotionIds } });
      const promotionMap = new Map(promotions.map((p) => [p.onChainAddress, p]));

      res.json({
        success: true,
        data: {
          coupons: coupons.map((c) => {
            const promotion = promotionMap.get(c.promotion);
            return {
              id: c._id,
              onChainAddress: c.onChainAddress,
              nftMint: c.nftMint,
              couponId: c.couponId,
              promotion: promotion ? {
                id: promotion._id,
                title: promotion.title,
                description: promotion.description,
                category: promotion.category,
              } : null,
              discountPercentage: c.discountPercentage,
              expiryTimestamp: c.expiryTimestamp,
              isRedeemed: c.isRedeemed,
              redeemedAt: c.redeemedAt,
              isListed: c.isListed,
              listingPrice: c.listingPrice,
              createdAt: c.createdAt,
            };
          }),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Failed to get user coupons:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/coupons/:couponId
   * Get coupon details
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findOne({
        $or: [{ _id: couponId }, { onChainAddress: couponId }, { nftMint: couponId }],
      });

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
      }

      const [promotion, merchant] = await Promise.all([
        Promotion.findOne({ onChainAddress: coupon.promotion }),
        Merchant.findOne({ onChainAddress: coupon.merchant }),
      ]);

      res.json({
        success: true,
        data: {
          id: coupon._id,
          onChainAddress: coupon.onChainAddress,
          nftMint: coupon.nftMint,
          couponId: coupon.couponId,
          owner: coupon.owner,
          promotion: promotion ? {
            id: promotion._id,
            onChainAddress: promotion.onChainAddress,
            title: promotion.title,
            description: promotion.description,
            category: promotion.category,
          } : null,
          merchant: merchant ? {
            id: merchant._id,
            name: merchant.name,
            category: merchant.category,
            location: merchant.location,
          } : null,
          discountPercentage: coupon.discountPercentage,
          expiryTimestamp: coupon.expiryTimestamp,
          isRedeemed: coupon.isRedeemed,
          redeemedAt: coupon.redeemedAt,
          redemptionCode: coupon.redemptionCode,
          isListed: coupon.isListed,
          listingPrice: coupon.listingPrice,
          transferHistory: coupon.transferHistory,
          createdAt: coupon.createdAt,
        },
      });
    } catch (error) {
      logger.error('Failed to get coupon details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/coupons/transfer
   * Transfer coupon to another user
   */
  async transfer(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, recipientAddress } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !recipientAddress || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, recipientAddress, walletAddress',
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
          error: 'Cannot transfer redeemed coupon',
        });
      }

      // Update database
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $set: { owner: recipientAddress },
          $push: {
            transferHistory: {
              from: walletAddress,
              to: recipientAddress,
              timestamp: new Date(),
              transactionSignature: 'pending',
            },
          },
        }
      );

      res.json({
        success: true,
        data: {
          coupon: {
            id: coupon._id,
            onChainAddress: coupon.onChainAddress,
            newOwner: recipientAddress,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to transfer coupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const couponController = new CouponController();

// Export individual controller methods for testing
export const mintCoupon = couponController.mint.bind(couponController);
export const transferCoupon = couponController.transfer.bind(couponController);
export const getCoupon = couponController.getDetails.bind(couponController);
export const getUserCoupons = couponController.getMyCoupons.bind(couponController);
