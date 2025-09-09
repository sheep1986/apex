const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncVapiCallData() {
  console.log('🔄 Fetching calls with initiated status to sync with VAPI...');
  
  // Get calls that need syncing (initiated status or duration = 0)
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', '372fa470-8c48-43f8-95f2-91b62e2972b9')
    .or('status.eq.initiated,duration.eq.0');
  
  if (error) {
    console.error('❌ Error fetching calls:', error);
    return;
  }
  
  console.log(`📊 Found ${calls?.length || 0} calls to sync`);
  
  for (const call of calls || []) {
    console.log(`\n📞 Syncing call ${call.id}`);
    console.log(`   VAPI Call ID: ${call.vapi_call_id}`);
    
    if (!call.vapi_call_id) {
      console.log('   ⚠️ No VAPI call ID, skipping...');
      continue;
    }
    
    try {
      // Fetch call details from VAPI
      const vapiApiKey = 'da8956d4-0508-474e-bd96-7eda82d2d943'; // Organization's VAPI key
      const vapiResponse = await fetch(
        `https://api.vapi.ai/call/${call.vapi_call_id}`,
        {
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!vapiResponse.ok) {
        throw new Error(`VAPI API error: ${vapiResponse.status} ${vapiResponse.statusText}`);
      }
      
      const vapiCall = await vapiResponse.json();
      console.log('   ✅ VAPI Response:', {
        status: vapiCall.status,
        duration: vapiCall.duration,
        cost: vapiCall.cost,
        endedAt: vapiCall.endedAt
      });
      
      // Map VAPI status to our database status
      let mappedStatus = 'completed';
      if (vapiCall.status === 'ended' || vapiCall.status === 'completed') {
        mappedStatus = 'completed';
      } else if (vapiCall.status === 'failed') {
        mappedStatus = 'failed';
      } else if (vapiCall.status === 'in-progress' || vapiCall.status === 'queued') {
        mappedStatus = 'initiated';
      }
      
      // Calculate duration from startedAt and endedAt if not provided
      let duration = vapiCall.duration || 0;
      if (!duration && vapiCall.startedAt && vapiCall.endedAt) {
        const start = new Date(vapiCall.startedAt).getTime();
        const end = new Date(vapiCall.endedAt).getTime();
        duration = Math.floor((end - start) / 1000); // Convert to seconds
      }
      
      // Update call with VAPI data
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          status: mappedStatus,
          duration: duration,
          cost: vapiCall.cost || 0,
          recording_url: vapiCall.recordingUrl || vapiCall.recording?.url || vapiCall.artifact?.recordingUrl || '',
          transcript: vapiCall.transcript || vapiCall.messages?.map((m) => `${m.role}: ${m.message}`).join('\n') || '',
          summary: vapiCall.analysis?.summary || vapiCall.summary || '',
          ended_at: vapiCall.endedAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', call.id);
      
      if (updateError) {
        console.error('   ❌ Error updating call:', updateError);
      } else {
        console.log('   ✅ Call updated successfully');
      }
      
    } catch (apiError) {
      console.error('   ❌ Error fetching from VAPI:', apiError.message);
      if (apiError.response) {
        console.error('   Response:', apiError.response.data);
      }
    }
  }
  
  // Calculate total cost for the campaign
  const { data: updatedCalls } = await supabase
    .from('calls')
    .select('cost')
    .eq('campaign_id', '372fa470-8c48-43f8-95f2-91b62e2972b9');
  
  const totalCost = updatedCalls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  console.log(`\n💰 Total campaign cost: $${totalCost.toFixed(2)}`);
  
  // Update campaign with total cost
  const { error: campaignError } = await supabase
    .from('campaigns')
    .update({
      total_cost: totalCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', '372fa470-8c48-43f8-95f2-91b62e2972b9');
  
  if (campaignError) {
    console.error('❌ Error updating campaign cost:', campaignError);
  } else {
    console.log('✅ Campaign total cost updated');
  }
}

syncVapiCallData().catch(console.error);