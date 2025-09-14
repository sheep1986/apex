import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';

// Result type for safe API calls
export type ApiResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Structured logger for production
const logger = {
  error: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${message}`, data);
    }
    // In production, send to error tracking service (Sentry, etc.)
  },
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API Warning] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[API Info] ${message}`, data);
    }
  }
};

// Determine if error should be retried
const shouldRetry = (error: AxiosError): boolean => {
  if (!error.response) return true; // Network errors
  const status = error.response.status;
  return status >= 500 || status === 429; // Server errors or rate limiting
};

// Sleep helper for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe API wrapper with automatic error handling and retry logic
export async function safeApi<T>(
  config: AxiosRequestConfig,
  options?: {
    maxRetries?: number;
    showErrorToast?: boolean;
    retryDelay?: number;
  }
): Promise<ApiResult<T>> {
  const { 
    maxRetries = 3, 
    showErrorToast = true,
    retryDelay = 1000 
  } = options || {};

  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios(config);
      return { ok: true, data: response.data as T };
    } catch (error) {
      const axiosError = error as AxiosError;
      lastError = axiosError;

      // Log the error
      logger.error(`API request failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
        url: config.url,
        method: config.method,
        status: axiosError.response?.status,
        error: axiosError.message
      });

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(axiosError)) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        logger.info(`Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // No more retries, handle the error
      const apiError: ApiError = {
        message: axiosError.response?.data?.message || 
                 axiosError.message || 
                 'An unexpected error occurred',
        status: axiosError.response?.status,
        code: axiosError.code,
        details: axiosError.response?.data
      };

      // Show error toast if enabled
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: apiError.message,
          variant: 'destructive'
        });
      }

      return { ok: false, error: apiError };
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    ok: false,
    error: {
      message: lastError?.message || 'Maximum retries exceeded',
      status: lastError?.response?.status,
      code: lastError?.code,
      details: lastError?.response?.data
    }
  };
}

// Helper function to handle API results in components
export function handleApiResult<T>(
  result: ApiResult<T>,
  onSuccess: (data: T) => void,
  onError?: (error: ApiError) => void
): void {
  if (result.ok) {
    onSuccess(result.data);
  } else if (onError) {
    onError(result.error);
  }
}

// Type-safe API client builder
export function createApiClient(baseURL: string, defaultHeaders?: Record<string, string>) {
  return {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
      return safeApi<T>({
        ...config,
        method: 'GET',
        url: `${baseURL}${url}`,
        headers: { ...defaultHeaders, ...config?.headers }
      });
    },

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
      return safeApi<T>({
        ...config,
        method: 'POST',
        url: `${baseURL}${url}`,
        data,
        headers: { ...defaultHeaders, ...config?.headers }
      });
    },

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
      return safeApi<T>({
        ...config,
        method: 'PUT',
        url: `${baseURL}${url}`,
        data,
        headers: { ...defaultHeaders, ...config?.headers }
      });
    },

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
      return safeApi<T>({
        ...config,
        method: 'DELETE',
        url: `${baseURL}${url}`,
        headers: { ...defaultHeaders, ...config?.headers }
      });
    }
  };
}