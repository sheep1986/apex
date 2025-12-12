import { useApiClient, apiClient } from '../lib/api-client';
import { supabase } from './supabase-client';

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
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private apiClient: any;

  constructor(apiClient?: any) {
    // Use provided apiClient or fall back to default
    this.apiClient = apiClient || require('../lib/api-client').apiClient;
  }

  // Campaign Management
  async getCampaigns(): Promise<VapiOutboundCampaign[]> {
    try {
      console.log('🎯 VapiOutboundService: Fetching campaigns from:', this.baseURL);
      
      // Try API endpoints with proper error handling
      let response;
      let apiSuccess = false;
      
      try {
        console.log('📡 Trying /vapi-outbound/campaigns endpoint...');
        response = await this.apiClient.get('/vapi-outbound/campaigns');
        // Check if we actually got data
        if (response && response.data) {
          console.log('✅ vapi-outbound endpoint succeeded');
          apiSuccess = true;
        }
      } catch (error: any) {
        console.log('⚠️ vapi-outbound failed with:', error.response?.status || error.message);
      }
      
      // If vapi-outbound didn't work, try regular campaigns
      if (!apiSuccess) {
        try {
          console.log('📡 Trying /campaigns endpoint...');
          response = await this.apiClient.get('/campaigns');
          // Check if we actually got data
          if (response && response.data) {
            console.log('✅ Regular campaigns endpoint succeeded');
            apiSuccess = true;
          }
        } catch (error: any) {
          console.log('⚠️ Regular campaigns failed with:', error.response?.status || error.message);
        }
      }
      
      // If neither API worked, throw error to trigger Supabase fallback
      if (!apiSuccess) {
        console.error('❌ Both API endpoints failed, will try Supabase fallback');
        throw new Error('API endpoints unavailable');
      }
      console.log('📡 VapiOutboundService: API Response:', response);
      
      // The API returns {campaigns: [...], pagination: {...}}
      // Extract just the campaigns array
      const campaignsData = response.data?.campaigns || [];
      
      // Ensure we have an array before mapping
      if (!Array.isArray(campaignsData)) {
        console.error('❌ Campaigns data is not an array:', campaignsData);
        return [];
      }
      
      // Map the data - handle both camelCase and snake_case fields
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
        
        // Try to get organization_id from window.Clerk if available
        let organizationId = null;
        
        // First try to get from Clerk (if available in window)
        if (typeof window !== 'undefined' && (window as any).Clerk) {
          try {
            const clerk = (window as any).Clerk;
            const user = clerk.user;
            if (user) {
              // Get organization_id from user's publicMetadata or from database
              const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
              if (userEmail) {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('organization_id')
                  .eq('email', userEmail)
                  .single();
                
                if (!userError && userData?.organization_id) {
                  organizationId = userData.organization_id;
                  console.log('✅ Got organization_id from Clerk user:', organizationId);
                }
              }
            }
          } catch (clerkError) {
            console.warn('⚠️ Could not get organization from Clerk:', clerkError);
          }
        }
        
        // If no organization_id, try Supabase auth as fallback
        if (!organizationId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const { data: userData } = await supabase
              .from('users')
              .select('organization_id')
              .eq('email', user.email)
              .single();
            
            if (userData?.organization_id) {
              organizationId = userData.organization_id;
              console.log('✅ Got organization_id from Supabase auth:', organizationId);
            }
          }
        }
        
        // If still no organization_id, use the known one as last resort
        if (!organizationId) {
          // This is the organization_id for seanwentz99@gmail.com
          // TODO: Remove this hardcoded fallback once auth is fixed
          organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
          console.warn('⚠️ Using hardcoded organization_id as fallback:', organizationId);
        }
        
        const { data: campaigns, error: supabaseError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
          return [];
        }
        
        console.log('✅ Fetched campaigns from Supabase:', campaigns);
        
        // Transform Supabase data to match our interface
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
    settings?: Partial<VapiOutboundCampaign['settings']>;
    callBehavior?: any;
    workingHours?: any;
    retryLogic?: any;
    [key: string]: any;
  }): Promise<VapiOutboundCampaign> {
    try {
      // Extract concurrency from callBehavior if present
      const maxConcurrentCalls = campaignData.callBehavior?.customConcurrency || 10;
      
      // Transform campaign data to match backend expectations
      const transformedData = {
        ...campaignData,
        max_concurrent_calls: maxConcurrentCalls,
        // Remove frontend-specific properties
        callBehavior: undefined,
        // The backend will handle the rest of the data as-is
      };
      
      console.log('📡 Sending campaign data to backend:', transformedData);
      const response = await this.apiClient.post('/vapi-outbound/campaigns', transformedData);
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

      // Use apiClient for consistent auth handling
      const response = await this.apiClient.post(
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

  async getLiveMonitoring(campaignId: string): Promise<LiveMonitoring> {
    try {
      const response = await this.apiClient.get(`/vapi-outbound/campaigns/${campaignId}/live`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live monitoring:', error);
      throw error;
    }
  }

  // VAPI Resources
  async getAssistants(): Promise<VapiAssistant[]> {
    try {
      console.log('📡 VapiOutboundService.getAssistants: Making API call...');
      const response = await this.apiClient.get('/vapi-data/assistants');
      console.log('📡 VapiOutboundService.getAssistants: Response:', response);
      console.log('📡 VapiOutboundService.getAssistants: Response data:', response.data);
      console.log('📡 VapiOutboundService.getAssistants: Assistants array:', response.data.assistants);
      
      const assistants = response.data.assistants || [];
      console.log('📡 VapiOutboundService.getAssistants: Returning', assistants.length, 'assistants');
      
      return assistants;
    } catch (error) {
      console.error('❌ VapiOutboundService.getAssistants: Error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async getPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    try {
      console.log('📡 VapiOutboundService.getPhoneNumbers: Making API call...');
      const response = await this.apiClient.get('/vapi-data/phone-numbers');
      console.log('📡 VapiOutboundService.getPhoneNumbers: Response:', response);
      console.log('📡 VapiOutboundService.getPhoneNumbers: Response data:', response.data);
      console.log('📡 VapiOutboundService.getPhoneNumbers: Phone numbers array:', response.data.phoneNumbers);
      
      const phoneNumbers = response.data.phoneNumbers || [];
      console.log('📡 VapiOutboundService.getPhoneNumbers: Returning', phoneNumbers.length, 'phone numbers');
      
      return phoneNumbers;
    } catch (error) {
      console.error('❌ VapiOutboundService.getPhoneNumbers: Error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async downloadLeadsTemplate(): Promise<Blob> {
    try {
      const response = await this.apiClient.get('/vapi-outbound/leads-template', {
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
      console.log('📡 VapiOutboundService: Fetching recent calls...');
      let response;
      try {
        response = await this.apiClient.get(`/vapi-outbound/calls/recent?limit=${limit}`);
      } catch (error: any) {
        // If vapi-outbound endpoint doesn't exist, use regular calls endpoint
        if (error.response?.status === 404) {
          console.log('📡 Falling back to /calls endpoint...');
          response = await this.apiClient.get(`/calls?limit=${limit}`);
        } else {
          throw error;
        }
      }
      console.log('📡 VapiOutboundService: Recent calls response:', response);
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
          console.error('❌ Supabase error:', supabaseError);
          return [];
        }
        
        console.log('✅ Fetched calls from Supabase:', calls);
        return calls || [];
      } catch (supabaseError) {
        console.error('❌ Failed to fetch from Supabase:', supabaseError);
        return [];
      }
    }
  }

  /**
   * Get calls for a specific campaign
   */
  async getCampaignCalls(campaignId: string, params: URLSearchParams): Promise<any> {
    try {
      const response = await this.apiClient.get(`/campaigns/${campaignId}/calls?${params}`);
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
      const response = await this.apiClient.get(`/vapi-outbound/campaigns/${campaignId}/dashboard`);
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
      const response = await this.apiClient.get(`/vapi-outbound/campaigns/${campaignId}/calls`);
      return response.data.calls || response.data || [];
    } catch (error) {
      console.error('Error fetching campaign results from API:', error);
      
      // Fallback to Supabase
      try {
        console.log('🔄 Fetching campaign calls from Supabase...');
        const { data: calls, error: supabaseError } = await supabase
          .from('calls')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
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
            firstName: 'Matt',
            lastName: '',
            phone: call.phone_number || 'N/A'
          },
          startedAt: call.started_at || call.created_at,
          endedAt: call.ended_at
        }));
        
        console.log(`✅ Fetched ${transformedCalls.length} calls for campaign ${campaignId}`);
        return transformedCalls;
      } catch (supabaseError) {
        console.error('❌ Failed to fetch from Supabase:', supabaseError);
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
      const response = await this.apiClient.post(`/vapi-outbound/campaigns/${campaignId}/start`);
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
      const response = await this.apiClient.post(`/vapi-outbound/campaigns/${campaignId}/pause`);
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
      const response = await this.apiClient.post(`/vapi-outbound/campaigns/${campaignId}/resume`);
      return response.data || { message: 'Campaign resumed' };
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }

  /**
   * Sync a single call from VAPI
   */
  async syncCallFromVapi(callId: string): Promise<any> {
    try {
      console.log('🔄 Syncing call from VAPI:', callId);
      const response = await this.apiClient.post(`/vapi-data/sync-call/${callId}`);
      console.log('✅ Call synced:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing call from VAPI:', error);
      throw error;
    }
  }

  /**
   * Sync all recent calls from VAPI
   */
  async syncAllCallsFromVapi(campaignId?: string, limit: number = 100): Promise<any> {
    try {
      console.log('🔄 Syncing all calls from VAPI');
      const response = await this.apiClient.post('/vapi-data/sync-calls', {
        campaignId,
        limit
      });
      console.log('✅ Calls synced:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing calls from VAPI:', error);
      throw error;
    }
  }
}

// Create default instance for backward compatibility
export const vapiOutboundService = new VapiOutboundService(apiClient);

// Hook to create authenticated service instance
export const useVapiOutboundService = () => {
  const authenticatedApiClient = useApiClient();
  return new VapiOutboundService(authenticatedApiClient);
};

export default vapiOutboundService;
