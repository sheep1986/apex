import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuth } from '../hooks/auth';
import { supabase, getSupabase } from '../services/supabase-client';

// API Configuration - Use backend URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://apex-backend-august-production.up.railway.app/api';
console.log('🔗 API Connected to:', API_BASE_URL);
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Request/Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Retry Logic
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: AxiosError): boolean => {
  if (!error.response) return true; // Network errors

  const status = error.response.status;
  return status >= 500 || status === 429; // Server errors or rate limiting
};

const retryRequest = async (
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  retryCount = 0
): Promise<AxiosResponse> => {
  try {
    return await axiosInstance(config);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (retryCount < MAX_RETRIES && shouldRetry(axiosError)) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      await sleep(delay);
      return retryRequest(axiosInstance, config, retryCount + 1);
    }

    throw error;
  }
};

// Create Axios Instance with auth integration
const createApiClient = (getToken?: () => Promise<string | null>): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor
  instance.interceptors.request.use(
    async (config) => {
      let token: string | null = null;

      console.log('🔍 API Client: Getting token...');

      // Check if we're using dev auth
      const USE_DEV_AUTH = import.meta.env.VITE_USE_DEV_AUTH === 'true';

      if (USE_DEV_AUTH) {
        // Use development token based on current user role
        const currentRole = localStorage.getItem('dev-auth-role') || 'client_admin';
        token = `test-token-${currentRole}`;
        console.log('🔑 API Client: Using dev token:', token);
      }
      
      // Check if we have Clerk auth available
      const USE_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      
      // Only try other auth methods if dev auth is not being used
      if (!USE_DEV_AUTH) {
        if (USE_CLERK) {
          // Try to get Clerk token from window.Clerk
          try {
            if (window.Clerk && window.Clerk.session) {
              const clerkToken = await window.Clerk.session.getToken();
              if (clerkToken) {
                token = clerkToken;
                console.log('🔍 API Client: Got Clerk token from window.Clerk');
              }
            } else if (getToken) {
              // Fallback to getToken if provided
              token = await getToken();
              console.log('🔍 API Client: Got Clerk token from getToken');
            }
          } catch (error) {
            console.warn('⚠️ Failed to get Clerk token:', error);
          }
        }
        
        if (!token) {
          // Fallback to Supabase auth token
          try {
            const supabaseClient = getSupabase();
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.access_token) {
              token = session.access_token;
              console.log('🔍 API Client: Got Supabase token:', '***EXISTS***');
            } else {
              console.warn('⚠️ API Client: No Supabase session found');
            }
          } catch (error) {
            console.error('❌ API Client: Error getting Supabase session:', error);
          }
        }
        
        // No fallback in production mode - user must be authenticated
        if (!token) {
          console.warn('⚠️ No authentication token available in production mode');
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔍 API Client: Set Authorization header with token:', token);
        console.log('🔍 API Client: Full request config:', {
          url: config.url,
          method: config.method,
          headers: config.headers
        });
      } else {
        console.warn('⚠️ No authentication token available - user needs to sign in');
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] =
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log request in development
      if (import.meta.env.DEV) {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          hasAuth: !!token,
          authMode: USE_DEV_AUTH ? 'development' : 'supabase',
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle authentication errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // ALWAYS use dev mode for now - disable all redirects
        console.error('🔓 Dev Mode: 401 error - continuing without redirect');
        return Promise.reject(error);

        // Production auth handling (disabled for now)
        // localStorage.removeItem('auth_token');
        // sessionStorage.removeItem('auth_token');
        // window.location.href = '/login';
      }

      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY;

        await sleep(delay);
        return retryRequest(instance, originalRequest);
      }

      // Transform error
      const errorData = error.response?.data as any;
      const apiError = new ApiError(
        errorData?.message || error.message || 'An unexpected error occurred',
        error.response?.status,
        errorData?.code,
        errorData
      );

      // Log error
      console.error('❌ API Error:', {
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
        url: error.config?.url,
        method: error.config?.method,
      });

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Create API instance (legacy - for backwards compatibility)
export const apiClient = createApiClient();

// Hook to create API client with auth integration
export const useApiClient = () => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};

// Utility Functions
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  },

  // Paginated GET request
  getPaginated: async <T = any>(
    url: string,
    params?: { page?: number; limit?: number; [key: string]: any },
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> => {
    const response = await apiClient.get<PaginatedResponse<T>>(url, {
      ...config,
      params: { page: 1, limit: 10, ...params },
    });
    return response.data;
  },

  // File upload with progress
  uploadFile: async (
    url: string,
    file: File,
    onProgress?: (progress: FileUploadProgress) => void,
    additionalData?: Record<string, any>
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress: FileUploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Download file
  downloadFile: async (url: string, filename?: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// Health Check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Export default
export default api;
