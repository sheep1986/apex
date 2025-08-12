const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../apps/backend/.env' });

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in backend/.env');
  process.exit(1);
}

async function fetchVAPITranscripts() {
  console.log('🔄 Fetching missing transcripts from VAPI...\n');

  try {
    // Get calls without transcripts but with VAPI call IDs
    const { data: calls, error } = await supabase
      .from('calls')
      .select('id, vapi_call_id, customer_name, organization_id, created_at')
      .is('transcript', null)
      .not('vapi_call_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching calls:', error);
      return;
    }

    console.log(`📊 Found ${calls.length} calls missing transcripts with VAPI IDs\n`);

    if (calls.length === 0) {
      console.log('✅ No calls need transcript updates!');
      return;
    }

    // Group calls by organization to use the right API key
    const callsByOrg = {};
    for (const call of calls) {
      if (!callsByOrg[call.organization_id]) {
        callsByOrg[call.organization_id] = [];
      }
      callsByOrg[call.organization_id].push(call);
    }

    // Process each organization's calls
    for (const [orgId, orgCalls] of Object.entries(callsByOrg)) {
      console.log(`\n🏢 Processing organization ${orgId}:`);
      
      // Get organization's VAPI keys
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name, vapi_private_key')
        .eq('id', orgId)
        .single();

      if (orgError || !org?.vapi_private_key) {
        console.log(`   ⚠️  No VAPI key found for this organization, skipping...`);
        continue;
      }

      console.log(`   Organization: ${org.name}`);
      console.log(`   Processing ${orgCalls.length} calls...`);

      // Fetch transcript for each call
      for (const call of orgCalls) {
        console.log(`\n   📞 Call ${call.id} (${call.customer_name}):`);
        console.log(`      VAPI ID: ${call.vapi_call_id}`);
        
        try {
          // Call VAPI API to get call details
          const response = await fetch(`https://api.vapi.ai/call/${call.vapi_call_id}`, {
            headers: {
              'Authorization': `Bearer ${org.vapi_private_key}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.log(`      ❌ VAPI API error: ${response.status} ${response.statusText}`);
            continue;
          }

          const vapiData = await response.json();
          
          if (vapiData.transcript) {
            console.log(`      ✅ Found transcript! Length: ${vapiData.transcript.length} chars`);
            console.log(`      📝 Preview: ${vapiData.transcript.substring(0, 100)}...`);
            
            // Update the call with the transcript
            const { error: updateError } = await supabase
              .from('calls')
              .update({ 
                transcript: vapiData.transcript,
                summary: vapiData.summary || null,
                recording_url: vapiData.recordingUrl || vapiData.recording?.url || null,
                duration: vapiData.endedAt && vapiData.startedAt ? 
                  Math.round((new Date(vapiData.endedAt) - new Date(vapiData.startedAt)) / 1000) : null,
                cost: vapiData.cost?.total || null
              })
              .eq('id', call.id);

            if (updateError) {
              console.log(`      ❌ Error updating call:`, updateError);
            } else {
              console.log(`      ✅ Updated successfully!`);
            }
          } else {
            console.log(`      ⚠️  No transcript found in VAPI response`);
          }
        } catch (apiError) {
          console.log(`      ❌ Error fetching from VAPI:`, apiError.message);
        }
      }
    }

    console.log(`\n✅ Transcript fetch complete!`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fetch
fetchVAPITranscripts();