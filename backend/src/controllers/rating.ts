import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { SolanaConfig } from '../config/solana';

export class RatingController {
  /**
   * POST /api/v1/ratings/rate
   * Rate a promotion
   */
  async ratePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId, stars } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!promotionId || !stars || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: promotionId, stars, walletAddress',
        });
      }

      if (stars < 1 || stars > 5) {
        res.status(400).json({
          success: false,
          error: 'Stars must be between 1 and 5',
        });
      }

      const promotionPubkey = new PublicKey(promotionId);
      const userPubkey = new PublicKey(walletAddress);

      // Derive rating PDA
      const [ratingPDA] = SolanaConfig.getInstance().getRatingPDA(promotionPubkey, userPubkey);

      // Derive user stats PDA
      const [userStatsPDA] = SolanaConfig.getInstance().getUserStatsPDA(userPubkey);

      // Check if rating already exists
      let existingRating;
      try {
        existingRating = await solanaService.program.account.rating.fetch(ratingPDA);
      } catch (error) {
        // Rating doesn't exist yet
        existingRating = null;
      }

      const isUpdate = existingRating !== null;

      res.json({
        success: true,
        data: {
          ratingPDA: ratingPDA.toString(),
          userStatsPDA: userStatsPDA.toString(),
          promotionPDA: promotionPubkey.toString(),
          isUpdate,
          message: isUpdate ? 'Rating will be updated' : 'New rating will be created',
        },
      });
    } catch (error) {
      logger.error('Error in ratePromotion:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rate promotion',
      });
    }
  }

  /**
   * GET /api/v1/ratings/promotion/:promotionId
   * Get all ratings for a promotion
   */
  async getPromotionRatings(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const { page, limit } = getPaginationParams(req);

      const promotionPubkey = new PublicKey(promotionId);

      // Fetch all ratings for this promotion
      const allRatings = await solanaService.program.account.rating.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator + user pubkey
            bytes: promotionPubkey.toBase58(),
          },
        },
      ]);

      // Calculate average rating
      const totalRatings = allRatings.length;
      const sumStars = allRatings.reduce((sum, r) => sum + r.account.stars, 0);
      const averageRating = totalRatings > 0 ? sumStars / totalRatings : 0;

      // Calculate distribution
      const distribution = [0, 0, 0, 0, 0];
      allRatings.forEach((r) => {
        if (r.account.stars >= 1 && r.account.stars <= 5) {
          distribution[r.account.stars - 1]++;
        }
      });

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRatings = allRatings.slice(startIndex, endIndex);

      const ratings = paginatedRatings.map((r) => ({
        address: r.publicKey.toString(),
        user: r.account.user.toString(),
        promotion: r.account.promotion.toString(),
        merchant: r.account.merchant.toString(),
        stars: r.account.stars,
        createdAt: new Date(r.account.createdAt.toNumber() * 1000).toISOString(),
        updatedAt: new Date(r.account.updatedAt.toNumber() * 1000).toISOString(),
      }));

      res.json({
        success: true,
        data: {
          ratings,
          stats: {
            totalRatings,
            averageRating: parseFloat(averageRating.toFixed(2)),
            distribution,
          },
          pagination: createPaginationResult(totalRatings, page, limit),
        },
      });
    } catch (error) {
      logger.error('Error in getPromotionRatings:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ratings',
      });
    }
  }

  /**
   * GET /api/v1/ratings/user/:userAddress
   * Get all ratings by a user
   */
  async getUserRatings(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const { page, limit } = getPaginationParams(req);

      const userPubkey = new PublicKey(userAddress);

      // Fetch all ratings by this user
      const allRatings = await solanaService.program.account.rating.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: userPubkey.toBase58(),
          },
        },
      ]);

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRatings = allRatings.slice(startIndex, endIndex);

      const ratings = paginatedRatings.map((r) => ({
        address: r.publicKey.toString(),
        user: r.account.user.toString(),
        promotion: r.account.promotion.toString(),
        merchant: r.account.merchant.toString(),
        stars: r.account.stars,
        createdAt: new Date(r.account.createdAt.toNumber() * 1000).toISOString(),
        updatedAt: new Date(r.account.updatedAt.toNumber() * 1000).toISOString(),
      }));

      res.json({
        success: true,
        data: {
          ratings,
          pagination: createPaginationResult(allRatings.length, page, limit),
        },
      });
    } catch (error) {
      logger.error('Error in getUserRatings:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user ratings',
      });
    }
  }

  /**
   * GET /api/v1/ratings/:promotionId/:userAddress
   * Get a specific user's rating for a promotion
   */
  async getUserPromotionRating(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId, userAddress } = req.params;

      const promotionPubkey = new PublicKey(promotionId);
      const userPubkey = new PublicKey(userAddress);

      // Derive rating PDA
      const [ratingPDA] = SolanaConfig.getInstance().getRatingPDA(promotionPubkey, userPubkey);

      try {
        const rating = await solanaService.program.account.rating.fetch(ratingPDA);

        res.json({
          success: true,
          data: {
            address: ratingPDA.toString(),
            user: rating.user.toString(),
            promotion: rating.promotion.toString(),
            merchant: rating.merchant.toString(),
            stars: rating.stars,
            createdAt: new Date(rating.createdAt.toNumber() * 1000).toISOString(),
            updatedAt: new Date(rating.updatedAt.toNumber() * 1000).toISOString(),
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Rating not found',
        });
      }
    } catch (error) {
      logger.error('Error in getUserPromotionRating:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rating',
      });
    }
  }
}

export const ratingController = new RatingController();
