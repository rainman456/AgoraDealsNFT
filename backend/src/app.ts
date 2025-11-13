import express, { Application } from 'express';
import { errorHandler } from './middleware/validation';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import marketplaceRoutes from './routes/marketplace';
import merchantRoutes from './routes/merchant';
import promotionRoutes from './routes/promotions';
import couponRoutes from './routes/coupons';
import redemptionRoutes from './routes/redemption';
import externalRoutes from './routes/external';
import ratingRoutes from './routes/ratings';
import userStatsRoutes from './routes/user-stats';
import stakingRoutes from './routes/staking';
import badgeRoutes from './routes/badges';
import redemptionTicketRoutes from './routes/redemption-tickets';
import groupDealRoutes from './routes/group-deals';
import auctionRoutes from './routes/auctions';
import merchantDashboardRoutes from './routes/merchant-dashboard';
import socialRoutes from './routes/social';
//import commentRoutes from './routes/comments';
import externalDealRoutes from './routes/external-deals';
import listingRoutes from './routes/listings';

export function createApp(): Application {
  const app = express();

  // Middleware - Allow all origins for prototype
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Wallet-Address, X-Request-Timestamp');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files (uploaded images)
  app.use('/uploads', express.static('uploads'));

  // Request logging with detailed information
  app.use((req, res, next) => {
    const start = Date.now();
    
    logger.info(`📥 Incoming Request: ${req.method} ${req.path}`, {
      ip: req.ip,
      origin: req.get('origin'),
      userAgent: req.get('user-agent'),
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusEmoji = res.statusCode >= 500 ? '❌' : res.statusCode >= 400 ? '⚠️' : '✅';
      logger.info(`📤 Response: ${req.method} ${req.path} - ${statusEmoji} ${res.statusCode} (${duration}ms)`);
      
      if (res.statusCode >= 500) {
        logger.error(`500 ERROR on ${req.method} ${req.path}`);
        logger.error('Query:', req.query);
        logger.error('This indicates an unhandled error in the route or middleware');
      }
    });
    
    next();
  });

  // Health check
  app.get('/health', async (_req, res) => {
    try {
      const mongoose = await import('mongoose');
      const dbState = mongoose.default.connection.readyState;
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbState === 1,
          readyState: dbState,
          readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
          name: mongoose.default.connection.name,
          host: mongoose.default.connection.host,
        },
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // API routes with error handling
  try {
    logger.info('Registering API routes...');
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/upload', uploadRoutes);
    app.use('/api/v1/marketplace', marketplaceRoutes);
    app.use('/api/v1/merchants', merchantRoutes);
    
    logger.info('Registering promotions route...');
    app.use('/api/v1/promotions', (req, _res, next) => {
      logger.info(`Promotions middleware: ${req.method} ${req.path}`);
      next();
    }, promotionRoutes);
    
    app.use('/api/v1/coupons', couponRoutes);
    app.use('/api/v1/redemption', redemptionRoutes);
    app.use('/api/v1/external', externalRoutes);
    app.use('/api/v1/ratings', ratingRoutes);
    app.use('/api/v1/user-stats', userStatsRoutes);
    app.use('/api/v1/staking', stakingRoutes);
    app.use('/api/v1/badges', badgeRoutes);
    app.use('/api/v1/redemption-tickets', redemptionTicketRoutes);
    app.use('/api/v1/group-deals', groupDealRoutes);
    app.use('/api/v1/auctions', auctionRoutes);
    app.use('/api/v1/merchant-dashboard', merchantDashboardRoutes);
    app.use('/api/v1/social', socialRoutes);
    //app.use('/api/v1', commentRoutes);
    app.use('/api/v1/external-deals', externalDealRoutes);
    app.use('/api/v1/listings', listingRoutes);
    logger.info('✅ All routes registered successfully');
  } catch (error) {
    logger.error('Error registering routes:', error);
    throw error;
  }

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Catch-all error handler before the final error handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('=== GLOBAL ERROR HANDLER TRIGGERED ===');
    logger.error('Error:', err);
    logger.error('Request:', { method: req.method, path: req.path, query: req.query });
    logger.error('Error type:', typeof err);
    logger.error('Error name:', err?.name);
    logger.error('Error message:', err?.message);
    logger.error('Error stack:', err?.stack);
    
    if (!res.headersSent) {
      // For promotion list requests, return empty data instead of error
      if (req.path.includes('/promotions') && req.method === 'GET') {
        logger.info('Returning empty promotions list from global error handler');
        res.status(200).json({
          success: true,
          data: {
            promotions: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      }
    } else {
      logger.error('Headers already sent, cannot send error response');
    }
  });
  
  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp();
