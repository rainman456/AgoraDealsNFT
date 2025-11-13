import axios, { AxiosError } from 'axios';

/**
 * Structured error object returned by error handler
 */
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  details?: any;
  isValidationError?: boolean;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
}

/**
 * Maps backend error responses to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'User with this email already exists': 'An account with this email already exists. Please login instead.',
  'Merchant with this email already exists': 'A merchant account with this email already exists. Please login instead.',
  'Invalid email or password': 'Email or password is incorrect. Please try again.',
  'Email and password are required': 'Please provide both email and password.',
  'Email is required': 'Please provide your email address.',
  'Password is required': 'Please provide a password.',
  'User not found': 'User account not found.',
  'Merchant not found': 'Merchant account not found.',
  'No wallet connected': 'Please connect your wallet first.',
  'Promotion not found': 'The promotion you are looking for does not exist.',
  'Coupon not found': 'The coupon you are looking for does not exist.',
  'Insufficient balance': 'You do not have enough balance for this transaction.',
  'Maximum supply reached': 'This promotion has reached its maximum supply.',
  'Invalid category': 'Please select a valid category.',
  'Description is required': 'Please provide a description.',
  'Image upload failed': 'Failed to upload image. Please try again.',
  'Network error': 'Unable to connect to the server. Please check your connection.',
  'Request timeout': 'The request took too long. Please try again.',
};

/**
 * Extracts user-friendly error message from various error formats
 */
function extractErrorMessage(error: any): string {
  // Axios error with response
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    return ERROR_MESSAGE_MAP[message] || message || 'An error occurred. Please try again.';
  }

  // Standard Error object
  if (error instanceof Error) {
    return ERROR_MESSAGE_MAP[error.message] || error.message;
  }

  // String error
  if (typeof error === 'string') {
    return ERROR_MESSAGE_MAP[error] || error;
  }

  return 'An unexpected error occurred.';
}

/**
 * Extracts validation errors from response
 */
function extractValidationErrors(error: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (error.response?.data?.errors) {
    // Array of field errors
    if (Array.isArray(error.response.data.errors)) {
      error.response.data.errors.forEach((err: any) => {
        if (err.field) {
          errors[err.field] = err.message;
        }
      });
    }
    // Object of field errors
    else if (typeof error.response.data.errors === 'object') {
      Object.entries(error.response.data.errors).forEach(([field, message]) => {
        errors[field] = message as string;
      });
    }
  }

  return errors;
}

/**
 * Comprehensive error handler
 * Converts various error formats into structured AppError
 */
export function handleError(error: any): AppError {
  console.error('Error occurred:', error);

  // Handle network errors
  if (!axios.isAxiosError(error) && !(error instanceof Error)) {
    return {
      message: 'Network error. Please check your connection.',
      isNetworkError: true,
      code: 'NETWORK_ERROR',
    };
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Network error (no response from server)
    if (!axiosError.response) {
      return {
        message: 'Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true,
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;

    // 400 - Bad Request / Validation Error
    if (status === 400) {
      const validationErrors = extractValidationErrors(axiosError);
      const message = data?.error || data?.message || 'Invalid input. Please check your form.';
      return {
        message: ERROR_MESSAGE_MAP[message] || message,
        code: 'VALIDATION_ERROR',
        status: 400,
        isValidationError: true,
        details: validationErrors,
      };
    }

    // 401 - Unauthorized
    if (status === 401) {
      return {
        message: 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
        status: 401,
        isAuthError: true,
      };
    }

    // 403 - Forbidden
    if (status === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    // 404 - Not Found
    if (status === 404) {
      return {
        message: data?.error || 'The requested resource was not found.',
        code: 'NOT_FOUND',
        status: 404,
      };
    }

    // 409 - Conflict (e.g., duplicate email)
    if (status === 409) {
      return {
        message: data?.error || 'This action conflicts with existing data.',
        code: 'CONFLICT',
        status: 409,
        isValidationError: true,
      };
    }

    // 429 - Too Many Requests
    if (status === 429) {
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMITED',
        status: 429,
      };
    }

    // 500+ - Server Error
    if (status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status,
        isServerError: true,
      };
    }

    // Generic HTTP error
    return {
      message: extractErrorMessage(axiosError),
      code: `HTTP_${status}`,
      status,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      message: extractErrorMessage(error),
      code: 'ERROR',
    };
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN',
  };
}

/**
 * Validation error handler for form fields
 */
export function getFieldError(appError: AppError, fieldName: string): string | null {
  if (!appError.isValidationError || !appError.details) {
    return null;
  }
  return appError.details[fieldName] || null;
}

/**
 * Check if error is a specific type
 */
export function isValidationError(error: AppError): boolean {
  return error.isValidationError === true;
}

export function isAuthError(error: AppError): boolean {
  return error.isAuthError === true;
}

export function isNetworkError(error: AppError): boolean {
  return error.isNetworkError === true;
}

export function isServerError(error: AppError): boolean {
  return error.isServerError === true;
}

/**
 * Retry logic helper
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const wait = delayMs * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${wait}ms`);
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  throw lastError;
}
