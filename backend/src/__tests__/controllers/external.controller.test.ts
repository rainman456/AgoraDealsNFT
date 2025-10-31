import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExternalDeals, syncExternalDeals } from '../../controllers/external';
import { createMockRequest, createMockResponse, createMockNext } from '../utils/testHelpers';

// Mock dependencies
vi.mock('../../services/aggregator.service', () => ({
  AggregatorService: vi.fn().mockImplementation(() => ({
    fetchFlightDeals: vi.fn().mockResolvedValue([
      {
        dealType: 'Flight',
        title: 'NYC to LA',
        description: 'Round trip flight',
        price: 299.99,
        originalPrice: 499.99,
        provider: 'Skyscanner',
        externalUrl: 'https://skyscanner.com/deal/123',
        validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
        metadata: {
          departure: 'JFK',
          arrival: 'LAX',
        },
      },
    ]),
    fetchHotelDeals: vi.fn().mockResolvedValue([
      {
        dealType: 'Hotel',
        title: 'Luxury Hotel NYC',
        description: '5-star hotel in Manhattan',
        price: 199.99,
        originalPrice: 399.99,
        provider: 'Booking.com',
        externalUrl: 'https://booking.com/hotel/123',
        validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
        metadata: {
          location: 'Manhattan, NY',
          rating: 5,
        },
      },
    ]),
    syncDealsToBlockchain: vi.fn().mockResolvedValue([
      {
        signature: 'mock-signature-1',
        externalDeal: 'deal-address-1',
      },
      {
        signature: 'mock-signature-2',
        externalDeal: 'deal-address-2',
      },
    ]),
  })),
}));

describe('External Deals Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExternalDeals', () => {
    it('should get flight deals successfully', async () => {
      const req = createMockRequest({
        query: {
          type: 'flight',
          origin: 'JFK',
          destination: 'LAX',
          date: '2024-12-01',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getExternalDeals(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deals: expect.arrayContaining([
              expect.objectContaining({
                dealType: 'Flight',
                title: expect.any(String),
                price: expect.any(Number),
              }),
            ]),
          }),
        })
      );
    });

    it('should get hotel deals successfully', async () => {
      const req = createMockRequest({
        query: {
          type: 'hotel',
          location: 'New York',
          checkIn: '2024-12-01',
          checkOut: '2024-12-05',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getExternalDeals(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deals: expect.arrayContaining([
              expect.objectContaining({
                dealType: 'Hotel',
                title: expect.any(String),
                price: expect.any(Number),
              }),
            ]),
          }),
        })
      );
    });

    it('should handle missing deal type', async () => {
      const req = createMockRequest({
        query: {
          // Missing type
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid deal type', async () => {
      const req = createMockRequest({
        query: {
          type: 'invalid-type',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle API errors', async () => {
      const { AggregatorService } = await import('../../services/aggregator.service');
      const mockInstance = new AggregatorService();
      vi.mocked(mockInstance.fetchFlightDeals).mockRejectedValueOnce(
        new Error('API error')
      );

      const req = createMockRequest({
        query: {
          type: 'flight',
          origin: 'JFK',
          destination: 'LAX',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await getExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('syncExternalDeals', () => {
    it('should sync deals to blockchain successfully', async () => {
      const req = createMockRequest({
        body: {
          deals: [
            {
              dealType: 'Flight',
              title: 'NYC to LA',
              price: 299.99,
              externalUrl: 'https://example.com/deal/1',
              validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
            },
            {
              dealType: 'Hotel',
              title: 'Luxury Hotel',
              price: 199.99,
              externalUrl: 'https://example.com/deal/2',
              validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
            },
          ],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            synced: 2,
            results: expect.arrayContaining([
              expect.objectContaining({
                signature: expect.any(String),
                externalDeal: expect.any(String),
              }),
            ]),
          }),
        })
      );
    });

    it('should handle missing deals array', async () => {
      const req = createMockRequest({
        body: {
          // Missing deals
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle empty deals array', async () => {
      const req = createMockRequest({
        body: {
          deals: [],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate deal structure', async () => {
      const req = createMockRequest({
        body: {
          deals: [
            {
              // Missing required fields
              title: 'Test Deal',
            },
          ],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle blockchain sync errors', async () => {
      const { AggregatorService } = await import('../../services/aggregator.service');
      const mockInstance = new AggregatorService();
      vi.mocked(mockInstance.syncDealsToBlockchain).mockRejectedValueOnce(
        new Error('Blockchain sync failed')
      );

      const req = createMockRequest({
        body: {
          deals: [
            {
              dealType: 'Flight',
              title: 'NYC to LA',
              price: 299.99,
              externalUrl: 'https://example.com/deal/1',
              validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
            },
          ],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle partial sync failures gracefully', async () => {
      const { AggregatorService } = await import('../../services/aggregator.service');
      const mockInstance = new AggregatorService();
      vi.mocked(mockInstance.syncDealsToBlockchain).mockResolvedValueOnce([
        {
          signature: 'mock-signature-1',
          externalDeal: 'deal-address-1',
        },
        {
          error: 'Failed to sync deal 2',
        },
      ] as any);

      const req = createMockRequest({
        body: {
          deals: [
            {
              dealType: 'Flight',
              title: 'NYC to LA',
              price: 299.99,
              externalUrl: 'https://example.com/deal/1',
              validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
            },
            {
              dealType: 'Hotel',
              title: 'Luxury Hotel',
              price: 199.99,
              externalUrl: 'https://example.com/deal/2',
              validUntil: Math.floor(Date.now() / 1000) + 86400 * 7,
            },
          ],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await syncExternalDeals(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
