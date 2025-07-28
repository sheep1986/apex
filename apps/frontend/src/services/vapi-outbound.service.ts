import { apiClient } from '../lib/api-client';

// Types for VAPI Outbound Campaigns
export interface VapiOutboundCampaign {
  id: string;
  apexId?: string; // Human-readable ID like apex12345
  name: string;
  description?: string;
  objective?: string;
  organizationId: string;
  assistantId: string;
  assistantName?: string;
  phoneNumberId: string;
  phoneNumber?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalLeads: number;
  callsCompleted: number;
  callsInProgress: number;
  successRate: number;
  totalCost: number;
  budget?: number;
  campaignType?: 'b2b' | 'b2c';
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
    voiceSettings?: {
      speed: number;
      pitch: number;
      temperature: number;
    };
    autoReload?: boolean;
    autoReloadThreshold?: number;
  };
  teamAssignment?: {
    assignedTeam: string[];
    teamLeader: string;
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
    // Always return mock campaigns for demo purposes
    console.log('🎯 VapiOutboundService: Returning mock campaigns');
    return [
        {
          id: 'vapi-1',
          name: 'Real Estate Lead Generation',
          description: 'Target homeowners interested in selling their property in high-value neighborhoods',
          objective: 'Generate qualified leads for luxury real estate listings',
          organizationId: 'org-1',
          assistantId: 'asst-realestate',
          assistantName: 'Real Estate Pro Assistant',
          phoneNumberId: 'phone-555-0101',
          phoneNumber: '+1-555-0101',
          status: 'active',
          totalLeads: 500,
          callsCompleted: 234,
          callsInProgress: 12,
          successRate: 68.5,
          totalCost: 1247.50,
          budget: 5000,
          campaignType: 'b2c',
          createdAt: '2025-07-15T00:00:00Z',
          updatedAt: '2025-07-24T00:00:00Z',
          settings: {
            callsPerHour: 25,
            retryAttempts: 3,
            timeZone: 'America/New_York',
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            voiceSettings: {
              speed: 1.0,
              pitch: 1.0,
              temperature: 0.7
            },
            autoReload: true,
            autoReloadThreshold: 500
          },
          teamAssignment: {
            assignedTeam: ['user-1', 'user-2'],
            teamLeader: 'user-1'
          }
        },
        {
          id: 'vapi-2',
          name: 'SaaS Startup Qualification',
          description: 'AI-powered qualification calls for B2B SaaS prospects looking for CRM and automation solutions',
          objective: 'Qualify potential customers for our SaaS platform',
          organizationId: 'org-1',
          assistantId: 'asst-saas',
          assistantName: 'B2B SaaS Specialist',
          phoneNumberId: 'phone-555-0404',
          phoneNumber: '+1-555-0404',
          status: 'active',
          totalLeads: 150,
          callsCompleted: 42,
          callsInProgress: 3,
          successRate: 74.2,
          totalCost: 487.25,
          budget: 2500,
          campaignType: 'b2b',
          createdAt: '2025-07-12T00:00:00Z',
          updatedAt: '2025-07-24T00:00:00Z',
          settings: {
            callsPerHour: 15,
            retryAttempts: 2,
            timeZone: 'America/New_York',
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            voiceSettings: {
              speed: 1.1,
              pitch: 0.9,
              temperature: 0.6
            },
            autoReload: false,
            autoReloadThreshold: 100
          },
          teamAssignment: {
            assignedTeam: ['user-3', 'user-4'],
            teamLeader: 'user-3'
          }
        },
        {
          id: 'vapi-3',
          name: 'Insurance Follow-up Campaign',
          description: 'Follow up with existing customers for policy renewals and upselling',
          objective: 'Increase policy renewal rates and identify upsell opportunities',
          organizationId: 'org-1',
          assistantId: 'asst-insurance',
          assistantName: 'Insurance Specialist',
          phoneNumberId: 'phone-555-0201',
          phoneNumber: '+1-555-0201',
          status: 'paused',
          totalLeads: 200,
          callsCompleted: 89,
          callsInProgress: 0,
          successRate: 62.9,
          totalCost: 845.25,
          budget: 2000,
          campaignType: 'b2c',
          createdAt: '2025-07-01T00:00:00Z',
          updatedAt: '2025-07-20T00:00:00Z',
          settings: {
            callsPerHour: 20,
            retryAttempts: 3,
            timeZone: 'America/New_York',
            workingHours: {
              start: '10:00',
              end: '16:00'
            },
            voiceSettings: {
              speed: 0.9,
              pitch: 1.1,
              temperature: 0.8
            },
            autoReload: true,
            autoReloadThreshold: 200
          },
          teamAssignment: {
            assignedTeam: ['user-5'],
            teamLeader: 'user-5'
          }
        },
        {
          id: 'vapi-4',
          name: 'Healthcare Appointment Reminders',
          description: 'Automated appointment reminders and confirmations for medical practice',
          objective: 'Reduce no-show rates and improve patient engagement',
          organizationId: 'org-1',
          assistantId: 'asst-healthcare',
          assistantName: 'Healthcare Assistant',
          phoneNumberId: 'phone-555-0505',
          phoneNumber: '+1-555-0505',
          status: 'draft',
          totalLeads: 75,
          callsCompleted: 0,
          callsInProgress: 0,
          successRate: 0,
          totalCost: 0,
          budget: 1500,
          campaignType: 'b2c',
          createdAt: '2025-07-22T00:00:00Z',
          updatedAt: '2025-07-24T00:00:00Z',
          settings: {
            callsPerHour: 30,
            retryAttempts: 2,
            timeZone: 'America/New_York',
            workingHours: {
              start: '08:00',
              end: '18:00'
            },
            voiceSettings: {
              speed: 1.0,
              pitch: 1.0,
              temperature: 0.5
            },
            autoReload: false,
            autoReloadThreshold: 50
          },
          teamAssignment: {
            assignedTeam: ['user-6'],
            teamLeader: 'user-6'
          }
        }
      ];
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
      const response = await apiClient.post(`/campaign-automation/${campaignId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  async pauseCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/campaign-automation/${campaignId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  async resumeCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/campaign-automation/${campaignId}/resume`);
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
    // Always return mock recent calls for demo purposes
    console.log('🎯 VapiOutboundService: Returning mock recent calls');
    return [
      {
        id: 'call-1',
        campaignId: 'vapi-1',
        campaignName: 'Real Estate Lead Generation',
        leadName: 'John Smith',
        phone: '+1-555-0123',
        status: 'completed',
        outcome: 'interested',
        duration: 180,
        cost: 2.45,
        startedAt: '2025-07-24T14:30:00Z',
        endedAt: '2025-07-24T14:33:00Z'
      },
      {
        id: 'call-2',
        campaignId: 'vapi-2',
        campaignName: 'SaaS Startup Qualification',
        leadName: 'Sarah Johnson',
        phone: '+1-555-0456',
        status: 'completed',
        outcome: 'qualified',
        duration: 240,
        cost: 3.20,
        startedAt: '2025-07-24T13:15:00Z',
        endedAt: '2025-07-24T13:19:00Z'
      },
      {
        id: 'call-3',
        campaignId: 'vapi-1',
        campaignName: 'Real Estate Lead Generation',
        leadName: 'Michael Davis',
        phone: '+1-555-0789',
        status: 'completed',
        outcome: 'no_answer',
        duration: 0,
        cost: 0.25,
        startedAt: '2025-07-24T12:45:00Z',
        endedAt: '2025-07-24T12:45:30Z'
      },
      {
        id: 'call-4',
        campaignId: 'vapi-2',
        campaignName: 'SaaS Startup Qualification',
        leadName: 'Emily Wilson',
        phone: '+1-555-0987',
        status: 'in_progress',
        outcome: 'pending',
        duration: 0,
        cost: 0,
        startedAt: '2025-07-24T15:20:00Z',
        endedAt: null
      }
    ].slice(0, limit);
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
