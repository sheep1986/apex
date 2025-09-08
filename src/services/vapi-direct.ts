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
 * Get VAPI Public API Key from Supabase or localStorage
 */
async function getVapiPublicKey(): Promise<string | null> {
  // Check cache first
  if (cachedApiKey) return cachedApiKey;
  
  // Check localStorage for quick access
  const localKey = localStorage.getItem('vapi_public_key');
  if (localKey) {
    cachedApiKey = localKey;
    return localKey;
  }
  
  try {
    // Get from Supabase organizations table
    const { data: org } = await supabase
      .from('organizations')
      .select('vapi_api_key')
      .single();
    
    if (org?.vapi_api_key) {
      cachedApiKey = org.vapi_api_key;
      localStorage.setItem('vapi_public_key', org.vapi_api_key);
      return org.vapi_api_key;
    }
  } catch (error) {
    console.error('Error fetching VAPI key from Supabase:', error);
  }
  
  // Fallback to hardcoded key (for testing)
  const fallbackKey = 'da8956d4-0508-474e-bd96-7eda82d2d943';
  cachedApiKey = fallbackKey;
  return fallbackKey;
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