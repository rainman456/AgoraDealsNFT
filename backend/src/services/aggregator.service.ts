import axios from 'axios';
import { logger } from '../utils/logger';

export interface ExternalDeal {
  id: string;
  externalId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountedPrice: number;
  discountPercentage?: number;
  provider: 'skyscanner' | 'booking' | 'shopify' | 'mock';
  externalUrl: string;
  affiliateUrl: string;
  imageUrl?: string;
  location?: string;
  validUntil?: Date;
  expiryTimestamp: number;
}

export class AggregatorService {
  private skyscannerApiKey = process.env.SKYSCANNER_API_KEY;
  private bookingApiKey = process.env.BOOKING_API_KEY;
  private shopifyApiKey = process.env.SHOPIFY_API_KEY;

  /**
   * Fetch deals from Skyscanner
   * Note: Requires real API key from Skyscanner partnership team
   */
  async fetchSkyscannerDeals(origin: string, destination: string, _date: string): Promise<ExternalDeal[]> {
    if (!this.skyscannerApiKey) {
      logger.warn('Skyscanner API key not configured, returning mock data');
      return this.getMockFlightDeals();
    }

    try {
      // Skyscanner API implementation
      // Note: No sandbox - requires real API key
      const response = await axios.get('https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create', {
        headers: {
          'x-api-key': this.skyscannerApiKey,
        },
        params: {
          query: {
            market: 'US',
            locale: 'en-US',
            currency: 'USD',
            queryLegs: [
              {
                originPlaceId: { iata: origin },
                destinationPlaceId: { iata: destination },
                date: { year: 2024, month: 12, day: 25 },
              },
            ],
            adults: 1,
          },
        },
      });

      return this.parseSkyscannerResponse(response.data);
    } catch (error) {
      logger.error('Skyscanner API error:', error);
      return this.getMockFlightDeals();
    }
  }

  /**
   * Fetch deals from Booking.com
   * Note: Has sandbox environment available
   */
  async fetchBookingDeals(city: string, checkIn: string, checkOut: string): Promise<ExternalDeal[]> {
    if (!this.bookingApiKey) {
      logger.warn('Booking.com API key not configured, returning mock data');
      return this.getMockHotelDeals();
    }

    try {
      // Use sandbox for testing
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://demandapi.booking.com/3.1'
        : 'https://demandapi-sandbox.booking.com/3.1';

      const response = await axios.get(`${baseUrl}/hotels/search`, {
        headers: {
          'Authorization': `Bearer ${this.bookingApiKey}`,
          'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID || '',
        },
        params: {
          city,
          checkin: checkIn,
          checkout: checkOut,
          adults: 1,
        },
      });

      return this.parseBookingResponse(response.data);
    } catch (error) {
      logger.error('Booking.com API error:', error);
      return this.getMockHotelDeals();
    }
  }

  /**
   * Fetch deals from Shopify
   */
  async fetchShopifyDeals(_category?: string): Promise<ExternalDeal[]> {
    if (!this.shopifyApiKey) {
      logger.warn('Shopify API key not configured, returning mock data');
      return this.getMockShoppingDeals();
    }

    try {
      // Shopify implementation would go here
      return this.getMockShoppingDeals();
    } catch (error) {
      logger.error('Shopify API error:', error);
      return this.getMockShoppingDeals();
    }
  }

  /**
   * Fetch flight deals
   */
  async fetchFlightDeals(params: { origin: string; destination: string; departureDate: string; returnDate?: string }): Promise<ExternalDeal[]> {
    return this.fetchSkyscannerDeals(params.origin, params.destination, params.departureDate);
  }

  /**
   * Fetch hotel deals
   */
  async fetchHotelDeals(params: { location: string; checkIn: string; checkOut: string }): Promise<ExternalDeal[]> {
    return this.fetchBookingDeals(params.location, params.checkIn, params.checkOut);
  }

  /**
   * Get all external deals
   */
  async getAllExternalDeals(): Promise<ExternalDeal[]> {
    const deals: ExternalDeal[] = [];

    // For testing, return mock data
    deals.push(...this.getMockFlightDeals());
    deals.push(...this.getMockHotelDeals());
    deals.push(...this.getMockShoppingDeals());

    return deals;
  }

