import dotenv from 'dotenv';
import { createApp } from './app';
import { getDatabaseConfig } from './config/database';
import { getSolanaConfig } from './config/solana';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.API_PORT || 3001;

async function startServer() {
  try {
    // Initialize database connection
    logger.info('Connecting to database...');
    await getDatabaseConfig().connect();

    // Initialize Solana connection
    logger.info('Initializing Solana connection...');
    const solanaConfig = getSolanaConfig();
    logger.info(`Connected to Solana: ${solanaConfig.connection.rpcEndpoint}`);
    logger.info(`Program ID: ${solanaConfig.programId.toString()}`);

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Solana Network: ${process.env.SOLANA_NETWORK || 'devnet'}`);
      logger.info(`💾 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/discount-platform'}`);
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

startServer();
