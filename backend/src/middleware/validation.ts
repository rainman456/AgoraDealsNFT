import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Validate Solana public key format
 */
export const validatePublicKey = (value: string) => {
  const publicKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!publicKeyRegex.test(value)) {
    throw new Error('Invalid Solana public key format');
  }
  return value;
};

/**
 * Merchant registration validation schema
 */
export const merchantRegistrationSchema = Joi.object({
  publicKey: Joi.string().custom(validatePublicKey).required(),
  name: Joi.string().min(1).max(50).required(),
  category: Joi.string().min(1).max(30).required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

/**
 * Promotion creation validation schema
 */
export const promotionCreationSchema = Joi.object({
  merchantPublicKey: Joi.string().custom(validatePublicKey).required(),
  promotionId: Joi.number().integer().min(0).required(),
  discountPercentage: Joi.number().integer().min(1).max(100).required(),
  maxSupply: Joi.number().integer().min(1).required(),
  expiryTimestamp: Joi.number().integer().min(Date.now() / 1000).required(),
  category: Joi.string().min(1).max(30).required(),
  description: Joi.string().min(1).max(200).required(),
  price: Joi.number().integer().min(0).required(),
});

/**
 * Coupon minting validation schema
 */
export const couponMintingSchema = Joi.object({
  promotionAddress: Joi.string().custom(validatePublicKey).required(),
  recipientPublicKey: Joi.string().custom(validatePublicKey).required(),
  couponId: Joi.number().integer().min(0).required(),
});

/**
 * Redemption validation schema
 */
export const redemptionSchema = Joi.object({
  couponAddress: Joi.string().custom(validatePublicKey).required(),
  userPublicKey: Joi.string().custom(validatePublicKey).required(),
  merchantPublicKey: Joi.string().custom(validatePublicKey).required(),
});

/**
 * Rating validation schema
 */
export const ratingSchema = Joi.object({
  promotionAddress: Joi.string().custom(validatePublicKey).required(),
  userPublicKey: Joi.string().custom(validatePublicKey).required(),
  stars: Joi.number().integer().min(1).max(5).required(),
});

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed:', errors);

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
