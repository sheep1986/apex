import { apiClient } from '@/lib/api-client';

export interface OrganizationSetting {
  key: string;
  value: any;
  encrypted: boolean;
  updatedAt: string;
}

export interface OrganizationSettingsResponse {
  organizationId: string;
  settings: Record<string, any>;
  count: number;
}

export interface VapiCredentials {
  credentials: {
    vapi_api_key?: string;
    vapi_webhook_secret?: string;
    vapi_phone_numbers?: string[];
    vapi_assistants?: Array<{
      id: string;
      name: string;
      model: string;
    }>;
  };
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  phoneNumbers: string[];
  assistants: any[];
}

class OrganizationSettingsService {
  private baseUrl = '/organization-settings';

  // Get all organization settings
  async getSettings(): Promise<OrganizationSettingsResponse> {
    const response = await apiClient.get(this.baseUrl);
    return response.data;
  }

  // Get specific setting
  async getSetting(key: string): Promise<OrganizationSetting> {
    const response = await apiClient.get(`${this.baseUrl}/${key}`);
    return response.data;
  }

  // Set setting (with optional encryption)
  async setSetting(key: string, value: any, encrypted = false): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${key}`, {
      value,
      encrypted
    });
  }

  // Delete setting
  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${key}`);
  }

  // Bulk update settings
  async bulkUpdateSettings(settings: Record<string, { value: any; encrypted?: boolean }>): Promise<any> {
    const response = await apiClient.put(`${this.baseUrl}/bulk`, {
      settings
    });
    return response.data;
  }

  // Get VAPI credentials (with proper decryption for admins)
  async getVapiCredentials(): Promise<VapiCredentials> {
    const response = await apiClient.get(`${this.baseUrl}/vapi/credentials`);
    return response.data;
  }

  // Convenience methods for common settings
  
  async setVapiApiKey(apiKey: string): Promise<void> {
    await this.setSetting('vapi_api_key', apiKey, true);
  }

  async setVapiWebhookSecret(secret: string): Promise<void> {
    await this.setSetting('vapi_webhook_secret', secret, true);
  }

  async setVapiPhoneNumbers(phoneNumbers: string[]): Promise<void> {
    await this.setSetting('vapi_phone_numbers', phoneNumbers, false);
  }

  async setVapiAssistants(assistants: any[]): Promise<void> {
    await this.setSetting('vapi_assistants', assistants, false);
  }

  async setMaxConcurrentCalls(limit: number): Promise<void> {
    await this.setSetting('max_concurrent_calls', limit, false);
  }

  async setDefaultUserRole(role: string): Promise<void> {
    await this.setSetting('default_user_role', role, false);
  }

  async setOrganizationName(name: string): Promise<void> {
    await this.setSetting('organization_name', name, false);
  }

  async setBillingEmail(email: string): Promise<void> {
    await this.setSetting('billing_email', email, false);
  }

  async setComplianceSettings(settings: {
    tcpa_enabled: boolean;
    do_not_call_enabled: boolean;
    recording_consent: boolean;
  }): Promise<void> {
    await this.setSetting('compliance_settings', settings, false);
  }

  // Settings inheritance - get setting with fallback to defaults
  async getSettingWithFallback(key: string, defaultValue: any = null): Promise<any> {
    try {
      const setting = await this.getSetting(key);
      return setting.value;
    } catch (error) {
      // If setting doesn't exist, return default
      if (error.response?.status === 404) {
        return defaultValue;
      }
      throw error;
    }
  }

  // Check if organization has specific capability
  async hasCapability(capability: string): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      
      switch (capability) {
        case 'vapi_integration':
          return !!settings.settings.vapi_api_key;
        case 'webhooks':
          return !!settings.settings.vapi_webhook_secret;
        case 'phone_numbers':
          return Array.isArray(settings.settings.vapi_phone_numbers) && 
                 settings.settings.vapi_phone_numbers.length > 0;
        case 'assistants':
          return Array.isArray(settings.settings.vapi_assistants) && 
                 settings.settings.vapi_assistants.length > 0;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking capability ${capability}:`, error);
      return false;
    }
  }

  // Get organization configuration for campaigns
  async getCampaignDefaults(): Promise<{
    maxConcurrentCalls: number;
    defaultWorkingHours: any;
    complianceSettings: any;
    vapiCredentials: VapiCredentials;
  }> {
    const [
      maxConcurrent,
      workingHours, 
      compliance,
      vapiCreds
    ] = await Promise.all([
      this.getSettingWithFallback('max_concurrent_calls', 10),
      this.getSettingWithFallback('default_working_hours', {
        enabled: true,
        timezone: 'America/New_York',
        hours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' }
        }
      }),
      this.getSettingWithFallback('compliance_settings', {
        tcpa_enabled: true,
        do_not_call_enabled: true,
        recording_consent: true
      }),
      this.getVapiCredentials()
    ]);

    return {
      maxConcurrentCalls: maxConcurrent,
      defaultWorkingHours: workingHours,
      complianceSettings: compliance,
      vapiCredentials: vapiCreds
    };
  }

  // Test VAPI connection
  async testVapiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await apiClient.post('/vapi/test-connection');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Connection test failed',
        details: error.response?.data
      };
    }
  }

  // Sync VAPI resources (phone numbers, assistants)
  async syncVapiResources(): Promise<{
    phoneNumbers: string[];
    assistants: any[];
    success: boolean;
  }> {
    try {
      const response = await apiClient.post('/vapi/sync-resources');
      
      // Update local settings with synced data
      if (response.data.phoneNumbers) {
        await this.setVapiPhoneNumbers(response.data.phoneNumbers);
      }
      
      if (response.data.assistants) {
        await this.setVapiAssistants(response.data.assistants);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error syncing VAPI resources:', error);
      throw error;
    }
  }

  // Export settings for backup/migration
  async exportSettings(): Promise<Record<string, any>> {
    const settings = await this.getSettings();
    return settings.settings;
  }

  // Import settings from backup
  async importSettings(settingsData: Record<string, any>, overwrite = false): Promise<void> {
    const settingsToImport = {};
    
    for (const [key, value] of Object.entries(settingsData)) {
      // Skip encrypted fields in bulk import for security
      if (key.includes('api_key') || key.includes('secret') || key.includes('password')) {
        continue;
      }
      
      settingsToImport[key] = { value, encrypted: false };
    }
    
    await this.bulkUpdateSettings(settingsToImport);
  }
}

export const organizationSettingsService = new OrganizationSettingsService();