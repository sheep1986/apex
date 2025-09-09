import { supabase } from './supabase-client';

// Direct Supabase service that bypasses the API
export class DirectSupabaseService {
  async getCampaigns() {
    console.log('🔄 DirectSupabaseService: Fetching campaigns directly from Supabase...');
    
    // Hardcoded organization_id for now
    const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return [];
    }
    
    console.log(`✅ Found ${campaigns?.length || 0} campaigns in Supabase`);
    
    // Transform to match the expected format
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
  
  async getRecentCalls(limit: number = 20) {
    console.log('🔄 DirectSupabaseService: Fetching recent calls from Supabase...');
    
    const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
    
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return [];
    }
    
    console.log(`✅ Found ${calls?.length || 0} recent calls`);
    return calls || [];
  }
}

export const directSupabaseService = new DirectSupabaseService();