import CryptoJS from 'crypto-js';

// Type Definitions
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  industry: string;
  timezone: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationKeys {
  vapi: {
    apiKey: string;
    encrypted: boolean;
    testStatus: 'pending' | 'success' | 'failed';
    lastTested?: Date;
  };
  airtable: {
    apiKey: string;
    encrypted: boolean;
    testStatus: 'pending' | 'success' | 'failed';
    lastTested?: Date;
  };
  makecom: {
    webhookUrl: string;
    encrypted: boolean;
    testStatus: 'pending' | 'success' | 'failed';
    lastTested?: Date;
  };
}

export interface AssistantConfig {
  id: string;
  name: string;
  language: string;
  voice: string;
  tone: string;
  systemPrompt: string;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
    days: string[];
    timezone: string;
  };
  keyInfo: string[];
  vapiAssistantId?: string;
  airtableBaseId?: string;
  makecomScenarioIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingConfig {
  customerId: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  credits: number;
  monthlySpend: number;
  billingCycle: 'monthly' | 'annual';
  autoRecharge: {
    enabled: boolean;
    threshold: number;
    amount: number;
  };
}

export interface UserConfig {
  profile: UserProfile;
  integrations: IntegrationKeys;
  assistants: AssistantConfig[];
  billing: BillingConfig;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    dataRetention: number; // days
    timezone: string;
  };
  onboardingCompleted: boolean;
  setupSteps: {
    profile: boolean;
    integrations: boolean;
    assistant: boolean;
    billing: boolean;
  };
}

class UserConfigService {
  private readonly ENCRYPTION_KEY = 'apex-ai-calling-platform-secure-key';
  private readonly STORAGE_KEY = 'apex-user-config';

  // Encrypt sensitive data
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  // Decrypt sensitive data
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Save user configuration
  async saveUserConfig(config: UserConfig): Promise<void> {
    try {
      const configToSave = { ...config };

      if (configToSave.integrations.vapi.apiKey) {
        configToSave.integrations.vapi.apiKey = this.encrypt(configToSave.integrations.vapi.apiKey);
        configToSave.integrations.vapi.encrypted = true;
      }

      if (configToSave.integrations.airtable.apiKey) {
        configToSave.integrations.airtable.apiKey = this.encrypt(
          configToSave.integrations.airtable.apiKey
        );
        configToSave.integrations.airtable.encrypted = true;
      }

      if (configToSave.integrations.makecom.webhookUrl) {
        configToSave.integrations.makecom.webhookUrl = this.encrypt(
          configToSave.integrations.makecom.webhookUrl
        );
        configToSave.integrations.makecom.encrypted = true;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
      await this.saveToBackend(configToSave);

      console.log('User configuration saved successfully');
    } catch (error) {
      console.error('Error saving user configuration:', error);
      throw new Error('Failed to save user configuration');
    }
  }

  // Load user configuration
  async loadUserConfig(): Promise<UserConfig | null> {
    try {
      const storedConfig = localStorage.getItem(this.STORAGE_KEY);
      if (!storedConfig) return null;

      const config: UserConfig = JSON.parse(storedConfig);

      // Decrypt sensitive API keys
      if (config.integrations.vapi.encrypted && config.integrations.vapi.apiKey) {
        config.integrations.vapi.apiKey = this.decrypt(config.integrations.vapi.apiKey);
        config.integrations.vapi.encrypted = false;
      }

      if (config.integrations.airtable.encrypted && config.integrations.airtable.apiKey) {
        config.integrations.airtable.apiKey = this.decrypt(config.integrations.airtable.apiKey);
        config.integrations.airtable.encrypted = false;
      }

      if (config.integrations.makecom.encrypted && config.integrations.makecom.webhookUrl) {
        config.integrations.makecom.webhookUrl = this.decrypt(
          config.integrations.makecom.webhookUrl
        );
        config.integrations.makecom.encrypted = false;
      }

      return config;
    } catch (error) {
      console.error('Error loading user configuration:', error);
      return null;
    }
  }

  // Test API connections
  async testIntegration(
    service: 'vapi' | 'airtable' | 'makecom',
    apiKey: string
  ): Promise<boolean> {
    try {
      switch (service) {
        case 'vapi':
          return await this.testVapiConnection(apiKey);
        case 'airtable':
          return await this.testAirtableConnection(apiKey);
        case 'makecom':
          return await this.testMakecomConnection(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error testing ${service} integration:`, error);
      return false;
    }
  }

  private async testVapiConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.vapi.ai/assistant', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testAirtableConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.airtable.com/v0/meta/bases', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testMakecomConnection(webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async saveToBackend(config: UserConfig): Promise<void> {
    try {
      console.log('Saving configuration to backend...');
      // Implementation for backend API call
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  }

  createDefaultConfig(userId: string, email: string): UserConfig {
    return {
      profile: {
        id: userId,
        firstName: '',
        lastName: '',
        email: email,
        company: '',
        industry: '',
        timezone: 'America/New_York',
        phoneNumber: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      integrations: {
        vapi: { apiKey: '', encrypted: false, testStatus: 'pending' },
        airtable: { apiKey: '', encrypted: false, testStatus: 'pending' },
        makecom: { webhookUrl: '', encrypted: false, testStatus: 'pending' },
      },
      assistants: [],
      billing: {
        customerId: '',
        plan: 'starter',
        credits: 1000,
        monthlySpend: 0,
        billingCycle: 'monthly',
        autoRecharge: { enabled: false, threshold: 100, amount: 500 },
      },
      preferences: {
        notifications: true,
        emailUpdates: true,
        dataRetention: 90,
        timezone: 'America/New_York',
      },
      onboardingCompleted: false,
      setupSteps: {
        profile: false,
        integrations: false,
        assistant: false,
        billing: false,
      },
    };
  }
}

export default new UserConfigService();
