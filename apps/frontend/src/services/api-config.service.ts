// API Configuration Service - Frontend Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiConfiguration {
  id?: string;
  organization_id: string;
  service_name: 'stripe' | 'openai' | 'supabase';
  configuration: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
}

export interface OpenAIConfig {
  apiKey: string;
  organizationId: string;
  model: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export type ServiceConfigs = {
  stripe: StripeConfig;
  openai: OpenAIConfig;
  supabase: SupabaseConfig;
};

class ApiConfigurationService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('supabase_token');
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 API Request:', { 
      method: options.method || 'GET', 
      url, 
      hasToken: !!token,
      token: token ? `${token.substring(0, 10)}...` : 'none'
    });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 API Response:', { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('❌ API Error:', error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
  }

  async getApiConfiguration<T extends keyof ServiceConfigs>(
    serviceName: T
  ): Promise<ServiceConfigs[T] | null> {
    try {
      const data = await this.makeRequest(`/api/api-configurations/${serviceName}`);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return data as ServiceConfigs[T];
    } catch (error) {
      console.error('Error in getApiConfiguration:', error);
      throw error;
    }
  }

  async saveApiConfiguration<T extends keyof ServiceConfigs>(
    serviceName: T,
    configuration: ServiceConfigs[T]
  ): Promise<string> {
    try {
      console.log('🚀 Saving API configuration:', { serviceName, configuration });
      
      const data = await this.makeRequest(`/api/api-configurations/${serviceName}`, {
        method: 'POST',
        body: JSON.stringify({ configuration }),
      });

      console.log('✅ API configuration saved successfully:', data);
      return data.id;
    } catch (error) {
      console.error('❌ Error in saveApiConfiguration:', error);
      throw error;
    }
  }

  async getAllApiConfigurations(): Promise<{
    stripe: StripeConfig | null;
    openai: OpenAIConfig | null;
    supabase: SupabaseConfig | null;
  }> {
    try {
      const data = await this.makeRequest('/api/api-configurations');
      return data;
    } catch (error) {
      console.error('Error fetching all API configurations:', error);
      throw error;
    }
  }

  async deleteApiConfiguration(serviceName: keyof ServiceConfigs): Promise<void> {
    try {
      await this.makeRequest(`/api/api-configurations/${serviceName}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error in deleteApiConfiguration:', error);
      throw error;
    }
  }

  async testApiConfiguration(serviceName: keyof ServiceConfigs, configuration: Record<string, any>): Promise<boolean> {
    try {
      // Basic client-side validation - server will do more thorough validation
      switch (serviceName) {
        case 'stripe':
          return !!(configuration.publicKey && configuration.secretKey && 
                   configuration.publicKey.startsWith('pk_') && configuration.secretKey.startsWith('sk_'));
        case 'openai':
          return !!(configuration.apiKey && configuration.apiKey.startsWith('sk-'));
        case 'supabase':
          return !!(configuration.url && configuration.anonKey && 
                   configuration.url.includes('supabase') && configuration.anonKey.length > 10);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error testing ${serviceName} configuration:`, error);
      return false;
    }
  }

  // Get audit log for configuration changes
  async getConfigurationAuditLog(serviceName?: keyof ServiceConfigs): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (serviceName) {
        params.append('serviceName', serviceName);
      }
      
      const endpoint = `/api/api-configurations-audit${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await this.makeRequest(endpoint);
      return data;
    } catch (error) {
      console.error('Error in getConfigurationAuditLog:', error);
      throw error;
    }
  }
}

export const apiConfigService = new ApiConfigurationService();
export default apiConfigService;