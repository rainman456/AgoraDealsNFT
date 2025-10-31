import { Request, Response } from 'express';
import { NFTMetadata } from '../models/nft-metadata';
import { Coupon } from '../models/coupon';
import { logger } from '../utils/logger';

export class SocialController {
  /**
   * POST /api/v1/social/share
   * Track coupon/promotion share
   */
  async trackShare(req: Request, res: Response): Promise<void> {
    try {
      const { itemId, itemType, platform } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!itemId || !itemType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: itemId, itemType',
        });
      }

      // Update share count in metadata
      if (itemType === 'coupon') {
        const coupon = await Coupon.findOne({
          $or: [{ _id: itemId }, { onChainAddress: itemId }],
        });

        if (coupon) {
          await NFTMetadata.updateOne(
            { 'onChain.mint': coupon.nftMint },
            { $inc: { 'social.totalShares': 1 } }
          );
        }
      }

      res.json({
        success: true,
        data: {
          itemId,
          itemType,
          platform,
          sharedBy: walletAddress,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to track share:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/social/view
   * Track coupon/promotion view
   */
  async trackView(req: Request, res: Response): Promise<void> {
    try {
      const { itemId, itemType } = req.body;

      if (!itemId || !itemType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: itemId, itemType',
        });
      }

      // Update view count in metadata
      if (itemType === 'coupon') {
        const coupon = await Coupon.findOne({
          $or: [{ _id: itemId }, { onChainAddress: itemId }],
        });

        if (coupon) {
          await NFTMetadata.updateOne(
            { 'onChain.mint': coupon.nftMint },
            { $inc: { 'social.totalViews': 1 } }
          );
        }
      }

      res.json({
        success: true,
        data: {
          itemId,
          itemType,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to track view:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/social/trending
   * Get trending coupons/promotions
   */
  async getTrending(req: Request, res: Response): Promise<void> {
    try {
      const { category, timeframe = '7d' } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      // Calculate date threshold based on timeframe
      const now = new Date();
      const threshold = new Date();
      switch (timeframe) {
        case '24h':
          threshold.setHours(now.getHours() - 24);
          break;
        case '7d':
          threshold.setDate(now.getDate() - 7);
          break;
        case '30d':
          threshold.setDate(now.getDate() - 30);
          break;
        default:
          threshold.setDate(now.getDate() - 7);
      }

      const filter: any = {
        createdAt: { $gte: threshold },
      };

      if (category) {
        filter['couponData.category'] = category;
      }

      // Get trending based on engagement score
      const trending = await NFTMetadata.find(filter)
        .sort({
          'social.totalViews': -1,
          'social.totalShares': -1,
          'social.averageRating': -1,
        })
        .limit(limit);

      res.json({
        success: true,
        data: trending,
      });
    } catch (error) {
      logger.error('Failed to get trending items:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/social/popular
   * Get popular coupons by category
   */
  async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      const filter: any = {};
      if (category) {
        filter['couponData.category'] = category;
      }

      const popular = await NFTMetadata.find(filter)
        .sort({
          'social.totalRedemptions': -1,
          'social.averageRating': -1,
        })
        .limit(limit);

      res.json({
        success: true,
        data: popular,
      });
    } catch (error) {
      logger.error('Failed to get popular items:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/social/rate
   * Rate a coupon or promotion
   */
  async rateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, rating, review } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || rating === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, rating',
        });
      }

      if (rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5',
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

      // Update metadata with new rating
      const metadata = await NFTMetadata.findOne({ 'onChain.mint': coupon.nftMint });
      
      if (metadata) {
        const currentTotal = metadata.social?.averageRating || 0;
        const currentCount = metadata.social?.totalRatings || 0;
        const newCount = currentCount + 1;
        const newAverage = ((currentTotal * currentCount) + rating) / newCount;

        await NFTMetadata.updateOne(
          { 'onChain.mint': coupon.nftMint },
          {
            $set: {
              'social.averageRating': newAverage,
              'social.totalRatings': newCount,
            },
          }
        );
      }

      res.json({
        success: true,
        data: {
          couponId,
          rating,
          review,
          ratedBy: walletAddress,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to rate coupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/social/feed
   * Get personalized social feed
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      const filter: any = {};
      if (category) {
        filter['couponData.category'] = category;
      }

      // Get recent and trending items
      const feed = await NFTMetadata.find(filter)
        .sort({
          createdAt: -1,
          'social.totalViews': -1,
          'social.averageRating': -1,
        })
        .limit(limit);

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      logger.error('Failed to get feed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const socialController = new SocialController();
