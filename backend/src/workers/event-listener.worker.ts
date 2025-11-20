import { blockchainEventListener } from '../services/blockchain-event-listener.service';
import { eventHandlers } from '../services/event-handlers.service';
import { blockchainSync } from '../services/blockchain-sync.service';
import { logger } from '../utils/logger';
import { getDatabaseConfig } from '../config/database';

/**
 * Event Listener Worker
 * 
 * Standalone worker process that:
 * 1. Listens to blockchain events
 * 2. Processes events with retry logic
 * 3. Runs periodic reconciliation
 */

class EventListenerWorker {
  private reconciliationInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

 async start(options: { backfillFromSlot?: number; skipBackfill?: boolean } = {}): Promise<void> {
  try {
    logger.info('🚀 Starting Event Listener Worker...');

    // Connect to database
    await getDatabaseConfig().connect();
    logger.info('✅ Database connected');

    // Register event handlers
    this.registerEventHandlers();

    // Check if we need to backfill
    if (!options.skipBackfill) {
      const syncStatus = await SyncStatus.findOne({ service: 'event-listener' });
      const currentSlot = await blockchainEventListener['connection'].getSlot('finalized');
      
      if (syncStatus && syncStatus.lastProcessedSlot > 0) {
        const slotDifference = currentSlot - syncStatus.lastProcessedSlot;
        
        if (slotDifference > 100) {
          logger.info(`Detected ${slotDifference} slots to backfill. Starting backfill...`);
          
          try {
            await blockchainEventListener.backfillEvents(
              syncStatus.lastProcessedSlot,
              currentSlot
            );
            logger.info('✅ Backfill complete');
          } catch (error) {
            logger.error('Backfill failed, continuing with live events:', error);
          }
        }
      } else if (options.backfillFromSlot) {
        logger.info(`Backfilling from slot ${options.backfillFromSlot}...`);
        
        try {
          await blockchainEventListener.backfillEvents(options.backfillFromSlot, currentSlot);
          logger.info('✅ Backfill complete');
        } catch (error) {
          logger.error('Backfill failed, continuing with live events:', error);
        }
      }
    }

    // Start listening to blockchain events
    await blockchainEventListener.startListening();

    // Start periodic reconciliation (every 5 minutes)
    this.startReconciliation();

    // Start health monitoring
    this.startHealthMonitoring();

    // Handle graceful shutdown
    this.setupShutdownHandlers();

    logger.info('✅ Event Listener Worker started successfully');
  } catch (error) {
    logger.error('Failed to start Event Listener Worker:', error);
    process.exit(1);
  }
}





private startHealthMonitoring(): void {
  setInterval(async () => {
    try {
      const status = blockchainEventListener.getStatus();
      
      if (!status.isListening) {
        logger.warn('⚠️  Event listener is not active. Attempting restart...');
        await blockchainEventListener.startListening();
      }
      
      // Check database connection
      const db = getDatabaseConfig();
      if (!db.getConnectionStatus()) {
        logger.warn('⚠️  Database disconnected. Attempting reconnect...');
        await db.connect();
      }
      
      logger.debug('Health check passed', {
        listening: status.isListening,
        lastSlot: status.lastProcessedSlot,
        errors: status.errorCount,
      });
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }, 60000); // Every minute
}



// FIX: Add failed event logging
private async logFailedEvent(error: any): Promise<void> {
  try {
    // You could create a FailedEvent model to track these
    logger.error('Permanently failed event:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    });
    
    // TODO: Implement dead letter queue or alert mechanism
  } catch (logError) {
    logger.error('Failed to log failed event:', logError);
  }
}

  private registerEventHandlers(): void {
  // Core events
  blockchainEventListener.on('PromotionCreated', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handlePromotionCreated(event));
  });

  blockchainEventListener.on('CouponMinted', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCouponMinted(event));
  });

  blockchainEventListener.on('CouponTransferred', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCouponTransferred(event));
  });

  blockchainEventListener.on('CouponRedeemed', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCouponRedeemed(event));
  });

  // Marketplace events
  blockchainEventListener.on('CouponListed', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCouponListed(event));
  });

  blockchainEventListener.on('CouponSold', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCouponSold(event));
  });

  blockchainEventListener.on('ListingCancelled', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleListingCancelled(event));
  });

  // Rating and comments
  blockchainEventListener.on('PromotionRated', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handlePromotionRated(event));
  });

  blockchainEventListener.on('CommentAdded', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCommentAdded(event));
  });

  blockchainEventListener.on('CommentLiked', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleCommentLiked(event));
  });

  // Merchant events
  blockchainEventListener.on('MerchantRegistered', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleMerchantRegistered(event));
  });

  // Group deal events
  blockchainEventListener.on('GroupDealCreated', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleGroupDealCreated(event));
  });

  blockchainEventListener.on('GroupDealJoined', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleGroupDealJoined(event));
  });

  blockchainEventListener.on('GroupDealFinalized', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleGroupDealFinalized(event));
  });

  blockchainEventListener.on('GroupDealRefunded', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleGroupDealRefunded(event));
  });

  // Auction events
  blockchainEventListener.on('AuctionCreated', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleAuctionCreated(event));
  });

  blockchainEventListener.on('BidPlaced', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleBidPlaced(event));
  });

  blockchainEventListener.on('AuctionFinalized', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleAuctionFinalized(event));
  });

  blockchainEventListener.on('AuctionCancelled', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleAuctionCancelled(event));
  });

  // Badge and reputation events
  blockchainEventListener.on('BadgeEarned', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleBadgeEarned(event));
  });

  // Redemption ticket events
  blockchainEventListener.on('TicketGenerated', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleTicketGenerated(event));
  });

  blockchainEventListener.on('TicketRedeemed', async (event) => {
    await this.handleEventWithRetry(() => eventHandlers.handleTicketRedeemed(event));
  });

  // System events
  blockchainEventListener.on('transaction-finalized', async (event) => {
    logger.info(`✅ Transaction finalized: ${event.signature}`);
  });

  blockchainEventListener.on('potential-reorg', async (event) => {
    logger.warn(`⚠️  Potential reorg detected for ${event.signature}`);
    await this.handlePotentialReorg(event);
  });

  blockchainEventListener.on('parse-error', async (event) => {
    logger.error(`Failed to parse event for ${event.signature}`, event.error);
  });

  blockchainEventListener.on('high-error-rate', async (event) => {
    logger.error(`🚨 HIGH ERROR RATE detected:`, event);
    // Could trigger alerts here
  });

  blockchainEventListener.on('max-reconnect-attempts-reached', () => {
    logger.error('❌ Max reconnection attempts reached. Shutting down worker.');
    this.shutdown();
  });

  logger.info('✅ Event handlers registered');
}


