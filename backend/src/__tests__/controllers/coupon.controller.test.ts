import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { mintCoupon, transferCoupon, getCoupon, getUserCoupons } from '../../controllers/coupon';
import { createMockRequest, createMockResponse, createMockNext, createMockModel } from '../utils/testHelpers';
import { mockCouponDoc, mockUserKeypair, mockCoupon, mockPromotion, mockMint } from '../utils/mockData';

// Mock dependencies
vi.mock('../../services/solana.service', () => ({
  SolanaService: vi.fn().mockImplementation(() => ({
    mintCoupon: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
      coupon: mockCoupon.toString(),
      mint: mockMint.toString(),
    }),
    transferCoupon: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
    }),
    getCoupon: vi.fn().mockResolvedValue({
      promotion: mockPromotion,
      owner: mockUserKeypair.publicKey,
      mint: mockMint,
      serialNumber: new BN(1),
      isRedeemed: false,
      redeemedAt: new BN(0),
    }),
  })),
}));

vi.mock('../../models/coupon', () => ({
  Coupon: createMockModel(mockCouponDoc),
}));

vi.mock('../../models/promotion', () => ({
  Promotion: {
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: 'promotion-id',
        onchainAddress: mockPromotion.toString(),
      }),
    }),
  },
}));

describe('Coupon Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mintCoupon', () => {
    it('should mint coupon successfully', async () => {
      const req = createMockRequest({
        body: {
          userWallet: mockUserKeypair.publicKey.toString(),
          promotionAddress: mockPromotion.toString(),
          serialNumber: 1,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await mintCoupon(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            signature: 'mock-signature',
            coupon: expect.any(Object),
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          userWallet: mockUserKeypair.publicKey.toString(),
          // Missing promotionAddress and serialNumber
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await mintCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid wallet address', async () => {
      const req = createMockRequest({
        body: {
          userWallet: 'invalid-address',
          promotionAddress: mockPromotion.toString(),
          serialNumber: 1,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await mintCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle promotion not found', async () => {
      const { Promotion } = await import('../../models/promotion');
      vi.mocked(Promotion.findOne).mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as any);

      const req = createMockRequest({
        body: {
          userWallet: mockUserKeypair.publicKey.toString(),
          promotionAddress: mockPromotion.toString(),
          serialNumber: 1,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await mintCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('transferCoupon', () => {
    it('should transfer coupon successfully', async () => {
      const req = createMockRequest({
        body: {
          fromWallet: mockUserKeypair.publicKey.toString(),
          toWallet: new PublicKey('99999999999999999999999999999999').toString(),
          couponAddress: mockCoupon.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await transferCoupon(req, res, next);

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
          fromWallet: mockUserKeypair.publicKey.toString(),
          // Missing toWallet and couponAddress
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await transferCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid addresses', async () => {
      const req = createMockRequest({
        body: {
          fromWallet: 'invalid-address',
          toWallet: 'invalid-address',
          couponAddress: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await transferCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCoupon', () => {
    it('should get coupon by address successfully', async () => {
      const req = createMockRequest({
        params: {
          address: mockCoupon.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getCoupon(req, res, next);

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

    it('should handle invalid coupon address', async () => {
      const req = createMockRequest({
        params: {
          address: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserCoupons', () => {
    it('should get user coupons with pagination', async () => {
      const req = createMockRequest({
        params: {
          walletAddress: mockUserKeypair.publicKey.toString(),
        },
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getUserCoupons(req, res, next);

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

    it('should filter unredeemed coupons', async () => {
      const req = createMockRequest({
        params: {
          walletAddress: mockUserKeypair.publicKey.toString(),
        },
        query: {
          redeemed: 'false',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getUserCoupons(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter by promotion', async () => {
      const req = createMockRequest({
        params: {
          walletAddress: mockUserKeypair.publicKey.toString(),
        },
        query: {
          promotionId: 'promotion-id',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getUserCoupons(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle invalid wallet address', async () => {
      const req = createMockRequest({
        params: {
          walletAddress: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getUserCoupons(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
