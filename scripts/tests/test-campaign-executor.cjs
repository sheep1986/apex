// Test the campaign executor directly
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function testCampaignExecution() {
  console.log('🧪 Testing campaign execution...\n');
  
  // Get one active campaign
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .limit(1);
    
  if (!campaigns || campaigns.length === 0) {
    console.log('No active campaigns found');
    return;
  }
  
  const campaign = campaigns[0];
  console.log(`Testing with campaign: ${campaign.name} (${campaign.id})`);
  
  // Check for CSV data
  if (!campaign.settings?.csv_data) {
    console.log('❌ No CSV data in campaign settings');
    return;
  }
  
  console.log('✅ Campaign has CSV data');
  
  // Parse CSV
  const lines = campaign.settings.csv_data.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('CSV headers:', headers);
  
  if (lines.length > 1) {
    const firstRow = lines[1].split(',').map(v => v.trim());
    console.log('First contact:', firstRow);
  }
  
  // Check VAPI settings
  console.log('\n📋 VAPI Configuration:');
  console.log('  Assistant ID:', campaign.settings.assistant_id || campaign.assistant_id);
  console.log('  Phone Number ID:', campaign.settings.phone_number_id || campaign.phone_number_id);
  
  // Check organization VAPI credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('vapi_api_key, vapi_settings')
    .eq('id', campaign.organization_id)
    .single();
    
  if (org?.vapi_api_key || org?.vapi_settings) {
    console.log('✅ Organization has VAPI credentials');
  } else {
    console.log('❌ Organization missing VAPI credentials');
  }
  
  // Check call_queue
  const { count: queueCount } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id);
    
  console.log(`\n📊 Call queue status: ${queueCount || 0} items`);
  
  if (queueCount === 0) {
    console.log('\n⚠️ Call queue is empty. The campaign executor should populate it.');
    console.log('This should happen automatically when the backend is running.');
  }
  
  // Check for recent calls
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (recentCalls && recentCalls.length > 0) {
    console.log(`\n📞 Recent calls (${recentCalls.length}):`);
    recentCalls.forEach(call => {
      console.log(`  ${call.customer_phone} - ${call.outcome || 'in_progress'} (${call.created_at})`);
    });
  } else {
    console.log('\n📞 No calls made yet for this campaign');
  }
  
  console.log('\n🔍 Summary:');
  console.log('1. Campaign is active ✅');
  console.log('2. Has CSV data ✅');
  console.log(`3. Has VAPI assistant: ${campaign.settings?.assistant_id ? '✅' : '❌'}`);
  console.log(`4. Has phone number: ${campaign.settings?.phone_number_id ? '✅' : '❌'}`);
  console.log(`5. Organization has VAPI: ${(org?.vapi_api_key || org?.vapi_settings) ? '✅' : '❌'}`);
  console.log(`6. Call queue populated: ${queueCount > 0 ? '✅' : '❌'}`);
  console.log(`7. Calls being made: ${recentCalls?.length > 0 ? '✅' : '❌'}`);
  
  if (queueCount === 0) {
    console.log('\n💡 Next step: Make sure the backend server is running.');
    console.log('The campaign executor will automatically populate the queue and start making calls.');
  }
}

testCampaignExecution().catch(console.error);