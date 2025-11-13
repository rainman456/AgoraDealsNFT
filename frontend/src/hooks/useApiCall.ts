import { useState, useCallback, useRef } from 'react';
import { AppError, handleError } from '@/lib/error-handler';

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showLoadingToast?: boolean;
  abortPreviousRequest?: boolean;
}

interface UseApiCallReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  abort: () => void;
}

/**
 * Custom hook for executing API calls with loading and error states
 * Handles AbortController for canceling previous requests
 */
export function useApiCall<T = any>(
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    onSuccess,
    onError,
    showLoadingToast = false,
    abortPreviousRequest = true,
  } = options;

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    abort();
  }, [abort]);

  const execute = useCallback(
    async (apiCall: () => Promise<T>): Promise<T | null> => {
      try {
        // Abort previous request if enabled
        if (abortPreviousRequest && abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        if (showLoadingToast) {
          console.debug('API call started...');
        }

        const result = await apiCall();

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          console.debug('API call was aborted');
          return null;
        }

        setData(result);
        setError(null);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: any) {
        // Check if error is due to abort
        if (err?.name === 'AbortError') {
          console.debug('Request was canceled');
          return null;
        }

        const appError = err instanceof Object && 'message' in err && 'code' in err
          ? (err as AppError)
          : handleError(err);

        setError(appError);
        setData(null);

        if (onError) {
          onError(appError);
        }

        console.error('API call error:', appError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [abortPreviousRequest, onSuccess, onError, showLoadingToast]
  );

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    abort,
  };
}
