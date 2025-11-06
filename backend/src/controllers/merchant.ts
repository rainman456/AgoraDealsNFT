import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Merchant } from '../models/merchant';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class MerchantController {
  /**
   * POST /api/v1/merchants/register
   * Register a new merchant
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, description, latitude, longitude } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress || !name || !category) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, name, category',
        });
        return;
      }

      const authority = new PublicKey(walletAddress);
      
      // Register on-chain
      const result = await solanaService.registerMerchant(
        authority,
        name,
        category,
        latitude,
        longitude
      );

      // Save to database
      const merchant = await Merchant.create({
        walletAddress,
        authority: walletAddress,
        onChainAddress: result.merchant,
        name,
        category,
        description,
        location: latitude && longitude ? { latitude, longitude } : undefined,
        totalCouponsCreated: 0,
        totalCouponsRedeemed: 0,
        isActive: true,
        averageRating: 0,
        totalRatings: 0,
      });

      res.status(201).json({
        success: true,
        data: {
          merchant: {
            id: merchant._id,
            walletAddress: merchant.walletAddress,
            onChainAddress: merchant.onChainAddress,
            name: merchant.name,
            category: merchant.category,
            description: merchant.description,
            location: merchant.location,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Merchant registration failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/merchants/:merchantId
   * Get merchant profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;

      const merchant = await Merchant.findOne({
        $or: [{ _id: merchantId }, { onChainAddress: merchantId }, { walletAddress: merchantId }],
      });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      res.json({
        success: true,
        data: {
          id: merchant._id,
          walletAddress: merchant.walletAddress,
          onChainAddress: merchant.onChainAddress,
          name: merchant.name,
          category: merchant.category,
          description: merchant.description,
          location: merchant.location,
          totalCouponsCreated: merchant.totalCouponsCreated,
          totalCouponsRedeemed: merchant.totalCouponsRedeemed,
          isActive: merchant.isActive,
          averageRating: merchant.averageRating,
          totalRatings: merchant.totalRatings,
          createdAt: merchant.createdAt,
        },
      });
    } catch (error) {
      logger.error('Failed to get merchant profile:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/merchants?page=1&limit=20&category=Food&search=coffee
   * List merchants with pagination and filters
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { category, search } = req.query;

      const filter: any = { isActive: true };

      if (category) {
        filter.category = category;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [merchants, total] = await Promise.all([
        Merchant.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Merchant.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          merchants: merchants.map((m) => ({
            id: m._id,
            walletAddress: m.walletAddress,
            onChainAddress: m.onChainAddress,
            name: m.name,
            category: m.category,
            description: m.description,
            location: m.location,
            averageRating: m.averageRating,
            totalRatings: m.totalRatings,
            totalCouponsCreated: m.totalCouponsCreated,
          })),
          pagination: createPaginationResult(page, limit, total),
        },
      });
    } catch (error) {
      logger.error('Failed to list merchants:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const merchantController = new MerchantController();

// Export individual controller methods for testing
export const registerMerchant = merchantController.register.bind(merchantController);
export const getMerchantProfile = merchantController.getProfile.bind(merchantController);
export const listMerchants = merchantController.list.bind(merchantController);