  /**
   * Mock flight deals (fallback when API keys not available)
   */
  private getMockFlightDeals(): ExternalDeal[] {
    const now = Date.now();
    return [
      {
        id: 'flight-1',
        externalId: 'flight-1',
        title: 'New York to London',
        description: 'Round trip flight with premium airline',
        category: 'Travel',
        price: 450,
        originalPrice: 650,
        discountedPrice: 450,
        discountPercentage: 31,
        provider: 'mock',
        externalUrl: 'https://skyscanner.com',
        affiliateUrl: 'https://skyscanner.com',
        imageUrl: '/images/deals/flight-1.jpg',
        validUntil: new Date(now + 7 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 7 * 24 * 60 * 60 * 1000) / 1000),
      },
      {
        id: 'flight-2',
        externalId: 'flight-2',
        title: 'Los Angeles to Tokyo',
        description: 'Direct flight with complimentary meals',
        category: 'Travel',
        price: 680,
        originalPrice: 950,
        discountedPrice: 680,
        discountPercentage: 28,
        provider: 'mock',
        externalUrl: 'https://skyscanner.com',
        affiliateUrl: 'https://skyscanner.com',
        imageUrl: '/images/deals/flight-2.jpg',
        validUntil: new Date(now + 14 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 14 * 24 * 60 * 60 * 1000) / 1000),
      },
    ];
  }

  /**
   * Mock hotel deals (fallback when API keys not available)
   */
  private getMockHotelDeals(): ExternalDeal[] {
    const now = Date.now();
    return [
      {
        id: 'hotel-1',
        externalId: 'hotel-1',
        title: 'Luxury Beach Resort - Miami',
        description: '5-star beachfront resort with spa and pool',
        category: 'Travel',
        price: 199,
        originalPrice: 350,
        discountedPrice: 199,
        discountPercentage: 43,
        provider: 'mock',
        externalUrl: 'https://booking.com',
        affiliateUrl: 'https://booking.com',
        location: 'Miami, FL',
        imageUrl: '/images/deals/hotel-1.jpg',
        validUntil: new Date(now + 30 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      },
      {
        id: 'hotel-2',
        externalId: 'hotel-2',
        title: 'Downtown Business Hotel - NYC',
        description: 'Modern hotel in the heart of Manhattan',
        category: 'Travel',
        price: 159,
        originalPrice: 280,
        discountedPrice: 159,
        discountPercentage: 43,
        provider: 'mock',
        externalUrl: 'https://booking.com',
        affiliateUrl: 'https://booking.com',
        location: 'New York, NY',
        imageUrl: '/images/deals/hotel-2.jpg',
        validUntil: new Date(now + 21 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 21 * 24 * 60 * 60 * 1000) / 1000),
      },
    ];
  }

  /**
   * Mock shopping deals (fallback when API keys not available)
   */
  private getMockShoppingDeals(): ExternalDeal[] {
    const now = Date.now();
    return [
      {
        id: 'shop-1',
        externalId: 'shop-1',
        title: 'Wireless Headphones',
        description: 'Premium noise-cancelling headphones',
        category: 'Electronics',
        price: 149,
        discountedPrice: 149,
        originalPrice: 299,
        discountPercentage: 50,
        provider: 'mock',
        externalUrl: 'https://shopify.com',
        affiliateUrl: 'https://shopify.com',
        imageUrl: '/images/deals/headphones.jpg',
        validUntil: new Date(now + 10 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 10 * 24 * 60 * 60 * 1000) / 1000),
      },
      {
        id: 'shop-2',
        externalId: 'shop-2',
        title: 'Smart Watch',
        description: 'Fitness tracking smartwatch with GPS',
        category: 'Electronics',
        price: 199,
        discountedPrice: 199,
        originalPrice: 349,
        discountPercentage: 43,
        provider: 'mock',
        externalUrl: 'https://shopify.com',
        affiliateUrl: 'https://shopify.com',
        imageUrl: '/images/deals/smartwatch.jpg',
        validUntil: new Date(now + 15 * 24 * 60 * 60 * 1000),
        expiryTimestamp: Math.floor((now + 15 * 24 * 60 * 60 * 1000) / 1000),
      },
    ];
  }

  private parseSkyscannerResponse(_data: any): ExternalDeal[] {
    // Parse Skyscanner API response
    return [];
  }

  private parseBookingResponse(_data: any): ExternalDeal[] {
    // Parse Booking.com API response
    return [];
  }
}

export const aggregatorService = new AggregatorService();
