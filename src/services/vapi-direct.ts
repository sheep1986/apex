/**
 * Direct VAPI API Service
 * Uses VAPI Public API Key for frontend calls
 * Based on successful AppNoAuth implementation
 */

import { supabase } from './supabase-client';

const VAPI_BASE_URL = 'https://api.vapi.ai';

// Cache for API key to reduce database calls
let cachedApiKey: string | null = null;

/**
 * Get VAPI Public API Key from organization settings
 * Organization credentials are the primary source of truth
 */
async function getVapiPublicKey(): Promise<string | null> {
  // Check cache first
  if (cachedApiKey) return cachedApiKey;
  
  try {
    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return null;
    }
    
    // Get user's organization ID
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (!userData?.organization_id) {
      console.error('User has no organization');
      return null;
    }
    
    // Get organization's VAPI public key
    const { data: org } = await supabase
      .from('organizations')
      .select('vapi_api_key, vapi_public_key')
      .eq('id', userData.organization_id)
      .single();
    
    const apiKey = org?.vapi_public_key || org?.vapi_api_key;
    
    if (apiKey) {
      cachedApiKey = apiKey;
      // Store in localStorage for quick access (with expiry)
      localStorage.setItem('vapi_public_key', apiKey);
      localStorage.setItem('vapi_key_cached_at', Date.now().toString());
      console.log('✅ Loaded VAPI key from organization settings');
      return apiKey;
    } else {
      console.warn('⚠️ Organization has no VAPI API key configured');
      return null;
    }
  } catch (error) {
    console.error('Error fetching organization VAPI key:', error);
    
    // Check localStorage as fallback (if recently cached)
    const cachedKey = localStorage.getItem('vapi_public_key');
    const cachedAt = localStorage.getItem('vapi_key_cached_at');
    
    if (cachedKey && cachedAt) {
      const cacheAge = Date.now() - parseInt(cachedAt);
      // Use cache if less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        cachedApiKey = cachedKey;
        return cachedKey;
      }
    }
    
    return null;
  }
}

/**
 * Make a direct VAPI API call
 */
async function vapiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const apiKey = await getVapiPublicKey();
  
  if (!apiKey) {
    throw new Error('VAPI Public API Key not configured');
  }
  
  const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`VAPI API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * VAPI Direct API Methods
 */
export const vapiDirect = {
  // Set API key manually
  setApiKey(key: string) {
    cachedApiKey = key;
    localStorage.setItem('vapi_public_key', key);
  },
  
  // Clear cached key
  clearCache() {
    cachedApiKey = null;
    localStorage.removeItem('vapi_public_key');
  },
  
  // Get all assistants
  async getAssistants() {
    try {
      const data = await vapiRequest('/assistant');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return [];
    }
  },
  
  // Get single assistant
  async getAssistant(id: string) {
    return vapiRequest(`/assistant/${id}`);
  },
  
  // Get all phone numbers
  async getPhoneNumbers() {
    try {
      const data = await vapiRequest('/phone-number');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      return [];
    }
  },
  
  // Get single phone number
  async getPhoneNumber(id: string) {
    return vapiRequest(`/phone-number/${id}`);
  },
  
  // Create outbound call
  async createCall(params: {
    assistantId: string;
    phoneNumberId: string;
    customer: {
      number: string;
      name?: string;
    };
  }) {
    return vapiRequest('/call', {
      method: 'POST',
      body: JSON.stringify({
        assistant: { assistantId: params.assistantId },
        phoneNumberId: params.phoneNumberId,
        customer: params.customer,
      }),
    });
  },
  
  // Get call details
  async getCall(id: string) {
    return vapiRequest(`/call/${id}`);
  },
  
  // List calls
  async getCalls(params?: { assistantId?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.assistantId) queryParams.set('assistantId', params.assistantId);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() 
      ? `/call?${queryParams.toString()}`
      : '/call';
    
    return vapiRequest(endpoint);
  },
  
  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const [assistants, phoneNumbers] = await Promise.all([
        this.getAssistants(),
        this.getPhoneNumbers(),
      ]);
      
      return {
        success: true,
        message: `Connected! Found ${assistants.length} assistants and ${phoneNumbers.length} phone numbers`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to VAPI',
      };
    }
  },
};

export default vapiDirect;