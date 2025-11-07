import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { ExternalDeal, DealSource } from '../models/external-deal';
import { solanaService } from '../services/solana.service';
import { logger } from '../utils/logger';
import BN from 'bn.js';

export const externalDealController = {
  // List external deals
  async list(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        source,
        verified,
        sortBy = 'createdAt',
        order = 'desc',
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = {};

      if (category) filter.category = category;
      if (source) filter.source = source;
      if (verified !== undefined) filter.isVerified = verified === 'true';

      // Only show non-expired deals
      filter.expiryTimestamp = { $gt: new Date() };

      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions: any = { [sortBy as string]: sortOrder };

      const deals = await ExternalDeal.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      const total = await ExternalDeal.countDocuments(filter);

      res.json({
        deals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error listing external deals:', error);
      res.status(500).json({ error: 'Failed to fetch external deals' });
    }
  },

  // Get external deal by ID
  async getById(req: Request, res: Response) {
    try {
      const { dealId } = req.params;

      const deal = await ExternalDeal.findOne({ onChainAddress: dealId });
      if (!deal) {
        return res.status(404).json({ error: 'External deal not found' });
      }

      res.json(deal);
    } catch (error) {
      logger.error('Error fetching external deal:', error);
      res.status(500).json({ error: 'Failed to fetch external deal' });
    }
  },

  // Create external deal (oracle only)
  async create(req: Request, res: Response) {
    try {
      const {
        source,
        externalId,
        title,
        description,
        originalPrice,
        discountedPrice,
        discountPercentage,
        category,
        imageUrl,
        affiliateUrl,
        expiryTimestamp,
      } = req.body;

      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      // Validate required fields
      if (!source || !externalId || !title || !originalPrice || !discountedPrice) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Mint external deal on-chain
      const expiryTs = Math.floor(new Date(expiryTimestamp).getTime() / 1000);
      
      const result = await solanaService.updateExternalDeal(
        externalId,
        title,
        description || '',
        originalPrice,
        discountedPrice,
        category,
        imageUrl || '',
        affiliateUrl || '',
        expiryTs
      );

      // Save to database
      const deal = new ExternalDeal({
        onChainAddress: result.deal,
        oracleAuthority: walletAddress,
        source,
        externalId,
        title,
        description,
        originalPrice,
        discountedPrice,
        discountPercentage,
        category,
        imageUrl,
        affiliateUrl,
        expiryTimestamp: new Date(expiryTimestamp),
        isVerified: false,
        verificationCount: 0,
      });

      await deal.save();

      res.status(201).json({
        deal,
        transactionSignature: result.signature,
      });
    } catch (error) {
      logger.error('Error creating external deal:', error);
      res.status(500).json({ error: 'Failed to create external deal' });
    }
  },

  // Update external deal (oracle only)
  async update(req: Request, res: Response) {
    try {
      const { dealId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      const deal = await ExternalDeal.findOne({ onChainAddress: dealId });
      if (!deal) {
        return res.status(404).json({ error: 'External deal not found' });
      }

      // Verify oracle authority
      if (deal.oracleAuthority !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to update this deal' });
      }

      const updateFields = [
        'title',
        'description',
        'originalPrice',
        'discountedPrice',
        'discountPercentage',
        'imageUrl',
        'affiliateUrl',
        'expiryTimestamp',
        'isVerified',
      ];

      updateFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          (deal as any)[field] = req.body[field];
        }
      });

      deal.lastUpdated = new Date();
      await deal.save();

      res.json(deal);
    } catch (error) {
      logger.error('Error updating external deal:', error);
      res.status(500).json({ error: 'Failed to update external deal' });
    }
  },
};
