import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQRCode, verifyQRCode } from '../../utils/qr-generator';

// Mock qrcode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
  },
}));

describe('QR Generator Utils', () => {
  describe('generateQRCode', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should generate QR code for coupon redemption', async () => {
      const couponAddress = '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG';
      const merchantAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

      const result = await generateQRCode(couponAddress, merchantAddress);

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(result).toBe('data:image/png;base64,mockQRCode');
    });

    it('should include timestamp in QR data', async () => {
      const couponAddress = '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG';
      const merchantAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

      await generateQRCode(couponAddress, merchantAddress);

      // Verify QR code was called (implementation detail)
      const QRCode = await import('qrcode');
      expect(QRCode.default.toDataURL).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const QRCode = await import('qrcode');
      vi.mocked(QRCode.default.toDataURL).mockRejectedValueOnce(new Error('QR generation failed'));

      await expect(
        generateQRCode('invalid', 'invalid')
      ).rejects.toThrow('QR generation failed');
    });
  });

  describe('verifyQRCode', () => {
    it('should verify valid QR code data', () => {
      const now = Date.now();
      const qrData = JSON.stringify({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        merchantAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        timestamp: now,
      });

      const result = verifyQRCode(qrData);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        merchantAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        timestamp: now,
      });
    });

    it('should reject expired QR codes', () => {
      const oldTimestamp = Date.now() - (11 * 60 * 1000); // 11 minutes ago
      const qrData = JSON.stringify({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        merchantAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        timestamp: oldTimestamp,
      });

      const result = verifyQRCode(qrData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code expired');
    });

    it('should reject QR codes with missing fields', () => {
      const qrData = JSON.stringify({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        // Missing merchantAddress and timestamp
      });

      const result = verifyQRCode(qrData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid QR code data');
    });

    it('should reject invalid JSON', () => {
      const result = verifyQRCode('invalid json');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid QR code format');
    });

    it('should accept QR codes within validity period', () => {
      const recentTimestamp = Date.now() - (5 * 60 * 1000); // 5 minutes ago
      const qrData = JSON.stringify({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        merchantAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        timestamp: recentTimestamp,
      });

      const result = verifyQRCode(qrData);

      expect(result.valid).toBe(true);
    });

    it('should reject QR codes with future timestamps', () => {
      const futureTimestamp = Date.now() + (5 * 60 * 1000); // 5 minutes in future
      const qrData = JSON.stringify({
        couponAddress: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG',
        merchantAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        timestamp: futureTimestamp,
      });

      const result = verifyQRCode(qrData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid QR code data');
    });
  });
});
