import { Request, Response } from 'express';
import { Listing } from '../models/listing';
import { Coupon } from '../models/coupon';
import { logger } from '../utils/logger';

export const listingController = {
  // List marketplace listings
  async list(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        seller,
        active,
        sortBy = 'createdAt',
        order = 'desc',
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = {};

      if (seller) filter.seller = seller;
      if (active !== undefined) filter.isActive = active === 'true';

      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions: any = { [sortBy as string]: sortOrder };

      const listings = await Listing.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      const total = await Listing.countDocuments(filter);

      res.json({
        listings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error listing marketplace listings:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  // Get listing by ID
  async getById(req: Request, res: Response) {
    try {
      const { listingId } = req.params;

      const listing = await Listing.findOne({ onChainAddress: listingId });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      return res.json(listing);
    } catch (error) {
      logger.error('Error fetching listing:', error);
      return res.status(500).json({ error: 'Failed to fetch listing' });
    }
  },

  // Create a listing
  async create(req: Request, res: Response) {
    try {
      const { couponAddress, price } = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      if (!couponAddress || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify coupon ownership
      const coupon = await Coupon.findOne({ onChainAddress: couponAddress });
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      if (coupon.owner !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to list this coupon' });
      }

      if (coupon.isRedeemed) {
        return res.status(400).json({ error: 'Cannot list redeemed coupon' });
      }

      const listing = new Listing({
        onChainAddress: `listing${Math.random().toString(36).substring(7)}`,
        coupon: couponAddress,
        seller: walletAddress,
        price,
        isActive: true,
      });

      await listing.save();

      // Update coupon listing status
      coupon.isListed = true;
      await coupon.save();

      return res.status(201).json(listing);
    } catch (error) {
      logger.error('Error creating listing:', error);
      return res.status(500).json({ error: 'Failed to create listing' });
    }
  },

  // Deactivate a listing
  async deactivate(req: Request, res: Response) {
    try {
      const { listingId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      const listing = await Listing.findOne({ onChainAddress: listingId });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Verify ownership
      if (listing.seller !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to deactivate this listing' });
      }

      listing.isActive = false;
      await listing.save();

      // Update coupon listing status
      await Coupon.updateOne(
        { onChainAddress: listing.coupon },
        { isListed: false }
      );

      return res.json(listing);
    } catch (error) {
      logger.error('Error deactivating listing:', error);
      return res.status(500).json({ error: 'Failed to deactivate listing' });
    }
  },

  // Delete a listing
  async delete(req: Request, res: Response) {
    try {
      const { listingId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      const listing = await Listing.findOne({ onChainAddress: listingId });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Verify ownership
      if (listing.seller !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to delete this listing' });
      }

      await Listing.deleteOne({ onChainAddress: listingId });

      // Update coupon listing status
      await Coupon.updateOne(
        { onChainAddress: listing.coupon },
        { isListed: false }
      );

      return res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
      logger.error('Error deleting listing:', error);
      return res.status(500).json({ error: 'Failed to delete listing' });
    }
  },
};
