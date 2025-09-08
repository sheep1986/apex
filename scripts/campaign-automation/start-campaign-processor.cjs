// Minimal Campaign Processor - Start calls for existing campaigns
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function processCampaigns() {
  console.log('🚀 Campaign Processor Started\n');
  console.log('This will check for campaigns with pending leads and simulate starting calls.\n');
  
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  while (true) {
    try {
      // Get active campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
        
      if (campaignError) {
        console.error('Error fetching campaigns:', campaignError);
      } else if (campaigns && campaigns.length > 0) {
        console.log(`\n[${new Date().toLocaleTimeString()}] Found ${campaigns.length} active campaigns`);
        
        for (const campaign of campaigns) {
          // Check for pending leads
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('call_status', 'pending')
            .limit(5);
            
          if (!leadsError && leads && leads.length > 0) {
            console.log(`\n📞 Campaign "${campaign.name}" has ${leads.length} pending leads`);
            
            // Process each lead
            for (const lead of leads) {
              console.log(`  Processing: ${lead.first_name} ${lead.last_name} - ${lead.phone}`);
              
              // Update lead status to simulate call
              const { error: updateLeadError } = await supabase
                .from('leads')
                .update({
                  call_status: 'calling',
                  updated_at: new Date().toISOString()
                })
                .eq('id', lead.id);
                
              if (!updateLeadError) {
                // Create a call record
                const { data: callRecord, error: callError } = await supabase
                  .from('calls')
                  .insert({
                    organization_id: organizationId,
                    campaign_id: campaign.id,
                    lead_id: lead.id,
                    direction: 'outbound',
                    phone_number: lead.phone,
                    status: 'initiated',
                    started_at: new Date().toISOString(),
                    vapi_call_id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  })
                  .select()
                  .single();
                  
                if (callError) {
                  console.error(`    ❌ Error creating call record: ${callError.message}`);
                } else {
                  console.log(`    ✅ Call initiated: ${callRecord.id}`);
                  
                  // Simulate call completion after 30 seconds
                  setTimeout(async () => {
                    const duration = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
                    const outcomes = ['interested', 'not_interested', 'no_answer', 'voicemail'];
                    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
                    
                    // Update call record
                    await supabase
                      .from('calls')
                      .update({
                        status: 'completed',
                        outcome: outcome,
                        duration: duration,
                        ended_at: new Date().toISOString(),
                        cost: (duration / 60 * 0.15).toFixed(2)
                      })
                      .eq('id', callRecord.id);
                      
                    // Update lead status
                    await supabase
                      .from('leads')
                      .update({
                        call_status: 'completed',
                        status: outcome === 'interested' ? 'qualified' : 'unqualified',
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', lead.id);
                      
                    console.log(`    📊 Call completed: ${outcome} (${duration}s)`);
                  }, 30000);
                }
              }
              
              // Wait 5 seconds between calls
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        }
      }
      
      // Wait 30 seconds before checking again
      console.log('\n⏳ Waiting 30 seconds before next check...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.error('Error in campaign processor:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Campaign Processor shutting down...');
  process.exit(0);
});

console.log('============================================');
console.log('    CAMPAIGN PROCESSOR - SIMULATION MODE');
console.log('============================================');
console.log('This will simulate making calls to test the system.');
console.log('Press Ctrl+C to stop.\n');

processCampaigns();