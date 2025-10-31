import { describe, it, expect } from 'vitest';
import { getPaginationParams, createPaginatedResponse } from '../../utils/pagination';

describe('Pagination Utils', () => {
  describe('getPaginationParams', () => {
    it('should return default pagination params when no query provided', () => {
      const result = getPaginationParams({});
      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('should parse page and limit from query', () => {
      const result = getPaginationParams({ page: '2', limit: '10' });
      expect(result).toEqual({
        page: 2,
        limit: 10,
        skip: 10,
      });
    });

    it('should enforce maximum limit of 100', () => {
      const result = getPaginationParams({ limit: '200' });
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum page of 1', () => {
      const result = getPaginationParams({ page: '0' });
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('should handle invalid numbers gracefully', () => {
      const result = getPaginationParams({ page: 'invalid', limit: 'invalid' });
      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('should calculate skip correctly', () => {
      const result = getPaginationParams({ page: '3', limit: '15' });
      expect(result.skip).toBe(30); // (3-1) * 15
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create paginated response with correct structure', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = createPaginatedResponse(data, 3, 1, 10);

      expect(result).toEqual({
        data,
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should calculate hasNext correctly', () => {
      const data = Array(10).fill({ id: 1 });
      const result = createPaginatedResponse(data, 25, 1, 10);

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should calculate hasPrev correctly', () => {
      const data = Array(10).fill({ id: 1 });
      const result = createPaginatedResponse(data, 25, 2, 10);

      expect(result.pagination.hasPrev).toBe(true);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should handle last page correctly', () => {
      const data = Array(5).fill({ id: 1 });
      const result = createPaginatedResponse(data, 25, 3, 10);

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should handle empty data', () => {
      const result = createPaginatedResponse([], 0, 1, 10);

      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });
  });
});
