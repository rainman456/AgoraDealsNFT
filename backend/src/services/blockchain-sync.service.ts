import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaConfig } from '../config/solana';
import { logger } from '../utils/logger';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
// import { Merchant } from '../models/merchant';
// import { Listing } from '../models/listing';

/**
 * Blockchain Sync Service
 * 
 * Reconciles MongoDB state with blockchain state.
 * Handles data consistency and recovery from failures.
 */
export class BlockchainSyncService {
  private static instance: BlockchainSyncService;
  private connection: Connection;
  private program: any;

  private constructor() {
    const config = getSolanaConfig();
    this.connection = config.connection;
    this.program = config.program;
  }

  public static getInstance(): BlockchainSyncService {
    if (!BlockchainSyncService.instance) {
      BlockchainSyncService.instance = new BlockchainSyncService();
    }
    return BlockchainSyncService.instance;
  }

  /**
   * Sync a single promotion from blockchain to database
   */
  public async syncPromotion(promotionAddress: string): Promise<void> {
  try {
    const promotionPubkey = new PublicKey(promotionAddress);
    
    // Fetch from blockchain with retry
    let onChainData: any;
    try {
      onChainData = await this.program.account.promotion.fetch(promotionPubkey);
    } catch (error: any) {
      if (error.message?.includes('Account does not exist')) {
        logger.warn(`Promotion ${promotionAddress} no longer exists on chain - marking as orphaned`);
        
        await Promotion.updateOne(
          { onChainAddress: promotionAddress },
          {
            $set: {
              isActive: false,
              // Add orphaned fields if they exist in your schema
            },
          }
        );
        return;
      }
      throw error;
    }

    const dbPromotion = await Promotion.findOne({ onChainAddress: promotionAddress });

    if (!dbPromotion) {
      logger.warn(`Promotion not found in DB: ${promotionAddress} - creating from chain data`);
      
      // Create from blockchain data
      await Promotion.create({
        onChainAddress: promotionAddress,
        merchant: onChainData.merchant.toString(),
        title: 'Synced Promotion',
        description: '',
        category: 'general',
        discountPercentage: onChainData.discountPercentage,
        maxSupply: onChainData.maxSupply,
        currentSupply: onChainData.currentSupply,
        price: onChainData.price ? Number(onChainData.price.toString()) : 0,
        expiryTimestamp: new Date(onChainData.expiryTimestamp.toNumber() * 1000),
        isActive: onChainData.isActive,
        imageUrl: '',
        stats: {
          totalMinted: onChainData.currentSupply,
          totalRedeemed: 0,
          averageRating: 0,
          totalRatings: 0,
          totalComments: 0,
        },
      });
      
      logger.info(`✅ Created promotion from chain data: ${promotionAddress}`);
      return;
    }

    // Check for discrepancies
    const discrepancies: string[] = [];

    if (dbPromotion.currentSupply !== onChainData.currentSupply) {
      discrepancies.push(
        `currentSupply: DB=${dbPromotion.currentSupply}, Chain=${onChainData.currentSupply}`
      );
    }

    if (dbPromotion.isActive !== onChainData.isActive) {
      discrepancies.push(
        `isActive: DB=${dbPromotion.isActive}, Chain=${onChainData.isActive}`
      );
    }

    if (discrepancies.length > 0) {
      logger.warn(`Discrepancies found for promotion ${promotionAddress}:`, discrepancies);

      // Update DB to match blockchain (blockchain is source of truth)
      await Promotion.updateOne(
        { onChainAddress: promotionAddress },
        {
          $set: {
            currentSupply: onChainData.currentSupply,
            isActive: onChainData.isActive,
            'stats.totalMinted': onChainData.currentSupply,
          },
        }
      );

      logger.info(`✅ Synced promotion ${promotionAddress} from blockchain`);
    } else {
      logger.debug(`Promotion ${promotionAddress} is in sync`);
    }
  } catch (error) {
    logger.error(`Error syncing promotion ${promotionAddress}:`, error);
    throw error;
  }
}



public async syncPromotionsBatch(addresses: string[]): Promise<void> {
  logger.info(`Starting batch sync for ${addresses.length} promotions`);
  
  const batchSize = 10;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(address => 
        this.syncPromotion(address).catch(error => {
          logger.error(`Failed to sync promotion ${address}:`, error);
        })
      )
    );
    
