const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkCampaignCallsStatus() {
  // Campaign IDs we're tracking
  const campaigns = [
    { id: 'c2609329-ec4c-47d7-85aa-687856493d0a', name: '11' },
    { id: 'b61389af-5508-4718-adf7-b7ff1c4be53c', name: 'Unknown (from URL)' }
  ];
  
  for (const campaign of campaigns) {
    console.log(`\n=== Campaign: ${campaign.name} (${campaign.id}) ===`);
    
    // Check campaign exists
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single();
      
    if (campaignError || !campaignData) {
      console.log('❌ Campaign not found');
      continue;
    }
    
    console.log(`Status: ${campaignData.status}`);
    console.log(`Type: ${campaignData.type}`);
    
    // Check leads
    console.log('\n📋 Leads:');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, call_status, status, updated_at')
      .eq('campaign_id', campaign.id)
      .order('updated_at', { ascending: false });
      
    if (leadsError) {
      console.log('Error fetching leads:', leadsError);
    } else if (!leads || leads.length === 0) {
      console.log('  No leads found');
    } else {
      console.log(`  Total: ${leads.length}`);
      leads.forEach((lead, i) => {
        if (i < 3) { // Show first 3
          console.log(`  - ${lead.first_name} ${lead.last_name}: ${lead.call_status} (Updated: ${new Date(lead.updated_at).toLocaleTimeString()})`);
        }
      });
      
      // Count by status
      const statusCounts = {};
      leads.forEach(lead => {
        statusCounts[lead.call_status] = (statusCounts[lead.call_status] || 0) + 1;
      });
      console.log('\n  Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`    ${status}: ${count}`);
      });
    }
    
    // Check calls
    console.log('\n📞 Calls:');
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, status, phone_number, started_at, ended_at, duration, outcome, vapi_call_id')
      .eq('campaign_id', campaign.id)
      .order('started_at', { ascending: false })
      .limit(5);
      
    if (callsError) {
      console.log('Error fetching calls:', callsError);
    } else if (!calls || calls.length === 0) {
      console.log('  No calls found');
    } else {
      console.log(`  Total recent: ${calls.length}`);
      calls.forEach((call, i) => {
        const startTime = new Date(call.started_at).toLocaleTimeString();
        const duration = call.duration || 'ongoing';
        console.log(`  ${i + 1}. ${call.status} - ${call.phone_number} at ${startTime} (${duration}s)`);
        if (call.vapi_call_id) {
          console.log(`     VAPI ID: ${call.vapi_call_id}`);
        }
      });
    }
  }
  
  // Check ALL recent calls
  console.log('\n\n=== ALL RECENT CALLS (Last 10) ===');
  const { data: allCalls, error: allCallsError } = await supabase
    .from('calls')
    .select('id, campaign_id, status, phone_number, started_at, vapi_call_id')
    .order('started_at', { ascending: false })
    .limit(10);
    
  if (allCallsError) {
    console.log('Error fetching all calls:', allCallsError);
  } else if (!allCalls || allCalls.length === 0) {
    console.log('No calls found in the entire system');
  } else {
    allCalls.forEach((call, i) => {
      const startTime = new Date(call.started_at).toLocaleTimeString();
      console.log(`${i + 1}. ${call.status} - ${call.phone_number} at ${startTime}`);
      console.log(`   Campaign: ${call.campaign_id?.substring(0, 8)}...`);
      if (call.vapi_call_id?.startsWith('sim-')) {
        console.log(`   📌 SIMULATED CALL`);
      }
    });
  }
}

checkCampaignCallsStatus();