private async handlePotentialReorg(event: any): Promise<void> {
  try {
    logger.warn(`Handling potential reorg for event: ${event.eventName}`);
    
    // Re-sync affected data based on event type
    switch (event.eventName) {
      case 'PromotionCreated':
        if (event.eventData.promotion) {
          await blockchainSync.syncPromotion(event.eventData.promotion.toString());
        }
        break;
        
      case 'CouponMinted':
        if (event.eventData.coupon) {
          await blockchainSync.syncCoupon(event.eventData.coupon.toString());
        }
        break;
        
      default:
        logger.info(`No specific reorg handler for ${event.eventName}`);
    }
  } catch (error) {
    logger.error('Error handling potential reorg:', error);
  }
}



  /**
   * Handle event with retry logic
   */
  private async handleEventWithRetry(
  handler: () => Promise<void>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<void> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      await handler();
      return;
    } catch (error: any) {
      attempts++;
      
      // Don't retry on these errors
      const nonRetryableErrors = [
        'already exists',
        'duplicate key',
        'already processed',
      ];
      
      if (nonRetryableErrors.some(msg => error.message?.toLowerCase().includes(msg))) {
        logger.warn('Non-retryable error, skipping:', error.message);
        return;
      }
      
      logger.error(`Event handler failed (attempt ${attempts}/${maxRetries}):`, error);

      if (attempts < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempts - 1); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error('Max retry attempts reached for event handler');
        
        // Log to dead letter queue or alert system
        await this.logFailedEvent(error);
      }
    }
  }
}


  /**
   * Start periodic reconciliation
   */
  private startReconciliation(): void {
    // Run reconciliation every 5 minutes
    this.reconciliationInterval = setInterval(async () => {
      try {
        logger.info('Running periodic reconciliation...');
        await blockchainSync.reconcileAll();
      } catch (error) {
        logger.error('Reconciliation failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('✅ Periodic reconciliation started (every 5 minutes)');
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        this.shutdown();
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown();
    });
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    try {
      logger.info('Stopping event listener...');
      await blockchainEventListener.stopListening();

      if (this.reconciliationInterval) {
        clearInterval(this.reconciliationInterval);
      }

      logger.info('Closing database connection...');
      await getDatabaseConfig().disconnect();

      logger.info('✅ Worker shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start worker if this file is run directly
// Start worker
const worker = new EventListenerWorker();
worker.start();

export default EventListenerWorker;
