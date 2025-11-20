import { Router } from 'express';
import { User } from '../models/user';
import { Merchant } from '../models/merchant';
import { walletService } from '../services/wallet.service';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Login endpoint - works for both users and merchants
 * POST /api/auth/login
 */
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Try to find user first
    let user = await User.findOne({ email });
    if (user) {
      // In a real app, you'd verify the password hash here
      // For now, we'll accept any password for demo purposes
      res.json({
        success: true,
        data: {
          type: 'user',
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
      return;
    }

    // Try to find merchant
    let merchant = await Merchant.findOne({ email });
    if (merchant) {
      // In a real app, you'd verify the password hash here
      res.json({
        success: true,
        data: {
          type: 'merchant',
          merchantId: merchant._id,
          walletAddress: merchant.walletAddress || merchant.onChainAddress,
          email: merchant.email,
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
      return;
    }

    // Neither user nor merchant found
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  } catch (error: any) {
    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

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
        user: {
          userId: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          tier: user.tier,
        }
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

    // Generate wallet for merchant
    const walletData = walletService.createWalletData();

    // Create merchant in database
    const merchant = new Merchant({
      email,
      walletAddress: walletData.publicKey,
      encryptedPrivateKey: walletData.encryptedPrivateKey,
      iv: walletData.iv,
      authTag: walletData.authTag,
      name,
      category,
      description,
      location,
    });

    await merchant.save();

    res.status(201).json({
      success: true,
      data: {
        merchant: {
          merchantId: merchant._id,
          email: merchant.email,
          walletAddress: merchant.walletAddress,
          name: merchant.name,
          category: merchant.category,
        }
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