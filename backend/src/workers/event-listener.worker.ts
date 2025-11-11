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

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Event Listener Worker...');

      // Connect to database
      await getDatabaseConfig().connect();
      logger.info('✅ Database connected');

      // Register event handlers
      this.registerEventHandlers();

      // Start listening to blockchain events
      await blockchainEventListener.startListening();

      // Start periodic reconciliation (every 5 minutes)
      this.startReconciliation();

      // Handle graceful shutdown
      this.setupShutdownHandlers();

      logger.info('✅ Event Listener Worker started successfully');
    } catch (error) {
      logger.error('Failed to start Event Listener Worker:', error);
      process.exit(1);
    }
  }

  private registerEventHandlers(): void {
    // Register handlers for each event type
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

    blockchainEventListener.on('CouponListed', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleCouponListed(event));
    });

    blockchainEventListener.on('CouponSold', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleCouponSold(event));
    });

    blockchainEventListener.on('ListingCancelled', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleListingCancelled(event));
    });

    blockchainEventListener.on('PromotionRated', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handlePromotionRated(event));
    });

    blockchainEventListener.on('CommentAdded', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleCommentAdded(event));
    });

    blockchainEventListener.on('MerchantRegistered', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleMerchantRegistered(event));
    });

    blockchainEventListener.on('GroupDealCreated', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleGroupDealCreated(event));
    });

    blockchainEventListener.on('AuctionCreated', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleAuctionCreated(event));
    });

    blockchainEventListener.on('BadgeEarned', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleBadgeEarned(event));
    });

    blockchainEventListener.on('TicketGenerated', async (event) => {
      await this.handleEventWithRetry(() => eventHandlers.handleTicketGenerated(event));
    });

    // Handle finalized events
    blockchainEventListener.on('transaction-finalized', async (event) => {
      logger.info(`Transaction finalized: ${event.signature}`);
      // Could trigger additional processing here
    });

    // Handle potential reorgs
    blockchainEventListener.on('potential-reorg', async (event) => {
      logger.warn(`⚠️  Potential reorg detected for ${event.signature}`);
      // Trigger reconciliation for affected data
      if (event.eventName === 'PromotionCreated' && event.eventData.promotion) {
        await blockchainSync.syncPromotion(event.eventData.promotion.toString());
      }
    });

    // Handle max reconnect attempts
    blockchainEventListener.on('max-reconnect-attempts-reached', () => {
      logger.error('❌ Max reconnection attempts reached. Shutting down worker.');
      this.shutdown();
    });

    logger.info('✅ Event handlers registered');
  }

  /**
   * Handle event with retry logic
   */
  private async handleEventWithRetry(
    handler: () => Promise<void>,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await handler();
        return;
      } catch (error) {
        attempts++;
        logger.error(`Event handler failed (attempt ${attempts}/${maxRetries}):`, error);

        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        } else {
          logger.error('Max retry attempts reached for event handler');
          // Could send alert here
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
