import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { registerMerchant, getMerchant, getMerchants } from '../../controllers/merchant';
import { createMockRequest, createMockResponse, createMockNext, createMockModel } from '../utils/testHelpers';
import { mockMerchantDoc, mockMerchantKeypair, mockMerchant } from '../utils/mockData';

// Mock dependencies
vi.mock('../../services/solana.service', () => ({
  SolanaService: vi.fn().mockImplementation(() => ({
    registerMerchant: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
      merchant: mockMerchant.toString(),
    }),
    getMerchant: vi.fn().mockResolvedValue({
      authority: mockMerchantKeypair.publicKey,
      name: 'Test Merchant',
      category: 'Restaurant',
      isActive: true,
      totalPromotions: 5,
      rating: 45,
      totalRatings: 10,
    }),
  })),
}));

vi.mock('../../models/merchant', () => ({
  Merchant: createMockModel(mockMerchantDoc),
}));

describe('Merchant Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerMerchant', () => {
    it('should register merchant successfully', async () => {
      const req = createMockRequest({
        body: {
          walletAddress: mockMerchantKeypair.publicKey.toString(),
          name: 'Test Merchant',
          description: 'A test merchant',
          category: 'Restaurant',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Test St',
          },
          contactInfo: {
            email: 'test@merchant.com',
            phone: '+1234567890',
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await registerMerchant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            signature: 'mock-signature',
            merchant: expect.any(Object),
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          walletAddress: mockMerchantKeypair.publicKey.toString(),
          // Missing name and category
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await registerMerchant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid wallet address', async () => {
      const req = createMockRequest({
        body: {
          walletAddress: 'invalid-address',
          name: 'Test Merchant',
          category: 'Restaurant',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await registerMerchant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle blockchain errors', async () => {
      const { SolanaService } = await import('../../services/solana.service');
      const mockInstance = new SolanaService();
      vi.mocked(mockInstance.registerMerchant).mockRejectedValueOnce(
        new Error('Blockchain error')
      );

      const req = createMockRequest({
        body: {
          walletAddress: mockMerchantKeypair.publicKey.toString(),
          name: 'Test Merchant',
          category: 'Restaurant',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await registerMerchant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMerchant', () => {
    it('should get merchant by address successfully', async () => {
      const req = createMockRequest({
        params: {
          address: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchant(req, res, next);

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

    it('should handle invalid merchant address', async () => {
      const req = createMockRequest({
        params: {
          address: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle merchant not found', async () => {
      const { SolanaService } = await import('../../services/solana.service');
      const mockInstance = new SolanaService();
      vi.mocked(mockInstance.getMerchant).mockRejectedValueOnce(
        new Error('Account does not exist')
      );

      const req = createMockRequest({
        params: {
          address: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMerchants', () => {
    it('should get merchants with pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchants(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.objectContaining({
              total: expect.any(Number),
              page: 1,
              limit: 10,
              totalPages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrev: expect.any(Boolean),
            }),
          }),
        })
      );
    });

    it('should filter merchants by category', async () => {
      const req = createMockRequest({
        query: {
          category: 'Restaurant',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchants(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter merchants by location', async () => {
      const req = createMockRequest({
        query: {
          latitude: '40.7128',
          longitude: '-74.0060',
          radius: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchants(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should search merchants by name', async () => {
      const req = createMockRequest({
        query: {
          search: 'Test',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getMerchants(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const { Merchant } = await import('../../models/merchant');
      vi.mocked(Merchant.find).mockReturnValue({
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

      await getMerchants(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
