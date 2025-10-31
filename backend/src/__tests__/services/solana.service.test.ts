import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import { SolanaService } from '../../services/solana.service';
import { createMockProgram } from '../utils/testHelpers';
import {
  mockKeypair,
  mockMerchantKeypair,
  mockUserKeypair,
  mockMarketplace,
  mockMerchant,
  mockPromotion,
  mockCoupon,
  mockListing,
} from '../utils/mockData';

// Mock the Solana config
vi.mock('../../config/solana', () => ({
  getSolanaConfig: vi.fn(() => ({
    program: createMockProgram(),
    wallet: mockKeypair,
    connection: {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      }),
    },
    getMarketplacePDA: vi.fn(() => [mockMarketplace, 255]),
    getMerchantPDA: vi.fn(() => [mockMerchant, 255]),
    getPromotionPDA: vi.fn(() => [mockPromotion, 255]),
    getCouponPDA: vi.fn(() => [mockCoupon, 255]),
    getListingPDA: vi.fn(() => [mockListing, 255]),
    getRatingPDA: vi.fn(() => [new PublicKey('99999999999999999999999999999999'), 255]),
    getCommentPDA: vi.fn(() => [new PublicKey('88888888888888888888888888888888'), 255]),
    getExternalDealPDA: vi.fn(() => [new PublicKey('77777777777777777777777777777777'), 255]),
  })),
}));

