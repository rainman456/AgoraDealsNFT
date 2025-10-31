import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Coupon } from '../models/coupon';
import { Promotion } from '../models/promotion';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class MarketplaceController {
  /**
   * POST /api/v1/marketplace/list
   * List coupon for sale
   */
  async listCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, price } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || price === undefined || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, price, walletAddress',
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
          error: 'Cannot list redeemed coupon',
        });
      }

      if (coupon.isListed) {
        res.status(400).json({
          success: false,
          error: 'Coupon already listed',
        });
      }

      const couponPDA = new PublicKey(coupon.onChainAddress);
      const sellerPubkey = new PublicKey(walletAddress);

      // List on-chain
      const result = await solanaService.listCouponForSale(couponPDA, sellerPubkey, price);

      // Update database
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $set: {
            isListed: true,
            listingPrice: price,
          },
        }
      );

      res.json({
        success: true,
        data: {
          listingAddress: result.listing,
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to list coupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/marketplace/listings?page=1&limit=20
   * Get all marketplace listings
   */
  async getListings(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);

      const filter = { isListed: true, isRedeemed: false };

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
          listings: coupons.map((c) => {
            const promotion = promotionMap.get(c.promotion);
            return {
              id: c._id,
              onChainAddress: c.onChainAddress,
              nftMint: c.nftMint,
              couponId: c.couponId,
              seller: c.owner,
              listingPrice: c.listingPrice,
              promotion: promotion ? {
                id: promotion._id,
                title: promotion.title,
                description: promotion.description,
                category: promotion.category,
                discountPercentage: promotion.discountPercentage,
              } : null,
              expiryTimestamp: c.expiryTimestamp,
              createdAt: c.createdAt,
            };
          }),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Failed to get listings:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/marketplace/buy
   * Buy a listed coupon
   */
  async buyCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { listingId } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!listingId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: listingId, walletAddress',
        });
      }

      // In a real implementation, you would fetch the listing from on-chain
      // For now, we'll use the coupon as a proxy
      const coupon = await Coupon.findOne({
        $or: [{ _id: listingId }, { onChainAddress: listingId }],
      });

      if (!coupon || !coupon.isListed) {
        res.status(404).json({
          success: false,
          error: 'Listing not found',
        });
      }

      const listingPDA = new PublicKey(listingId);
      const buyerPubkey = new PublicKey(walletAddress);

      // Buy on-chain
      const result = await solanaService.buyCouponListing(listingPDA, buyerPubkey);

      // Update database
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $set: {
            owner: walletAddress,
            isListed: false,
            listingPrice: undefined,
          },
          $push: {
            transferHistory: {
              from: coupon.owner,
              to: walletAddress,
              timestamp: new Date(),
              transactionSignature: result.signature,
            },
          },
        }
      );

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to buy coupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/marketplace/cancel
   * Cancel a listing
   */
  async cancelListing(req: Request, res: Response): Promise<void> {
    try {
      const { listingId } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!listingId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: listingId, walletAddress',
        });
      }

      const coupon = await Coupon.findOne({
        $or: [{ _id: listingId }, { onChainAddress: listingId }],
      });

      if (!coupon || !coupon.isListed) {
        res.status(404).json({
          success: false,
          error: 'Listing not found',
        });
      }

      if (coupon.owner !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not listing owner',
        });
      }

      // Update database
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $set: {
            isListed: false,
            listingPrice: undefined,
          },
        }
      );

      res.json({
        success: true,
        message: 'Listing cancelled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel listing:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const marketplaceController = new MarketplaceController();