    // Rate limiting between batches
    if (i + batchSize < addresses.length) {

 await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  logger.info('✅ Batch sync complete');
}


  /**
   * Wait for transaction finality before marking DB records as confirmed
   */
  public async waitForFinality(signature: string, maxWaitSeconds = 60): Promise<boolean> {
  const startTime = Date.now();
  let lastStatus: string = 'unknown';
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    try {
      const status = await this.connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (!status || !status.value) {
        logger.debug(`No status found for ${signature}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const currentStatus = status.value.confirmationStatus || 'unknown';
      
      if (currentStatus !== lastStatus) {
        logger.info(`Transaction ${signature} status: ${currentStatus}`);
        lastStatus = currentStatus;
      }

      if (currentStatus === 'finalized') {
        logger.info(`✅ Transaction finalized: ${signature}`);
        return true;
      }

      if (status.value.err) {
        logger.error(`❌ Transaction failed: ${signature}`, status.value.err);
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error(`Error checking finality for ${signature}:`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  logger.warn(`⏱️ Finality timeout for ${signature} after ${maxWaitSeconds}s`);
  return false;
}


  /**
   * Verify transaction finality (legacy method - use waitForFinality instead)
   */
  public async verifyTransactionFinality(signature: string): Promise<boolean> {
    return this.waitForFinality(signature);
  }

  /**
   * Sync a single coupon from blockchain to database
   */
  public async syncCoupon(couponAddress: string): Promise<void> {
    try {
      const couponPubkey = new PublicKey(couponAddress);
      const onChainData = await this.program.account.coupon.fetch(couponPubkey);

      const dbCoupon = await Coupon.findOne({ onChainAddress: couponAddress });

      if (!dbCoupon) {
        logger.warn(`Coupon not found in DB: ${couponAddress}`);
        return;
      }

      // Check for discrepancies
      const discrepancies: string[] = [];

      if (dbCoupon.owner !== onChainData.owner.toString()) {
        discrepancies.push(
          `owner: DB=${dbCoupon.owner}, Chain=${onChainData.owner.toString()}`
        );
      }

      if (dbCoupon.isRedeemed !== onChainData.isRedeemed) {
        discrepancies.push(
          `isRedeemed: DB=${dbCoupon.isRedeemed}, Chain=${onChainData.isRedeemed}`
        );
      }

      if (discrepancies.length > 0) {
        logger.warn(`Discrepancies found for coupon ${couponAddress}:`, discrepancies);

        // Update DB to match blockchain
        await Coupon.updateOne(
          { onChainAddress: couponAddress },
          {
            $set: {
              owner: onChainData.owner.toString(),
              isRedeemed: onChainData.isRedeemed,
              lastSyncedAt: new Date(),
            },
          }
        );

        logger.info(`✅ Synced coupon ${couponAddress} from blockchain`);
      }
    } catch (error) {
      logger.error(`Error syncing coupon ${couponAddress}:`, error);
      throw error;
    }
  }

  /**
   * Find and clean up orphaned data
   * (Data in MongoDB that doesn't exist on blockchain)
   */
  public async cleanupOrphanedData(): Promise<void> {
    try {
      logger.info('Starting orphaned data cleanup...');

      // Check promotions
      const promotions = await Promotion.find({ onChainAddress: { $ne: 'pending' } });
      let orphanedPromotions = 0;

      for (const promotion of promotions) {
        try {
          const promotionPubkey = new PublicKey(promotion.onChainAddress);
          await this.program.account.promotion.fetch(promotionPubkey);
        } catch (error: any) {
          if (error.message?.includes('Account does not exist')) {
            logger.warn(`Orphaned promotion found: ${promotion.onChainAddress}`);
            orphanedPromotions++;
            
            // Mark as orphaned instead of deleting (for audit trail)
            await Promotion.updateOne(
              { _id: promotion._id },
              {
                $set: {
                  isOrphaned: true,
                  orphanedAt: new Date(),
                },
              }
            );
          }
        }
      }

      // Check coupons
      const coupons = await Coupon.find({ onChainAddress: { $ne: 'pending' } });
      let orphanedCoupons = 0;

      for (const coupon of coupons) {
        try {
          const couponPubkey = new PublicKey(coupon.onChainAddress);
          await this.program.account.coupon.fetch(couponPubkey);
        } catch (error: any) {
          if (error.message?.includes('Account does not exist')) {
            logger.warn(`Orphaned coupon found: ${coupon.onChainAddress}`);
            orphanedCoupons++;
            
            await Coupon.updateOne(
              { _id: coupon._id },
              {
                $set: {
                  isOrphaned: true,
                  orphanedAt: new Date(),
                },
              }
            );
          }
        }
      }

      logger.info(`Cleanup complete: ${orphanedPromotions} promotions, ${orphanedCoupons} coupons marked as orphaned`);
    } catch (error) {
      logger.error('Error during orphaned data cleanup:', error);
      throw error;
    }
  }



  /**
   * Reconcile recent promotions against blockchain state
   * Run this every 5 minutes via cron
   */
  public async reconcileRecentPromotions(): Promise<void> {
    try {
      // Check last 1 hour of promotions
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPromotions = await Promotion.find({
        createdAt: { $gte: oneHourAgo },
        onChainAddress: { $ne: 'pending' },
      });

      logger.info(`Reconciling ${recentPromotions.length} recent promotions...`);

      for (const promo of recentPromotions) {
        try {
          const promoPubkey = new PublicKey(promo.onChainAddress);
          const onChainData = await this.program.account.promotion.fetch(promoPubkey);

          // Check for discrepancies
          if (promo.currentSupply !== onChainData.currentSupply) {
            logger.warn(`🔄 Reconciling promotion ${promo.onChainAddress}`);
            await Promotion.updateOne(
              { _id: promo._id },
              { 
                $set: { 
                  currentSupply: onChainData.currentSupply,
                  lastReconciledAt: new Date(),
                }
              }
            );
          }

        } catch (error: any) {
          if (error.message?.includes('Account does not exist')) {
            logger.error(`⚠️ REORG DETECTED: Promotion ${promo.onChainAddress} no longer on chain!`);
            await Promotion.updateOne(
              { _id: promo._id },
              { 
                $set: { 
                  isOrphaned: true,
                  orphanedAt: new Date(),
                  orphanReason: 'block_reorg',
                }
              }
            );
          }
        }
      }

      logger.info('✅ Reconciliation complete');
    } catch (error) {
      logger.error('Reconciliation failed:', error);
    }
  }

  /**
   * Reconcile all data (run periodically)
   */
  public async reconcileAll(): Promise<void> {
    try {
      logger.info('Starting full reconciliation...');

      // Sync all promotions
      const promotions = await Promotion.find({ 
        onChainAddress: { $ne: 'pending' },
        isOrphaned: { $ne: true },
      });

      for (const promotion of promotions) {
        await this.syncPromotion(promotion.onChainAddress);
      }

      // Sync all coupons
      const coupons = await Coupon.find({ 
        onChainAddress: { $ne: 'pending' },
        isOrphaned: { $ne: true },
      });

      for (const coupon of coupons) {
        await this.syncCoupon(coupon.onChainAddress);
      }

      // Cleanup orphaned data
      await this.cleanupOrphanedData();

      logger.info('✅ Full reconciliation complete');
    } catch (error) {
      logger.error('Error during reconciliation:', error);
      throw error;
    }
  }
}

export const blockchainSync = BlockchainSyncService.getInstance();
