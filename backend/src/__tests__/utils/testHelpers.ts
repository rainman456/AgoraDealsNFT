import { vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/**
 * Create a mock Anchor program
 */
export const createMockProgram = () => ({
  methods: {
    initialize: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    registerMerchant: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    createPromotion: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    mintCoupon: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    transferCoupon: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    redeemCoupon: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    listForSale: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    buyListing: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    ratePromotion: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    addComment: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
    updateExternalDeal: vi.fn().mockReturnValue({
      accounts: vi.fn().mockReturnThis(),
      signers: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue('mock-signature'),
    }),
  },
  account: {
    marketplace: {
      fetch: vi.fn().mockResolvedValue({
        authority: new PublicKey('11111111111111111111111111111111'),
        totalMerchants: new BN(10),
        totalPromotions: new BN(50),
        totalCoupons: new BN(200),
      }),
    },
    merchant: {
      fetch: vi.fn().mockResolvedValue({
        authority: new PublicKey('11111111111111111111111111111111'),
        name: 'Test Merchant',
        category: 'Restaurant',
        isActive: true,
        totalPromotions: new BN(5),
        rating: new BN(45),
        totalRatings: new BN(10),
      }),
    },
    promotion: {
      fetch: vi.fn().mockResolvedValue({
        merchant: new PublicKey('11111111111111111111111111111111'),
        title: 'Test Promotion',
        discountPercentage: 20,
        maxSupply: new BN(100),
        currentSupply: new BN(10),
        isActive: true,
        startDate: new BN(Math.floor(Date.now() / 1000)),
        endDate: new BN(Math.floor(Date.now() / 1000) + 86400 * 30),
      }),
    },
    coupon: {
      fetch: vi.fn().mockResolvedValue({
        promotion: new PublicKey('11111111111111111111111111111111'),
        owner: new PublicKey('22222222222222222222222222222222'),
        mint: new PublicKey('33333333333333333333333333333333'),
        serialNumber: new BN(1),
        isRedeemed: false,
        redeemedAt: new BN(0),
      }),
    },
    listing: {
      fetch: vi.fn().mockResolvedValue({
        coupon: new PublicKey('11111111111111111111111111111111'),
        seller: new PublicKey('22222222222222222222222222222222'),
        price: new BN(1000000000),
        isActive: true,
      }),
    },
  },
});

/**
 * Create a mock Express request
 */
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null as (any | null),
  ...overrides,
});

/**
 * Create a mock Express response
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock Express next function
 */
export const createMockNext = () => vi.fn();

/**
 * Mock Mongoose model methods
 */
export const createMockModel = (mockData: any) => ({
  find: vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([mockData]),
  }),
  findOne: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(mockData),
  }),
  findById: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(mockData),
  }),
  create: vi.fn().mockResolvedValue(mockData),
  findByIdAndUpdate: vi.fn().mockResolvedValue(mockData),
  findByIdAndDelete: vi.fn().mockResolvedValue(mockData),
  countDocuments: vi.fn().mockResolvedValue(1),
});

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
