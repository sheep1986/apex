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
    
    // Fetch lead and call counts for each campaign
    const campaignsWithCounts = await Promise.all(
      (campaigns || []).map(async (campaign: any) => {
        // Get lead count
        const { count: leadCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);
        
        // Get call count
        const { count: callCount } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);
        
        // Get completed calls count (including initiated since user confirmed receiving calls)
        const { count: completedCallCount } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .in('status', ['completed', 'ended', 'initiated']);
        
        console.log(`📊 Campaign ${campaign.name}: ${leadCount} leads, ${callCount} calls, ${completedCallCount} completed`);
    console.log('📊 Returning data with:', {
      totalLeads: leadCount || 0,
      callsCompleted: completedCallCount || 0,
      id: campaign.id
    });
        
        // Log if this is the test mm campaign
        if (campaign.name === 'test mm') {
          console.log('🎯 Found test mm campaign with data!', {
            leadCount,
            callCount,
            completedCallCount,
            campaignId: campaign.id
          });
        }
        
        return {
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
          totalLeads: leadCount || 0,
          callsCompleted: completedCallCount || 0,
          totalCost: campaign.total_cost || (callCount ? callCount * 0.05 : 0), // Estimate $0.05 per call
          successRate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0,
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
        };
      })
    );
    
    return campaignsWithCounts;
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
  
  async getCampaignLeads(campaignId: string) {
    console.log('🔄 DirectSupabaseService: Fetching leads for campaign:', campaignId);
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error fetching leads:', error);
      return [];
    }
    
    console.log(`✅ Found ${leads?.length || 0} leads for campaign`);
    return leads || [];
  }
  
  async getCampaignCalls(campaignId: string) {
    console.log('🔄 DirectSupabaseService: Fetching calls for campaign:', campaignId);
    
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error fetching calls:', error);
      return [];
    }
    
    console.log(`✅ Found ${calls?.length || 0} calls for campaign`);
    
    // Include all calls, even with initiated status
    return (calls || []).map(call => ({
      ...call,
      // Add display-friendly status
      displayStatus: call.status === 'initiated' ? 'connected' : call.status,
      // Add placeholder data for initiated calls
      transcript: call.transcript || (call.status === 'initiated' ? 'Call connected but transcript not yet available' : ''),
      recording_url: call.recording_url || '',
      summary: call.summary || (call.status === 'initiated' ? 'Call was successfully initiated' : '')
    }));
  }
  
  async getCampaignById(campaignId: string) {
    console.log('🔄 DirectSupabaseService: Fetching campaign by ID:', campaignId);
    
    if (!campaignId) {
      console.error('❌ No campaign ID provided');
      return null;
    }
    
    // Get campaign data
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching campaign:', error);
      return null;
    }
    
    if (!campaign) {
      console.error('❌ No campaign found with ID:', campaignId);
      return null;
    }
    
    console.log('✅ Found campaign:', campaign.name)
    
    // Get lead count
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    
    // Get call count
    const { count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    
    // Get completed calls count (including initiated since user confirmed receiving calls)
    const { count: completedCallCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['completed', 'ended', 'initiated']);
    
    console.log(`📊 Campaign ${campaign.name}: ${leadCount} leads, ${callCount} calls, ${completedCallCount} completed`);
    console.log('📊 Returning data with:', {
      totalLeads: leadCount || 0,
      callsCompleted: completedCallCount || 0,
      id: campaign.id
    });
    
    return {
      ...campaign,
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
      totalLeads: leadCount || 0,
      callsCompleted: completedCallCount || 0,
      totalCost: campaign.total_cost || (callCount ? callCount * 0.05 : 0),
      successRate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0,
      callsInProgress: campaign.calls_in_progress || 0,
      settings: campaign.settings || {
        callsPerHour: campaign.calls_per_hour || 10,
        retryAttempts: campaign.retry_attempts || 2,
        timeZone: campaign.time_zone || 'America/New_York',
        workingHours: {
          start: campaign.working_hours_start || '09:00',
          end: campaign.working_hours_end || '17:00'
        },
        total_leads: leadCount || 0,
        calls_completed: completedCallCount || 0,
        successful_calls: completedCallCount || 0
      },
      teamAssignment: campaign.team_assignment
    };
  }
}

export const directSupabaseService = new DirectSupabaseService();