import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Promotion } from '../models/promotion';
import { Merchant } from '../models/merchant';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { filterByDistance } from '../utils/distance';
// import { getDatabaseConfig } from '../config/database';

export class PromotionController {
  constructor() {
    // Bind all methods to ensure 'this' context is preserved
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getDetails = this.getDetails.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.rate = this.rate.bind(this);
    this.addComment = this.addComment.bind(this);
  }

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
        expiryDays,
        imageUrl,
      } = req.body;

      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress || !title || !description || !category || !discountPercentage || !maxSupply || !price) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      // Calculate expiry timestamp from days if not provided
      let finalExpiryTimestamp: Date;
      if (expiryTimestamp) {
        finalExpiryTimestamp = new Date(expiryTimestamp);
      } else if (expiryDays) {
        finalExpiryTimestamp = new Date();
        finalExpiryTimestamp.setDate(finalExpiryTimestamp.getDate() + parseInt(expiryDays));
      } else {
        // Default to 30 days
        finalExpiryTimestamp = new Date();
        finalExpiryTimestamp.setDate(finalExpiryTimestamp.getDate() + 30);
      }

      // Get merchant
      const merchant = await Merchant.findOne({ 
        $or: [
          { walletAddress },
          { email: req.body.email }
        ]
      });
      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Merchant not registered',
        });
        return;
      }

      // Check if merchant has blockchain setup
      const hasBlockchainSetup = merchant.encryptedPrivateKey && merchant.iv && merchant.authTag;
      
      let onChainAddress = 'pending';
      let transactionSignature = 'pending';

      // BLOCKCHAIN-FIRST PATTERN: Create on-chain first, then sync to DB
      if (hasBlockchainSetup) {
        try {
          const merchantAuthority = new PublicKey(merchant.walletAddress!);
          const promotionId = merchant.totalCouponsCreated;

          // Restore merchant keypair for signing
          const { walletService } = await import('../services/wallet.service');
          const merchantKeypair = walletService.restoreKeypair({
            encryptedPrivateKey: merchant.encryptedPrivateKey!,
            iv: merchant.iv!,
            authTag: merchant.authTag!,
          });

          // Create on-chain FIRST
          const result = await solanaService.createPromotion(
            merchantAuthority,
            promotionId,
            discountPercentage,
            maxSupply,
            Math.floor(finalExpiryTimestamp.getTime() / 1000),
            category,
            description,
            price,
            merchantKeypair
          );
          
          onChainAddress = result.promotion;
          transactionSignature = result.signature;

          logger.info(`✅ Promotion created on-chain: ${onChainAddress}`);

          // Wait for confirmation before saving to DB
          const { blockchainSync } = await import('../services/blockchain-sync.service');
          const isFinalized = await blockchainSync.verifyTransactionFinality(transactionSignature);
          
          if (!isFinalized) {
            logger.warn(`Transaction not yet finalized: ${transactionSignature}`);
          }
        } catch (blockchainError) {
          logger.error('Blockchain creation failed:', blockchainError);
          // FAIL FAST: Don't create in DB if blockchain fails
          res.status(500).json({
            success: false,
            error: 'Blockchain transaction failed. Please try again.',
            details: blockchainError instanceof Error ? blockchainError.message : 'Unknown error',
          });
          return;
        }
      }

      // Save to database AFTER blockchain success
      const originalPrice = price / (1 - discountPercentage / 100);
      const promotion = await Promotion.create({
        onChainAddress,
        merchant: merchant.onChainAddress || merchant._id.toString(),
        title,
        description,
        category,
        discountPercentage,
        maxSupply,
        currentSupply: 0,
        price,
        originalPrice,
        imageUrl: imageUrl || '',
        expiryTimestamp: finalExpiryTimestamp,
        isActive: true,
        transactionSignature,
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
            originalPrice: promotion.originalPrice,
            imageUrl: promotion.imageUrl,
            expiryTimestamp: promotion.expiryTimestamp,
          },
          transactionSignature,
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
      // Check if database is connected
      const mongoose = await import('mongoose');
      if (mongoose.default.connection.readyState !== 1) {
        logger.warn('Database not connected, returning empty promotions list');
        res.json({
          success: true,
          data: {
            promotions: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
        });
        return;
      }

      const { page, limit, skip } = getPaginationParams(req.query);
      const { category, minDiscount, search, sortBy, sortOrder, latitude, longitude, radius, isActive } = req.query;

      const filter: any = { expiryTimestamp: { $gt: new Date() } };
      
      // Handle isActive filter - default to true if not specified
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
      } else {
        filter.isActive = true;
      }

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

      const [promotions, total] = await Promise.all([
        Promotion.find(filter).skip(skip).limit(limit).sort(sortOptions).lean(),
        Promotion.countDocuments(filter),
      ]);

      // Populate merchant details
      const merchantAddresses = [...new Set(promotions.map((p) => p.merchant))].filter(Boolean);
      const merchants = await Merchant.find({ onChainAddress: { $in: merchantAddresses } }).lean();
      const merchantMap = new Map(merchants.map((m) => [m.onChainAddress, m]));

      let promotionsWithMerchant = promotions.map((p) => {
        const merchantDetails = merchantMap.get(p.merchant);
        return {
          _id: p._id,
          onChainAddress: p.onChainAddress,
          merchant: p.merchant,
          title: p.title,
          description: p.description,
          category: p.category,
          discountPercentage: p.discountPercentage,
          maxSupply: p.maxSupply,
          currentSupply: p.currentSupply,
          price: p.price,
          expiryTimestamp: p.expiryTimestamp,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          stats: p.stats,
          createdAt: p.createdAt,
          originalPrice: p.originalPrice,
          merchantDetails: merchantDetails ? {
            _id: merchantDetails._id,
            name: merchantDetails.name,
            businessName: merchantDetails.businessName || merchantDetails.name,
            category: merchantDetails.category,
            location: merchantDetails.location,
          } : null,
        };
      });

      // Filter by distance if location provided
      if (latitude && longitude && radius) {
        const filtered = promotionsWithMerchant.filter((p) => p.merchantDetails?.location);
        promotionsWithMerchant = filterByDistance(
          filtered as any[],
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          parseFloat(radius as string)
        ) as typeof promotionsWithMerchant;
      }

      res.json({
        success: true,
        data: {
          promotions: promotionsWithMerchant.map((p) => ({
            _id: p._id,
            id: p._id,
            onChainAddress: p.onChainAddress,
            merchant: {
              id: p.merchantDetails?._id,
              name: p.merchantDetails?.name,
              businessName: p.merchantDetails?.businessName || p.merchantDetails?.name,
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
            originalPrice: p.originalPrice || (p.price / (1 - p.discountPercentage / 100)),
            discountedPrice: p.price,
            expiryTimestamp: p.expiryTimestamp,
            endDate: p.expiryTimestamp,
            imageUrl: p.imageUrl,
            stats: p.stats,
          })),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Error listing promotions:', error);
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
        return;
      }

      const merchant = await Merchant.findOne({ onChainAddress: promotion.merchant });

      res.json({
        success: true,
        data: {
          _id: promotion._id,
          id: promotion._id,
          onChainAddress: promotion.onChainAddress,
          merchant: merchant ? {
            id: merchant._id,
            name: merchant.name,
            businessName: merchant.businessName || merchant.name,
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
          originalPrice: promotion.originalPrice || (promotion.price / (1 - promotion.discountPercentage / 100)),
          discountedPrice: promotion.price,
          expiryTimestamp: promotion.expiryTimestamp,
          endDate: promotion.expiryTimestamp,
          imageUrl: promotion.imageUrl,
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
        return;
      }

      if (stars < 1 || stars > 5) {
        res.status(400).json({
          success: false,
          error: 'Stars must be between 1 and 5',
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
        return;
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

      // Handle guest users - skip blockchain interaction
      if (walletAddress === 'guest_user') {
        // For guest users, just increment comment count without blockchain tx
        await Promotion.updateOne(
          { _id: promotion._id },
          { $inc: { 'stats.totalComments': 1 } }
        );

        res.json({
          success: true,
          data: {
            message: 'Comment added (guest mode - no blockchain transaction)',
            commentId: promotion.stats.totalComments,
          },
        });
        return;
      }

      // Validate wallet address format for real users
      if (!walletAddress || walletAddress.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address format',
        });
        return;
      }

      let authorPubkey: PublicKey;
      try {
        authorPubkey = new PublicKey(walletAddress);
      } catch (err) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address: must be a valid Solana public key',
        });
        return;
      }

      const promotionPDA = new PublicKey(promotion.onChainAddress);
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
        return;
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

  /**
   * PUT /api/v1/promotions/:promotionId
   * Update a promotion
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const { title, description, price, maxSupply } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing wallet address',
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

      // Verify merchant ownership
      const merchant = await Merchant.findOne({ 
        onChainAddress: promotion.merchant,
        walletAddress 
      });

      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this promotion',
        });
        return;
      }

      // Update promotion
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (maxSupply !== undefined) updateData.maxSupply = maxSupply;

      await Promotion.updateOne(
        { _id: promotion._id },
        { $set: updateData }
      );

      const updatedPromotion = await Promotion.findById(promotion._id);

      res.json({
        success: true,
        data: updatedPromotion,
      });
    } catch (error) {
      logger.error('Failed to update promotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/v1/promotions/:promotionId
   * Delete a promotion
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'] || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing wallet address',
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

      // Verify merchant ownership
      const merchant = await Merchant.findOne({ 
        onChainAddress: promotion.merchant,
        walletAddress 
      });

      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this promotion',
        });
        return;
      }

      // Soft delete by marking as inactive
      await Promotion.updateOne(
        { _id: promotion._id },
        { $set: { isActive: false } }
      );

      res.json({
        success: true,
        message: 'Promotion deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete promotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/v1/promotions/:promotionId/pause
   * Pause a promotion
   */
  async pause(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'] || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing wallet address',
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

      // Verify merchant ownership
      const merchant = await Merchant.findOne({ 
        onChainAddress: promotion.merchant,
        walletAddress 
      });

      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to pause this promotion',
        });
        return;
      }

      await Promotion.updateOne(
        { _id: promotion._id },
        { $set: { isActive: false } }
      );

      res.json({
        success: true,
        message: 'Promotion paused successfully',
      });
    } catch (error) {
      logger.error('Failed to pause promotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/v1/promotions/:promotionId/resume
   * Resume a paused promotion
   */
  async resume(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'] || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing wallet address',
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

      // Verify merchant ownership
      const merchant = await Merchant.findOne({ 
        onChainAddress: promotion.merchant,
        walletAddress 
      });

      if (!merchant) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to resume this promotion',
        });
        return;
      }

      await Promotion.updateOne(
        { _id: promotion._id },
        { $set: { isActive: true } }
      );

      res.json({
        success: true,
        message: 'Promotion resumed successfully',
      });
    } catch (error) {
      logger.error('Failed to resume promotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const promotionController = new PromotionController();

// Export individual controller methods for testing
export const createPromotion = promotionController.create.bind(promotionController);
export const listPromotions = promotionController.list.bind(promotionController);
export const getPromotions = promotionController.list.bind(promotionController);
export const getPromotion = promotionController.getDetails.bind(promotionController);
export const getPromotionDetails = promotionController.getDetails.bind(promotionController);
export const ratePromotion = promotionController.rate.bind(promotionController);
export const addPromotionComment = promotionController.addComment.bind(promotionController);
