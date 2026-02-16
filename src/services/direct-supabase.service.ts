import { supabase } from './supabase-client';

// Direct Supabase service that bypasses the API
export class DirectSupabaseService {
  async getCampaigns() {
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
        
        // Get total cost from all calls
        const { data: callsWithCost } = await supabase
          .from('calls')
          .select('cost')
          .eq('campaign_id', campaign.id);
        
        const totalCallCost = callsWithCost?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
        
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
          totalCost: totalCallCost || campaign.total_cost || 0, // Use actual cost from calls
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
    
    return calls || [];
  }
  
  async getCampaignLeads(campaignId: string) {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error fetching leads:', error);
      return [];
    }
    
    return leads || [];
  }
  
  async getCampaignCalls(campaignId: string) {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error fetching calls:', error);
      return [];
    }
    
    // Include all calls with proper formatting
    return (calls || []).map(call => ({
      ...call,
      // Add display-friendly status
      displayStatus: call.status === 'completed' ? 'Completed' : 
                    call.status === 'initiated' ? 'In Progress' : 
                    call.status === 'failed' ? 'Failed' : call.status,
      // Ensure all fields are present
      transcript: call.transcript || '',
      recording_url: call.recording_url || '',
      summary: call.summary || '',
      cost: call.cost || 0,
      duration: call.duration || 0
    }));
  }
  
  async getCampaignById(campaignId: string) {
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
    
    // Get total cost from all calls
    const { data: callsWithCost } = await supabase
      .from('calls')
      .select('cost')
      .eq('campaign_id', campaignId);
    
    const totalCallCost = callsWithCost?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
    
    // Parse settings if it's a JSON string
    let parsedSettings = campaign.settings;
    if (typeof parsedSettings === 'string') {
      try {
        parsedSettings = JSON.parse(parsedSettings);
      } catch {
        parsedSettings = {};
      }
    }
    
    return {
      ...campaign,
      id: campaign.id,
      apexId: campaign.apex_id || `apex${campaign.id.substring(0, 5)}`,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status || 'draft',
      assistantId: campaign.assistant_id || '',
      assistantName: parsedSettings?.voice_agent || 'Emerald Green Energy Demo',
      phoneNumberId: campaign.phone_number_id || '',
      phoneNumber: campaign.phone_number || '+447482792343',
      organizationId: campaign.organization_id || '',
      objective: campaign.objective,
      budget: campaign.budget,
      campaignType: campaign.campaign_type,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
      totalLeads: leadCount || 0,
      callsCompleted: completedCallCount || 0,
      totalCost: totalCallCost || campaign.total_cost || 0,
      successRate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0,
      callsInProgress: campaign.calls_in_progress || 0,
      settings: {
        ...(parsedSettings || {}),
        callsPerHour: campaign.calls_per_hour || 10,
        retryAttempts: campaign.retry_attempts || 2,
        timeZone: campaign.time_zone || 'America/New_York',
        workingHours: {
          start: campaign.working_hours_start || '09:00',
          end: campaign.working_hours_end || '17:00'
        },
        total_leads: leadCount || 0,
        calls_completed: completedCallCount || 0,
        successful_calls: completedCallCount || 0,
        // Include Apex details from settings
        voice_agent: parsedSettings?.voice_agent || 'Emerald Green Energy Demo',
        system_prompt: parsedSettings?.system_prompt || '',
        voice_model: parsedSettings?.voice_model || 'eleven_turbo_v2_5',
        schedule: parsedSettings?.schedule || null
      },
      teamAssignment: campaign.team_assignment
    };
  }
}

export const directSupabaseService = new DirectSupabaseService();