import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { GroupDeal } from '../models/group-deal';
import { Promotion } from '../models/promotion';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import BN from 'bn.js';

export class GroupDealController {
  /**
   * POST /api/v1/group-deals/create
   * Create a new group deal
   */
  async createGroupDeal(req: Request, res: Response): Promise<void> {
    try {
      const {
        promotionId,
        title,
        description,
        category,
        tiers,
        targetParticipants,
        maxParticipants,
        durationDays,
        imageUrl,
        termsAndConditions,
      } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!promotionId || !title || !tiers || !targetParticipants || !maxParticipants || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
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
      const merchantAuthority = new PublicKey(walletAddress);
      
      const duration = new BN(durationDays * 24 * 60 * 60); // Convert days to seconds
      const dealId = Date.now();
      const basePrice = tiers[0]?.price || 0;

      // Create on-chain
      const result = await solanaService.createGroupDeal(
        promotionPDA,
        merchantAuthority,
        dealId,
        targetParticipants,
        maxParticipants,
        basePrice,
        tiers,
        duration.toNumber()
      );

      const now = new Date();
      const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Save to database
      const groupDeal = await GroupDeal.create({
        onChainAddress: result.groupDeal,
        promotionAddress: promotion.onChainAddress,
        merchantAddress: promotion.merchant,
        title,
        description,
        category: category || promotion.category,
        tiers,
        targetParticipants,
        currentParticipants: 0,
        maxParticipants,
        participants: [],
        startTime: now,
        endTime,
        expiryTimestamp: endTime,
        status: 'active',
        isActive: true,
        isSuccessful: false,
        totalRevenue: 0,
        currentTier: 0,
        imageUrl,
        termsAndConditions: termsAndConditions || [],
      });

      res.status(201).json({
        success: true,
        data: {
          groupDeal: {
            id: groupDeal._id,
            onChainAddress: groupDeal.onChainAddress,
            title: groupDeal.title,
            targetParticipants: groupDeal.targetParticipants,
            currentParticipants: groupDeal.currentParticipants,
            endTime: groupDeal.endTime,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to create group deal:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/group-deals/:dealId/join
   * Join a group deal
   */
  async joinGroupDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { quantity } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress || !quantity) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, quantity',
        });
      }

      const groupDeal = await GroupDeal.findOne({
        $or: [{ _id: dealId }, { onChainAddress: dealId }],
      });

      if (!groupDeal) {
        res.status(404).json({
          success: false,
          error: 'Group deal not found',
        });
      }

      if (!groupDeal.isActive) {
        res.status(400).json({
          success: false,
          error: 'Group deal is not active',
        });
      }

      if (new Date() > groupDeal.endTime) {
        res.status(400).json({
          success: false,
          error: 'Group deal has ended',
        });
      }

      if (groupDeal.currentParticipants + quantity > groupDeal.maxParticipants) {
        res.status(400).json({
          success: false,
          error: 'Not enough spots available',
        });
      }

      const groupDealPDA = new PublicKey(groupDeal.onChainAddress);
      const userPubkey = new PublicKey(walletAddress);

      // Join on-chain (note: quantity is handled in the controller logic, not passed to chain)
      const result = await solanaService.joinGroupDeal(
        groupDealPDA,
        userPubkey
      );

      // Calculate price based on current tier
      const currentTier = groupDeal.tiers.find(
        (tier) => groupDeal.currentParticipants >= tier.minParticipants
      ) || groupDeal.tiers[0];
      
      const paidAmount = currentTier.pricePerUnit * quantity;

      // Update database
      await GroupDeal.updateOne(
        { _id: groupDeal._id },
        {
          $inc: {
            currentParticipants: quantity,
            totalRevenue: paidAmount,
          },
          $push: {
            participants: {
              userAddress: walletAddress,
              joinedAt: new Date(),
              quantity,
              paidAmount,
              txSignature: result.signature,
            },
          },
        }
      );

      // Check if deal is successful
      const updatedDeal = await GroupDeal.findById(groupDeal._id);
      if (updatedDeal && updatedDeal.currentParticipants >= updatedDeal.targetParticipants) {
        await GroupDeal.updateOne(
          { _id: groupDeal._id },
          {
            $set: {
              status: 'successful',
              isSuccessful: true,
            },
          }
        );
      }

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
          paidAmount,
          currentParticipants: (updatedDeal?.currentParticipants || 0),
        },
      });
    } catch (error) {
      logger.error('Failed to join group deal:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/group-deals?page=1&limit=20&status=active
   * Get all group deals
   */
  async getGroupDeals(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, category, merchantAddress } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (merchantAddress) filter.merchantAddress = merchantAddress;

      const [deals, total] = await Promise.all([
        GroupDeal.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        GroupDeal.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: deals,
        pagination: createPaginationResult(total, page, limit),
      });
    } catch (error) {
      logger.error('Failed to get group deals:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/group-deals/:dealId
   * Get group deal details
   */
  async getGroupDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;

      const groupDeal = await GroupDeal.findOne({
        $or: [{ _id: dealId }, { onChainAddress: dealId }],
      });

      if (!groupDeal) {
        res.status(404).json({
          success: false,
          error: 'Group deal not found',
        });
      }

      res.json({
        success: true,
        data: groupDeal,
      });
    } catch (error) {
      logger.error('Failed to get group deal:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/group-deals/:dealId/finalize
   * Finalize a group deal (merchant only)
   */
  async finalizeGroupDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing walletAddress',
        });
      }

      const groupDeal = await GroupDeal.findOne({
        $or: [{ _id: dealId }, { onChainAddress: dealId }],
      });

      if (!groupDeal) {
        res.status(404).json({
          success: false,
          error: 'Group deal not found',
        });
      }

      if (groupDeal.merchantAddress !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not authorized',
        });
      }

      const groupDealPDA = new PublicKey(groupDeal.onChainAddress);
      const merchantAuthority = new PublicKey(walletAddress);

      // Finalize on-chain
      const result = await solanaService.finalizeGroupDeal(groupDealPDA, merchantAuthority);

      // Update database
      const newStatus = groupDeal.currentParticipants >= groupDeal.targetParticipants
        ? 'successful'
        : 'failed';

      await GroupDeal.updateOne(
        { _id: groupDeal._id },
        {
          $set: {
            status: newStatus,
            isActive: false,
            isSuccessful: newStatus === 'successful',
          },
        }
      );

      res.json({
        success: true,
        data: {
          status: newStatus,
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to finalize group deal:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const groupDealController = new GroupDealController();
