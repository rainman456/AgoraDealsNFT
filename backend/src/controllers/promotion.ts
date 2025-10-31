import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Promotion } from '../models/promotion';
import { Merchant } from '../models/merchant';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { filterByDistance } from '../utils/distance';

export class PromotionController {
  /**
   * POST /api/v1/promotions
   * Create a new promotion
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category,
        discountPercentage,
        maxSupply,
        price,
        expiryTimestamp,
      } = req.body;

      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress || !title || !description || !category || !discountPercentage || !maxSupply || !price || !expiryTimestamp) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Get merchant
      const merchant = await Merchant.findOne({ walletAddress });
      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Merchant not registered',
        });
      }

      const merchantAuthority = new PublicKey(walletAddress);
      const promotionId = merchant.totalCouponsCreated;

      // Restore merchant keypair for signing
      const { walletService } = await import('../services/wallet.service');
      const merchantKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: merchant.encryptedPrivateKey,
        iv: merchant.iv,
        authTag: merchant.authTag,
      });

      // Create on-chain
      const result = await solanaService.createPromotion(
        merchantAuthority,
        promotionId,
        discountPercentage,
        maxSupply,
        Math.floor(new Date(expiryTimestamp).getTime() / 1000),
        category,
        description,
        price,
        merchantKeypair
      );

      // Save to database
      const promotion = await Promotion.create({
        onChainAddress: result.promotion,
        merchant: merchant.onChainAddress,
        title,
        description,
        category,
        discountPercentage,
        maxSupply,
        currentSupply: 0,
        price,
        expiryTimestamp: new Date(expiryTimestamp),
        isActive: true,
        stats: {
          totalMinted: 0,
          totalRedeemed: 0,
          averageRating: 0,
          totalRatings: 0,
          totalComments: 0,
        },
      });

      // Update merchant
      await Merchant.updateOne(
        { _id: merchant._id },
        { $inc: { totalCouponsCreated: 1 } }
      );

      res.status(201).json({
        success: true,
        data: {
          promotion: {
            id: promotion._id,
            onChainAddress: promotion.onChainAddress,
            title: promotion.title,
            description: promotion.description,
            category: promotion.category,
            discountPercentage: promotion.discountPercentage,
            maxSupply: promotion.maxSupply,
            price: promotion.price,
            expiryTimestamp: promotion.expiryTimestamp,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Promotion creation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/promotions?page=1&limit=20&category=Food&minDiscount=30&search=coffee&sortBy=discount&sortOrder=desc
   * List promotions with filters
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { category, minDiscount, search, sortBy, sortOrder, latitude, longitude, radius } = req.query;

      const filter: any = { isActive: true, expiryTimestamp: { $gt: new Date() } };

      if (category) {
        filter.category = category;
      }

      if (minDiscount) {
        filter.discountPercentage = { $gte: parseInt(minDiscount as string) };
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const sortOptions: any = {};
      if (sortBy === 'discount') {
        sortOptions.discountPercentage = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'price') {
        sortOptions.price = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1;
      }

      let [promotions, total] = await Promise.all([
        Promotion.find(filter).skip(skip).limit(limit).sort(sortOptions),
        Promotion.countDocuments(filter),
      ]);

      // Populate merchant details
      const merchantIds = [...new Set(promotions.map((p) => p.merchant))];
      const merchants = await Merchant.find({ onChainAddress: { $in: merchantIds } });
      const merchantMap = new Map(merchants.map((m) => [m.onChainAddress, m]));

      let promotionsWithMerchant = promotions.map((p) => ({
        ...p.toObject(),
        merchantDetails: merchantMap.get(p.merchant),
      }));

      // Filter by distance if location provided
      if (latitude && longitude && radius) {
        const filtered = promotionsWithMerchant.filter((p) => p.merchantDetails?.location);
        promotionsWithMerchant = filterByDistance(
          filtered as any[],
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          parseFloat(radius as string)
        ) as typeof promotionsWithMerchant;
        total = promotionsWithMerchant.length;
      }

      res.json({
        success: true,
        data: {
          promotions: promotionsWithMerchant.map((p) => ({
            id: p._id,
            onChainAddress: p.onChainAddress,
            merchant: {
              id: p.merchantDetails?._id,
              name: p.merchantDetails?.name,
              category: p.merchantDetails?.category,
              location: p.merchantDetails?.location,
            },
            title: p.title,
            description: p.description,
            category: p.category,
            discountPercentage: p.discountPercentage,
            maxSupply: p.maxSupply,
            currentSupply: p.currentSupply,
            price: p.price,
            expiryTimestamp: p.expiryTimestamp,
            stats: p.stats,
          })),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Failed to list promotions:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/promotions/:promotionId
   * Get promotion details
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;

      const promotion = await Promotion.findOne({
        $or: [{ _id: promotionId }, { onChainAddress: promotionId }],
      });

      if (!promotion) {
        res.status(404).json({
          success: false,
          error: 'Promotion not found',
        });
      }

      const merchant = await Merchant.findOne({ onChainAddress: promotion.merchant });

      res.json({
        success: true,
        data: {
          id: promotion._id,
          onChainAddress: promotion.onChainAddress,
          merchant: merchant ? {
            id: merchant._id,
            name: merchant.name,
            category: merchant.category,
            location: merchant.location,
            averageRating: merchant.averageRating,
          } : null,
          title: promotion.title,
          description: promotion.description,
          category: promotion.category,
          discountPercentage: promotion.discountPercentage,
          maxSupply: promotion.maxSupply,
          currentSupply: promotion.currentSupply,
          price: promotion.price,
          expiryTimestamp: promotion.expiryTimestamp,
          isActive: promotion.isActive,
          stats: promotion.stats,
          createdAt: promotion.createdAt,
        },
      });
    } catch (error) {
      logger.error('Failed to get promotion details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/promotions/rate
   * Rate a promotion
   */
  async rate(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId, stars } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!promotionId || !walletAddress || stars === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: promotionId, walletAddress, stars',
        });
      }

      if (stars < 1 || stars > 5) {
        res.status(400).json({
          success: false,
          error: 'Stars must be between 1 and 5',
        });
      }

      const promotion = await Promotion.findOne({
        $or: [{ _id: promotionId }, { onChainAddress: promotionId }],
      });

      if (!promotion) {
        res.status(404).json({
          success: false,
          error: 'Promotion not found',
        });
      }

      const promotionPDA = new PublicKey(promotion.onChainAddress);
      const userPubkey = new PublicKey(walletAddress);

      // Restore user keypair for signing
      const { User } = await import('../models/user');
      const { walletService } = await import('../services/wallet.service');
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const userKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: user.encryptedPrivateKey,
        iv: user.iv,
        authTag: user.authTag,
      });

      const result = await solanaService.ratePromotion(promotionPDA, userPubkey, stars, userKeypair);

      // Update promotion stats
      const newTotalRatings = promotion.stats.totalRatings + 1;
      const newAverageRating =
        (promotion.stats.averageRating * promotion.stats.totalRatings + stars) / newTotalRatings;

      await Promotion.updateOne(
        { _id: promotion._id },
        {
          $set: {
            'stats.averageRating': newAverageRating,
            'stats.totalRatings': newTotalRatings,
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
      logger.error('Failed to rate promotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/promotions/comment
   * Add comment to promotion
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId, content, parentCommentId } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!promotionId || !walletAddress || !content) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: promotionId, walletAddress, content',
        });
      }

      const promotion = await Promotion.findOne({
        $or: [{ _id: promotionId }, { onChainAddress: promotionId }],
      });

      if (!promotion) {
        res.status(404).json({
          success: false,
          error: 'Promotion not found',
        });
      }

      const promotionPDA = new PublicKey(promotion.onChainAddress);
      const authorPubkey = new PublicKey(walletAddress);
      const merchantPDA = new PublicKey(promotion.merchant);
      const commentId = promotion.stats.totalComments;

      // Restore user keypair for signing
      const { User } = await import('../models/user');
      const { walletService } = await import('../services/wallet.service');
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const userKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: user.encryptedPrivateKey,
        iv: user.iv,
        authTag: user.authTag,
      });

      const result = await solanaService.addComment(
        promotionPDA,
        authorPubkey,
        merchantPDA,
        content,
        commentId,
        parentCommentId ? new PublicKey(parentCommentId) : undefined,
        userKeypair
      );

      // Update promotion stats
      await Promotion.updateOne(
        { _id: promotion._id },
        { $inc: { 'stats.totalComments': 1 } }
      );

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to add comment:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const promotionController = new PromotionController();
