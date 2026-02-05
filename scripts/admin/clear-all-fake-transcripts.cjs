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

async function clearAllFakeTranscripts() {
  console.log('🔍 Finding ALL fake transcripts in database...\n');

  // Comprehensive list of fake indicators
  const fakeIndicators = [
    // Original solar script indicators
    'Hello? Alright.',
    'Is it possible to speak to Harris',
    'Emerald Green Energy',
    'solar energy for your property',
    'This is have you heard this? This is the AR caller thing',
    'Hi, Harris',
    'Roadwood Drive',
    'solar consultation',
    
    // Apex AI test script indicators
    'Sarah from Apex AI',
    'Hi Sean! This is Sarah from Apex AI',
    'interest in our AI voice calling platform',
    'AI voice calling platform',
    'Apex AI',
    'calling to follow up on your interest',
    
    // Other test/demo indicators
    'This is a test call',
    'demo call',
    'test transcript',
    'mock call',
    'sample transcript'
  ];

  try {
    // Get ALL calls with transcripts
    const { data: calls, error: fetchError } = await supabase
      .from('calls')
      .select('id, customer_name, transcript, vapi_call_id, created_at')
      .not('transcript', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching calls:', fetchError);
      return;
    }

    console.log(`📊 Total calls with transcripts: ${calls.length}\n`);

    // Check each transcript
    const fakeCalls = [];
    for (const call of calls) {
      const transcript = call.transcript || '';
      const transcriptLower = transcript.toLowerCase();
      
      // Check for any fake indicators
      const isFake = fakeIndicators.some(indicator => 
        transcriptLower.includes(indicator.toLowerCase())
      );
      
      if (isFake) {
        fakeCalls.push(call);
        console.log(`❌ FAKE: Call ${call.id}`);
        console.log(`   Customer: ${call.customer_name || 'Unknown'}`);
        console.log(`   Created: ${new Date(call.created_at).toLocaleString()}`);
        console.log(`   VAPI ID: ${call.vapi_call_id || 'None'}`);
        console.log(`   Preview: ${transcript.substring(0, 150).replace(/\n/g, ' ')}...`);
        console.log('');
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total transcripts: ${calls.length}`);
    console.log(`   Fake transcripts: ${fakeCalls.length}`);
    console.log(`   Real transcripts: ${calls.length - fakeCalls.length}`);

    if (fakeCalls.length > 0) {
      console.log(`\n🗑️  Clearing ${fakeCalls.length} fake transcripts...`);
      
      // Clear all fake transcripts
      for (const call of fakeCalls) {
        const { error: updateError } = await supabase
          .from('calls')
          .update({ 
            transcript: null,
            summary: null
          })
          .eq('id', call.id);

        if (updateError) {
          console.error(`❌ Error clearing call ${call.id}:`, updateError);
        }
      }
      
      console.log(`\n✅ Cleared ${fakeCalls.length} fake transcripts!`);
      
      // Show which calls have VAPI IDs for re-fetching
      const callsWithVapi = fakeCalls.filter(c => c.vapi_call_id);
      if (callsWithVapi.length > 0) {
        console.log(`\n💡 ${callsWithVapi.length} calls have VAPI IDs and can be re-fetched:`);
        console.log(`   Run: node fetch-vapi-transcripts.cjs`);
      }
    } else {
      console.log(`\n✅ No fake transcripts found!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the cleanup
clearAllFakeTranscripts();