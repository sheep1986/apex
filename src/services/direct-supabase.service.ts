import { supabase } from './supabase-client';

// Direct Supabase service that bypasses the API
// Organization ID should be passed from user context to ensure proper data isolation
export class DirectSupabaseService {
  async getCampaigns(organizationId?: string) {
    console.log('🔄 DirectSupabaseService: Fetching campaigns directly from Supabase...');

    if (!organizationId) {
      console.warn('⚠️ No organization ID provided - cannot fetch campaigns');
      return [];
    }

    console.log('🏢 Using organization ID:', organizationId);

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

        // Get total cost from all calls
        const { data: callsWithCost } = await supabase
          .from('calls')
          .select('cost')
          .eq('campaign_id', campaign.id);

        const totalCallCost = callsWithCost?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;

        console.log(`📊 Campaign ${campaign.name}: ${leadCount} leads, ${callCount} calls, ${completedCallCount} completed`);

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
          totalCost: totalCallCost || campaign.total_cost || 0,
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

  async getRecentCalls(limit: number = 20, organizationId?: string) {
    console.log('🔄 DirectSupabaseService: Fetching recent calls from Supabase...');

    if (!organizationId) {
      console.warn('⚠️ No organization ID provided - fetching all calls for debugging');
    }

    console.log('🏢 Using organization ID:', organizationId);

    // First, get campaign IDs for this organization
    const { data: orgCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('organization_id', organizationId || '');

    if (campaignsError) {
      console.error('❌ Error fetching org campaigns:', campaignsError);
    }

    const campaignIds = orgCampaigns?.map(c => c.id) || [];
    console.log(`📋 Found ${campaignIds.length} campaigns for organization`);

    // Try to fetch calls - first by organization_id, then by campaign_id as fallback
    let calls: any[] = [];

    // Method 1: Try direct organization_id filter
    const { data: directCalls, error: directError } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId || '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!directError && directCalls && directCalls.length > 0) {
      console.log(`✅ Found ${directCalls.length} calls via direct org_id filter`);
      calls = directCalls;
    } else {
      console.log('⚠️ No calls found via direct org_id, trying campaign_id filter...');

      // Method 2: Fallback to fetching by campaign IDs
      if (campaignIds.length > 0) {
        const { data: campaignCalls, error: campaignError } = await supabase
          .from('calls')
          .select('*')
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!campaignError && campaignCalls) {
          console.log(`✅ Found ${campaignCalls.length} calls via campaign_id filter`);
          calls = campaignCalls;
        }
      }
    }

    // If still no calls, try fetching all calls to see what's in the database
    if (calls.length === 0) {
      console.log('📊 Debugging: Checking total calls in database...');
      const { data: allCalls, count } = await supabase
        .from('calls')
        .select('id, campaign_id, organization_id, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      console.log(`📊 Total calls in DB: ${count}, sample:`, allCalls?.map(c => ({
        id: c.id?.substring(0, 8),
        campaign_id: c.campaign_id?.substring(0, 8),
        org_id: c.organization_id?.substring(0, 8)
      })));
    }

    console.log(`✅ Returning ${calls.length} recent calls`);
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

    // First, check total calls in the database to help debug
    const { count: totalCallsCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total calls in database: ${totalCallsCount || 0}`);

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching calls:', error);
      return [];
    }

    console.log(`✅ Found ${calls?.length || 0} calls for campaign ${campaignId}`);

    // If no calls found, log all unique campaign_ids to help debug
    if (!calls || calls.length === 0) {
      const { data: allCalls } = await supabase
        .from('calls')
        .select('campaign_id')
        .limit(100);
      const uniqueCampaignIds = [...new Set(allCalls?.map(c => c.campaign_id) || [])];
      console.log('📋 Campaign IDs with calls:', uniqueCampaignIds);
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

    // Get total cost from all calls
    const { data: callsWithCost } = await supabase
      .from('calls')
      .select('cost')
      .eq('campaign_id', campaignId);

    const totalCallCost = callsWithCost?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;

    console.log(`📊 Campaign ${campaign.name}: ${leadCount} leads, ${callCount} calls, ${completedCallCount} completed`);

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
        voice_agent: parsedSettings?.voice_agent || 'Emerald Green Energy Demo',
        system_prompt: parsedSettings?.system_prompt || '',
        voice_model: parsedSettings?.voice_model || 'eleven_turbo_v2_5',
        schedule: parsedSettings?.schedule || null
      },
      teamAssignment: campaign.team_assignment
    };
  }

  async deleteCampaign(campaignId: string, organizationId?: string) {
    console.log('🗑️ DirectSupabaseService: Deleting campaign:', campaignId);

    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }

    if (!organizationId) {
      console.warn('⚠️ No organization ID provided - cannot verify campaign ownership');
      throw new Error('Organization ID is required for delete authorization');
    }

    console.log('🏢 Verifying campaign belongs to organization:', organizationId);

    // Verify campaign belongs to the organization before deleting
    const { data: campaign, error: verifyError } = await supabase
      .from('campaigns')
      .select('id, organization_id')
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single();

    if (verifyError || !campaign) {
      console.error('❌ Campaign not found or does not belong to organization');
      throw new Error('Campaign not found or unauthorized');
    }

    // First, delete associated calls
    const { error: callsError } = await supabase
      .from('calls')
      .delete()
      .eq('campaign_id', campaignId);

    if (callsError) {
      console.error('❌ Error deleting campaign calls:', callsError);
    }

    // Then, delete associated leads
    const { error: leadsError } = await supabase
      .from('leads')
      .delete()
      .eq('campaign_id', campaignId);

    if (leadsError) {
      console.error('❌ Error deleting campaign leads:', leadsError);
    }

    // Finally, delete the campaign
    const { error: campaignError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('organization_id', organizationId); // Double-check org ID on delete

    if (campaignError) {
      console.error('❌ Error deleting campaign:', campaignError);
      throw new Error(`Failed to delete campaign: ${campaignError.message}`);
    }

    console.log('✅ Campaign deleted successfully:', campaignId);
    return true;
  }
}

export const directSupabaseService = new DirectSupabaseService();
