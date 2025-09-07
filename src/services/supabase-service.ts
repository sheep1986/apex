import { getSupabase } from './supabase-client';

// Lazy-load the Supabase client to ensure proper initialization
let _supabaseClient: ReturnType<typeof getSupabase> | null = null;

function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = getSupabase();
    console.log('🔍 Supabase client initialized:', !!_supabaseClient);
    console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co');
  }
  return _supabaseClient;
}

// Use getter for backward compatibility
const supabase = new Proxy({} as ReturnType<typeof getSupabase>, {
  get(target, prop, receiver) {
    const client = getSupabaseClient();
    return Reflect.get(client, prop, receiver);
  }
});

// Types for our database tables
export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'platform' | 'agency' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  monthly_cost: number;
  billing_email?: string;
  phone?: string;
  address?: string;
  country?: string;
  website?: string;
  industry?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  custom_domain?: string;
  call_limit: number;
  user_limit: number;
  storage_limit_gb: number;
  vapi_api_key?: string;  // Public key
  vapi_private_key?: string;  // Private key
  vapi_webhook_secret?: string;
  vapi_webhook_url?: string;
  vapi_webhook_configured?: boolean;
  vapi_assistant_id?: string;
  vapi_phone_number_id?: string;
  vapi_settings?: any;
  webhook_url?: string;
  max_concurrent_calls?: number;
  default_user_role?: string;
  compliance_settings?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
  trial_ends_at?: string;
  last_payment_at?: string;
}

export interface DatabaseUser {
  id: string;
  organization_id: string;
  clerk_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'platform_owner' | 'support_admin' | 'support_agent' | 'client_admin' | 'client_user' | 'client_viewer';
  permissions: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended' | 'invited';
  email_verified: boolean;
  last_login_at?: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
  invited_at?: string;
  invited_by?: string;
  organizationName?: string; // Added for organization name
  organizations?: { id: string; name: string; slug: string }; // For join data
}

export interface Campaign {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  type: 'outbound' | 'inbound' | 'follow_up' | 'survey';
  vapi_agent_id?: string;
  voice_id?: string;
  script?: string;
  system_prompt?: string;
  temperature: number;
  max_tokens: number;
  phone_number?: string;
  caller_id?: string;
  max_call_duration: number;
  retry_attempts: number;
  retry_delay: number;
  start_date?: string;
  end_date?: string;
  time_zone: string;
  calling_hours_start: string;
  calling_hours_end: string;
  calling_days: number[];
  total_leads: number;
  calls_made: number;
  calls_answered: number;
  calls_completed: number;
  conversion_rate: number;
  avg_call_duration: number;
  cost_per_call: number;
  created_at: string;
  updated_at: string;
  last_call_at?: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  campaign_id?: string;
  uploaded_by?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone: string;
  company?: string;
  job_title?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  custom_fields: Record<string, any>;
  score: number;
  qualification_status: 'unqualified' | 'qualified' | 'hot' | 'warm' | 'cold' | 'do_not_call';
  lead_source?: string;
  lead_quality: 'high' | 'medium' | 'low' | 'unknown';
  call_status: 'pending' | 'calling' | 'answered' | 'voicemail' | 'busy' | 'failed' | 'completed' | 'do_not_call';
  call_attempts: number;
  last_call_at?: string;
  next_call_at?: string;
  converted: boolean;
  conversion_date?: string;
  conversion_value?: number;
  phone_validated: boolean;
  email_validated: boolean;
  data_quality_score: number;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  organization_id: string;
  campaign_id?: string;
  lead_id?: string;
  user_id?: string;
  vapi_call_id?: string;
  call_sid?: string;
  from_number?: string;
  to_number?: string;
  direction: 'outbound' | 'inbound';
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'busy' | 'failed' | 'no_answer' | 'cancelled';
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration: number;
  billable_duration: number;
  outcome?: 'connected' | 'voicemail' | 'busy' | 'no_answer' | 'failed' | 'interested' | 'not_interested' | 'callback' | 'converted';
  sentiment?: 'positive' | 'neutral' | 'negative' | 'unknown';
  transcript?: string;
  summary?: string;
  key_points: any[];
  objections: any[];
  buying_signals: any[];
  next_steps?: string;
  call_quality_score: number;
  ai_confidence_score: number;
  human_review_required: boolean;
  cost: number;
  cost_currency: string;
  recording_url?: string;
  recording_duration: number;
  created_at: string;
  updated_at: string;
}

