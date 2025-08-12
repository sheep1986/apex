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

async function checkAndFixTranscripts() {
  console.log('🔍 Checking for fake transcripts in database...\n');

  try {
    // Get all calls with transcripts
    const { data: calls, error } = await supabase
      .from('calls')
      .select('id, customer_name, transcript, vapi_call_id, created_at')
      .not('transcript', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching calls:', error);
      return;
    }

    console.log(`📊 Found ${calls.length} calls with transcripts\n`);

    // Check each transcript for signs it's fake/mock
    const fakeIndicators = [
      'Hello? Alright.',
      'Is it possible to speak to Harris',
      'Emerald Green Energy',
      'solar energy for your property',
      'This is have you heard this? This is the AR caller thing',
      'Hi, Harris'
    ];

    for (const call of calls) {
      const isFake = fakeIndicators.some(indicator => 
        call.transcript?.includes(indicator)
      );

      console.log(`\n📞 Call ID: ${call.id}`);
      console.log(`👤 Customer: ${call.customer_name}`);
      console.log(`📅 Created: ${new Date(call.created_at).toLocaleString()}`);
      console.log(`🆔 VAPI Call ID: ${call.vapi_call_id || 'N/A'}`);
      
      if (isFake) {
        console.log(`⚠️  STATUS: FAKE TRANSCRIPT DETECTED`);
        console.log(`📝 Transcript preview: ${call.transcript.substring(0, 100)}...`);
        
        // If we have a VAPI call ID, we could fetch the real transcript
        if (call.vapi_call_id) {
          console.log(`💡 This call has a VAPI ID and could be updated with real data`);
        }
      } else {
        console.log(`✅ STATUS: Appears to be real transcript`);
        console.log(`📝 Transcript preview: ${call.transcript.substring(0, 100)}...`);
      }
    }

    // Count fake vs real
    const fakeCount = calls.filter(call => 
      fakeIndicators.some(indicator => call.transcript?.includes(indicator))
    ).length;

    console.log(`\n📊 Summary:`);
    console.log(`   - Total calls with transcripts: ${calls.length}`);
    console.log(`   - Fake transcripts: ${fakeCount}`);
    console.log(`   - Real transcripts: ${calls.length - fakeCount}`);

    // Offer to clear fake transcripts
    if (fakeCount > 0) {
      console.log(`\n⚠️  Found ${fakeCount} fake transcripts in the database.`);
      console.log(`   These appear to be test data that should be removed.`);
      console.log(`\n   To clear fake transcripts, run:`);
      console.log(`   node clear-fake-transcripts.js`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkAndFixTranscripts();