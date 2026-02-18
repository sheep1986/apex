import axios from 'axios';
import { supabase } from '../services/supabase-client';

// All API calls go through Netlify Functions (relative paths)
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get auth token from Supabase session (not localStorage — Supabase SDK manages its own storage)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || null;

    if (!token) {
      console.warn('⚠️ No Supabase session token found');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default apiClient;