export interface VapiIntegration {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'testing';
  vapi_api_key: string;
  vapi_public_key?: string;
  vapi_webhook_url?: string;
  vapi_webhook_secret?: string;
  default_voice_id?: string;
  default_voice_name?: string;
  voice_provider: string;
  default_system_prompt?: string;
  default_temperature: number;
  default_max_tokens: number;
  phone_number?: string;
  caller_id?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  calls_per_minute: number;
  daily_call_limit: number;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  sidebar_collapsed: boolean;
  dashboard_layout: Record<string, any>;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  notification_types: string[];
  two_factor_enabled: boolean;
  session_timeout: number;
  require_password_change: boolean;
  allowed_ip_addresses?: string[];
  data_retention_days: number;
  analytics_tracking: boolean;
  share_usage_data: boolean;
  api_access_enabled: boolean;
  webhook_notifications: boolean;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'call_completed' | 'campaign_finished' | 'lead_qualified' | 'system_alert';
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  delivery_method?: 'in_app' | 'email' | 'sms' | 'webhook';
  delivered: boolean;
  delivered_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  // Expose the client for direct access
  get client() {
    return supabase;
  }
  
  // Organizations
  async getOrganizations() {
    console.log('📡 SupabaseService.getOrganizations called');
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('📊 Supabase query result:', { data, error });
    
    if (error) {
      console.error('❌ Supabase error in getOrganizations:', error);
      throw error;
    }
    
    console.log('✅ Returning organizations:', data?.length || 0);
    return data as Organization[];
  }

  async getOrganization(id: string) {
    console.log('📡 Fetching organization with ID:', id);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching organization:', error);
      throw error;
    }
    
    console.log('✅ Organization fetched from Supabase:', data);
    console.log('📊 Organization data fields:', {
      hasName: !!data?.name,
      hasBillingEmail: !!data?.billing_email,
      hasPhone: !!data?.phone,
      hasWebsite: !!data?.website,
      hasIndustry: !!data?.industry,
      hasAddress: !!data?.address,
      hasVapiApiKey: !!data?.vapi_api_key,
      hasVapiPrivateKey: !!data?.vapi_private_key
    });
    
