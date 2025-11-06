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

export function createApp(): Application {
  const app = express();

  // Middleware - Allow all origins for prototype
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization,X-Wallet-Address');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
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
      logger.info(`📤 Response: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/marketplace', marketplaceRoutes);
  app.use('/api/v1/merchants', merchantRoutes);
  app.use('/api/v1/promotions', promotionRoutes);
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

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp();
