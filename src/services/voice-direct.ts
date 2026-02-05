/**
 * Direct Trinity API Service
 * Now points to internal Trinity Voice Engine (Netlify Functions)
 * Zero-Trace: No keys on client, no direct Vapi calls.
 */

import { supabase } from './supabase-client';

// Map to our internal functions
const API_BASE = '/api';

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function voiceEngineRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Unauthorized');

  // Request to our own backend
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Voice Engine error: ${response.status}`);
  }

  return response.json();
}

export const voiceDirect = {
  // No setApiKey or clearPublicKey anymore. Internal only.

  // Assistants
  async getAssistants() {
    // For now we might not have a list endpoint, referencing onboarding creation
    // But assuming we might add one. For now returning empty or implementation deferred.
    return []; 
  },
  
  async getAssistant(id: string) {
    // Implementation deferred or mapped to getCalls logic if needed
    return null; 
  },
  
  // Phone Numbers
  async getPhoneNumbers() {
     // Configured server-side
     return [];
  },
  
  // Create outbound call -> /api/voice/test-call (mapped to voice-test-call)
  async createCall(params: {
    phoneNumberId: string; // Server might override this
    assistantId: string;
    customerNumber: string;
    customerName?: string;
  }) {
    return voiceEngineRequest('/voice/test-call', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
  
  async getCall(id: string) {
    return voiceEngineRequest(`/voice/calls/${id}`);
  },
  
  // List calls -> /api/voice/calls
  async getCalls(params?: { assistantId?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.assistantId) queryParams.set('assistantId', params.assistantId);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    return voiceEngineRequest(`/voice/calls?${queryParams.toString()}`);
  }
};

export default voiceDirect;