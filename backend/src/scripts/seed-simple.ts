import mongoose from 'mongoose';
import { User } from '../models/user';
import { Merchant } from '../models/merchant';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
import { Auction } from '../models/auction';
import { GroupDeal } from '../models/group-deal';
import { RedemptionTicket } from '../models/redemption-ticket';
import { Comment } from '../models/comment';
import { Rating } from '../models/rating';
import { ExternalDeal, DealSource } from '../models/external-deal';
import { Listing } from '../models/listing';
import { UserReputation, BadgeNFT, BadgeType, ReputationTier } from '../models/badge';
import { getDatabaseConfig } from '../config/database';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

async function seedSimple() {
  try {
    // Connect to MongoDB
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
    await Comment.deleteMany({});
    await Rating.deleteMany({});
    await ExternalDeal.deleteMany({});
    await Listing.deleteMany({});
    await UserReputation.deleteMany({});
    await BadgeNFT.deleteMany({});
    logger.info('Cleared existing data');

    // Drop old walletAddress index if it exists
    try {
      const db = mongoose.connection.db;
      await db.collection('merchants').dropIndex('walletAddress_1');
      logger.info('✅ Dropped old walletAddress_1 index');
    } catch (err: any) {
      logger.info('walletAddress_1 index does not exist (this is fine)');
    }

    // Create test users
    logger.info('Creating test users...');
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = new User({
        walletAddress: `user${i}wallet${Math.random().toString(36).substring(7)}`,
        encryptedPrivateKey: 'mock_encrypted_key',
        iv: 'mock_iv',
        authTag: 'mock_auth_tag',
        username: `TestUser${i}`,
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
        email: 'pizza@paradise.com',
        name: 'Pizza Paradise',
        category: 'Food & Dining',
        description: 'Best pizza in town with authentic Italian recipes',
        location: { latitude: 40.7128, longitude: -74.0060, address: '123 Main St, New York, NY' },
      },
      {
        email: 'info@fashionhub.com',
        name: 'Fashion Hub',
        category: 'Shopping',
        description: 'Trendy clothing and accessories for all ages',
        location: { latitude: 34.0522, longitude: -118.2437, address: '456 Fashion Ave, Los Angeles, CA' },
      },
      {
        email: 'contact@techstore.com',
        name: 'Tech Store',
        category: 'Electronics',
        description: 'Latest gadgets and electronics at great prices',
        location: { latitude: 37.7749, longitude: -122.4194, address: '789 Tech Blvd, San Francisco, CA' },
      },
      {
        email: 'spa@retreat.com',
        name: 'Spa Retreat',
        category: 'Wellness',
        description: 'Relaxation and rejuvenation services',
        location: { latitude: 25.7617, longitude: -80.1918, address: '321 Wellness Way, Miami, FL' },
      },
      {
        email: 'tours@adventure.com',
        name: 'Adventure Tours',
        category: 'Travel',
        description: 'Exciting travel packages and guided tours',
        location: { latitude: 36.1699, longitude: -115.1398, address: '654 Adventure Rd, Las Vegas, NV' },
      },
    ];

    const merchants = [];
    for (const merchantData of merchantsData) {
      const merchant = new Merchant({
        walletAddress: `merchant${Math.random().toString(36).substring(7)}`,
        encryptedPrivateKey: 'mock_encrypted_key',
        iv: 'mock_iv',
        authTag: 'mock_auth_tag',
        authority: `authority${Math.random().toString(36).substring(7)}`,
        onChainAddress: `onchain${Math.random().toString(36).substring(7)}`,
        totalCouponsCreated: 0,
        totalCouponsRedeemed: Math.floor(Math.random() * 50),
        averageRating: 3.5 + Math.random() * 1.5,
        totalRatings: Math.floor(Math.random() * 100),
        ...merchantData,
      });

      await merchant.save();
      merchants.push(merchant);
      logger.info(`Created merchant: ${merchant.name}`);
    }

    // Create promotions for each merchant
    logger.info('Creating promotions...');
    const promotions = [];
    const promotionImages = [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
    ];
    const promotionTemplates = [
      { title: '50% Off Pizza', description: 'Get half off on any large pizza', discountPercentage: 50, price: 15, originalPrice: 30, category: 'Food & Dining' },
      { title: 'Buy 1 Get 1 Free', description: 'Buy one item, get another free', discountPercentage: 50, price: 25, originalPrice: 50, category: 'Shopping' },
      { title: '30% Off Electronics', description: 'Save on the latest gadgets', discountPercentage: 30, price: 100, originalPrice: 143, category: 'Electronics' },
      { title: 'Spa Day Special', description: 'Full day spa package at reduced price', discountPercentage: 40, price: 80, originalPrice: 133, category: 'Wellness' },
      { title: 'Weekend Getaway', description: 'Discounted travel packages', discountPercentage: 35, price: 200, originalPrice: 308, category: 'Travel' },
    ];

    for (let i = 0; i < merchants.length; i++) {
      const merchant = merchants[i];
      const template = promotionTemplates[i % promotionTemplates.length];
      
      for (let j = 0; j < 3; j++) {
        const promotion = new Promotion({
          onChainAddress: `promo${Math.random().toString(36).substring(7)}`,
          merchant: merchant.onChainAddress,
          title: `${template.title} ${j + 1}`,
          description: template.description,
          category: template.category,
          discountPercentage: template.discountPercentage,
          maxSupply: 100 + Math.floor(Math.random() * 100),
          currentSupply: Math.floor(Math.random() * 50),
          price: template.price + Math.floor(Math.random() * 20),
          originalPrice: template.originalPrice + Math.floor(Math.random() * 20),
          imageUrl: promotionImages[Math.floor(Math.random() * promotionImages.length)],
          expiryTimestamp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          isActive: true,
          stats: {
            totalMinted: Math.floor(Math.random() * 50),
            totalRedeemed: Math.floor(Math.random() * 30),
            averageRating: 3.5 + Math.random() * 1.5,
            totalRatings: Math.floor(Math.random() * 50),
            totalComments: Math.floor(Math.random() * 20),
          },
        });

        await promotion.save();
        promotions.push(promotion);
        logger.info(`Created promotion: ${promotion.title}`);
      }
    }

    // Create some coupons
    logger.info('Creating coupons...');
    for (let i = 0; i < 20; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const merchant = merchants.find(m => m.onChainAddress === promotion.merchant);
      
      const coupon = new Coupon({
        onChainAddress: `coupon${Math.random().toString(36).substring(7)}`,
        couponId: i,
        nftMint: `mint${Math.random().toString(36).substring(7)}`,
        promotion: promotion.onChainAddress,
        owner: user.walletAddress,
        merchant: merchant?.onChainAddress || promotion.merchant,
        discountPercentage: promotion.discountPercentage,
        expiryTimestamp: promotion.expiryTimestamp,
        isRedeemed: Math.random() > 0.7,
        redeemedAt: Math.random() > 0.7 ? new Date() : undefined,
        isListed: false,
        transferHistory: [],
      });

      await coupon.save();
      logger.info(`Created coupon for promotion: ${promotion.title}`);
    }

    // Create some auctions
    logger.info('Creating auctions...');
    for (let i = 0; i < 5; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const seller = users[Math.floor(Math.random() * users.length)];
      const merchant = merchants.find(m => m.onChainAddress === promotion.merchant);
      
      const auction = new Auction({
        onChainAddress: `auction${Math.random().toString(36).substring(7)}`,
        couponAddress: `coupon${Math.random().toString(36).substring(7)}`,
        sellerAddress: seller.walletAddress,
        merchantAddress: merchant?.onChainAddress || promotion.merchant,
        title: `Auction: ${promotion.title}`,
        description: `Auction for ${promotion.description}`,
        category: promotion.category,
        startingPrice: promotion.price * 0.8,
        currentBid: promotion.price * 0.9,
        reservePrice: promotion.price,
        buyNowPrice: promotion.price * 1.2,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        isActive: true,
        isSettled: false,
        bids: [],
        totalBids: 0,
        extendOnBid: true,
        extensionTime: 300,
      });

      await auction.save();
      logger.info(`Created auction: ${auction.title}`);
    }

    // Create some group deals
    logger.info('Creating group deals...');
    for (let i = 0; i < 5; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const merchant = merchants.find(m => m.onChainAddress === promotion.merchant);
      
      const groupDeal = new GroupDeal({
        onChainAddress: `groupdeal${Math.random().toString(36).substring(7)}`,
        promotionAddress: promotion.onChainAddress,
        merchantAddress: merchant?.onChainAddress || promotion.merchant,
        title: `Group Deal: ${promotion.title}`,
        description: `Group buying opportunity for ${promotion.description}`,
        category: promotion.category,
        tiers: [
          { minParticipants: 5, discountPercentage: 10, pricePerUnit: promotion.price * 0.9 },
          { minParticipants: 10, discountPercentage: 20, pricePerUnit: promotion.price * 0.8 },
          { minParticipants: 20, discountPercentage: 30, pricePerUnit: promotion.price * 0.7 },
        ],
        currentTier: 0,
        targetParticipants: 20,
        maxParticipants: 50,
        currentParticipants: Math.floor(Math.random() * 15),
        participants: [],
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expiryTimestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        isActive: true,
        isSuccessful: false,
        totalRevenue: 0,
        termsAndConditions: ['Valid for group purchase only', 'Non-refundable'],
      });

      await groupDeal.save();
      logger.info(`Created group deal: ${groupDeal.title}`);
    }

    // Create comments for promotions
    logger.info('Creating comments...');
    const comments = [];
    for (let i = 0; i < 30; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const commentTexts = [
        'Great deal! Highly recommend.',
        'Used this coupon yesterday, amazing value!',
        'Best discount I\'ve found in a while.',
        'Quality product at a great price.',
        'Will definitely buy again!',
        'Excellent service and great savings.',
        'Perfect for budget shoppers.',
        'Worth every penny!',
      ];
      
      const comment = new Comment({
        onChainAddress: `comment${Math.random().toString(36).substring(7)}`,
        user: user.walletAddress,
        promotion: promotion.onChainAddress,
        content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        likes: Math.floor(Math.random() * 20),
        isMerchantReply: false,
      });

      await comment.save();
      comments.push(comment);
    }
    logger.info(`Created ${comments.length} comments`);

    // Create ratings for promotions
    logger.info('Creating ratings...');
    const ratings = [];
    for (let i = 0; i < 40; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const merchant = merchants.find(m => m.onChainAddress === promotion.merchant);
      
      // Check if user already rated this promotion
      const existingRating = ratings.find(r => r.user === user.walletAddress && r.promotion === promotion.onChainAddress);
      if (existingRating) continue;
      
      const rating = new Rating({
        onChainAddress: `rating${Math.random().toString(36).substring(7)}`,
        user: user.walletAddress,
        promotion: promotion.onChainAddress,
        merchant: merchant?.onChainAddress || promotion.merchant,
        stars: Math.floor(Math.random() * 5) + 1,
      });

      await rating.save();
      ratings.push(rating);
    }
    logger.info(`Created ${ratings.length} ratings`);

    // Create external deals
    logger.info('Creating external deals...');
    const externalDeals = [];
    const externalDealTemplates = [
      {
        source: DealSource.Amazon,
        title: 'Wireless Headphones - 40% Off',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
        category: 'Electronics',
        originalPrice: 199,
        discountedPrice: 119,
        discountPercentage: 40,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        affiliateUrl: 'https://amazon.com/deal/headphones123',
      },
      {
        source: DealSource.Shopify,
        title: 'Designer Sunglasses - 50% Off',
        description: 'Stylish UV-protection sunglasses from top brands',
        category: 'Fashion',
        originalPrice: 150,
        discountedPrice: 75,
        discountPercentage: 50,
        imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
        affiliateUrl: 'https://shopify.com/sunglasses-deal',
      },
      {
        source: DealSource.BookingCom,
        title: 'Luxury Hotel Stay - 35% Off',
        description: '3-night stay at 5-star beachfront resort with breakfast included',
        category: 'Travel',
        originalPrice: 600,
        discountedPrice: 390,
        discountPercentage: 35,
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        affiliateUrl: 'https://booking.com/hotel-deal-456',
      },
      {
        source: DealSource.Skyscanner,
        title: 'Round-trip Flight - 45% Off',
        description: 'Discounted flights to popular destinations worldwide',
        category: 'Travel',
        originalPrice: 500,
        discountedPrice: 275,
        discountPercentage: 45,
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
        affiliateUrl: 'https://skyscanner.com/flight-deal-789',
      },
      {
        source: DealSource.Amazon,
        title: 'Smart Watch - 30% Off',
        description: 'Fitness tracking smartwatch with heart rate monitor and GPS',
        category: 'Electronics',
        originalPrice: 299,
        discountedPrice: 209,
        discountPercentage: 30,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        affiliateUrl: 'https://amazon.com/smartwatch-deal',
      },
    ];

    for (const template of externalDealTemplates) {
      const externalDeal = new ExternalDeal({
        onChainAddress: `external${Math.random().toString(36).substring(7)}`,
        oracleAuthority: `oracle${Math.random().toString(36).substring(7)}`,
        source: template.source,
        externalId: `ext${Math.random().toString(36).substring(7)}`,
        title: template.title,
        description: template.description,
        originalPrice: template.originalPrice,
        discountedPrice: template.discountedPrice,
        discountPercentage: template.discountPercentage,
        category: template.category,
        imageUrl: template.imageUrl,
        affiliateUrl: template.affiliateUrl,
        expiryTimestamp: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isVerified: Math.random() > 0.3,
        verificationCount: Math.floor(Math.random() * 10),
      });

      await externalDeal.save();
      externalDeals.push(externalDeal);
    }
    logger.info(`Created ${externalDeals.length} external deals`);

    // Create marketplace listings
    logger.info('Creating marketplace listings...');
    const listings = [];
    for (let i = 0; i < 10; i++) {
      const promotion = promotions[Math.floor(Math.random() * promotions.length)];
      const seller = users[Math.floor(Math.random() * users.length)];
      
      const listing = new Listing({
        onChainAddress: `listing${Math.random().toString(36).substring(7)}`,
        coupon: `coupon${Math.random().toString(36).substring(7)}`,
        seller: seller.walletAddress,
        price: promotion.price * (0.8 + Math.random() * 0.4),
        isActive: Math.random() > 0.2,
      });

      await listing.save();
      listings.push(listing);
    }
    logger.info(`Created ${listings.length} marketplace listings`);

    // Create user reputations
    logger.info('Creating user reputations...');
    const reputations = [];
    for (const user of users) {
      const reputation = new UserReputation({
        onChainAddress: `reputation${Math.random().toString(36).substring(7)}`,
        user: user.walletAddress,
        totalPurchases: user.totalPurchases,
        totalRedemptions: user.totalRedemptions,
        totalRatingsGiven: Math.floor(Math.random() * 20),
        totalComments: Math.floor(Math.random() * 15),
        reputationScore: user.reputationScore,
        tier: user.tier as ReputationTier,
        badgesEarned: user.badgesEarned.map(b => {
          if (b === 'early_adopter') return BadgeType.EarlyAdopter;
          if (b === 'deal_hunter') return BadgeType.FirstPurchase;
          return BadgeType.FirstPurchase;
        }),
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
      });

      await reputation.save();
      reputations.push(reputation);
    }
    logger.info(`Created ${reputations.length} user reputations`);

    // Create badge NFTs
    logger.info('Creating badge NFTs...');
    const badgeNFTs = [];
    for (let i = 0; i < 15; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const badgeTypes = Object.values(BadgeType);
      const badgeType = badgeTypes[Math.floor(Math.random() * badgeTypes.length)];
      
      const badgeNFT = new BadgeNFT({
        onChainAddress: `badge${Math.random().toString(36).substring(7)}`,
        user: user.walletAddress,
        badgeType: badgeType,
        mint: `mint${Math.random().toString(36).substring(7)}`,
        metadata: `metadata${Math.random().toString(36).substring(7)}`,
        metadataUri: `https://arweave.net/${Math.random().toString(36).substring(7)}`,
        earnedAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
      });

      await badgeNFT.save();
      badgeNFTs.push(badgeNFT);
    }
    logger.info(`Created ${badgeNFTs.length} badge NFTs`);

    logger.info('Database seeding completed successfully!');
    logger.info(`Created ${users.length} users`);
    logger.info(`Created ${merchants.length} merchants`);
    logger.info(`Created ${promotions.length} promotions`);
    logger.info(`Created ${comments.length} comments`);
    logger.info(`Created ${ratings.length} ratings`);
    logger.info(`Created ${externalDeals.length} external deals`);
    logger.info(`Created ${listings.length} marketplace listings`);
    logger.info(`Created ${reputations.length} user reputations`);
    logger.info(`Created ${badgeNFTs.length} badge NFTs`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedSimple();
