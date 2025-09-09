const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTest1111Call() {
  console.log('🔄 Syncing call for test 1111 campaign...');
  
  // Get the call that needs syncing
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('id', 'fff2a611-78af-4906-b6cb-6e25d03259d2');
  
  if (error) {
    console.error('❌ Error fetching call:', error);
    return;
  }
  
  if (!calls || calls.length === 0) {
    console.log('❌ Call not found');
    return;
  }
  
  const call = calls[0];
  console.log('📞 Found call:', {
    id: call.id,
    vapi_call_id: call.vapi_call_id,
    status: call.status,
    duration: call.duration
  });
  
  if (!call.vapi_call_id) {
    console.log('⚠️ No VAPI call ID, cannot sync');
    return;
  }
  
  try {
    // Fetch call details from VAPI
    const vapiApiKey = 'da8956d4-0508-474e-bd96-7eda82d2d943';
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
    console.log('✅ VAPI Response:', {
      status: vapiCall.status,
      duration: vapiCall.duration,
      cost: vapiCall.cost,
      endedAt: vapiCall.endedAt,
      startedAt: vapiCall.startedAt
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
    
    // Extract transcript
    let transcript = '';
    if (vapiCall.transcript) {
      transcript = vapiCall.transcript;
    } else if (vapiCall.messages && Array.isArray(vapiCall.messages)) {
      transcript = vapiCall.messages
        .map(msg => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content || msg.message || ''}`)
        .join('\n');
    }
    
    // Update call with VAPI data
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: mappedStatus,
        duration: duration,
        cost: vapiCall.cost || 0,
        recording_url: vapiCall.recordingUrl || vapiCall.recording?.url || vapiCall.artifact?.recordingUrl || '',
        transcript: transcript,
        summary: vapiCall.analysis?.summary || vapiCall.summary || '',
        ended_at: vapiCall.endedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', call.id);
    
    if (updateError) {
      console.error('❌ Error updating call:', updateError);
    } else {
      console.log('✅ Call updated successfully');
      console.log('   Status:', mappedStatus);
      console.log('   Duration:', duration, 'seconds');
      console.log('   Cost: $', vapiCall.cost || 0);
    }
    
  } catch (apiError) {
    console.error('❌ Error fetching from VAPI:', apiError.message);
    
    // If VAPI call is not found or in progress, update status based on time
    const callAge = Date.now() - new Date(call.created_at).getTime();
    if (callAge > 60000) { // If call is older than 1 minute
      console.log('⏰ Call is old, marking as completed...');
      
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          status: 'completed',
          duration: 0,
          cost: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', call.id);
      
      if (!updateError) {
        console.log('✅ Call marked as completed');
      }
    }
  }
  
  // Update campaign total cost
  const campaignId = '5e142c0b-66bb-4f41-ae5f-8977892c1c63';
  const { data: campaignCalls } = await supabase
    .from('calls')
    .select('cost')
    .eq('campaign_id', campaignId);
  
  const totalCost = campaignCalls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  console.log(`\n💰 Total campaign cost: $${totalCost.toFixed(2)}`);
  
  await supabase
    .from('campaigns')
    .update({
      total_cost: totalCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);
}

syncTest1111Call().catch(console.error);