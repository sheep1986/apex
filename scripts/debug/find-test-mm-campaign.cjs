const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findCampaign() {
  // Find "test mm" campaign
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', 'test mm')
    .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${campaigns?.length || 0} campaigns named "test mm"`);
  
  for (const campaign of campaigns || []) {
    console.log('\n📋 Campaign:', campaign.name);
    console.log('   ID:', campaign.id);
    console.log('   Status:', campaign.status);
    console.log('   Created:', campaign.created_at);
    
    // Get calls for this campaign
    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .eq('campaign_id', campaign.id);
    
    console.log(`   Calls: ${calls?.length || 0}`);
    
    if (calls && calls.length > 0) {
      for (const call of calls) {
        console.log('\n   📞 Call:');
        console.log('      ID:', call.id);
        console.log('      VAPI ID:', call.vapi_call_id);
        console.log('      Status:', call.status);
        console.log('      Duration:', call.duration);
        console.log('      Cost:', call.cost);
      }
    }
    
    // Get leads for this campaign
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaign.id);
    
    console.log(`   Leads: ${leads?.length || 0}`);
  }
}

findCampaign().catch(console.error);