const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCallStatus() {
  // Get the call for this campaign
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', '372fa470-8c48-43f8-95f2-91b62e2972b9');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${calls?.length || 0} calls for campaign "test mm"`);
  
  for (const call of calls || []) {
    console.log('\n📞 Call Details:');
    console.log('   ID:', call.id);
    console.log('   VAPI Call ID:', call.vapi_call_id);
    console.log('   Status:', call.status);
    console.log('   Duration:', call.duration, 'seconds');
    console.log('   Cost: $', call.cost);
    console.log('   Phone:', call.phone_number);
    console.log('   Created:', call.created_at);
    console.log('   Recording URL:', call.recording_url || 'None');
    console.log('   Transcript:', call.transcript ? 'Yes' : 'No');
  }
}

checkCallStatus().catch(console.error);