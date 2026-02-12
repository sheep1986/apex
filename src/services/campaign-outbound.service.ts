import { apiClient, useApiClient } from '../lib/api-client';
import { supabase } from './supabase-client';

// Types for Outbound Campaigns
export interface OutboundCampaign {
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

export interface OutboundLead {
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

export interface VoiceAssistant {
  id: string;
  name: string;
  description?: string;
  model: string;
  voice: string;
  isActive: boolean;
}

export interface VoicePhoneNumber {
  id: string;
  number: string;
  country: string;
  provider: string;
  isActive: boolean;
}

export interface CampaignDashboard {
  campaign: OutboundCampaign;
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
    endedAt?: string;
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
  campaign: OutboundCampaign;
  leads: OutboundLead[];
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

class CampaignOutboundService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private apiClient: any;

  constructor(apiClient?: any) {
    // Use provided apiClient or fall back to default
    this.apiClient = apiClient || require('../lib/api-client').apiClient;
  }

  // Campaign Management
  async getCampaigns(): Promise<OutboundCampaign[]> {
    try {
      console.log('🎯 CampaignOutboundService: Fetching campaigns');
      
      let response;
      let apiSuccess = false;
      
      try {
        // Use normalized /api/campaigns endpoint
        console.log('📡 Trying /api/campaigns endpoint...');
        response = await this.apiClient.get('/api/campaigns');
        if (response && response.data) {
          console.log('✅ Campaigns endpoint succeeded');
          apiSuccess = true;
        }
      } catch (error: any) {
        // Fallback or legacy path if needed
        console.log('⚠️ /api/campaigns failed with:', error.response?.status || error.message);
        try {
           response = await this.apiClient.get('/campaigns');
           if (response && response.data) {
             apiSuccess = true;
           }
        } catch (e) {
           // ignore
        }
      }
      
      // If API endpoints failed, throw error to trigger Supabase fallback
      if (!apiSuccess) {
        console.log('❌ API endpoints failed, trying Supabase fallback');
        throw new Error('API endpoints unavailable');
      }
      
      // The API returns {campaigns: [...], pagination: {...}}
      const campaignsData = response.data?.campaigns || [];
      
      if (!Array.isArray(campaignsData)) {
        return [];
      }
      
      // Map the data
      return campaignsData.map((campaign: any) => ({
        id: campaign.id,
        apexId: campaign.apexId || campaign.apex_id || `apex${campaign.id.substring(0, 5)}`,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        assistantId: campaign.assistantId || campaign.assistant_id || '',
        assistantName: campaign.assistantName || campaign.assistant_name || 'AI Assistant',
        phoneNumberId: campaign.phoneNumberId || campaign.phone_number_id || '',
        phoneNumber: campaign.phoneNumber || campaign.phone_number,
        organizationId: campaign.organizationId || campaign.organization_id || '',
        objective: campaign.objective,
        budget: campaign.budget,
        campaignType: campaign.campaignType || campaign.campaign_type,
        createdAt: campaign.createdAt || campaign.created_at,
        updatedAt: campaign.updatedAt || campaign.updated_at,
        totalLeads: campaign.totalLeads || campaign.total_leads || campaign.leads_count?.count || 0,
        callsCompleted: campaign.callsCompleted || campaign.calls_completed || campaign.completed_calls_count || 0,
        totalCost: campaign.totalCost || campaign.total_cost || campaign.spent || 0,
        successRate: campaign.successRate || campaign.success_rate || campaign.conversion_rate || 0,
        callsInProgress: campaign.callsInProgress || campaign.calls_in_progress || 0,
        settings: campaign.settings || {
          callsPerHour: campaign.calls_per_hour || 10,
          retryAttempts: campaign.retry_attempts || 2,
          timeZone: campaign.time_zone || 'America/New_York',
          workingHours: {
            start: campaign.working_hours_start || '09:00',
            end: campaign.working_hours_end || '17:00'
          }
        },
        teamAssignment: campaign.teamAssignment || campaign.team_assignment
      }));
    } catch (error) {
      console.error('❌ Error fetching campaigns from API:', error);
      
      // Fallback to direct Supabase query
      try {
        console.log('🔄 Attempting to fetch campaigns directly from Supabase...');
        
        let organizationId = null;

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('email', user.email)
            .single();

          if (userData?.organization_id) {
            organizationId = userData.organization_id;
          }
        }
        
        if (organizationId) {
            const { data: campaigns, error: supabaseError } = await supabase
              .from('campaigns')
              .select('*')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false });
            
            if (supabaseError) return [];
            
            return (campaigns || []).map((campaign: any) => ({
              id: campaign.id,
              apexId: campaign.apex_id || `apex${campaign.id.substring(0, 5)}`,
              name: campaign.name,
              description: campaign.description,
              status: campaign.status || 'draft',
              assistantId: campaign.assistant_id || '',
              assistantName: campaign.assistant_name || 'AI Assistant',
              phoneNumberId: campaign.phone_number_id || '',
              phoneNumber: campaign.phone_number,
              organizationId: campaign.organization_id || '',
              objective: campaign.objective,
              budget: campaign.budget,
              campaignType: campaign.campaign_type,
              createdAt: campaign.created_at,
              updatedAt: campaign.updated_at,
              totalLeads: campaign.total_leads || 0,
              callsCompleted: campaign.calls_completed || 0,
              totalCost: campaign.total_cost || 0,
              successRate: campaign.success_rate || 0,
              callsInProgress: campaign.calls_in_progress || 0,
              settings: {
                callsPerHour: campaign.calls_per_hour || 10,
                retryAttempts: campaign.retry_attempts || 2,
                timeZone: campaign.time_zone || 'America/New_York',
                workingHours: {
                  start: campaign.working_hours_start || '09:00',
                  end: campaign.working_hours_end || '17:00'
                }
              },
              teamAssignment: campaign.team_assignment
            }));
        }
        return [];

      } catch (supabaseError) {
        console.error('❌ Failed to fetch from Supabase:', supabaseError);
        return [];
      }
    }
  }

  async createCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    settings?: Partial<OutboundCampaign['settings']>;
    callBehavior?: any;
    workingHours?: any;
    retryLogic?: any;
    [key: string]: any;
  }): Promise<OutboundCampaign> {
    try {
      // Extract concurrency from callBehavior if present
      const maxConcurrentCalls = campaignData.callBehavior?.customConcurrency || 10;
      
      // Transform campaign data to match backend expectations
      const transformedData = {
        ...campaignData,
        max_concurrent_calls: maxConcurrentCalls,
        callBehavior: undefined,
      };
      
      console.log('📡 Sending campaign data to backend:', transformedData);
      const response = await this.apiClient.post('/api/campaigns', transformedData);
      return response.data.campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
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

      // Use /api/campaigns endpoint
      const response = await this.apiClient.post(
        `/api/campaigns/${campaignId}/upload-leads`,
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

  async getLiveMonitoring(campaignId: string): Promise<LiveMonitoring> {
    try {
      // Normalize to /api/campaigns which should support live monitoring
      const response = await this.apiClient.get(`/api/campaigns/${campaignId}/live`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live monitoring:', error);
      throw error;
    }
  }

  // Voice Resources
  async getAssistants(): Promise<VoiceAssistant[]> {
    try {
      const response = await this.apiClient.get('/api/voice/assistants');      
      return response.data.assistants || [];
    } catch (error) {
      console.error('❌ Error getting assistants:', error);
      throw error;
    }
  }

  async getPhoneNumbers(): Promise<VoicePhoneNumber[]> {
    try {
      const response = await this.apiClient.get('/api/voice/phone-numbers');
      return response.data.phoneNumbers || [];
    } catch (error) {
      console.error('❌ Error getting phone numbers:', error);
      throw error;
    }
  }

  async downloadLeadsTemplate(): Promise<Blob> {
    try {
      const response = await this.apiClient.get('/api/campaigns/leads-template', {
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
    return '';
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');

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
        const response = await this.apiClient.get(`/api/calls?limit=${limit}`);
        return response.data.calls || response.data || [];
    } catch (error) {
      console.error('Error fetching recent calls from API:', error);
      
      // Fallback to direct Supabase query
      try {
        console.log('🔄 Attempting to fetch calls directly from Supabase...');
        
        const { data: calls, error: supabaseError } = await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (supabaseError) {
          return [];
        }
        
        return calls || [];
      } catch (supabaseError) {
        return [];
      }
    }
  }

  /**
   * Get calls for a specific campaign
   */
  async getCampaignCalls(campaignId: string, params: URLSearchParams): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/campaigns/${campaignId}/calls?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign calls:', error);
      throw error;
    }
  }

  /**
   * Get campaign dashboard data (live metrics)
   */
  async getCampaignDashboard(campaignId: string): Promise<any> {
    try {
      // Try API first
      const response = await this.apiClient.get(`/api/campaigns/${campaignId}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign dashboard:', error);
      
      // Return default dashboard data
      return {
        totalCalls: 0,
        completedCalls: 0,
        inProgressCalls: 0,
        averageCallDuration: 0,
        conversionRate: 0,
        totalCost: 0,
        outcomeBreakdown: {
          answered: 0,
          voicemail: 0,
          no_answer: 0,
          busy: 0,
          failed: 0
        }
      };
    }
  }

  /**
   * Get campaign results (call history)
   */
  async getCampaignResults(campaignId: string): Promise<any[]> {
    try {
      // Try API first
      const response = await this.apiClient.get(`/api/campaigns/${campaignId}/calls`);
      return response.data.calls || response.data || [];
    } catch (error) {
      console.error('Error fetching campaign results from API:', error);
      
      // Fallback to Supabase
      try {
        const { data: calls, error: supabaseError } = await supabase
          .from('calls')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          return [];
        }
        
        // Transform the data to match expected format
        const transformedCalls = (calls || []).map(call => ({
          id: call.id,
          status: call.status || 'completed',
          outcome: call.outcome || 'completed',
          duration: call.duration || 0,
          cost: call.cost || 0.05,
          phone_number: call.phone_number,
          customer_phone: call.phone_number,
          customerPhone: call.phone_number,
          recording_url: call.recording_url,
          transcript: call.transcript,
          summary: call.summary,
          created_at: call.created_at,
          started_at: call.started_at || call.created_at,
          lead: {
            firstName: 'Lead',
            lastName: '',
            phone: call.phone_number || 'N/A'
          },
          startedAt: call.started_at || call.created_at,
          endedAt: call.ended_at
        }));
        
        return transformedCalls;
      } catch (supabaseError) {
        return [];
      }
    }
  }

  /**
   * Get live data for a campaign
   */
  async getLiveData(campaignId: string): Promise<any> {
    return this.getCampaignDashboard(campaignId);
  }

  /**
   * Start a campaign
   */
  async startCampaign(campaignId: string): Promise<{ message: string; callsStarted?: number }> {
    try {
      console.log('🚀 Starting campaign:', campaignId);
      const response = await this.apiClient.post(`/api/campaigns/${campaignId}/start`);
      return response.data || { message: 'Campaign started' };
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await this.apiClient.post(`/api/campaigns/${campaignId}/pause`);
      return response.data || { message: 'Campaign paused' };
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(campaignId: string): Promise<{ message: string }> {
    try {
      const response = await this.apiClient.post(`/api/campaigns/${campaignId}/resume`);
      return response.data || { message: 'Campaign resumed' };
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }
}

// Create default instance for backward compatibility
export const campaignOutboundService = new CampaignOutboundService(apiClient);

// Hook to create authenticated service instance
export const useCampaignOutboundService = () => {
  const authenticatedApiClient = useApiClient();
  return new CampaignOutboundService(authenticatedApiClient);
};

export default campaignOutboundService;
