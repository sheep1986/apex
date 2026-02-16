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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingConfig {
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
  private readonly STORAGE_KEY = 'apex-user-config';

  // Save user configuration - Preferences Only
  async saveUserConfig(config: UserConfig): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      await this.saveToBackend(config);
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
      return JSON.parse(storedConfig);
    } catch (error) {
      console.error('Error loading user configuration:', error);
      return null;
    }
  }

  // Test API connections - Delegated to Server Side
  async testIntegration(
    service: 'airtable' | 'makecom',
    apiKeyOrUrl: string
  ): Promise<boolean> {
      // In V1, all integration testing happens server-side via Supabase Edge Functions
      // This client-side stub is deprecated and should call the backend
      console.warn('Client-side integration testing is deprecated. Use server-side verification.');
      return false;
  }

  private async saveToBackend(config: UserConfig): Promise<void> {
    try {
      // Implementation for backend API call (e.g., Supabase /api/user/config)
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
      assistants: [],
      billing: {
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
