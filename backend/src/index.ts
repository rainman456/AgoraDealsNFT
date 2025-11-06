import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app';
import { getDatabaseConfig } from './config/database';
import { getSolanaConfig } from './config/solana';
import { logger } from './utils/logger';

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
    await getDatabaseConfig().connect();

    // Initialize Solana connection
    logger.info('Initializing Solana connection...');
    const solanaConfig = getSolanaConfig();
    try {
      const version = await solanaConfig.connection.getVersion();
      logger.info(`Connected to Solana: ${solanaConfig.connection.rpcEndpoint}`);
      logger.info(`Solana version: ${version['solana-core']}`);
      logger.info(`Program ID: ${solanaConfig.programId.toString()}`);
    } catch (error) {
      logger.error('Failed to connect to Solana RPC:', error);
      throw new Error(`Solana RPC connection failed. Make sure your validator is running at ${solanaConfig.connection.rpcEndpoint}`);
    }

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Solana Network: ${process.env.SOLANA_NETWORK || 'localnet'}`);
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
