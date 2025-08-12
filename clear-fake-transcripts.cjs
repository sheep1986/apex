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

async function clearFakeTranscripts() {
  console.log('🧹 Clearing fake transcripts from database...\n');

  const fakeIndicators = [
    'Hello? Alright.',
    'Is it possible to speak to Harris',
    'Emerald Green Energy',
    'solar energy for your property',
    'This is have you heard this? This is the AR caller thing',
    'Hi, Harris'
  ];

  try {
    // First, find all calls with fake transcripts
    const { data: calls, error: fetchError } = await supabase
      .from('calls')
      .select('id, customer_name, transcript')
      .not('transcript', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching calls:', fetchError);
      return;
    }

    const fakeCalls = calls.filter(call => 
      fakeIndicators.some(indicator => call.transcript?.includes(indicator))
    );

    console.log(`📊 Found ${fakeCalls.length} calls with fake transcripts\n`);

    if (fakeCalls.length === 0) {
      console.log('✅ No fake transcripts found!');
      return;
    }

    // Clear the fake transcripts
    for (const call of fakeCalls) {
      console.log(`🗑️  Clearing fake transcript for call ${call.id} (${call.customer_name})`);
      
      const { error: updateError } = await supabase
        .from('calls')
        .update({ 
          transcript: null,
          summary: null // Also clear summary as it's likely fake too
        })
        .eq('id', call.id);

      if (updateError) {
        console.error(`   ❌ Error clearing call ${call.id}:`, updateError);
      } else {
        console.log(`   ✅ Cleared successfully`);
      }
    }

    console.log(`\n✅ Cleared ${fakeCalls.length} fake transcripts`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. These calls need real transcripts from VAPI`);
    console.log(`   2. The webhook should update them when calls complete`);
    console.log(`   3. Or run a batch job to fetch from VAPI API`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the cleanup
clearFakeTranscripts();