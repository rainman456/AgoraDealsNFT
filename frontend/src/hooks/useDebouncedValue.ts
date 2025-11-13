import { useState, useEffect } from 'react';

/**
 * Custom hook for debounced values
 * Useful for search input, filter input, etc.
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callback
 * Useful for search API calls, auto-save, etc.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  return debouncedCallback;
}

/**
 * Custom hook for debounced async operations with loading state
 */
export function useDebouncedAsync<T, R>(
  asyncFn: (value: T) => Promise<R>,
  value: T,
  delay: number = 500
): {
  data: R | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<R | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        setError(null);
        const result = await asyncFn(value);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, asyncFn]);

  return { data, isLoading, error };
}
