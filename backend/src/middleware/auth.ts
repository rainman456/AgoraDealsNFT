import { Request, Response, NextFunction } from 'express';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';

/**
 * Simple API key authentication middleware
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required',
    });
    return;
  }

  // In production, validate against stored API keys
  // For now, just check if it exists
  next();
};

/**
 * Verify Solana wallet signature (optional enhancement)
 */
export const verifyWalletSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicKey, signature, message } = req.body;

    if (!publicKey || !signature || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing authentication parameters',
      });
      return;
    }

    // TODO: Implement signature verification using nacl
    // For now, just validate public key format
    try {
      new PublicKey(publicKey);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid public key',
      });
      return;
    }
  } catch (error) {
    logger.error('Signature verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
    return;
  }
};

/**
 * Rate limiting middleware (simple implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  };
};

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
