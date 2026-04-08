/**
 * Enhanced API Client with Error Reporting
 * 
 * This utility provides a fetch wrapper that automatically reports API errors
 * to the error reporting service while maintaining backward compatibility.
 */

import { ErrorReporting } from '@/lib/error-reporting';

export interface APIErrorReportingOptions {
  reportErrors?: boolean;
  component?: string;
  userAction?: string;
  metadata?: Record<string, unknown>;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public response?: unknown,
    public endpoint?: string,
    public method?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Enhanced fetch wrapper with automatic error reporting
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit & APIErrorReportingOptions = {}
): Promise<APIResponse<T>> {
  const {
    reportErrors = true,
    component,
    userAction,
    metadata,
    ...fetchOptions
  } = options;

  const method = fetchOptions.method || 'GET';
  const startTime = Date.now();

  try {
    const response = await fetch(endpoint, fetchOptions);
    const duration = Date.now() - startTime;

    // Log successful API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API ${method} ${endpoint} - ${response.status} (${duration}ms)`);
    }

    if (!response.ok) {
      let errorData: unknown = null;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null) {
          if ('message' in errorData && typeof (errorData as { message: unknown }).message === 'string') {
            errorMessage = (errorData as { message: string }).message;
          } else if ('error' in errorData && typeof (errorData as { error: unknown }).error === 'string') {
            errorMessage = (errorData as { error: string }).error;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }

      const error = new APIError(
        errorMessage,
        response.status,
        response.statusText,
        errorData,
        endpoint,
        method
      );

      // Report API error if enabled
      if (reportErrors) {
        ErrorReporting.captureAPIError(
          error,
          { endpoint, method, status: response.status, errorData }
        );

        // Also report as user action error if specified
        if (userAction) {
          ErrorReporting.captureUserActionError(
            error,
            {
              endpoint,
              method,
              component,
              duration,
              userAction,
              ...metadata,
            }
          );
        }
      }

      throw error;
    }

    // Parse response data
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as T;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle network errors and other fetch failures
    if (!(error instanceof APIError)) {
      const networkError = new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        0,
        'Network Error',
        null,
        endpoint,
        method
      );

      // Report network errors if enabled
      if (reportErrors) {
        ErrorReporting.captureAPIError(
          networkError,
          { endpoint, method, status: 0, originalError: error instanceof Error ? error.message : String(error) }
        );

        if (userAction) {
          ErrorReporting.captureUserActionError(
            networkError,
            {
              endpoint,
              method,
              component,
              duration,
              errorType: 'network_error',
              userAction,
              ...metadata,
            }
          );
        }
      }

      throw networkError;
    }

    // Re-throw API errors (already reported above)
    throw error;
  }
}

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit & APIErrorReportingOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit & APIErrorReportingOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit & APIErrorReportingOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit & APIErrorReportingOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit & APIErrorReportingOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Hook for API calls with automatic error reporting
 */
export function useAPI() {
  return {
    api,
    apiClient,
    APIError,
  };
}

export default api;