describe('SolanaService', () => {
  let solanaService: SolanaService;

  beforeEach(() => {
    vi.clearAllMocks();
    solanaService = new SolanaService();
  });

  describe('initializeMarketplace', () => {
    it('should initialize marketplace successfully', async () => {
      const result = await solanaService.initializeMarketplace();

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('marketplace');
      expect(result.signature).toBe('mock-signature');
      expect(result.marketplace).toBe(mockMarketplace.toString());
    });

    it('should handle initialization errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.initialize).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Initialization failed')),
      } as any);

      await expect(solanaService.initializeMarketplace()).rejects.toThrow('Initialization failed');
    });
  });

  describe('registerMerchant', () => {
    it('should register merchant successfully', async () => {
      const result = await solanaService.registerMerchant(
        mockMerchantKeypair.publicKey,
        'Test Merchant',
        'Restaurant',
        40.7128,
        -74.0060
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('merchant');
      expect(result.signature).toBe('mock-signature');
      expect(result.merchant).toBe(mockMerchant.toString());
    });

    it('should register merchant without location', async () => {
      const result = await solanaService.registerMerchant(
        mockMerchantKeypair.publicKey,
        'Test Merchant',
        'Restaurant'
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('merchant');
    });

    it('should handle registration errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.registerMerchant).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Registration failed')),
      } as any);

      await expect(
        solanaService.registerMerchant(
          mockMerchantKeypair.publicKey,
          'Test Merchant',
          'Restaurant'
        )
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('createPromotion', () => {
    it('should create promotion successfully', async () => {
      const result = await solanaService.createPromotion(
        mockMerchantKeypair.publicKey,
        1,
        20,
        100,
        Math.floor(Date.now() / 1000) + 86400 * 30,
        'Food',
        'Test Promotion',
        50
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('promotion');
      expect(result.signature).toBe('mock-signature');
      expect(result.promotion).toBe(mockPromotion.toString());
    });

    it('should handle creation errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.createPromotion).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Creation failed')),
      } as any);

      await expect(
        solanaService.createPromotion(
          mockMerchantKeypair.publicKey,
          1,
          20,
          100,
          Math.floor(Date.now() / 1000) + 86400 * 30,
          'Food',
          'Test Promotion',
          50
        )
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('mintCoupon', () => {
    it('should mint coupon successfully', async () => {
      const result = await solanaService.mintCoupon(
        mockUserKeypair.publicKey,
        mockPromotion,
        1
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('coupon');
      expect(result).toHaveProperty('mint');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle minting errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.mintCoupon).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Minting failed')),
      } as any);

      await expect(
        solanaService.mintCoupon(mockUserKeypair.publicKey, mockPromotion, 1)
      ).rejects.toThrow('Minting failed');
    });
  });

  describe('transferCoupon', () => {
    it('should transfer coupon successfully', async () => {
      const result = await solanaService.transferCoupon(
        mockUserKeypair.publicKey,
        mockCoupon,
        new PublicKey('99999999999999999999999999999999')
      );

      expect(result).toHaveProperty('signature');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle transfer errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.transferCoupon).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Transfer failed')),
      } as any);

      await expect(
        solanaService.transferCoupon(
          mockUserKeypair.publicKey,
          mockCoupon,
          new PublicKey('99999999999999999999999999999999')
        )
      ).rejects.toThrow('Transfer failed');
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem coupon successfully', async () => {
      const result = await solanaService.redeemCoupon(
        mockUserKeypair.publicKey,
        mockCoupon,
        mockMerchant
      );

      expect(result).toHaveProperty('signature');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle redemption errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.redeemCoupon).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Redemption failed')),
      } as any);

      await expect(
        solanaService.redeemCoupon(mockUserKeypair.publicKey, mockCoupon, mockMerchant)
      ).rejects.toThrow('Redemption failed');
    });
  });

  describe('listForSale', () => {
    it('should list coupon for sale successfully', async () => {
      const result = await solanaService.listForSale(
        mockUserKeypair.publicKey,
        mockCoupon,
        new BN(1000000000)
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('listing');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle listing errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.listForSale).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Listing failed')),
      } as any);

      await expect(
        solanaService.listForSale(mockUserKeypair.publicKey, mockCoupon, new BN(1000000000))
      ).rejects.toThrow('Listing failed');
    });
  });

  describe('buyListing', () => {
    it('should buy listing successfully', async () => {
      const result = await solanaService.buyListing(
        mockUserKeypair.publicKey,
        mockListing
      );

      expect(result).toHaveProperty('signature');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle purchase errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.buyListing).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Purchase failed')),
      } as any);

      await expect(
        solanaService.buyListing(mockUserKeypair.publicKey, mockListing)
      ).rejects.toThrow('Purchase failed');
    });
  });

  describe('ratePromotion', () => {
    it('should rate promotion successfully', async () => {
      const result = await solanaService.ratePromotion(
        mockUserKeypair.publicKey,
        mockPromotion,
        5,
        'Great promotion!'
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('rating');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle rating errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.ratePromotion).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Rating failed')),
      } as any);

      await expect(
        solanaService.ratePromotion(
          mockUserKeypair.publicKey,
          mockPromotion,
          5,
          'Great promotion!'
        )
      ).rejects.toThrow('Rating failed');
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      const result = await solanaService.addComment(
        mockUserKeypair.publicKey,
        mockPromotion,
        mockMerchant,
        'Great deal!',
        null
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('comment');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle comment errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.addComment).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Comment failed')),
      } as any);

      await expect(
        solanaService.addComment(
          mockUserKeypair.publicKey,
          mockPromotion,
          mockMerchant,
          'Great deal!',
          null
        )
      ).rejects.toThrow('Comment failed');
    });
  });

  describe('updateExternalDeal', () => {
    it('should update external deal successfully', async () => {
      const result = await solanaService.updateExternalDeal(
        mockKeypair.publicKey,
        1,
        'Flight',
        'NYC to LA',
        299.99,
        'https://example.com/deal',
        Math.floor(Date.now() / 1000) + 86400 * 7
      );

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('externalDeal');
      expect(result.signature).toBe('mock-signature');
    });

    it('should handle update errors', async () => {
      const { getSolanaConfig } = await import('../../config/solana');
      const mockConfig = vi.mocked(getSolanaConfig)();
      vi.mocked(mockConfig.program.methods.updateExternalDeal).mockReturnValue({
        accounts: vi.fn().mockReturnThis(),
        signers: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockRejectedValue(new Error('Update failed')),
      } as any);

      await expect(
        solanaService.updateExternalDeal(
          mockKeypair.publicKey,
          1,
          'Flight',
          'NYC to LA',
          299.99,
          'https://example.com/deal',
          Math.floor(Date.now() / 1000) + 86400 * 7
        )
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getMarketplace', () => {
    it('should fetch marketplace data successfully', async () => {
      const result = await solanaService.getMarketplace();

      expect(result).toHaveProperty('authority');
      expect(result).toHaveProperty('totalMerchants');
      expect(result).toHaveProperty('totalPromotions');
      expect(result).toHaveProperty('totalCoupons');
    });
  });

  describe('getMerchant', () => {
    it('should fetch merchant data successfully', async () => {
      const result = await solanaService.getMerchant(mockMerchant);

      expect(result).toHaveProperty('authority');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('isActive');
    });
  });

  describe('getPromotion', () => {
    it('should fetch promotion data successfully', async () => {
      const result = await solanaService.getPromotion(mockPromotion);

      expect(result).toHaveProperty('merchant');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('discountPercentage');
      expect(result).toHaveProperty('maxSupply');
      expect(result).toHaveProperty('currentSupply');
    });
  });

  describe('getCoupon', () => {
    it('should fetch coupon data successfully', async () => {
      const result = await solanaService.getCoupon(mockCoupon);

      expect(result).toHaveProperty('promotion');
      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('mint');
      expect(result).toHaveProperty('serialNumber');
      expect(result).toHaveProperty('isRedeemed');
    });
  });

  describe('getListing', () => {
    it('should fetch listing data successfully', async () => {
      const result = await solanaService.getListing(mockListing);

      expect(result).toHaveProperty('coupon');
      expect(result).toHaveProperty('seller');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('isActive');
    });
  });
});