    return data as Organization;
  }

  async createOrganization(org: Partial<Organization>) {
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();
    
    if (error) throw error;
    return data as Organization;
  }

  async updateOrganization(id: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Organization;
  }

  // Users
  async getUsers(organizationId?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as DatabaseUser[];
  }

  async getUserByClerkId(clerkId: string) {
    console.log('🔍 getUserByClerkId called with:', clerkId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
      
      console.log('📊 Query result:', { data, error });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No user found
          console.log('⚠️ No user found with clerk_id:', clerkId);
          return null;
        }
        // Log the full error for debugging
        console.error('❌ Full error:', error);
        throw error;
      }
      
      return data as DatabaseUser | null;
    } catch (err) {
      console.error('❌ getUserByClerkId error:', err);
      throw err;
    }
  }

  async getUserById(id: string) {
    console.log('🔍 getUserById called with:', id);
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        organizations(
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ getUserById error:', error);
      if (error.code === 'PGRST116') {
        console.log('⚠️ No user found with ID:', id);
      }
      return null;
    }
    
    if (!data) {
      console.log('⚠️ No user found with ID:', id);
      return null;
    }
    
    console.log('✅ Found user:', data.email, 'Role:', data.role);
    
    return {
      ...data,
      organizationName: data.organizations?.name
    } as DatabaseUser;
  }

  async getUserByEmail(email: string) {
    console.log('🔍 getUserByEmail called with:', email);
    
    try {
      // Skip auth context check - it might be causing the hang
      // Go straight to the query
      console.log('📡 Attempting simple query...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      console.log('📊 Query completed - Data:', !!data, 'Error:', !!error);
      
      if (error) {
        console.error('❌ Query error:', error);
        console.log('Error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        
        if (error.code === 'PGRST116') {
          console.log('⚠️ No user found');
          return null;
        }
        
        throw error;
      }
      
      if (!data) {
        console.log('⚠️ No user found with email:', email);
        return null;
      }
      
      console.log('✅ Found user:', data.email, 'Role:', data.role, 'ID:', data.id);
      
      // Try to fetch organization if exists
      if (data.organization_id) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name, slug')
            .eq('id', data.organization_id)
            .single();
          
          if (org) {
            data.organizations = org;
            data.organizationName = org.name;
          }
        } catch (orgError) {
          console.warn('Could not fetch organization:', orgError);
        }
      }
      
      return data as DatabaseUser | null;
    } catch (error) {
      console.error('❌ getUserByEmail failed:', error);
      throw error;
    }
  }

  private async getUserByEmailFallback(email: string) {
    console.log('🔧 Using fallback query (no joins)...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('❌ Fallback query error:', error);
        throw error;
      }
      
      if (!data) {
        console.log('⚠️ No user found in fallback');
        return null;
      }
      
      console.log('✅ Fallback query successful:', data.email, 'Role:', data.role);
      
      // Try to fetch organization separately if user has one
      if (data.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('id', data.organization_id)
          .single();
        
        if (org) {
          data.organizations = org;
          data.organizationName = org.name;
        }
      }
      
      return data as DatabaseUser | null;
    } catch (error) {
      console.error('❌ Fallback query failed:', error);
      throw error;
    }
  }

  async createUser(user: Partial<DatabaseUser>) {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data as DatabaseUser;
  }

  async updateUser(id: string, updates: Partial<DatabaseUser>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as DatabaseUser;
  }

  async syncUserFromClerk(clerkUser: User, organizationId: string) {
    const existingUser = await this.getUserByClerkId(clerkUser.id);
    
    const userData: Partial<DatabaseUser> = {
      clerk_id: clerkUser.id,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      avatar_url: clerkUser.imageUrl,
      email_verified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
      last_login_at: new Date().toISOString(),
    };

    if (existingUser) {
      return await this.updateUser(existingUser.id, userData);
    } else {
      return await this.createUser({
        ...userData,
        organization_id: organizationId,
        role: 'client_user', // Default role
        permissions: {},
        status: 'active',
        timezone: 'UTC',
        language: 'en',
      });
    }
  }

  // Campaigns
  async getCampaigns(organizationId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Campaign[];
  }

  async getCampaign(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Campaign;
  }

  async createCampaign(campaign: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
    
    if (error) throw error;
    return data as Campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Campaign;
  }

  async deleteCampaign(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Leads
  async getLeads(organizationId: string, campaignId?: string) {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Lead[];
  }

  async createLead(lead: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  async updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  async deleteLead(id: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async bulkCreateLeads(leads: Partial<Lead>[]) {
    const { data, error } = await supabase
      .from('leads')
      .insert(leads)
      .select();
    
    if (error) throw error;
    return data as Lead[];
  }

  // Calls
  async getCalls(organizationId: string, campaignId?: string, leadId?: string) {
    let query = supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('started_at', { ascending: false });
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Call[];
  }

  async createCall(call: Partial<Call>) {
    const { data, error } = await supabase
      .from('calls')
      .insert(call)
      .select()
      .single();
    
    if (error) throw error;
    return data as Call;
  }

  async updateCall(id: string, updates: Partial<Call>) {
    const { data, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Call;
  }

  // VAPI Integrations
  async getVapiIntegrations(organizationId: string) {
    const { data, error } = await supabase
      .from('vapi_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as VapiIntegration[];
  }

  async createVapiIntegration(integration: Partial<VapiIntegration>) {
    const { data, error } = await supabase
      .from('vapi_integrations')
      .insert(integration)
      .select()
      .single();
    
    if (error) throw error;
    return data as VapiIntegration;
  }

  async updateVapiIntegration(id: string, updates: Partial<VapiIntegration>) {
    const { data, error } = await supabase
      .from('vapi_integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as VapiIntegration;
  }

  // User Settings
  async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as UserSettings | null;
  }

  async upsertUserSettings(settings: Partial<UserSettings>) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  }

  // Notifications
  async getNotifications(organizationId: string, userId?: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  }

  async createNotification(notification: Partial<Notification>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  }

  async markNotificationAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  }

  async markAllNotificationsAsRead(organizationId: string, userId?: string) {
    let query = supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('organization_id', organizationId)
      .eq('read', false);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    if (error) throw error;
  }

  // Analytics and Reports
  async getCampaignAnalytics(organizationId: string, campaignId?: string, dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('calls')
      .select(`
        *,
        campaigns(*),
        leads(*)
      `)
      .eq('organization_id', organizationId);
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    if (dateRange) {
      query = query
        .gte('started_at', dateRange.start)
        .lte('started_at', dateRange.end);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getOrganizationStats(organizationId: string) {
    const [campaigns, leads, calls, users] = await Promise.all([
      this.getCampaigns(organizationId),
      this.getLeads(organizationId),
      this.getCalls(organizationId),
      this.getUsers(organizationId)
    ]);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(l => l.qualification_status === 'qualified').length,
      totalCalls: calls.length,
      completedCalls: calls.filter(c => c.status === 'completed').length,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
    };
  }

  async getPhoneNumbers(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      return [];
    }
  }

  async getAssistants(organizationId: string) {
    try {
      // Since vapi_assistants table doesn't exist, return empty array
      // In production, assistants should be fetched from VAPI API
      console.log('vapi_assistants table does not exist, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return [];
    }
  }

  async getOrganizationUsers(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organization users:', error);
      return [];
    }
  }
}

export const supabaseService = new SupabaseService();