//import mongoose from 'mongoose';
//import type { ResolvedAccounts } from '@coral-xyz/anchor';
import { User } from '../models/user';
import { Merchant } from '../models/merchant';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
import { Auction } from '../models/auction';
import { GroupDeal } from '../models/group-deal';
import { RedemptionTicket } from '../models/redemption-ticket';
import { NFTMetadata } from '../models/nft-metadata';
import { Comment } from '../models/comment';
import { Rating } from '../models/rating';
import { Listing } from '../models/listing';
import { ExternalDeal, DealSource } from '../models/external-deal';
import { UserReputation, BadgeNFT, BadgeType, ReputationTier } from '../models/badge';
import { getDatabaseConfig } from '../config/database';
import { walletService } from '../services/wallet.service';
import { getSolanaConfig } from '../config/solana';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { logger } from '../utils/logger';

import dotenv from 'dotenv';
dotenv.config();



async function seedDatabase() {
  try {
    // Connect to MongoDB using DatabaseConfig
    const dbConfig = getDatabaseConfig();
    await dbConfig.connect();
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Merchant.deleteMany({});
    await Promotion.deleteMany({});
    await Coupon.deleteMany({});
    await Auction.deleteMany({});
    await GroupDeal.deleteMany({});
    await RedemptionTicket.deleteMany({});
    await NFTMetadata.deleteMany({});
    await Comment.deleteMany({});
    await Rating.deleteMany({});
    await Listing.deleteMany({});
    await ExternalDeal.deleteMany({});
    await UserReputation.deleteMany({});
    await BadgeNFT.deleteMany({});
    logger.info('Cleared existing data');

    // Initialize Solana config with better error handling
    let config;
    try {
      config = getSolanaConfig();
      logger.info('Solana config initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Solana config:', error);
      throw new Error(
        'Solana configuration failed. Please ensure:\n' +
        '1. Your Anchor program is built: cd contracts && anchor build\n' +
        '2. IDL is copied: cp contracts/target/idl/discount_platform.json backend/src/idl/\n' +
        '3. PROGRAM_ID is set in your .env file\n' +
        '4. ANCHOR_WALLET or WALLET_PRIVATE_KEY is configured'
      );
    }
    
    // Verify program is properly initialized
    if (!config.program) {
      throw new Error('Solana program is not initialized');
    }

    // Verify program methods and accounts exist
    if (!config.program.methods) {
      throw new Error('Program methods not available. Check your IDL structure.');
    }

    if (!config.program.account) {
      throw new Error('Program accounts not available. Check your IDL has account definitions.');
    }

    logger.info('Program verification successful');

    // Initialize marketplace if needed
    const [marketplacePDA] = config.getMarketplacePDA();
    try {
      // Check if marketplace exists by fetching account info
      const accountInfo = await config.connection.getAccountInfo(marketplacePDA);
      
      if (!accountInfo) {
        logger.info('Initializing marketplace...');
        const tx = await config.program.methods
          .initialize()
          .accounts({
            // marketplace: marketplacePDA,
            authority: config.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        logger.info(`Marketplace initialized: ${tx}`);
        
        // Wait for confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        logger.info('Marketplace already exists');
      }
    } catch (error: any) {
      logger.warn('Marketplace initialization skipped:', error.message);
    }

    // Create test users
    logger.info('Creating test users...');
    const users = [];
    for (let i = 1; i <= 25; i++) {
      const walletData = walletService.createWalletData();
      
      // Skip airdrop to avoid rate limits
      // Airdrops are not needed for database seeding

      const user = new User({
        walletAddress: walletData.publicKey,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        iv: walletData.iv,
        authTag: walletData.authTag,
        username: `user${i}`,
        email: `user${i}@test.com`,
        tier: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][i % 5],
        totalPurchases: Math.floor(Math.random() * 20),
        totalRedemptions: Math.floor(Math.random() * 15),
        reputationScore: Math.floor(Math.random() * 1000),
        badgesEarned: ['early_adopter', 'deal_hunter'].slice(0, Math.floor(Math.random() * 3)),
        preferences: {
          categories: ['Food', 'Shopping', 'Travel', 'Electronics', 'Wellness'].slice(0, Math.floor(Math.random() * 4) + 1),
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
        email: 'contact@pizzaparadise.com',
        category: 'Food & Dining',
        description: 'Best pizza in town with authentic Italian recipes',
        location: { latitude: 40.7128, longitude: -74.0060, address: '123 Main St, New York, NY' },
      },
      {
        name: 'Fashion Hub',
        email: 'info@fashionhub.com',
        category: 'Shopping',
        description: 'Trendy clothing and accessories for all ages',
        location: { latitude: 34.0522, longitude: -118.2437, address: '456 Fashion Ave, Los Angeles, CA' },
      },
      {
        name: 'Tech Store',
        email: 'support@techstore.com',
        category: 'Electronics',
        description: 'Latest gadgets and electronics at great prices',
        location: { latitude: 37.7749, longitude: -122.4194, address: '789 Tech Blvd, San Francisco, CA' },
      },
      {
        name: 'Spa Retreat',
        email: 'bookings@sparetreat.com',
        category: 'Wellness',
        description: 'Relaxation and rejuvenation services',
        location: { latitude: 25.7617, longitude: -80.1918, address: '321 Wellness Way, Miami, FL' },
      },
      {
        name: 'Adventure Tours',
        email: 'tours@adventuretours.com',
        category: 'Travel',
        description: 'Exciting travel packages and guided tours',
        location: { latitude: 36.1699, longitude: -115.1398, address: '654 Adventure Rd, Las Vegas, NV' },
      },
      {
        name: 'Coffee Corner',
        email: 'hello@coffeecorner.com',
        category: 'Food & Dining',
        description: 'Artisan coffee and fresh pastries daily',
        location: { latitude: 41.8781, longitude: -87.6298, address: '100 Coffee St, Chicago, IL' },
      },
      {
        name: 'Fitness First',
        email: 'join@fitnessfirst.com',
        category: 'Wellness',
        description: 'Premium gym with personal training',
        location: { latitude: 42.3601, longitude: -71.0589, address: '200 Gym Ave, Boston, MA' },
      },
      {
        name: 'Book Haven',
        email: 'books@bookhaven.com',
        category: 'Shopping',
        description: 'Independent bookstore with rare finds',
        location: { latitude: 47.6062, longitude: -122.3321, address: '300 Book Ln, Seattle, WA' },
      },
      {
        name: 'Sushi Master',
        email: 'reservations@sushimaster.com',
        category: 'Food & Dining',
        description: 'Authentic Japanese cuisine and sushi bar',
        location: { latitude: 33.4484, longitude: -112.0740, address: '400 Sushi Rd, Phoenix, AZ' },
      },
      {
        name: 'Game Zone',
        email: 'play@gamezone.com',
        category: 'Electronics',
        description: 'Gaming consoles, accessories, and collectibles',
        location: { latitude: 39.7392, longitude: -104.9903, address: '500 Game St, Denver, CO' },
      },
    ];

    const merchants = [];
    for (const merchantData of merchantsData) {
      const walletData = walletService.createWalletData();
      const publicKey = new PublicKey(walletData.publicKey);

      // Skip airdrop to avoid rate limits
      // Airdrops are not needed for database seeding

      // Skip on-chain registration for faster seeding
      const [merchantPDA] = config.getMerchantPDA(publicKey);

      const merchant = new Merchant({
        email: merchantData.email,
        walletAddress: walletData.publicKey,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        iv: walletData.iv,
        authTag: walletData.authTag,
        authority: walletData.publicKey,
        onChainAddress: merchantPDA.toString(),
        name: merchantData.name,
        category: merchantData.category,
        description: merchantData.description,
        location: merchantData.location,
        totalCouponsCreated: 0,
        totalCouponsRedeemed: Math.floor(Math.random() * 50),
        averageRating: 3.5 + Math.random() * 1.5,
        totalRatings: Math.floor(Math.random() * 100),
        isActive: true,
      });

      await merchant.save();
      merchants.push(merchant);
      logger.info(`Created merchant: ${merchant.name}`);
    }

    // Create promotions for each merchant
    logger.info('Creating promotions...');
    const promotions = [];
    const allCoupons = [];

    for (const merchant of merchants) {
      const merchantPublicKey = new PublicKey(merchant.walletAddress);
      const [merchantPDA] = config.getMerchantPDA(merchantPublicKey);
      
      // Create 2 promotions per merchant
      const numPromotions = 2;
      
      for (let p = 0; p < numPromotions; p++) {
        const promotionData = {
          title: `${merchant.name} Special Deal ${p + 1}`,
          discountPercentage: 15 + Math.floor(Math.random() * 35),
          maxSupply: 50 + Math.floor(Math.random() * 150),
          expiryTimestamp: Math.floor(Date.now() / 1000) + (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60,
          category: merchant.category,
          description: `Exclusive ${merchant.category} deal from ${merchant.name}. Limited time offer!`,
          price: 0.05 + Math.random() * 0.45,
        };

        // Generate promotion PDA
        const [promotionPDA] = config.getPromotionPDA(merchantPDA, p);

        try {

          const promotion = new Promotion({
            onChainAddress: promotionPDA.toString(),
            merchant: merchant.onChainAddress,
            title: promotionData.title,
            description: promotionData.description,
            category: promotionData.category,
            discountPercentage: promotionData.discountPercentage,
            maxSupply: promotionData.maxSupply,
            currentSupply: Math.floor(Math.random() * 20),
            price: promotionData.price,
            expiryTimestamp: new Date(promotionData.expiryTimestamp * 1000),
            isActive: true,
            stats: {
              totalMinted: Math.floor(Math.random() * 30),
              totalRedeemed: Math.floor(Math.random() * 15),
              averageRating: 3 + Math.random() * 2,
              totalRatings: Math.floor(Math.random() * 50),
              totalComments: Math.floor(Math.random() * 20),
            },
          });

          await promotion.save();
          promotions.push(promotion);

          logger.info(`Created promotion: ${promotion.title}`);

          // Create some mock coupons (not on-chain for seed data)
          const numCoupons = Math.floor(Math.random() * 5) + 1;
          for (let c = 0; c < numCoupons; c++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const coupon = new Coupon({
              onChainAddress: `coupon_${promotionPDA.toString()}_${c}`,
              couponId: c,
              nftMint: `mint_${promotionPDA.toString()}_${c}`,
              promotion: promotion.onChainAddress,
              owner: randomUser.walletAddress,
              merchant: merchant.onChainAddress,
              discountPercentage: promotionData.discountPercentage,
              expiryTimestamp: new Date(promotionData.expiryTimestamp * 1000),
              isRedeemed: Math.random() > 0.7,
              isListed: Math.random() > 0.8,
              listingPrice: Math.random() > 0.8 ? 0.05 + Math.random() * 0.2 : undefined,
              transferHistory: [],
            });

            await coupon.save();
            allCoupons.push(coupon);
          }

        } catch (error: any) {
          logger.error(`Failed to create promotion for ${merchant.name}:`, JSON.stringify(error));
        }
      }
    }

    // Create mock auctions (not on-chain for seed data)
    logger.info('Creating mock auctions...');
    const auctions = [];
    if (allCoupons.length > 0) {
      for (let i = 0; i < Math.min(5, allCoupons.length); i++) {
        const randomCoupon = allCoupons[Math.floor(Math.random() * allCoupons.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const startTime = new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000);
        const endTime = new Date(Date.now() + Math.floor(Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
        
        const auction = new Auction({
          onChainAddress: `auction_${i}`,
          couponAddress: randomCoupon.onChainAddress,
          sellerAddress: randomUser.walletAddress,
          merchantAddress: randomCoupon.merchant,
          title: `Auction: ${randomCoupon.discountPercentage}% Discount Coupon`,
          description: `Bid on this exclusive discount coupon!`,
          category: randomCoupon.promotion,
          startingPrice: 0.05 + Math.random() * 0.1,
          currentBid: 0.05 + Math.random() * 0.2,
          buyNowPrice: Math.random() > 0.5 ? 0.3 + Math.random() * 0.2 : undefined,
          bids: [],
          totalBids: Math.floor(Math.random() * 10),
          startTime,
          endTime,
          extendOnBid: true,
          extensionTime: 300,
          status: endTime > new Date() ? 'active' : 'ended',
          isActive: endTime > new Date(),
          isSettled: false,
        });

        await auction.save();
        auctions.push(auction);
        logger.info(`Created auction: ${auction.title}`);
      }
    }

    // Create group deals
    logger.info('Creating group deals...');
    const groupDeals = [];
    for (let i = 0; i < Math.min(3, merchants.length); i++) {
      const merchant = merchants[i];
      const startTime = new Date(Date.now() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000);
      const endTime = new Date(Date.now() + (5 + Math.floor(Math.random() * 10)) * 24 * 60 * 60 * 1000);
      
      const groupDeal = new GroupDeal({
        onChainAddress: `group_deal_${i}`,
        promotionAddress: promotions[i]?.onChainAddress || `promo_${i}`,
        merchantAddress: merchant.onChainAddress,
        title: `${merchant.name} Group Deal - ${['Bundle Pack', 'Family Package', 'Team Discount'][i % 3]}`,
        description: `Get together with friends and unlock bigger discounts! The more people join, the better the deal.`,
        category: merchant.category,
        tiers: [
          { minParticipants: 5, discountPercentage: 10, pricePerUnit: 0.09 },
          { minParticipants: 10, discountPercentage: 20, pricePerUnit: 0.08 },
          { minParticipants: 20, discountPercentage: 30, pricePerUnit: 0.07 },
          { minParticipants: 50, discountPercentage: 40, pricePerUnit: 0.06 },
        ],
        targetParticipants: 20,
        currentParticipants: 5 + Math.floor(Math.random() * 15),
        maxParticipants: 100,
        participants: [],
        startTime,
        endTime,
        expiryTimestamp: new Date(endTime.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        isActive: true,
        isSuccessful: false,
        totalRevenue: 0,
        currentTier: 0,
        termsAndConditions: [
          'Valid for group purchases only',
          'All participants must redeem within 30 days',
          'Non-refundable once target is reached',
        ],
      });

      await groupDeal.save();
      groupDeals.push(groupDeal);
      logger.info(`Created group deal: ${groupDeal.title}`);
    }

    // Create NFT metadata for coupons
    logger.info('Creating NFT metadata...');
    const nftMetadataList = [];
    for (let i = 0; i < Math.min(allCoupons.length, 50); i++) {
      const coupon = allCoupons[i];
      const merchant = merchants.find(m => m.onChainAddress === coupon.merchant);
      const promotion = promotions.find(p => p.onChainAddress === coupon.promotion);
      
      if (!merchant || !promotion) continue;

      const nftMetadata = new NFTMetadata({
        name: `${merchant.name} ${coupon.discountPercentage}% OFF`,
        symbol: 'DEAL',
        description: `Exclusive ${coupon.discountPercentage}% discount coupon for ${merchant.name}. ${promotion.description}`,
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=${coupon.onChainAddress}`,
        external_url: `https://dealforge.app/coupon/${coupon.onChainAddress}`,
        attributes: [
          { trait_type: 'Discount', value: coupon.discountPercentage, display_type: 'boost_percentage' },
          { trait_type: 'Category', value: merchant.category },
          { trait_type: 'Merchant', value: merchant.name },
          { trait_type: 'Expiry', value: Math.floor(coupon.expiryTimestamp.getTime() / 1000), display_type: 'date' },
          { trait_type: 'Rarity', value: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 5)] },
        ],
        couponData: {
          discountPercentage: coupon.discountPercentage,
          discountType: 'percentage',
          category: merchant.category,
          merchantId: merchant.onChainAddress,
          merchantName: merchant.name,
          promotionId: promotion.onChainAddress,
          expiryTimestamp: Math.floor(coupon.expiryTimestamp.getTime() / 1000),
          termsAndConditions: [
            'Valid for in-store and online purchases',
            'Cannot be combined with other offers',
            'One-time use only',
            'Non-transferable after redemption',
          ],
          redemptionInstructions: 'Present this NFT at checkout to redeem your discount',
          isTransferable: !coupon.isRedeemed,
        },
        location: merchant.location ? {
          latitude: merchant.location.latitude,
          longitude: merchant.location.longitude,
          address: merchant.location.address,
          radius: 5000,
        } : undefined,
        verification: {
          isVerified: true,
          verifiedBy: 'DealForge',
          verificationDate: new Date(),
          securityHash: `hash_${coupon.onChainAddress}`,
        },
        marketplace: {
          isListed: coupon.isListed || false,
          listingPrice: coupon.listingPrice,
          floorPrice: 0.05 + Math.random() * 0.1,
          lastSalePrice: Math.random() > 0.5 ? 0.08 + Math.random() * 0.1 : undefined,
          totalSales: Math.floor(Math.random() * 5),
        },
        social: {
          totalViews: Math.floor(Math.random() * 500),
          totalShares: Math.floor(Math.random() * 50),
          totalRedemptions: coupon.isRedeemed ? 1 : 0,
          averageRating: 3 + Math.random() * 2,
          totalRatings: Math.floor(Math.random() * 20),
        },
        onChain: {
          mint: coupon.nftMint,
          couponPDA: coupon.onChainAddress,
          metadataPDA: `metadata_${coupon.onChainAddress}`,
          updateAuthority: merchant.walletAddress,
          isMutable: true,
        },
      });

      await nftMetadata.save();
      nftMetadataList.push(nftMetadata);
      logger.info(`Created NFT metadata for coupon: ${nftMetadata.name}`);
    }

    // Create redemption tickets
    logger.info('Creating redemption tickets...');
    const redemptionTickets = [];
    for (let i = 0; i < Math.min(allCoupons.length, 30); i++) {
      const coupon = allCoupons[i];
      const user = users[Math.floor(Math.random() * users.length)];
      const merchant = merchants.find(m => m.onChainAddress === coupon.merchant);
      
      if (!merchant) continue;

      const isConsumed = Math.random() > 0.5;
      const ticketHash = `hash_${coupon.onChainAddress}_${user.walletAddress}_${i}`;
      const nonce = Math.floor(Math.random() * 1000000);

      const redemptionTicket = new RedemptionTicket({
        onChainAddress: `ticket_${i}_${Date.now()}`,
        couponAddress: coupon.onChainAddress,
        userAddress: user.walletAddress,
        merchantAddress: merchant.onChainAddress,
        ticketHash,
        nonce,
        expiresAt: coupon.expiryTimestamp,
        isConsumed,
        consumedAt: isConsumed ? new Date() : undefined,
        qrCodeData: `QR_${coupon.onChainAddress}_${user.walletAddress}`,
        verificationMethod: ['qr_scan', 'manual', 'api'][Math.floor(Math.random() * 3)] as 'qr_scan' | 'manual' | 'api',
        generationTxSignature: `tx_gen_${i}_${Date.now()}`,
        redemptionTxSignature: isConsumed ? `tx_redeem_${i}_${Date.now()}` : undefined,
        status: isConsumed ? 'consumed' : 'active',
        generationLocation: merchant.location ? {
          latitude: merchant.location.latitude + (Math.random() - 0.5) * 0.01,
          longitude: merchant.location.longitude + (Math.random() - 0.5) * 0.01,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        } : undefined,
        redemptionLocation: isConsumed && merchant.location ? {
          latitude: merchant.location.latitude + (Math.random() - 0.5) * 0.01,
          longitude: merchant.location.longitude + (Math.random() - 0.5) * 0.01,
          timestamp: new Date(),
        } : undefined,
      });

      await redemptionTicket.save();
      redemptionTickets.push(redemptionTicket);
      logger.info(`Created redemption ticket for user: ${user.username}`);
    }

    // Create comments for promotions
    logger.info('Creating comments...');
    const comments = [];
    for (let i = 0; i < Math.min(20, promotions.length * 3); i++) {
      const randomPromotion = promotions[Math.floor(Math.random() * promotions.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const isMerchantReply = Math.random() > 0.7;
      
      const comment: any = new Comment({
        onChainAddress: `comment_${i}_${Date.now()}`,
        user: randomUser.walletAddress,
        promotion: randomPromotion.onChainAddress,
        content: [
          'Great deal! Highly recommend.',
          'Used this coupon yesterday, works perfectly!',
          'Amazing discount, saved so much money!',
          'Is this still available?',
          'Best deal I\'ve found this month.',
          'Thank you for the feedback! We\'re glad you enjoyed it.',
          'Limited stock remaining, grab it while you can!',
          'Does this work with other promotions?',
        ][Math.floor(Math.random() * 8)],
        likes: Math.floor(Math.random() * 50),
        isMerchantReply,
        parentComment: Math.random() > 0.8 && comments.length > 0 ? comments[Math.floor(Math.random() * comments.length)].onChainAddress : undefined,
      });

      await comment.save();
      comments.push(comment);
      logger.info(`Created comment ${i + 1}`);
    }

    // Create ratings for promotions
    logger.info('Creating ratings...');
    const ratings: any[] = [];
    for (let i = 0; i < Math.min(30, promotions.length * 4); i++) {
      const randomPromotion = promotions[Math.floor(Math.random() * promotions.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const merchant = merchants.find(m => m.onChainAddress === randomPromotion.merchant);
      
      if (!merchant) continue;

      // Check if user already rated this promotion
      const existingRating = ratings.find(r => r.user === randomUser.walletAddress && r.promotion === randomPromotion.onChainAddress);
      if (existingRating) continue;

      const rating = new Rating({
        onChainAddress: `rating_${i}_${Date.now()}`,
        user: randomUser.walletAddress,
        promotion: randomPromotion.onChainAddress,
        merchant: merchant.onChainAddress,
        stars: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      });

      await rating.save();
      ratings.push(rating);
      logger.info(`Created rating ${i + 1}`);
    }

    // Create marketplace listings
    logger.info('Creating marketplace listings...');
    const listings = [];
    for (let i = 0; i < Math.min(15, allCoupons.length); i++) {
      const randomCoupon = allCoupons[Math.floor(Math.random() * allCoupons.length)];
      
      // Skip if coupon is redeemed or already listed
      if (randomCoupon.isRedeemed || randomCoupon.isListed) continue;

      const listing = new Listing({
        onChainAddress: `listing_${i}_${Date.now()}`,
        coupon: randomCoupon.onChainAddress,
        seller: randomCoupon.owner,
        price: 0.05 + Math.random() * 0.25,
        isActive: Math.random() > 0.2,
      });

      await listing.save();
      listings.push(listing);
      
      // Update coupon listing status
      randomCoupon.isListed = true;
      randomCoupon.listingPrice = listing.price;
      await randomCoupon.save();
      
      logger.info(`Created listing ${i + 1}`);
    }

    // Create external deals
    logger.info('Creating external deals...');
    const externalDeals = [];
    const externalDealData = [
      {
        source: DealSource.Skyscanner,
        title: 'Round Trip Flight to Paris',
        description: 'Amazing deal on flights to Paris with flexible dates',
        category: 'Travel',
        originalPrice: 899,
        discountedPrice: 549,
        imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=flight1',
      },
      {
        source: DealSource.BookingCom,
        title: '5-Star Hotel in Dubai',
        description: 'Luxury accommodation with breakfast included',
        category: 'Travel',
        originalPrice: 450,
        discountedPrice: 299,
        imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=hotel1',
      },
      {
        source: DealSource.Amazon,
        title: 'Wireless Noise-Cancelling Headphones',
        description: 'Premium audio quality with active noise cancellation',
        category: 'Electronics',
        originalPrice: 349,
        discountedPrice: 199,
        imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=headphones1',
      },
      {
        source: DealSource.Shopify,
        title: 'Designer Leather Jacket',
        description: 'Genuine leather with modern fit and style',
        category: 'Shopping',
        originalPrice: 599,
        discountedPrice: 399,
        imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=jacket1',
      },
      {
        source: DealSource.Custom,
        title: 'Spa Day Package',
        description: 'Full day spa treatment with massage and facial',
        category: 'Wellness',
        originalPrice: 250,
        discountedPrice: 149,
        imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=spa1',
      },
    ];

    for (let i = 0; i < externalDealData.length; i++) {
      const dealData = externalDealData[i];
      const discountPercentage = Math.round(((dealData.originalPrice - dealData.discountedPrice) / dealData.originalPrice) * 100);
      
      const externalDeal = new ExternalDeal({
        onChainAddress: `external_deal_${i}_${Date.now()}`,
        oracleAuthority: config.wallet.publicKey.toString(),
        source: dealData.source,
        externalId: `ext_${dealData.source}_${i}_${Date.now()}`,
        title: dealData.title,
        description: dealData.description,
        originalPrice: dealData.originalPrice,
        discountedPrice: dealData.discountedPrice,
        discountPercentage,
        category: dealData.category,
        imageUrl: dealData.imageUrl,
        affiliateUrl: `https://example.com/deal/${i}`,
        expiryTimestamp: new Date(Date.now() + (15 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        isVerified: Math.random() > 0.3,
        verificationCount: Math.floor(Math.random() * 10),
      });

      await externalDeal.save();
      externalDeals.push(externalDeal);
      logger.info(`Created external deal: ${externalDeal.title}`);
    }

    // Create user reputations
    logger.info('Creating user reputations...');
    const userReputations = [];
    for (const user of users) {
      const totalPurchases = user.totalPurchases;
      const totalRedemptions = user.totalRedemptions;
      const totalRatingsGiven = ratings.filter(r => r.user === user.walletAddress).length;
      const totalComments = comments.filter(c => c.user === user.walletAddress).length;
      const reputationScore = user.reputationScore;
      
      // Determine tier based on reputation score
      let tier = ReputationTier.Bronze;
      if (reputationScore >= 800) tier = ReputationTier.Diamond;
      else if (reputationScore >= 600) tier = ReputationTier.Platinum;
      else if (reputationScore >= 400) tier = ReputationTier.Gold;
      else if (reputationScore >= 200) tier = ReputationTier.Silver;

      // Determine badges earned
      const badgesEarned: BadgeType[] = [];
      if (totalPurchases >= 1) badgesEarned.push(BadgeType.FirstPurchase);
      if (totalRedemptions >= 10) badgesEarned.push(BadgeType.TenRedemptions);
      if (totalRedemptions >= 50) badgesEarned.push(BadgeType.FiftyRedemptions);
      if (totalRatingsGiven >= 20) badgesEarned.push(BadgeType.TopReviewer);
      if (Math.random() > 0.8) badgesEarned.push(BadgeType.EarlyAdopter);

      const userReputation = new UserReputation({
        onChainAddress: `reputation_${user.walletAddress}`,
        user: user.walletAddress,
        totalPurchases,
        totalRedemptions,
        totalRatingsGiven,
        totalComments,
        reputationScore,
        tier,
        badgesEarned,
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
      });

      await userReputation.save();
      userReputations.push(userReputation);
      logger.info(`Created reputation for user: ${user.username}`);
    }

    // Create badge NFTs
    logger.info('Creating badge NFTs...');
    const badgeNFTs = [];
    for (const userRep of userReputations) {
      for (const badgeType of userRep.badgesEarned) {
        const badgeNFT = new BadgeNFT({
          onChainAddress: `badge_${userRep.user}_${badgeType}_${Date.now()}`,
          user: userRep.user,
          badgeType,
          mint: `mint_badge_${userRep.user}_${badgeType}`,
          metadata: `metadata_badge_${badgeType}`,
          earnedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
          metadataUri: `https://api.dealforge.app/metadata/badge/${badgeType}`,
        });

        await badgeNFT.save();
        badgeNFTs.push(badgeNFT);
      }
      logger.info(`Created ${userRep.badgesEarned.length} badge NFTs for user`);
    }

    logger.info('Database seeding completed successfully!');
    logger.info(`Created:
      - ${users.length} users
      - ${merchants.length} merchants
      - ${promotions.length} promotions
      - ${allCoupons.length} coupons
      - ${auctions.length} auctions
      - ${groupDeals.length} group deals
      - ${nftMetadataList.length} NFT metadata entries
      - ${redemptionTickets.length} redemption tickets
      - ${comments.length} comments
      - ${ratings.length} ratings
      - ${listings.length} marketplace listings
      - ${externalDeals.length} external deals
      - ${userReputations.length} user reputations
      - ${badgeNFTs.length} badge NFTs
    `);

    process.exit(0);
  } catch (error: any) {
    logger.error('Database seeding failed:', error);
    console.error('\n' + error.stack);
    process.exit(1);
  }
}

seedDatabase();