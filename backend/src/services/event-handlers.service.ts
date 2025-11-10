// import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
import { Merchant } from '../models/merchant';
// import { User } from '../models/user';
import { Listing } from '../models/listing';
import { Rating } from '../models/rating';
import { Comment } from '../models/comment';
// import { GroupDeal } from '../models/group-deal';
// import { Auction } from '../models/auction';
// import { Badge } from '../models/badge';
// import { RedemptionTicket } from '../models/redemption-ticket';

/**
 * Event Handlers Service
 * 
 * Implements idempotent event handlers with retry logic.
 * Ensures MongoDB stays in sync with blockchain state.
 */
export class EventHandlersService {
  private static instance: EventHandlersService;
  private processedSignatures = new Set<string>();
  private maxCacheSize = 10000;

  private constructor() {}

  public static getInstance(): EventHandlersService {
    if (!EventHandlersService.instance) {
      EventHandlersService.instance = new EventHandlersService();
    }
    return EventHandlersService.instance;
  }

  /**
   * Check if event has already been processed (idempotency)
   */
  private isProcessed(signature: string): boolean {
    return this.processedSignatures.has(signature);
  }

  /**
   * Mark event as processed
   */
  private markProcessed(signature: string): void {
    this.processedSignatures.add(signature);
    
    // Prevent memory leak by limiting cache size
    if (this.processedSignatures.size > this.maxCacheSize) {
      const firstItem = this.processedSignatures.values().next().value;
      this.processedSignatures.delete(firstItem);
    }
  }

  /**
   * Handle PromotionCreated event
   */
  public async handlePromotionCreated(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      logger.debug(`Event already processed: ${signature}`);
      return;
    }

