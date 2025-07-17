import { apiClient } from '../lib/api-client';

// Types for VAPI Outbound Campaigns
export interface VapiOutboundCampaign {
  id: string;
  name: string;
  organizationId: string;
  assistantId: string;
  phoneNumberId: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalLeads: number;
  callsCompleted: number;
  callsInProgress: number;
  successRate: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    callsPerHour: number;
    retryAttempts: number;
    timeZone: string;
    workingHours: {
      start: string;
      end: string;
    };
  };
}

export interface VapiOutboundLead {
  id: string;
  campaignId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer' | 'callback_requested';
  callAttempts: number;
  lastCallAt?: string;
  callId?: string;
  outcome?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VapiAssistant {
  id: string;
  name: string;
  description?: string;
  model: string;
  voice: string;
  isActive: boolean;
}

export interface VapiPhoneNumber {
  id: string;
  number: string;
  country: string;
  provider: string;
  isActive: boolean;
}

export interface CampaignDashboard {
  campaign: VapiOutboundCampaign;
  metrics: {
    totalLeads: number;
    callsCompleted: number;
    callsInProgress: number;
    successRate: number;
    avgCallDuration: number;
    totalCost: number;
    costPerCall: number;
    conversionRate: number;
  };
  recentCalls: Array<{
    id: string;
    leadName: string;
    phone: string;
    status: string;
    duration: number;
    cost: number;
    startedAt: string;
  }>;
  leadStatus: {
    pending: number;
    calling: number;
    completed: number;
    failed: number;
    noAnswer: number;
    callbackRequested: number;
  };
}

export interface CampaignResults {
  campaign: VapiOutboundCampaign;
  leads: VapiOutboundLead[];
  analytics: {
    totalCalls: number;
    successfulCalls: number;
    avgDuration: number;
    totalCost: number;
    conversionsByOutcome: Record<string, number>;
    callsByHour: Array<{ hour: number; count: number }>;
    sentimentAnalysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

export interface LiveMonitoring {
  activeCalls: Array<{
    id: string;
    leadName: string;
    phone: string;
    duration: number;
    status: string;
    assistantName: string;
    startedAt: string;
  }>;
  realTimeMetrics: {
    callsInProgress: number;
    completedToday: number;
    successRateToday: number;
    costToday: number;
    avgDurationToday: number;
  };
  campaignProgress: {
    leadsRemaining: number;
    estimatedCompletion: string;
    currentCallsPerHour: number;
  };
}

class VapiOutboundService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Campaign Management
  async getCampaigns(): Promise<VapiOutboundCampaign[]> {
    try {
      const response = await apiClient.get('/vapi-outbound/campaigns');
      return response.data.campaigns || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  async createCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    settings?: Partial<VapiOutboundCampaign['settings']>;
  }): Promise<VapiOutboundCampaign> {
    try {
      const response = await apiClient.post('/vapi-outbound/campaigns', campaignData);
      return response.data.campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaignDashboard(campaignId: string): Promise<CampaignDashboard> {
    try {
      const response = await apiClient.get(`/vapi-outbound/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign dashboard:', error);
      throw error;
    }
  }

  async uploadLeads(
    campaignId: string,
    file: File
  ): Promise<{ message: string; imported: number; errors: string[] }> {
    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      // Use apiClient for consistent auth handling
      const response = await apiClient.post(
        `/vapi-outbound/campaigns/${campaignId}/upload-leads`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading leads:', error);
      throw error;
    }
  }

  async startCampaign(campaignId: string): Promise<{ message: string; callsStarted: number }> {
    try {
      const response = await apiClient.post(`/vapi-outbound/campaigns/${campaignId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  async pauseCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/vapi-outbound/campaigns/${campaignId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  async resumeCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/vapi-outbound/campaigns/${campaignId}/resume`);
      return response.data;
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }

  async getLiveMonitoring(campaignId: string): Promise<LiveMonitoring> {
    try {
      const response = await apiClient.get(`/vapi-outbound/campaigns/${campaignId}/live`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live monitoring:', error);
      throw error;
    }
  }

  async getCampaignResults(campaignId: string): Promise<CampaignResults> {
    try {
      const response = await apiClient.get(`/vapi-outbound/campaigns/${campaignId}/results`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign results:', error);
      throw error;
    }
  }

  // VAPI Resources
  async getAssistants(): Promise<VapiAssistant[]> {
    try {
      const response = await apiClient.get('/vapi-outbound/assistants');
      return response.data.assistants || [];
    } catch (error) {
      console.error('Error fetching assistants:', error);
      throw error;
    }
  }

  async getPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    try {
      const response = await apiClient.get('/vapi-outbound/phone-numbers');
      return response.data.phoneNumbers || [];
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      throw error;
    }
  }

  async downloadLeadsTemplate(): Promise<Blob> {
    try {
      const response = await apiClient.get('/vapi-outbound/leads-template', {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }

  // Utility methods
  private async getToken(): Promise<string> {
    // This will be handled by the apiClient which already includes auth headers
    // The apiClient service handles Clerk authentication automatically
    return '';
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format based on length
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    return `+${digits}`;
  }

  validateLeadData(leads: any[]): { valid: any[]; invalid: any[] } {
    const valid = [];
    const invalid = [];

    for (const lead of leads) {
      const errors = [];

      if (!lead.firstName?.trim()) errors.push('First name required');
      if (!lead.lastName?.trim()) errors.push('Last name required');
      if (!lead.phone?.trim()) errors.push('Phone number required');

      if (lead.phone && !/^\+?[\d\s\-\(\)]+$/.test(lead.phone)) {
        errors.push('Invalid phone format');
      }

      if (errors.length === 0) {
        valid.push({
          ...lead,
          phone: this.formatPhoneNumber(lead.phone),
        });
      } else {
        invalid.push({ ...lead, errors });
      }
    }

    return { valid, invalid };
  }

  /**
   * Get recent calls
   */
  async getRecentCalls(limit: number = 20): Promise<any[]> {
    try {
      const response = await apiClient.get(`/calls/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent calls:', error);
      throw error;
    }
  }

  /**
   * Get calls for a specific campaign
   */
  async getCampaignCalls(campaignId: string, params: URLSearchParams): Promise<any> {
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/calls?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign calls:', error);
      throw error;
    }
  }
}

export const vapiOutboundService = new VapiOutboundService();
export default vapiOutboundService;
