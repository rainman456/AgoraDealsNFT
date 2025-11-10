import { Router } from 'express';
import { User } from '../models/user';
import { Merchant } from '../models/merchant';
import { walletService } from '../services/wallet.service';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register/user
 */
router.post('/register/user', async (req, res) => {
  try {
    const { username, email } = req.body;

    // Generate wallet
    const walletData = walletService.createWalletData();

    // Create user
    const user = new User({
      walletAddress: walletData.publicKey,
      encryptedPrivateKey: walletData.encryptedPrivateKey,
      iv: walletData.iv,
      authTag: walletData.authTag,
      username,
      email,
    });

    await user.save();

    // Airdrop SOL for testing
    try {
      await walletService.airdropSol(new PublicKey(walletData.publicKey), 1000);
    } catch (airdropError) {
      logger.warn('Airdrop failed (may not be on localnet):', airdropError);
    }

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        tier: user.tier,
      },
    });
  } catch (error: any) {
    logger.error('User registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register user',
    });
  }
});

/**
 * Register a new merchant
 * POST /api/auth/register/merchant
 */
router.post('/register/merchant', async (req, res): Promise<void> => {
  try {
    const { name, email, category, description, location } = req.body;

    if (!name || !email || !category) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and category are required',
      });
      return;
    }

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      res.status(400).json({
        success: false,
        error: 'Merchant with this email already exists',
      });
      return;
    }

    // Create merchant in database (simplified - no blockchain)
    const merchant = new Merchant({
      email,
      name,
      category,
      description,
      location,
    });

    await merchant.save();

    res.status(201).json({
      success: true,
      data: {
        merchantId: merchant._id,
        email: merchant.email,
        name: merchant.name,
        category: merchant.category,
      },
    });
  } catch (error: any) {
    logger.error('Merchant registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register merchant',
    });
  }
});

/**
 * Get user by wallet address
 * GET /api/auth/user/:walletAddress
 */
router.get('/user/:walletAddress', async (req, res): Promise<void> => {
  try {
    const user = await User.findOne({ walletAddress: req.params.walletAddress });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        tier: user.tier,
        totalPurchases: user.totalPurchases,
        totalRedemptions: user.totalRedemptions,
        reputationScore: user.reputationScore,
        badgesEarned: user.badgesEarned,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user',
    });
  }
});

/**
 * Get merchant by wallet address
 * GET /api/auth/merchant/:walletAddress
 */
router.get('/merchant/:walletAddress', async (req, res): Promise<void> => {
  try {
    const merchant = await Merchant.findOne({ walletAddress: req.params.walletAddress });
    
    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        merchantId: merchant._id,
        walletAddress: merchant.walletAddress,
        onChainAddress: merchant.onChainAddress,
        name: merchant.name,
        category: merchant.category,
        description: merchant.description,
        location: merchant.location,
        totalCouponsCreated: merchant.totalCouponsCreated,
        totalCouponsRedeemed: merchant.totalCouponsRedeemed,
        averageRating: merchant.averageRating,
        isActive: merchant.isActive,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch merchant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch merchant',
    });
  }
});

export default router;
