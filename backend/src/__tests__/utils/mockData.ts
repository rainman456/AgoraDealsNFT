import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

// Mock keypairs
export const mockKeypair = Keypair.generate();
export const mockMerchantKeypair = Keypair.generate();
export const mockUserKeypair = Keypair.generate();

// Mock public keys
export const mockProgramId = new PublicKey('11111111111111111111111111111111');
export const mockMarketplace = new PublicKey('22222222222222222222222222222222');
export const mockMerchant = new PublicKey('33333333333333333333333333333333');
export const mockPromotion = new PublicKey('44444444444444444444444444444444');
export const mockCoupon = new PublicKey('55555555555555555555555555555555');
export const mockListing = new PublicKey('66666666666666666666666666666666');
export const mockMint = new PublicKey('77777777777777777777777777777777');
export const mockMetadata = new PublicKey('88888888888888888888888888888888');

// Mock merchant data
export const mockMerchantData = {
  name: 'Test Merchant',
  description: 'A test merchant for unit testing',
  category: 'Restaurant',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Test St, New York, NY',
  },
  contactInfo: {
    email: 'test@merchant.com',
    phone: '+1234567890',
    website: 'https://testmerchant.com',
  },
};

// Mock promotion data
export const mockPromotionData = {
  title: 'Test Promotion',
  description: 'A test promotion for unit testing',
  discountPercentage: 20,
  maxSupply: 100,
  startDate: Math.floor(Date.now() / 1000),
  endDate: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  category: 'Food',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Test St, New York, NY',
  },
  termsAndConditions: 'Test terms and conditions',
};

// Mock coupon data
export const mockCouponData = {
  serialNumber: 1,
  isRedeemed: false,
  redeemedAt: null as (Date | null),
  owner: mockUserKeypair.publicKey.toBase58(),
};

// Mock listing data
export const mockListingData = {
  price: new BN(1000000000), // 1 SOL
  isActive: true,
};

// Mock rating data
export const mockRatingData = {
  score: 5,
  comment: 'Great promotion!',
};

// Mock external deal data
export const mockExternalDealData = {
  dealType: 'Flight',
  title: 'NYC to LA Flight Deal',
  description: 'Round trip flight from NYC to LA',
  price: 299.99,
  originalPrice: 499.99,
  provider: 'Skyscanner',
  externalUrl: 'https://skyscanner.com/deal/123',
  validUntil: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  metadata: {
    departure: 'JFK',
    arrival: 'LAX',
    date: '2024-12-01',
  },
};

// Mock MongoDB documents
export const mockUserDoc = {
  _id: '507f1f77bcf86cd799439011',
  walletAddress: mockUserKeypair.publicKey.toBase58(),
  email: 'user@test.com',
  username: 'testuser',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockMerchantDoc = {
  _id: '507f1f77bcf86cd799439012',
  walletAddress: mockMerchantKeypair.publicKey.toBase58(),
  onchainAddress: mockMerchant.toBase58(),
  name: mockMerchantData.name,
  description: mockMerchantData.description,
  category: mockMerchantData.category,
  location: mockMerchantData.location,
  contactInfo: mockMerchantData.contactInfo,
  isVerified: true,
  rating: 4.5,
  totalPromotions: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPromotionDoc = {
  _id: '507f1f77bcf86cd799439013',
  merchantId: mockMerchantDoc._id,
  onchainAddress: mockPromotion.toBase58(),
  title: mockPromotionData.title,
  description: mockPromotionData.description,
  discountPercentage: mockPromotionData.discountPercentage,
  maxSupply: mockPromotionData.maxSupply,
  currentSupply: 10,
  startDate: new Date(mockPromotionData.startDate * 1000),
  endDate: new Date(mockPromotionData.endDate * 1000),
  category: mockPromotionData.category,
  location: mockPromotionData.location,
  termsAndConditions: mockPromotionData.termsAndConditions,
  isActive: true,
  rating: 4.8,
  totalRatings: 25,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCouponDoc = {
  _id: '507f1f77bcf86cd799439014',
  promotionId: mockPromotionDoc._id,
  onchainAddress: mockCoupon.toBase58(),
  mintAddress: mockMint.toBase58(),
  serialNumber: mockCouponData.serialNumber,
  owner: mockCouponData.owner,
  isRedeemed: mockCouponData.isRedeemed,
  redeemedAt: mockCouponData.redeemedAt,
  transferHistory: [] as Array<any>,
  createdAt: new Date(),
  updatedAt: new Date(),
};
