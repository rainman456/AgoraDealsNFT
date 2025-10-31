import { describe, it, expect } from 'vitest';
import { calculateDistance, isWithinRadius } from '../../utils/distance';

describe('Distance Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approx 3936 km)
      const nyc = { latitude: 40.7128, longitude: -74.0060 };
      const la = { latitude: 34.0522, longitude: -118.2437 };
      
      const distance = calculateDistance(nyc.latitude, nyc.longitude, la.latitude, la.longitude);
      
      // Allow 1% margin of error
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Two points about 1 km apart in NYC
      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: 40.7228, longitude: -74.0060 };
      
      const distance = calculateDistance(point1.latitude, point1.longitude, point2.latitude, point2.longitude);
      
      // Should be approximately 11 km (1 degree latitude ≈ 111 km, 0.01 degree ≈ 1.11 km)
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(12);
    });

    it('should handle equator crossing', () => {
      const north = { latitude: 10, longitude: 0 };
      const south = { latitude: -10, longitude: 0 };
      
      const distance = calculateDistance(north.latitude, north.longitude, south.latitude, south.longitude);
      
      // 20 degrees latitude ≈ 2220 km
      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2250);
    });

    it('should handle prime meridian crossing', () => {
      const west = { latitude: 0, longitude: -10 };
      const east = { latitude: 0, longitude: 10 };
      
      const distance = calculateDistance(west.latitude, west.longitude, east.latitude, east.longitude);
      
      // 20 degrees longitude at equator ≈ 2226 km
      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2250);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true when point is within radius', () => {
      const center = { latitude: 40.7128, longitude: -74.0060 };
      const point = { latitude: 40.7228, longitude: -74.0060 };
      
      const result = isWithinRadius(
        center.latitude,
        center.longitude,
        point.latitude,
        point.longitude,
        20 // 20 km radius
      );
      
      expect(result).toBe(true);
    });

    it('should return false when point is outside radius', () => {
      const center = { latitude: 40.7128, longitude: -74.0060 };
      const point = { latitude: 40.7228, longitude: -74.0060 };
      
      const result = isWithinRadius(
        center.latitude,
        center.longitude,
        point.latitude,
        point.longitude,
        5 // 5 km radius
      );
      
      expect(result).toBe(false);
    });

    it('should return true when point is exactly at radius', () => {
      const center = { latitude: 40.7128, longitude: -74.0060 };
      const point = { latitude: 40.7228, longitude: -74.0060 };
      
      const distance = calculateDistance(center.latitude, center.longitude, point.latitude, point.longitude);
      
      const result = isWithinRadius(
        center.latitude,
        center.longitude,
        point.latitude,
        point.longitude,
        distance
      );
      
      expect(result).toBe(true);
    });

    it('should return true for same location', () => {
      const result = isWithinRadius(40.7128, -74.0060, 40.7128, -74.0060, 1);
      expect(result).toBe(true);
    });

    it('should handle zero radius correctly', () => {
      const result = isWithinRadius(40.7128, -74.0060, 40.7128, -74.0060, 0);
      expect(result).toBe(true);
    });

    it('should return false for different location with zero radius', () => {
      const result = isWithinRadius(40.7128, -74.0060, 40.7228, -74.0060, 0);
      expect(result).toBe(false);
    });
  });
});
