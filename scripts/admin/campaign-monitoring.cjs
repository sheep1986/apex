const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function monitorCampaign() {
  console.log('📊 CAMPAIGN MONITORING & TROUBLESHOOTING');
  console.log('========================================\n');
  
  // Get the test campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', 'Test')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!campaign) {
    console.log('❌ Test campaign not found');
    return;
  }
  
  console.log(`🎯 Monitoring Campaign: ${campaign.name}`);
  console.log(`   ID: ${campaign.id}`);
  console.log(`   Status: ${campaign.status}`);
  console.log(`   Organization: ${campaign.organization_id}`);
  
  // Check what's needed for the campaign to work
  console.log('\\n🔍 CAMPAIGN REQUIREMENTS CHECK:\\n');
  
  // 1. Check existing leads for this organization
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', campaign.organization_id);
  
  console.log(`📋 Existing Leads in Organization: ${existingLeads?.length || 0}`);
  
  if (existingLeads && existingLeads.length > 0) {
    console.log('   Sample leads:');
    existingLeads.slice(0, 3).forEach((lead, i) => {
      console.log(`     ${i + 1}. ${lead.name} - ${lead.phone} (${lead.status})`);
    });
    
    console.log('\\n💡 SOLUTION: Use existing leads for your test campaign!');
    console.log('   These leads are already in your organization and can be called.');
  }
  
  // 2. Check VAPI configuration
  console.log('\\n🤖 VAPI Configuration:');
  const { data: orgSettings } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', campaign.organization_id)
    .single();
  
  if (orgSettings) {
    console.log(`   ✅ VAPI API Key: ${orgSettings.vapi_api_key ? 'Configured' : 'Missing'}`);
    console.log(`   ${orgSettings.vapi_assistant_id ? '✅' : '❌'} Assistant ID: ${orgSettings.vapi_assistant_id || 'Not set'}`);
    console.log(`   ${orgSettings.vapi_phone_number_id ? '✅' : '❌'} Phone Number ID: ${orgSettings.vapi_phone_number_id || 'Not set'}`);
  }
  
  // 3. Check recent calls to see if system is working
  console.log('\\n📞 Recent Call Activity:');
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('organization_id', campaign.organization_id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log(`   Recent calls: ${recentCalls?.length || 0}`);
  
  if (recentCalls && recentCalls.length > 0) {
    console.log('   Latest call activity:');
    recentCalls.forEach((call, i) => {
      console.log(`     ${i + 1}. ${call.phone_number} - ${call.status} (${new Date(call.created_at).toLocaleString()})`);
    });
    console.log('\\n   ✅ System IS making calls - check campaign assignment');
  } else {
    console.log('   ❌ No recent calls found');
    console.log('\\n   Possible issues:');
    console.log('     1. Backend automation server not running');
    console.log('     2. VAPI integration not configured');
    console.log('     3. No leads assigned to campaigns');
    console.log('     4. Campaign processor not active');
  }
  
  // 4. Check webhook logs for automation
  console.log('\\n🔄 Automation Activity:');
  const { data: webhookLogs } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log(`   Recent webhook activity: ${webhookLogs?.length || 0}`);
  
  if (webhookLogs && webhookLogs.length > 0) {
    webhookLogs.forEach((log, i) => {
      console.log(`     ${i + 1}. ${log.event_type || 'Unknown'} - ${new Date(log.created_at).toLocaleString()}`);
    });
  }
  
  // 5. Provide specific solutions
  console.log('\\n🎯 SPECIFIC SOLUTIONS FOR YOUR TEST CAMPAIGN:\\n');
  
  if (existingLeads && existingLeads.length > 0) {
    console.log('✅ IMMEDIATE FIX: Use your existing leads');
    console.log('   1. Go to your campaign dashboard');
    console.log('   2. Edit the "Test" campaign'); 
    console.log('   3. Add some of your existing leads to the campaign');
    console.log('   4. Save and activate the campaign');
    console.log('');
  }
  
  if (!orgSettings?.vapi_assistant_id || !orgSettings?.vapi_phone_number_id) {
    console.log('⚠️  REQUIRED: Complete VAPI setup');
    console.log('   1. Go to Organization Settings');
    console.log('   2. Configure VAPI Assistant ID');
    console.log('   3. Configure VAPI Phone Number ID');
    console.log('   4. These come from your VAPI dashboard');
    console.log('');
  }
  
  console.log('🚀 START CAMPAIGN PROCESSOR:');
  console.log('   Run this command to start making calls:');
  console.log('   npm run start:campaign-processor');
  console.log('');
  
  console.log('📊 MONITOR PROGRESS:');
  console.log('   Watch the calls table for new activity:');
  console.log('   SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;');
  
  console.log('\\n💡 For immediate testing with real calls:');
  console.log('   1. Add 1-2 of your actual phone numbers to existing leads');
  console.log('   2. Assign those leads to the Test campaign');
  console.log('   3. Make sure VAPI is fully configured');
  console.log('   4. Start the campaign processor');
  console.log('   5. Monitor the dashboard for call activity');
}

monitorCampaign();