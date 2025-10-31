import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { generateRedemptionQR, verifyRedemptionQR, redeemCoupon } from '../../controllers/redemption';
import { createMockRequest, createMockResponse, createMockNext } from '../utils/testHelpers';
import { mockUserKeypair, mockMerchantKeypair, mockCoupon, mockMerchant } from '../utils/mockData';

// Mock dependencies
vi.mock('../../services/solana.service', () => ({
  SolanaService: vi.fn().mockImplementation(() => ({
    redeemCoupon: vi.fn().mockResolvedValue({
      signature: 'mock-signature',
    }),
  })),
}));

vi.mock('../../services/redemption.service', () => ({
  RedemptionService: vi.fn().mockImplementation(() => ({
    generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
    verifyQRCode: vi.fn().mockReturnValue({
      valid: true,
      data: {
        couponAddress: mockCoupon.toString(),
        merchantAddress: mockMerchant.toString(),
        timestamp: Date.now(),
      },
    }),
  })),
}));

vi.mock('../../models/coupon', () => ({
  Coupon: {
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: 'coupon-id',
        onchainAddress: mockCoupon.toString(),
        owner: mockUserKeypair.publicKey.toString(),
        isRedeemed: false,
      }),
    }),
    findByIdAndUpdate: vi.fn().mockResolvedValue({
      _id: 'coupon-id',
      isRedeemed: true,
      redeemedAt: new Date(),
    }),
  },
}));

describe('Redemption Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRedemptionQR', () => {
    it('should generate QR code successfully', async () => {
      const req = createMockRequest({
        body: {
          couponAddress: mockCoupon.toString(),
          merchantAddress: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateRedemptionQR(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            qrCode: expect.stringContaining('data:image/png;base64,'),
          }),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {
          couponAddress: mockCoupon.toString(),
          // Missing merchantAddress
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateRedemptionQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid addresses', async () => {
      const req = createMockRequest({
        body: {
          couponAddress: 'invalid-address',
          merchantAddress: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateRedemptionQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle coupon not found', async () => {
      const { Coupon } = await import('../../models/coupon');
      vi.mocked(Coupon.findOne).mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as any);

      const req = createMockRequest({
        body: {
          couponAddress: mockCoupon.toString(),
          merchantAddress: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateRedemptionQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle already redeemed coupon', async () => {
      const { Coupon } = await import('../../models/coupon');
      vi.mocked(Coupon.findOne).mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: 'coupon-id',
          isRedeemed: true,
        }),
      } as any);

      const req = createMockRequest({
        body: {
          couponAddress: mockCoupon.toString(),
          merchantAddress: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateRedemptionQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('verifyRedemptionQR', () => {
    it('should verify QR code successfully', async () => {
      const qrData = JSON.stringify({
        couponAddress: mockCoupon.toString(),
        merchantAddress: mockMerchant.toString(),
        timestamp: Date.now(),
      });

      const req = createMockRequest({
        body: {
          qrData,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyRedemptionQR(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            valid: true,
            couponAddress: mockCoupon.toString(),
            merchantAddress: mockMerchant.toString(),
          }),
        })
      );
    });

    it('should handle missing QR data', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyRedemptionQR(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid QR data', async () => {
      const { RedemptionService } = await import('../../services/redemption.service');
      const mockInstance = new RedemptionService();
      vi.mocked(mockInstance.verifyQRCode).mockReturnValue({
        valid: false,
        error: 'Invalid QR code format',
      });

      const req = createMockRequest({
        body: {
          qrData: 'invalid-qr-data',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyRedemptionQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid QR code format',
        })
      );
    });

    it('should handle expired QR code', async () => {
      const { RedemptionService } = await import('../../services/redemption.service');
      const mockInstance = new RedemptionService();
      vi.mocked(mockInstance.verifyQRCode).mockReturnValue({
        valid: false,
        error: 'QR code expired',
      });

      const oldTimestamp = Date.now() - (11 * 60 * 1000);
      const qrData = JSON.stringify({
        couponAddress: mockCoupon.toString(),
        merchantAddress: mockMerchant.toString(),
        timestamp: oldTimestamp,
      });

      const req = createMockRequest({
        body: {
          qrData,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyRedemptionQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'QR code expired',
        })
      );
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem coupon successfully', async () => {
      const req = createMockRequest({
        body: {
          userWallet: mockUserKeypair.publicKey.toString(),
          couponAddress: mockCoupon.toString(),
          merchantAddress: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await redeemCoupon(req, res, next);

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
          userWallet: mockUserKeypair.publicKey.toString(),
          // Missing couponAddress and merchantAddress
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await redeemCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid addresses', async () => {
      const req = createMockRequest({
        body: {
          userWallet: 'invalid-address',
          couponAddress: 'invalid-address',
          merchantAddress: 'invalid-address',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await redeemCoupon(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should update coupon status in database', async () => {
      const { Coupon } = await import('../../models/coupon');

      const req = createMockRequest({
        body: {
          userWallet: mockUserKeypair.publicKey.toString(),
          couponAddress: mockCoupon.toString(),
          merchantAddress: mockMerchant.toString(),
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await redeemCoupon(req, res, next);

      expect(Coupon.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
