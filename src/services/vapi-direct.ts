/**
 * Direct Apex API Service
 * Uses Apex Public API Key for frontend calls
 * Based on successful AppNoAuth implementation
 */

import { supabase } from './supabase-client';

const APEX_BASE_URL = 'https://api.vapi.ai'; // Using VAPI infrastructure

// Cache for API key to reduce database calls
let cachedApiKey: string | null = null;

/**
 * Get Apex Public API Key from organization settings
 * Organization credentials are the primary source of truth
 */
async function getVapiPublicKey(): Promise<string | null> {
  // Check cache first
  if (cachedApiKey) return cachedApiKey;

  try {
    // Try to get organization ID from localStorage (set by UserContext)
    const storedOrgId = localStorage.getItem('organization_id');
    console.log('🔍 Stored organization ID:', storedOrgId);

    if (!storedOrgId) {
      console.error('❌ No organization ID found. User must be logged in with proper organization context.');
      return null;
    }

    // Get organization's VAPI keys directly
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('vapi_api_key, vapi_private_key, vapi_public_key, name')
      .eq('id', storedOrgId)
      .single();
    
    console.log('🔍 Organization data:', org);
    if (orgError) {
      console.error('Error fetching org:', orgError);
      return null;
    }
    
    // Check both private and public keys - private key is what Apex actually uses
    const apiKey = org?.vapi_private_key || org?.vapi_api_key || org?.vapi_public_key;
    
    if (apiKey) {
      cachedApiKey = apiKey;
      // Store in localStorage for quick access (with expiry)
      localStorage.setItem('vapi_public_key', apiKey);
      localStorage.setItem('vapi_key_cached_at', Date.now().toString());
      console.log('✅ Loaded Apex key from organization:', org.name);
      console.log('🔑 Using key:', apiKey.substring(0, 10) + '...');
      return apiKey;
    } else {
      console.warn('⚠️ Organization has no Apex API key configured');
      console.log('📊 Org data:', org);
      return null;
    }
  } catch (error) {
    console.error('Error fetching organization Apex key:', error);
    
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
 * Make a direct Apex API call
 */
async function vapiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const apiKey = await getVapiPublicKey();
  
  if (!apiKey) {
    console.warn('⚠️ No Apex API key found for organization');
    throw new Error('Apex API keys not configured. Please contact your administrator to set up Apex integration in Organization Settings.');
  }
  
  const response = await fetch(`${APEX_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Apex API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Apex Direct API Methods
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
        message: error.message || 'Failed to connect to Apex',
      };
    }
  },
};

export default vapiDirect;