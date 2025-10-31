import mongoose from 'mongoose';
import { User } from '../models/user';
import { Merchant } from '../models/merchant';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
import { walletService } from '../services/wallet.service';
import { getSolanaConfig } from '../config/solana';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { logger } from '../utils/logger';
import BN from 'bn.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/discount-platform';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Merchant.deleteMany({});
    await Promotion.deleteMany({});
    await Coupon.deleteMany({});
    logger.info('Cleared existing data');

    const config = getSolanaConfig();

    // Initialize marketplace if needed
    try {
      const [marketplacePDA] = config.getMarketplacePDA();
      const marketplaceAccount = await config.program.account.marketplace.fetchNullable(marketplacePDA);
      
      if (!marketplaceAccount) {
        logger.info('Initializing marketplace...');
        await config.program.methods
          .initialize()
          .accounts({
            authority: config.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();
        logger.info('Marketplace initialized');
      }
    } catch (error) {
      logger.warn('Marketplace initialization skipped:', error);
    }

    // Create test users
    logger.info('Creating test users...');
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const walletData = walletService.createWalletData();
      
      // Airdrop SOL
      try {
        await walletService.airdropSol(new PublicKey(walletData.publicKey), 2);
      } catch (e) {
        logger.warn(`Airdrop failed for user ${i}`);
      }

      const user = new User({
        walletAddress: walletData.publicKey,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        iv: walletData.iv,
        authTag: walletData.authTag,
        username: `user${i}`,
        email: `user${i}@test.com`,
        tier: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][i - 1],
        preferences: {
          categories: ['Food', 'Shopping', 'Travel'],
          locationEnabled: true,
          notifications: true,
        },
      });

      await user.save();
      users.push(user);
      logger.info(`Created user: ${user.username}`);
    }

    // Create test merchants
    logger.info('Creating test merchants...');
    const merchantsData = [
      {
        name: 'Pizza Paradise',
        category: 'Food & Dining',
        description: 'Best pizza in town with authentic Italian recipes',
        location: { latitude: 40.7128, longitude: -74.0060, address: '123 Main St, New York, NY' },
      },
      {
        name: 'Fashion Hub',
        category: 'Shopping',
        description: 'Trendy clothing and accessories for all ages',
        location: { latitude: 34.0522, longitude: -118.2437, address: '456 Fashion Ave, Los Angeles, CA' },
      },
      {
        name: 'Tech Store',
        category: 'Electronics',
        description: 'Latest gadgets and electronics at great prices',
        location: { latitude: 37.7749, longitude: -122.4194, address: '789 Tech Blvd, San Francisco, CA' },
      },
      {
        name: 'Spa Retreat',
        category: 'Wellness',
        description: 'Relaxation and rejuvenation services',
        location: { latitude: 25.7617, longitude: -80.1918, address: '321 Wellness Way, Miami, FL' },
      },
      {
        name: 'Adventure Tours',
        category: 'Travel',
        description: 'Exciting travel packages and guided tours',
        location: { latitude: 36.1699, longitude: -115.1398, address: '654 Adventure Rd, Las Vegas, NV' },
      },
    ];

    const merchants = [];
    for (const merchantData of merchantsData) {
      const walletData = walletService.createWalletData();
      const publicKey = new PublicKey(walletData.publicKey);

      // Airdrop SOL
      try {
        await walletService.airdropSol(publicKey, 5);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for airdrop
      } catch (e) {
        logger.warn(`Airdrop failed for merchant ${merchantData.name}`);
      }

      // Register merchant on-chain
      const merchantKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        iv: walletData.iv,
        authTag: walletData.authTag,
      });

      const [merchantPDA] = config.getMerchantPDA(publicKey);

      try {
        const tx = await config.program.methods
          .registerMerchant(
            merchantData.name,
            merchantData.category,
            merchantData.location.latitude,
            merchantData.location.longitude
          )
          .accounts({
            merchant: merchantPDA,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([merchantKeypair])
          .rpc();

        logger.info(`Merchant registered on-chain: ${merchantData.name} (${tx})`);
      } catch (error) {
        logger.error(`Failed to register merchant ${merchantData.name}:`, error);
        continue;
      }

      const merchant = new Merchant({
        walletAddress: walletData.publicKey,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        iv: walletData.iv,
        authTag: walletData.authTag,
        authority: walletData.publicKey,
        onChainAddress: merchantPDA.toString(),
        ...merchantData,
      });

      await merchant.save();
      merchants.push(merchant);
      logger.info(`Created merchant: ${merchant.name}`);
    }

    // Create promotions for each merchant
    logger.info('Creating promotions...');
    const promotions = [];
    for (const merchant of merchants) {
      const merchantKeypair = walletService.restoreKeypair({
        encryptedPrivateKey: merchant.encryptedPrivateKey,
        iv: merchant.iv,
        authTag: merchant.authTag,
      });

      const merchantPublicKey = new PublicKey(merchant.walletAddress);
      const [merchantPDA] = config.getMerchantPDA(merchantPublicKey);
      const merchantAccount = await config.program.account.merchant.fetch(merchantPDA);

      const promotionData = {
        discountPercentage: 20 + Math.floor(Math.random() * 30),
        maxSupply: 100,
        expiryTimestamp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        category: merchant.category,
        description: `Special ${merchant.category} deal from ${merchant.name}`,
        price: 0.1, // 0.1 SOL
      };

      const [promotionPDA] = config.getPromotionPDA(merchantPDA, merchantAccount.totalCouponsCreated.toNumber());

      try {
        const tx = await config.program.methods
          .createPromotion(
            promotionData.discountPercentage,
            promotionData.maxSupply,
            new BN(promotionData.expiryTimestamp),
            promotionData.category,
            promotionData.description,
            new BN(promotionData.price * 1e9) // Convert to lamports
          )
          .accounts({
            merchant: merchantPDA,
            authority: merchantPublicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([merchantKeypair])
          .rpc();

        logger.info(`Promotion created on-chain for ${merchant.name} (${tx})`);

        const promotion = new Promotion({
          onChainAddress: promotionPDA.toString(),
          merchantId: merchant._id,
          merchantWallet: merchant.walletAddress,
          ...promotionData,
          currentSupply: 0,
          isActive: true,
          imageUrl: `/images/promotions/${merchant.category.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        });

        await promotion.save();
        promotions.push(promotion);
        logger.info(`Created promotion for ${merchant.name}`);
      } catch (error) {
        logger.error(`Failed to create promotion for ${merchant.name}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Database seeding completed successfully!');
    logger.info(`Created ${users.length} users, ${merchants.length} merchants, ${promotions.length} promotions`);

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
