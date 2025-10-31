import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { Auction } from '../models/auction';
import { Coupon } from '../models/coupon';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import BN from 'bn.js';

export class AuctionController {
  /**
   * POST /api/v1/auctions/create
   * Create a new auction
   */
  async createAuction(req: Request, res: Response): Promise<void> {
    try {
      const {
        couponId,
        title,
        description,
        category,
        startingPrice,
        reservePrice,
        buyNowPrice,
        durationDays,
        extendOnBid,
        extensionTime,
      } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !title || !startingPrice || !durationDays || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const coupon = await Coupon.findOne({
        $or: [{ _id: couponId }, { onChainAddress: couponId }],
      });

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
        return;
      }

      if (coupon.owner !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not coupon owner',
        });
        return;
      }

      if (coupon.isRedeemed) {
        res.status(400).json({
          success: false,
          error: 'Cannot auction redeemed coupon',
        });
        return;
      }

      const couponPDA = new PublicKey(coupon.onChainAddress);
      const sellerPubkey = new PublicKey(walletAddress);
      
      const duration = new BN(durationDays * 24 * 60 * 60);

      // Create auction on-chain
      const auctionId = Date.now();
      const auctionType = { english: {} };
      const result = await solanaService.createAuction(
        couponPDA,
        sellerPubkey,
        auctionId,
        auctionType,
        startingPrice,
        reservePrice || 0,
        duration.toNumber(),
        extendOnBid || false,
        Math.floor(startingPrice * 0.05)
      );

      const now = new Date();
      const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Save to database
      const auction = await Auction.create({
        onChainAddress: result.auction,
        couponAddress: coupon.onChainAddress,
        sellerAddress: walletAddress,
        merchantAddress: coupon.merchant,
        title,
        description,
        category: category || 'General',
        startingPrice,
        reservePrice,
        currentBid: startingPrice,
        buyNowPrice,
        bids: [],
        totalBids: 0,
        startTime: now,
        endTime,
        extendOnBid: extendOnBid !== false,
        extensionTime: extensionTime || 300,
        status: 'active',
        isActive: true,
        isSettled: false,
        couponMetadata: {
          discountPercentage: coupon.discountPercentage,
          expiryTimestamp: coupon.expiryTimestamp,
          merchantName: 'Merchant', // TODO: fetch from merchant
        },
      });

      // Update coupon to mark as in auction
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $set: {
            isListed: true,
          },
        }
      );

      res.status(201).json({
        success: true,
        data: {
          auction: {
            id: auction._id,
            onChainAddress: auction.onChainAddress,
            title: auction.title,
            startingPrice: auction.startingPrice,
            endTime: auction.endTime,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to create auction:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/auctions/:auctionId/bid
   * Place a bid on an auction
   */
  async placeBid(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId } = req.params;
      const { amount } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress || !amount) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, amount',
        });
        return;
      }

      const auction = await Auction.findOne({
        $or: [{ _id: auctionId }, { onChainAddress: auctionId }],
      });

      if (!auction) {
        res.status(404).json({
          success: false,
          error: 'Auction not found',
        });
      }

      if (!auction.isActive) {
        res.status(400).json({
          success: false,
          error: 'Auction is not active',
        });
      }

      if (new Date() > auction.endTime) {
        res.status(400).json({
          success: false,
          error: 'Auction has ended',
        });
      }

      if (amount <= auction.currentBid) {
        res.status(400).json({
          success: false,
          error: 'Bid must be higher than current bid',
        });
      }

      if (auction.sellerAddress === walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Cannot bid on your own auction',
        });
      }

      const auctionPDA = new PublicKey(auction.onChainAddress);
      const bidderPubkey = new PublicKey(walletAddress);

      // Place bid on-chain
      const result = await solanaService.placeBid(
        auctionPDA,
        bidderPubkey,
        amount
      );

      // Update previous winning bid
      if (auction.bids.length > 0) {
        await Auction.updateOne(
          { _id: auction._id, 'bids.isWinning': true },
          {
            $set: {
              'bids.$.isWinning': false,
            },
          }
        );
      }

      // Extend auction if configured
      let newEndTime = auction.endTime;
      if (auction.extendOnBid) {
        const timeRemaining = auction.endTime.getTime() - Date.now();
        const extensionMs = (auction.extensionTime || 300) * 1000;
        
        if (timeRemaining < extensionMs) {
          newEndTime = new Date(Date.now() + extensionMs);
        }
      }

      // Update auction
      await Auction.updateOne(
        { _id: auction._id },
        {
          $set: {
            currentBid: amount,
            highestBidder: walletAddress,
            endTime: newEndTime,
          },
          $inc: {
            totalBids: 1,
          },
          $push: {
            bids: {
              bidderAddress: walletAddress,
              amount,
              timestamp: new Date(),
              txSignature: result.signature,
              isWinning: true,
            },
          },
        }
      );

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
          currentBid: amount,
          endTime: newEndTime,
        },
      });
    } catch (error) {
      logger.error('Failed to place bid:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/auctions/:auctionId/settle
   * Settle an auction
   */
  async settleAuction(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId } = req.params;

      const auction = await Auction.findOne({
        $or: [{ _id: auctionId }, { onChainAddress: auctionId }],
      });

      if (!auction) {
        res.status(404).json({
          success: false,
          error: 'Auction not found',
        });
      }

      if (auction.isSettled) {
        res.status(400).json({
          success: false,
          error: 'Auction already settled',
        });
      }

      if (new Date() < auction.endTime) {
        res.status(400).json({
          success: false,
          error: 'Auction has not ended yet',
        });
      }

      // Settle on-chain - Note: settleAuction method needs to be implemented in solanaService
      // const auctionPDA = new PublicKey(auction.onChainAddress);
      // const authorityPubkey = new PublicKey(walletAddress);
      // const result = await solanaService.settleAuction(auctionPDA, authorityPubkey);
      const result = { signature: 'pending-implementation' };

      // Update auction
      const winner = auction.highestBidder;
      const finalPrice = auction.currentBid;

      await Auction.updateOne(
        { _id: auction._id },
        {
          $set: {
            status: 'settled',
            isActive: false,
            isSettled: true,
            winner,
            finalPrice,
            settledAt: new Date(),
            settlementTxSignature: result.signature,
          },
        }
      );

      // Update coupon ownership if there was a winner
      if (winner) {
        await Coupon.updateOne(
          { onChainAddress: auction.couponAddress },
          {
            $set: {
              owner: winner,
              isListed: false,
            },
            $push: {
              transferHistory: {
                from: auction.sellerAddress,
                to: winner,
                timestamp: new Date(),
                transactionSignature: result.signature,
              },
            },
          }
        );
      }

      res.json({
        success: true,
        data: {
          winner,
          finalPrice,
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to settle auction:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/auctions?page=1&limit=20&status=active
   * Get all auctions
   */
  async getAuctions(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, category, sellerAddress } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (sellerAddress) filter.sellerAddress = sellerAddress;

      const [auctions, total] = await Promise.all([
        Auction.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Auction.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: auctions,
        pagination: createPaginationResult(total, page, limit),
      });
    } catch (error) {
      logger.error('Failed to get auctions:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/auctions/:auctionId
   * Get auction details
   */
  async getAuction(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId } = req.params;

      const auction = await Auction.findOne({
        $or: [{ _id: auctionId }, { onChainAddress: auctionId }],
      });

      if (!auction) {
        res.status(404).json({
          success: false,
          error: 'Auction not found',
        });
      }

      res.json({
        success: true,
        data: auction,
      });
    } catch (error) {
      logger.error('Failed to get auction:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const auctionController = new AuctionController();
