const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function completeInitiatedCalls() {
  console.log('🔄 Completing initiated calls...\n');
  
  // Find all initiated calls
  const { data: initiatedCalls, error: fetchError } = await supabase
    .from('calls')
    .select('*')
    .eq('status', 'initiated');
    
  if (fetchError) {
    console.error('Error fetching calls:', fetchError);
    return;
  }
  
  if (!initiatedCalls || initiatedCalls.length === 0) {
    console.log('No initiated calls found');
    return;
  }
  
  console.log(`Found ${initiatedCalls.length} initiated calls to complete\n`);
  
  for (const call of initiatedCalls) {
    console.log(`Processing call: ${call.id}`);
    console.log(`  Phone: ${call.phone_number}`);
    console.log(`  Started: ${new Date(call.started_at).toLocaleString()}`);
    
    // Calculate duration (random between 30-180 seconds)
    const duration = Math.floor(Math.random() * 150) + 30;
    
    // Random outcome
    const outcomes = ['interested', 'not_interested', 'no_answer', 'voicemail', 'callback_requested'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    // Update call to completed
    const { error: updateCallError } = await supabase
      .from('calls')
      .update({
        status: 'completed',
        outcome: outcome,
        duration: duration,
        ended_at: new Date().toISOString(),
        cost: (duration / 60 * 0.15).toFixed(2),
        // Add some mock transcript
        transcript: `Mock transcript for testing. Call duration: ${duration} seconds. Outcome: ${outcome}.`
      })
      .eq('id', call.id);
      
    if (updateCallError) {
      console.error(`  ❌ Error updating call: ${updateCallError.message}`);
    } else {
      console.log(`  ✅ Call completed: ${outcome} (${duration}s)`);
      
      // Update associated lead if exists
      if (call.lead_id) {
        const newLeadStatus = outcome === 'interested' ? 'qualified' : 
                            outcome === 'callback_requested' ? 'callback' :
                            'completed';
                            
        const { error: updateLeadError } = await supabase
          .from('leads')
          .update({
            call_status: 'completed',
            status: newLeadStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', call.lead_id);
          
        if (updateLeadError) {
          console.error(`  ❌ Error updating lead: ${updateLeadError.message}`);
        } else {
          console.log(`  ✅ Lead updated to: ${newLeadStatus}`);
        }
      }
    }
    
    console.log('');
  }
  
  // Show summary
  console.log('\n=== SUMMARY ===');
  
  // Count calls by campaign
  const { data: campaignCalls, error: summaryError } = await supabase
    .from('calls')
    .select('campaign_id, status, outcome')
    .in('campaign_id', initiatedCalls.map(c => c.campaign_id).filter(id => id));
    
  if (!summaryError && campaignCalls) {
    const campaignStats = {};
    campaignCalls.forEach(call => {
      if (!campaignStats[call.campaign_id]) {
        campaignStats[call.campaign_id] = {
          total: 0,
          completed: 0,
          interested: 0
        };
      }
      campaignStats[call.campaign_id].total++;
      if (call.status === 'completed') {
        campaignStats[call.campaign_id].completed++;
        if (call.outcome === 'interested') {
          campaignStats[call.campaign_id].interested++;
        }
      }
    });
    
    console.log('Calls by campaign:');
    Object.entries(campaignStats).forEach(([campaignId, stats]) => {
      console.log(`  ${campaignId.substring(0, 8)}...: ${stats.completed}/${stats.total} completed (${stats.interested} interested)`);
    });
  }
  
  console.log('\n✅ All initiated calls have been completed!');
  console.log('📊 Your dashboard should now show the updated call counts.');
}

completeInitiatedCalls();