    try {
      const { promotion, merchant, discount_percentage, max_supply, expiry_timestamp, price } = data;

      // Check if promotion already exists
      const existing = await Promotion.findOne({ onChainAddress: promotion.toString() });
      if (existing) {
        logger.debug(`Promotion already exists: ${promotion.toString()}`);
        this.markProcessed(signature);
        return;
      }

      // Get merchant from database
      const merchantDoc = await Merchant.findOne({ onChainAddress: merchant.toString() });
      if (!merchantDoc) {
        logger.warn(`Merchant not found for promotion: ${merchant.toString()}`);
        return;
      }

      // Create promotion in database
      await Promotion.create({
        onChainAddress: promotion.toString(),
        merchant: merchant.toString(),
        merchantId: merchantDoc._id,
        title: 'Promotion', // Will be updated via API
        description: '',
        category: merchantDoc.category || 'general',
        discountPercentage: discount_percentage,
        maxSupply: max_supply,
        currentSupply: 0,
        price: price.toString(),
        expiryTimestamp: new Date(expiry_timestamp * 1000),
        isActive: true,
        transactionSignature: signature,
        createdAt: new Date(),
      });

      logger.info(`✅ Promotion created in DB: ${promotion.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling PromotionCreated event:', error);
      throw error; // Will trigger retry
    }
  }

  /**
   * Handle CouponMinted event
   */
  public async handleCouponMinted(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { coupon, nft_mint, promotion, recipient, merchant, discount_percentage } = data;

      // Check if coupon already exists
      const existing = await Coupon.findOne({ onChainAddress: coupon.toString() });
      if (existing) {
        this.markProcessed(signature);
        return;
      }

      // Get promotion
      const promotionDoc = await Promotion.findOne({ onChainAddress: promotion.toString() });
      if (!promotionDoc) {
        logger.warn(`Promotion not found for coupon: ${promotion.toString()}`);
        return;
      }

      // Create coupon in database
      await Coupon.create({
        onChainAddress: coupon.toString(),
        nftMint: nft_mint.toString(),
        promotion: promotion.toString(),
        owner: recipient.toString(),
        merchant: merchant.toString(),
        discountPercentage: discount_percentage,
        expiryTimestamp: promotionDoc.expiryTimestamp,
        isRedeemed: false,
        isListed: false,
        transferHistory: [],
        transactionSignature: signature,
      });

      // Update promotion supply
      await Promotion.updateOne(
        { onChainAddress: promotion.toString() },
        {
          $inc: { currentSupply: 1, 'stats.totalMinted': 1 },
        }
      );

      logger.info(`✅ Coupon minted in DB: ${coupon.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CouponMinted event:', error);
      throw error;
    }
  }

  /**
   * Handle CouponTransferred event
   */
  public async handleCouponTransferred(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { coupon, from, to, timestamp } = data;

      await Coupon.updateOne(
        { onChainAddress: coupon.toString() },
        {
          $set: { owner: to.toString() },
          $push: {
            transferHistory: {
              from: from.toString(),
              to: to.toString(),
              timestamp: new Date(timestamp * 1000),
              transactionSignature: signature,
            },
          },
        }
      );

      logger.info(`✅ Coupon transferred: ${coupon.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CouponTransferred event:', error);
      throw error;
    }
  }

  /**
   * Handle CouponRedeemed event
   */
  public async handleCouponRedeemed(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { coupon, redemption_code, timestamp } = data;

      await Coupon.updateOne(
        { onChainAddress: coupon.toString() },
        {
          $set: {
            isRedeemed: true,
            redeemedAt: new Date(timestamp * 1000),
            redemptionCode: redemption_code,
          },
        }
      );

      // Update promotion stats
      const couponDoc = await Coupon.findOne({ onChainAddress: coupon.toString() });
      if (couponDoc) {
        await Promotion.updateOne(
          { onChainAddress: couponDoc.promotion },
          { $inc: { 'stats.totalRedeemed': 1 } }
        );
      }

      logger.info(`✅ Coupon redeemed: ${coupon.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CouponRedeemed event:', error);
      throw error;
    }
  }

  /**
   * Handle CouponListed event
   */
  public async handleCouponListed(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { listing, coupon, nft_mint, seller, price } = data;

      // Update coupon
      await Coupon.updateOne(
        { onChainAddress: coupon.toString() },
        {
          $set: {
            isListed: true,
            listingPrice: price.toString(),
          },
        }
      );

      // Create listing
      await Listing.create({
        onChainAddress: listing.toString(),
        coupon: coupon.toString(),
        nftMint: nft_mint.toString(),
        seller: seller.toString(),
        price: price.toString(),
        isActive: true,
        transactionSignature: signature,
      });

      logger.info(`✅ Coupon listed: ${coupon.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CouponListed event:', error);
      throw error;
    }
  }

  /**
   * Handle CouponSold event
   */
  public async handleCouponSold(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { listing, coupon, buyer, price, marketplace_fee } = data;

      // Update coupon ownership
      await Coupon.updateOne(
        { onChainAddress: coupon.toString() },
        {
          $set: {
            owner: buyer.toString(),
            isListed: false,
            listingPrice: null,
          },
        }
      );

      // Update listing
      await Listing.updateOne(
        { onChainAddress: listing.toString() },
        {
          $set: {
            isActive: false,
            soldAt: new Date(),
            buyer: buyer.toString(),
            finalPrice: price.toString(),
            marketplaceFee: marketplace_fee.toString(),
          },
        }
      );

      logger.info(`✅ Coupon sold: ${coupon.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CouponSold event:', error);
      throw error;
    }
  }

  /**
   * Handle ListingCancelled event
   */
  public async handleListingCancelled(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { listing, coupon } = data;

      await Coupon.updateOne(
        { onChainAddress: coupon.toString() },
        {
          $set: {
            isListed: false,
            listingPrice: null,
          },
        }
      );

      await Listing.updateOne(
        { onChainAddress: listing.toString() },
        {
          $set: {
            isActive: false,
            cancelledAt: new Date(),
          },
        }
      );

      logger.info(`✅ Listing cancelled: ${listing.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling ListingCancelled event:', error);
      throw error;
    }
  }

  /**
   * Handle PromotionRated event
   */
  public async handlePromotionRated(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { user, promotion, stars, is_update } = data;

      if (is_update) {
        await Rating.updateOne(
          {
            user: user.toString(),
            promotion: promotion.toString(),
          },
          {
            $set: { rating: stars },
          }
        );
      } else {
        await Rating.create({
          user: user.toString(),
          promotion: promotion.toString(),
          rating: stars,
          transactionSignature: signature,
        });
      }

      // Recalculate average rating
      const ratings = await Rating.find({ promotion: promotion.toString() });
      const avgRating = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;

      await Promotion.updateOne(
        { onChainAddress: promotion.toString() },
        {
          $set: {
            'stats.averageRating': avgRating,
            'stats.totalRatings': ratings.length,
          },
        }
      );

      logger.info(`✅ Promotion rated: ${promotion.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling PromotionRated event:', error);
      throw error;
    }
  }

  /**
   * Handle CommentAdded event
   */
  public async handleCommentAdded(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { comment, user, promotion, content, is_reply } = data;

      await Comment.create({
        onChainAddress: comment.toString(),
        user: user.toString(),
        promotion: promotion.toString(),
        content,
        isReply: is_reply,
        likes: 0,
        transactionSignature: signature,
      });

      logger.info(`✅ Comment added: ${comment.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling CommentAdded event:', error);
      throw error;
    }
  }

  /**
   * Handle MerchantRegistered event
   */
  public async handleMerchantRegistered(event: any): Promise<void> {
    const { signature, data } = event;

    if (this.isProcessed(signature)) {
      return;
    }

    try {
      const { merchant, authority, name, category, timestamp } = data;

      const existing = await Merchant.findOne({ onChainAddress: merchant.toString() });
      if (existing) {
        this.markProcessed(signature);
        return;
      }

      await Merchant.create({
        onChainAddress: merchant.toString(),
        authority: authority.toString(),
        walletAddress: authority.toString(),
        name,
        category,
        isVerified: false,
        totalCouponsCreated: 0,
        transactionSignature: signature,
        createdAt: new Date(timestamp * 1000),
      });

      logger.info(`✅ Merchant registered: ${merchant.toString()}`);
      this.markProcessed(signature);
    } catch (error) {
      logger.error('Error handling MerchantRegistered event:', error);
      throw error;
    }
  }

  /**
   * Handle other events (implement as needed)
   */
  public async handleGroupDealCreated(event: any): Promise<void> {
    // Implementation similar to above
    logger.info('GroupDealCreated event received', event);
  }

  public async handleAuctionCreated(event: any): Promise<void> {
    // Implementation similar to above
    logger.info('AuctionCreated event received', event);
  }

  public async handleBadgeEarned(event: any): Promise<void> {
    // Implementation similar to above
    logger.info('BadgeEarned event received', event);
  }

  public async handleTicketGenerated(event: any): Promise<void> {
    // Implementation similar to above
    logger.info('TicketGenerated event received', event);
  }
}

export const eventHandlers = EventHandlersService.getInstance();
