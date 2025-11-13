import { useState, useCallback } from 'react';
import { AppError, handleError, getFieldError } from '@/lib/error-handler';
import { toast } from 'react-toastify';

interface UseErrorHandlerReturn {
  error: AppError | null;
  fieldErrors: Record<string, string>;
  clearError: () => void;
  clearFieldError: (fieldName: string) => void;
  handleErrorResponse: (error: any, showToast?: boolean) => AppError;
  getFieldErrorMessage: (fieldName: string) => string | null;
  hasFieldError: (fieldName: string) => boolean;
}

/**
 * Custom hook for handling API errors in forms
 */
export function useErrorHandler(onError?: (error: AppError) => void): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const handleErrorResponse = useCallback(
    (err: any, showToast: boolean = true): AppError => {
      const appError = err instanceof Object && 'message' in err && 'code' in err 
        ? (err as AppError)
        : handleError(err);

      setError(appError);

      // Extract field errors
      if (appError.isValidationError && appError.details) {
        setFieldErrors(appError.details);
      } else {
        setFieldErrors({});
      }

      // Show toast notification
      if (showToast) {
        toast.error(appError.message);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(appError);
      }

      return appError;
    },
    [onError]
  );

  const getFieldErrorMessage = useCallback(
    (fieldName: string): string | null => {
      return fieldErrors[fieldName] || null;
    },
    [fieldErrors]
  );

  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return !!fieldErrors[fieldName];
    },
    [fieldErrors]
  );

  return {
    error,
    fieldErrors,
    clearError,
    clearFieldError,
    handleErrorResponse,
    getFieldErrorMessage,
    hasFieldError,
  };
}
