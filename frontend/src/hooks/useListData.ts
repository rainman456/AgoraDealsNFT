import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, handleError } from '@/lib/error-handler';
import {
  OptimisticUpdateManager,
  OptimisticUpdateConfig,
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateItem,
} from '@/lib/optimistic-update';

export interface UseListDataOptions<T> {
  /** Initial data */
  initialData?: T[];
  /** Page size for pagination */
  pageSize?: number;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
  /** Deduplicate items by id */
  deduplicateById?: boolean;
  /** Sort items after fetch */
  sortFn?: (a: T, b: T) => number;
  /** Filter items after fetch */
  filterFn?: (item: T) => boolean;
}

export interface UseListDataReturn<T> {
  items: T[];
  isLoading: boolean;
  error: AppError | null;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  
  // Data mutations
  setItems: (items: T[]) => void;
  addItem: (item: T, optimistic?: boolean) => void;
  removeItem: (id: string, optimistic?: boolean) => void;
  updateItem: (id: string, updates: Partial<T>, optimistic?: boolean) => void;
  
  // List operations
  fetch: (params?: Record<string, any>) => Promise<void>;
  loadMore: (params?: Record<string, any>) => Promise<void>;
  refresh: (params?: Record<string, any>) => Promise<void>;
  
  // Pagination
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number, params?: Record<string, any>) => Promise<void>;
  
  // State management
  reset: () => void;
  setError: (error: AppError | null) => void;
}

/**
 * Custom hook for managing list data with pagination, optimistic updates, and error handling
 */
export function useListData<T extends { id?: string }>(
  fetchFn: (page: number, pageSize: number, params?: Record<string, any>) => Promise<{ items: T[]; total: number }>,
  options: UseListDataOptions<T> = {}
): UseListDataReturn<T> {
  const {
    initialData = [],
    pageSize = 20,
    optimisticUpdates = true,
    deduplicateById = true,
    sortFn,
    filterFn,
  } = options;

  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Track optimistic updates
  const optimisticUpdatesRef = useRef<Map<string, OptimisticUpdateManager<T[]>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<Record<string, any>>({});

  // Helper to deduplicate items
  const deduplicateItems = useCallback(
    (itemList: T[]): T[] => {
      if (!deduplicateById) return itemList;
      const seen = new Set<string>();
      return itemList.filter((item) => {
        if (!item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    [deduplicateById]
  );

  // Helper to process items (filter, sort, deduplicate)
  const processItems = useCallback(
    (itemList: T[]): T[] => {
      let processed = itemList;
      if (filterFn) processed = processed.filter(filterFn);
      if (sortFn) processed = [...processed].sort(sortFn);
      processed = deduplicateItems(processed);
      return processed;
    },
    [filterFn, sortFn, deduplicateItems]
  );

  // Fetch list data
  const fetch = useCallback(
    async (params?: Record<string, any>) => {
      try {
        // Abort previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);
        lastParamsRef.current = params || {};

        const result = await fetchFn(1, pageSize, params);
        const processed = processItems(result.items);

        setItems(processed);
        setTotal(result.total);
        setPage(1);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          const appError = err instanceof Object && 'message' in err
            ? (err as AppError)
            : handleError(err);
          setError(appError);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFn, pageSize, processItems]
  );

  // Load more (pagination)
  const loadMore = useCallback(
    async (params?: Record<string, any>) => {
      try {
        setIsLoading(true);
        setError(null);
        const nextPage = page + 1;
        const result = await fetchFn(nextPage, pageSize, params || lastParamsRef.current);
        const newItems = processItems([...items, ...result.items]);

        setItems(newItems);
        setTotal(result.total);
        setPage(nextPage);
      } catch (err: any) {
        const appError = err instanceof Object && 'message' in err
          ? (err as AppError)
          : handleError(err);
        setError(appError);
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, fetchFn, items, processItems]
  );

  // Refresh current page
  const refresh = useCallback(
    async (params?: Record<string, any>) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn(page, pageSize, params || lastParamsRef.current);
        const processed = processItems(result.items);

        setItems(processed);
        setTotal(result.total);
      } catch (err: any) {
        const appError = err instanceof Object && 'message' in err
          ? (err as AppError)
          : handleError(err);
        setError(appError);
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, fetchFn, processItems]
  );

  // Pagination helpers
  const nextPage = useCallback(async () => {
    if (page * pageSize < total) {
      await loadMore();
    }
  }, [page, pageSize, total, loadMore]);

  const prevPage = useCallback(async () => {
    if (page > 1) {
      const prevPageNum = page - 1;
      setPage(prevPageNum);
      const result = await fetchFn(prevPageNum, pageSize, lastParamsRef.current);
      const processed = processItems(result.items);
      setItems(processed);
      setTotal(result.total);
    }
  }, [page, pageSize, fetchFn, processItems]);

  const goToPage = useCallback(
    async (newPage: number, params?: Record<string, any>) => {
      if (newPage < 1) return;
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn(newPage, pageSize, params || lastParamsRef.current);
        const processed = processItems(result.items);

        setItems(processed);
        setTotal(result.total);
        setPage(newPage);
      } catch (err: any) {
        const appError = err instanceof Object && 'message' in err
          ? (err as AppError)
          : handleError(err);
        setError(appError);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, fetchFn, processItems]
  );

  // Add item with optional optimistic update
  const addItem = useCallback(
    (item: T, optimistic: boolean = optimisticUpdates) => {
      if (optimistic) {
        const updated = optimisticAddItem(items, item);
        const manager = new OptimisticUpdateManager({
          originalData: items,
          optimisticData: updated,
        });
        optimisticUpdatesRef.current.set(`add-${item.id}`, manager);
        setItems(updated);
      } else {
        setItems((prev) => optimisticAddItem(prev, item));
      }
    },
    [items, optimisticUpdates]
  );

  // Remove item with optional optimistic update
  const removeItem = useCallback(
    (id: string, optimistic: boolean = optimisticUpdates) => {
      if (optimistic && id) {
        const updated = optimisticRemoveItem(items, id);
        const manager = new OptimisticUpdateManager({
          originalData: items,
          optimisticData: updated,
        });
        optimisticUpdatesRef.current.set(`remove-${id}`, manager);
        setItems(updated);
      } else {
        setItems((prev) => optimisticRemoveItem(prev, id));
      }
    },
    [items, optimisticUpdates]
  );

  // Update item with optional optimistic update
  const updateItem = useCallback(
    (id: string, updates: Partial<T>, optimistic: boolean = optimisticUpdates) => {
      if (optimistic && id) {
        const updated = optimisticUpdateItem(items, id, updates);
        const manager = new OptimisticUpdateManager({
          originalData: items,
          optimisticData: updated,
        });
        optimisticUpdatesRef.current.set(`update-${id}`, manager);
        setItems(updated);
      } else {
        setItems((prev) => optimisticUpdateItem(prev, id, updates));
      }
    },
    [items, optimisticUpdates]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setItems(initialData);
    setIsLoading(false);
    setError(null);
    setPage(1);
    setTotal(0);
    optimisticUpdatesRef.current.clear();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const hasMore = page * pageSize < total;

  return {
    items,
    isLoading,
    error,
    page,
    pageSize,
    total,
    hasMore,
    setItems,
    addItem,
    removeItem,
    updateItem,
    fetch,
    loadMore,
    refresh,
    nextPage,
    prevPage,
    goToPage,
    reset,
    setError,
  };
}
