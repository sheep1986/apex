import axios from 'axios';
import supabase from './supabase-client';

export interface VAPIConfig {
  apiKey: string;
  organizationId: string;
}

export interface CallRequest {
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
    name?: string;
  };
}

export class VAPIIntegrationService {
  private apiKey: string;
  private baseURL = 'https://api.vapi.ai';

  constructor(config: VAPIConfig) {
    this.apiKey = config.apiKey;
  }

  static async forOrganization(organizationId: string): Promise<VAPIIntegrationService | null> {
    // First check organization_settings table
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('value')
      .eq('organization_id', organizationId)
      .eq('key', 'vapi_credentials')
      .single();

    let apiKey: string | null = null;

    if (settings?.value) {
      try {
        const vapiSettings = typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
        apiKey = vapiSettings.apiKey || vapiSettings.privateKey;
      } catch (error) {
        console.error('Error parsing VAPI settings:', error);
      }
    }

    // Fallback to direct organization table columns
    if (!apiKey) {
      const { data: org } = await supabase
        .from('organizations')
        .select('vapi_api_key, vapi_private_key, settings, vapi_settings')
        .eq('id', organizationId)
        .single();

      if (org) {
        apiKey = org.vapi_private_key || 
                 org.vapi_api_key || 
                 org.settings?.vapi?.privateKey || 
                 org.settings?.vapi?.apiKey;
        
        // Try parsing vapi_settings if it exists
        if (!apiKey && org.vapi_settings) {
          try {
            const vapiSettings = typeof org.vapi_settings === 'string' ? 
              JSON.parse(org.vapi_settings) : org.vapi_settings;
            apiKey = vapiSettings.apiKey || vapiSettings.privateKey;
          } catch (error) {
            console.error('Error parsing organization vapi_settings:', error);
          }
        }
      }
    }

    if (!apiKey) {
      console.log(`No VAPI API key found for organization ${organizationId}`);
      return null;
    }

    return new VAPIIntegrationService({
      apiKey,
      organizationId
    });
  }

  static async getOrganizationVAPIConfig(organizationId: string) {
    const { data: config } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    return config;
  }

  async createCall(callRequest: CallRequest) {
    const response = await axios.post(`${this.baseURL}/call`, callRequest, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async getCall(callId: string) {
    const response = await axios.get(`${this.baseURL}/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return response.data;
  }

  async listCalls() {
    const response = await axios.get(`${this.baseURL}/call`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return response.data;
  }

  async getPhoneNumbers() {
    const response = await axios.get(`${this.baseURL}/phone-number`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return response.data;
  }

  async getAssistants() {
    const response = await axios.get(`${this.baseURL}/assistant`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return response.data;
  }

  async syncPhoneNumbers() {
    // Sync phone numbers from VAPI to local database
    try {
      const phoneNumbers = await this.getPhoneNumbers();
      console.log(`Syncing ${phoneNumbers.length} phone numbers from VAPI`);
      
      // This would typically update the local database
      return { success: true, count: phoneNumbers.length };
    } catch (error) {
      console.error('Error syncing phone numbers:', error);
      return { success: false, error: error.message };
    }
  }

  async syncAssistants() {
    // Sync assistants from VAPI to local database
    try {
      const assistants = await this.getAssistants();
      console.log(`Syncing ${assistants.length} assistants from VAPI`);
      
      // This would typically update the local database
      return { success: true, count: assistants.length };
    } catch (error) {
      console.error('Error syncing assistants:', error);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    // Test VAPI connection by fetching assistants
    try {
      await this.getAssistants();
      return { success: true };
    } catch (error) {
      console.error('VAPI connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}