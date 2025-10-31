import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { createPromotion, getPromotion, getPromotions } from '../../controllers/promotion';
import { createMockRequest, createMockResponse, createMockNext, createMockModel } from '../utils/testHelpers';
import { mockPromotionDoc, mockMerchantKeypair, mockPromotion, mockMerchant } from '../utils/mockData';

// Mock dependencies
vi.mock('../../services/solana.service', () => ({
  SolanaService: vi.fn().mockImplementation(() => ({
    createPromotion: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
      promotion: mockPromotion.toString(),
    }),
    getPromotion: vi.fn().mockResolvedValue({
      merchant: mockMerchant,
      title: 'Test Promotion',
      discountPercentage: 20,
      maxSupply: new BN(100),
      currentSupply: new BN(10),
      isActive: true,
      startDate: new BN(Math.floor(Date.now() / 1000)),
      endDate: new BN(Math.floor(Date.now() / 1000) + 86400 * 30),
    }),
  })),
}));

vi.mock('../../models/promotion', () => ({
  Promotion: createMockModel(mockPromotionDoc),
}));

vi.mock('../../models/merchant', () => ({
  Merchant: {
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: 'merchant-id',
        walletAddress: mockMerchantKeypair.publicKey.toString(),
      }),
    }),
  },
}));

describe('Promotion Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPromotion', () => {
    it('should create promotion successfully', async () => {
      const req = createMockRequest({
        body: {
          merchantWallet: mockMerchantKeypair.publicKey.toString(),
          promotionId: 1,
          title: 'Test Promotion',
          description: 'A test promotion',
          discountPercentage: 20,
          maxSupply: 100,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
          category: 'Food',
          price: 50,
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Test St',
          },
          termsAndConditions: 'Test terms',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await createPromotion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            signature: 'mock-signature',
            promotion: expect.any(Object),
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          merchantWallet: mockMerchantKeypair.publicKey.toString(),
          // Missing required fields
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await createPromotion(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate discount percentage range', async () => {
      const req = createMockRequest({
        body: {
          merchantWallet: mockMerchantKeypair.publicKey.toString(),
          promotionId: 1,
          title: 'Test Promotion',
          discountPercentage: 150, // Invalid: > 100
          maxSupply: 100,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
          category: 'Food',
          price: 50,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await createPromotion(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate date range', async () => {
      const req = createMockRequest({
        body: {
          merchantWallet: mockMerchantKeypair.publicKey.toString(),
          promotionId: 1,
          title: 'Test Promotion',
          discountPercentage: 20,
          maxSupply: 100,
          startDate: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
          endDate: new Date().toISOString(), // End before start
          category: 'Food',
          price: 50,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await createPromotion(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle merchant not found', async () => {
      const { Merchant } = await import('../../models/merchant');
      vi.mocked(Merchant.findOne).mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as any);

      const req = createMockRequest({
        body: {
          merchantWallet: mockMerchantKeypair.publicKey.toString(),
          promotionId: 1,
          title: 'Test Promotion',
          discountPercentage: 20,
          maxSupply: 100,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
          category: 'Food',
          price: 50,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await createPromotion(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPromotion', () => {
    it('should get promotion by address successfully', async () => {
      const req = createMockRequest({
        params: {
          address: mockPromotion.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotion(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            onchain: expect.any(Object),
            offchain: expect.any(Object),
          }),
        })
      );
    });

    it('should handle invalid promotion address', async () => {
      const req = createMockRequest({
        params: {
          address: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotion(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPromotions', () => {
    it('should get promotions with pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

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

    it('should filter promotions by category', async () => {
      const req = createMockRequest({
        query: {
          category: 'Food',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter promotions by merchant', async () => {
      const req = createMockRequest({
        query: {
          merchantId: 'merchant-id',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter active promotions only', async () => {
      const req = createMockRequest({
        query: {
          active: 'true',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter by location', async () => {
      const req = createMockRequest({
        query: {
          latitude: '40.7128',
          longitude: '-74.0060',
          radius: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should search promotions by title', async () => {
      const req = createMockRequest({
        query: {
          search: 'Test',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getPromotions(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
