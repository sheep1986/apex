const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

// This webhook processor should be set up on your backend
// For now, let's create a script that can be run periodically to sync calls

async function processEndedCalls() {
  console.log('🔄 Processing ended calls...');
  
  // Get all calls that are still in "initiated" status
  const { data: pendingCalls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('status', 'initiated');
  
  if (error) {
    console.error('❌ Error fetching pending calls:', error);
    return;
  }
  
  console.log(`📊 Found ${pendingCalls?.length || 0} pending calls to process`);
  
  for (const call of pendingCalls || []) {
    if (!call.vapi_call_id) continue;
    
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
      
      if (!vapiResponse.ok) continue;
      
      const vapiCall = await vapiResponse.json();
      
      // Only process if call has ended
      if (vapiCall.status !== 'ended' && vapiCall.status !== 'completed') {
        console.log(`⏳ Call ${call.id} still in progress (${vapiCall.status})`);
        continue;
      }
      
      console.log(`✅ Processing ended call ${call.id}`);
      
      // Calculate duration
      let duration = vapiCall.duration || 0;
      if (!duration && vapiCall.startedAt && vapiCall.endedAt) {
        const start = new Date(vapiCall.startedAt).getTime();
        const end = new Date(vapiCall.endedAt).getTime();
        duration = Math.floor((end - start) / 1000);
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
          status: 'completed',
          duration: duration,
          cost: vapiCall.cost || 0,
          recording_url: vapiCall.recordingUrl || vapiCall.recording?.url || '',
          transcript: transcript,
          summary: vapiCall.analysis?.summary || '',
          ended_at: vapiCall.endedAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', call.id);
      
      if (updateError) {
        console.error(`❌ Error updating call ${call.id}:`, updateError);
      } else {
        console.log(`✅ Call ${call.id} updated successfully`);
        
        // Update campaign total cost
        if (call.campaign_id) {
          const { data: campaignCalls } = await supabase
            .from('calls')
            .select('cost')
            .eq('campaign_id', call.campaign_id);
          
          const totalCost = campaignCalls?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;
          
          await supabase
            .from('campaigns')
            .update({
              total_cost: totalCost,
              updated_at: new Date().toISOString()
            })
            .eq('id', call.campaign_id);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing call ${call.id}:`, error.message);
    }
  }
  
  console.log('✅ Finished processing ended calls');
}

// Run the processor
processEndedCalls().catch(console.error);

// You can set this up to run periodically
// setInterval(processEndedCalls, 30000); // Every 30 seconds