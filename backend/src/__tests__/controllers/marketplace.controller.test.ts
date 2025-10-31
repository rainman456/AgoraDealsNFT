import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { listCoupon, buyCoupon, getListings } from '../../controllers/marketplace';
import { createMockRequest, createMockResponse, createMockNext } from '../utils/testHelpers';
import { mockUserKeypair, mockCoupon, mockListing } from '../utils/mockData';

// Mock dependencies
vi.mock('../../services/solana.service', () => ({
  SolanaService: vi.fn().mockImplementation(() => ({
    listForSale: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
      listing: mockListing.toString(),
    }),
    buyListing: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
    }),
    getListing: vi.fn().mockResolvedValue({
      coupon: mockCoupon,
      seller: mockUserKeypair.publicKey,
      price: new BN(1000000000),
      isActive: true,
    }),
  })),
}));

vi.mock('../../models/coupon', () => ({
  Coupon: {
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        {
          _id: 'coupon-id',
          onchainAddress: mockCoupon.toString(),
          owner: mockUserKeypair.publicKey.toString(),
          isRedeemed: false,
        },
      ]),
    }),
    countDocuments: vi.fn().mockResolvedValue(1),
  },
}));

describe('Marketplace Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCoupon', () => {
    it('should list coupon for sale successfully', async () => {
      const req = createMockRequest({
        body: {
          sellerWallet: mockUserKeypair.publicKey.toString(),
          couponAddress: mockCoupon.toString(),
          price: 1.5, // SOL
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await listCoupon(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            signature: 'mock-signature',
            listing: expect.any(String),
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          sellerWallet: mockUserKeypair.publicKey.toString(),
          // Missing couponAddress and price
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await listCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate price is positive', async () => {
      const req = createMockRequest({
        body: {
          sellerWallet: mockUserKeypair.publicKey.toString(),
          couponAddress: mockCoupon.toString(),
          price: -1,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await listCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid addresses', async () => {
      const req = createMockRequest({
        body: {
          sellerWallet: 'invalid-address',
          couponAddress: 'invalid-address',
          price: 1.5,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await listCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('buyCoupon', () => {
    it('should buy coupon successfully', async () => {
      const req = createMockRequest({
        body: {
          buyerWallet: mockUserKeypair.publicKey.toString(),
          listingAddress: mockListing.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await buyCoupon(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            signature: 'mock-signature',
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          buyerWallet: mockUserKeypair.publicKey.toString(),
          // Missing listingAddress
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await buyCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid addresses', async () => {
      const req = createMockRequest({
        body: {
          buyerWallet: 'invalid-address',
          listingAddress: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await buyCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getListings', () => {
    it('should get listings with pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getListings(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it('should filter by promotion', async () => {
      const req = createMockRequest({
        query: {
          promotionId: 'promotion-id',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getListings(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter by price range', async () => {
      const req = createMockRequest({
        query: {
          minPrice: '0.5',
          maxPrice: '2.0',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getListings(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should sort by price', async () => {
      const req = createMockRequest({
        query: {
          sortBy: 'price',
          sortOrder: 'asc',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getListings(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const { Coupon } = await import('../../models/coupon');
      vi.mocked(Coupon.find).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const req = createMockRequest({
        query: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getListings(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
