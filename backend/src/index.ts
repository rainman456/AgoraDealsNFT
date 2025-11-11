import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app';
import { getDatabaseConfig } from './config/database';
import { getSolanaConfig } from './config/solana';
import { logger } from './utils/logger';
import { BlockchainEventListenerService } from './services/blockchain-event-listener.service';
import { EventHandlersService } from './services/event-handlers.service';
import { BlockchainSyncService } from './services/blockchain-sync.service';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.API_PORT || 3001;

async function startServer() {
  try {
    // Initialize database connection
    logger.info('Connecting to database...');
    try {
      await getDatabaseConfig().connect();
      logger.info('✅ Database connection successful');
      
      // Wait longer for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify connection is actually ready
      const mongoose = await import('mongoose');
      const readyState = mongoose.default.connection.readyState;
      logger.info(`Database readyState after connect: ${readyState} (1=connected)`);
      logger.info(`Database name: ${mongoose.default.connection.name}`);
      logger.info(`Database host: ${mongoose.default.connection.host}`);
      
      if (readyState !== 1) {
        logger.error('⚠️ Database connection not ready - readyState:', readyState);
        logger.error('This will cause 500 errors on API requests');
      } else {
        logger.info('✅ Database fully connected and ready');
      }
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      logger.error('MongoDB URI check:', process.env.MONGODB_URI ? 'URI is set' : 'URI is missing');
      logger.error('Server will continue but API requests will return empty data');
    }

    // Initialize Solana connection
    logger.info('Initializing Solana connection...');
    try {
      const solanaConfig = getSolanaConfig();
      
      // Verify Solana connection is actually working
      const version = await solanaConfig.connection.getVersion();
      logger.info(`Connected to Solana: ${solanaConfig.connection.rpcEndpoint}`);
      logger.info(`Solana version: ${version['solana-core']}`);
      logger.info(`Program ID: ${solanaConfig.programId.toString()}`);
    } catch (error) {
      logger.warn('Solana connection failed, continuing without blockchain:', error);
    }

    // Setup blockchain event handlers
    await setupBlockchainEventHandlers();

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Solana Network: ${process.env.SOLANA_NETWORK || 'devnet'}`);
      const mongoUri = process.env.MONGODB_URI;
      if (mongoUri) {
        logger.info(`💾 MongoDB: ${mongoUri.substring(0, 20)}...${mongoUri.substring(mongoUri.length - 30)}`);
      } else {
        logger.warn('💾 MongoDB: Not configured');
      }

      // Start reconciliation cron job (every 5 minutes)
      startReconciliationJob();
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await getDatabaseConfig().disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await getDatabaseConfig().disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Setup blockchain event handlers
 */
async function setupBlockchainEventHandlers() {
  try {
    const blockchainEventListener = BlockchainEventListenerService.getInstance();
    const eventHandlers = EventHandlersService.getInstance();

    // Register all event handlers
    blockchainEventListener.on('PromotionCreated', async (event) => {
      await eventHandlers.handlePromotionCreated(event);
    });

    blockchainEventListener.on('CouponMinted', async (event) => {
      await eventHandlers.handleCouponMinted(event);
    });

    blockchainEventListener.on('CouponTransferred', async (event) => {
      await eventHandlers.handleCouponTransferred(event);
    });

    blockchainEventListener.on('CouponRedeemed', async (event) => {
      await eventHandlers.handleCouponRedeemed(event);
    });

    blockchainEventListener.on('CouponListed', async (event) => {
      await eventHandlers.handleCouponListed(event);
    });

    blockchainEventListener.on('CouponSold', async (event) => {
      await eventHandlers.handleCouponSold(event);
    });

    blockchainEventListener.on('ListingCancelled', async (event) => {
      await eventHandlers.handleListingCancelled(event);
    });

    blockchainEventListener.on('PromotionRated', async (event) => {
      await eventHandlers.handlePromotionRated(event);
    });

    blockchainEventListener.on('CommentAdded', async (event) => {
      await eventHandlers.handleCommentAdded(event);
    });

    blockchainEventListener.on('GroupDealCreated', async (event) => {
      await eventHandlers.handleGroupDealCreated(event);
    });

    blockchainEventListener.on('GroupDealJoined', async (event) => {
      await eventHandlers.handleGroupDealJoined(event);
    });

    blockchainEventListener.on('handleGroupDealCreated', async (event) => {
      await eventHandlers.handleGroupDealCreated(event);
    });

    blockchainEventListener.on('AuctionCreated', async (event) => {
      await eventHandlers.handleAuctionCreated(event);
    });

    blockchainEventListener.on('BidPlaced', async (event) => {
      await eventHandlers.handleBidPlaced(event);
    });

    // blockchainEventListener.on('AuctionEnded', async (event) => {
    //   await eventHandlers.handleAuctionEnded(event);
    // });

    blockchainEventListener.on('BadgeEarned', async (event) => {
      await eventHandlers.handleBadgeEarned(event);
    });

    blockchainEventListener.on('TicketGenerated', async (event) => {
      await eventHandlers.handleTicketGenerated(event);
    });

    // Start listening for events
    await blockchainEventListener.startListening();
    logger.info('✅ Blockchain event listener started');
  } catch (error) {
    logger.error('❌ Failed to start blockchain listener:', error);
    // Don't crash server, but log prominently
  }
}

/**
 * Start blockchain reconciliation cron job
 */
function startReconciliationJob() {
  const blockchainSync = BlockchainSyncService.getInstance();
  
  // Run every 5 minutes
  setInterval(async () => {
    logger.info('Running blockchain reconciliation...');
    try {
      await blockchainSync.reconcileRecentPromotions();
    } catch (error) {
      logger.error('Reconciliation job failed:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  logger.info('✅ Reconciliation job scheduled (every 5 minutes)');
}

startServer();
