import { Request, Response } from 'express';
import { solanaService } from '../services/solana.service';
import { aggregatorService } from '../services/aggregator.service';
import { logger } from '../utils/logger';

export class ExternalController {
  /**
   * POST /api/v1/external/sync-flights
   * Sync flight deals from external sources
   */
  async syncFlights(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, departureDate, returnDate } = req.body;

      if (!origin || !destination || !departureDate) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: origin, destination, departureDate',
        });
      }

      // Fetch flight deals from aggregator
      const deals = await aggregatorService.fetchFlightDeals({
        origin,
        destination,
        departureDate,
        returnDate,
      });

      // Sync to blockchain (in background)
      setImmediate(async () => {
        for (const deal of deals) {
          try {
            const expiryTimestamp = typeof deal.expiryTimestamp === 'string' 
              ? Math.floor(new Date(deal.expiryTimestamp).getTime() / 1000)
              : deal.expiryTimestamp;
            
            await solanaService.updateExternalDeal(
              deal.externalId,
              deal.title,
              deal.description,
              deal.originalPrice,
              deal.discountedPrice,
              deal.category,
              deal.imageUrl,
              deal.affiliateUrl,
              expiryTimestamp
            );
          } catch (error) {
            logger.error(`Failed to sync flight deal ${deal.externalId}:`, error);
          }
        }
      });

      res.json({
        success: true,
        message: 'Flight deals sync initiated',
        data: {
          dealsFound: deals.length,
        },
      });
    } catch (error) {
      logger.error('Failed to sync flight deals:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/external/sync-hotels
   * Sync hotel deals from external sources
   */
  async syncHotels(req: Request, res: Response): Promise<void> {
    try {
      const { location, checkIn, checkOut } = req.body;

      if (!location || !checkIn || !checkOut) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: location, checkIn, checkOut',
        });
      }

      // Fetch hotel deals from aggregator
      const deals = await aggregatorService.fetchHotelDeals({
        location,
        checkIn,
        checkOut,
      });

      // Sync to blockchain (in background)
      setImmediate(async () => {
        for (const deal of deals) {
          try {
            const expiryTimestamp = typeof deal.expiryTimestamp === 'string' 
              ? Math.floor(new Date(deal.expiryTimestamp).getTime() / 1000)
              : deal.expiryTimestamp;
            
            await solanaService.updateExternalDeal(
              deal.externalId,
              deal.title,
              deal.description,
              deal.originalPrice,
              deal.discountedPrice,
              deal.category,
              deal.imageUrl,
              deal.affiliateUrl,
              expiryTimestamp
            );
          } catch (error) {
            logger.error(`Failed to sync hotel deal ${deal.externalId}:`, error);
          }
        }
      });

      res.json({
        success: true,
        message: 'Hotel deals sync initiated',
        data: {
          dealsFound: deals.length,
        },
      });
    } catch (error) {
      logger.error('Failed to sync hotel deals:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/external/deals
   * Get all external deals
   */
  async getDeals(_req: Request, res: Response): Promise<void> {
    try {
      const deals = await solanaService.getExternalDeals();

      res.json({
        success: true,
        data: {
          deals: deals.map((d) => ({
            address: d.publicKey.toString(),
            source: Object.keys(d.account.source)[0],
            externalId: d.account.externalId,
            title: d.account.title,
            description: d.account.description,
            originalPrice: d.account.originalPrice.toString(),
            discountedPrice: d.account.discountedPrice.toString(),
            discountPercentage: d.account.discountPercentage,
            category: d.account.category,
            imageUrl: d.account.imageUrl,
            affiliateUrl: d.account.affiliateUrl,
            expiryTimestamp: new Date(d.account.expiryTimestamp.toNumber() * 1000).toISOString(),
            isVerified: d.account.isVerified,
          })),
        },
      });
    } catch (error) {
      logger.error('Failed to get external deals:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const externalController = new ExternalController();
