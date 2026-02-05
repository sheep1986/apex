const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseCampaignIssue() {
  console.log('🔍 CAMPAIGN DIAGNOSTIC REPORT');
  console.log('============================\n');
  
  // 1. Check recent campaigns
  console.log('📊 Recent Campaigns:');
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (campaignError) {
    console.error('❌ Error fetching campaigns:', campaignError);
    return;
  }
  
  if (campaigns.length === 0) {
    console.log('❌ No campaigns found in database');
    return;
  }
  
  console.log(`Found ${campaigns.length} recent campaigns:\n`);
  
  // Check the most recent campaign (likely the test one)
  const testCampaign = campaigns[0];
  console.log(`🎯 MOST RECENT CAMPAIGN (ID: ${testCampaign.id}):`);
  console.log(`   Name: "${testCampaign.name}"`);
  console.log(`   Status: ${testCampaign.status}`);
  console.log(`   Created: ${new Date(testCampaign.created_at).toLocaleString()}`);
  console.log(`   Updated: ${new Date(testCampaign.updated_at).toLocaleString()}`);
  console.log(`   Organization: ${testCampaign.organization_id}`);
  console.log(`   Total Leads: ${testCampaign.total_leads || 0}`);
  console.log(`   Calls Made: ${testCampaign.calls_made || 0}`);
  console.log(`   Calls Completed: ${testCampaign.calls_completed || 0}`);
  
  // 2. Check campaign leads/phone numbers
  console.log('\\n📱 Campaign Phone Numbers/Leads:');
  
  // Check for leads associated with this campaign
  const { data: campaignLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', testCampaign.id);
  
  // Also check phone_numbers table
  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('campaign_id', testCampaign.id);
  
  console.log(`   Associated Leads: ${campaignLeads?.length || 0}`);
  console.log(`   Phone Numbers: ${phoneNumbers?.length || 0}`);
  
  if (phoneNumbers && phoneNumbers.length > 0) {
    console.log('   Phone Number Details:');
    phoneNumbers.slice(0, 3).forEach((phone, i) => {
      console.log(`     ${i + 1}. ${phone.phone_number} (Status: ${phone.status})`);
    });
  }
  
  if (campaignLeads && campaignLeads.length > 0) {
    console.log('   Lead Details:');
    campaignLeads.slice(0, 3).forEach((lead, i) => {
      console.log(`     ${i + 1}. ${lead.name} - ${lead.phone} (Status: ${lead.status})`);
    });
  }
  
  // 3. Check for calls made by this campaign
  console.log('\\n📞 Calls Made by Campaign:');
  const { data: campaignCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', testCampaign.id)
    .order('created_at', { ascending: false });
  
  console.log(`   Total Calls Found: ${campaignCalls?.length || 0}`);
  
  if (campaignCalls && campaignCalls.length > 0) {
    console.log('   Recent Call Details:');
    campaignCalls.slice(0, 3).forEach((call, i) => {
      console.log(`     ${i + 1}. ${call.phone_number} - Status: ${call.status} (${new Date(call.created_at).toLocaleString()})`);
    });
  }
  
  // 4. Check VAPI configuration
  console.log('\\n🤖 VAPI Configuration Check:');
  
  // Check for VAPI assistants
  const { data: assistants } = await supabase
    .from('vapi_assistants')
    .select('*')
    .eq('organization_id', testCampaign.organization_id);
  
  console.log(`   VAPI Assistants: ${assistants?.length || 0}`);
  
  if (assistants && assistants.length > 0) {
    const assistant = assistants[0];
    console.log(`   Active Assistant: ${assistant.name || 'Unnamed'}`);
    console.log(`   Assistant ID: ${assistant.assistant_id}`);
    console.log(`   Status: ${assistant.is_active ? 'Active' : 'Inactive'}`);
  }
  
  // Check organization settings for VAPI keys
  const { data: orgSettings } = await supabase
    .from('organizations')
    .select('vapi_api_key, vapi_assistant_id, vapi_phone_number_id')
    .eq('id', testCampaign.organization_id)
    .single();
  
  if (orgSettings) {
    console.log(`   VAPI API Key: ${orgSettings.vapi_api_key ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VAPI Assistant ID: ${orgSettings.vapi_assistant_id ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VAPI Phone Number ID: ${orgSettings.vapi_phone_number_id ? '✅ Set' : '❌ Missing'}`);
  }
  
  // 5. Check campaign automation status
  console.log('\\n🚀 Campaign Automation Status:');
  
  // Look for any automation logs or processors
  const { data: automationLogs } = await supabase
    .from('webhook_logs')
    .select('*')
    .ilike('data', `%${testCampaign.id}%`)
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log(`   Recent Automation Logs: ${automationLogs?.length || 0}`);
  
  if (automationLogs && automationLogs.length > 0) {
    console.log('   Latest Log Entries:');
    automationLogs.forEach((log, i) => {
      console.log(`     ${i + 1}. ${log.event_type || 'Unknown'} - ${new Date(log.created_at).toLocaleString()}`);
    });
  }
  
  // 6. Generate diagnosis
  console.log('\\n🎯 DIAGNOSIS:');
  
  const issues = [];
  
  if (testCampaign.status !== 'active') {
    issues.push(`Campaign status is "${testCampaign.status}" (should be "active")`);
  }
  
  if (!phoneNumbers || phoneNumbers.length === 0) {
    issues.push('No phone numbers assigned to campaign');
  }
  
  if (!campaignLeads || campaignLeads.length === 0) {
    issues.push('No leads assigned to campaign');
  }
  
  if (!orgSettings?.vapi_api_key) {
    issues.push('VAPI API key not configured');
  }
  
  if (!orgSettings?.vapi_assistant_id) {
    issues.push('VAPI Assistant ID not configured');
  }
  
  if (!orgSettings?.vapi_phone_number_id) {
    issues.push('VAPI Phone Number ID not configured');
  }
  
  if (!assistants || assistants.length === 0) {
    issues.push('No VAPI assistants configured');
  }
  
  if (campaignCalls && campaignCalls.length === 0) {
    issues.push('Campaign automation is not making calls');
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues found - campaign should be working');
  } else {
    console.log('❌ Issues Found:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  // 7. Suggested fixes
  console.log('\\n🔧 SUGGESTED FIXES:');
  
  if (testCampaign.status !== 'active') {
    console.log('   1. Activate the campaign in the dashboard');
  }
  
  if (!phoneNumbers || phoneNumbers.length === 0) {
    console.log('   2. Add phone numbers to the campaign');
  }
  
  if (!orgSettings?.vapi_api_key) {
    console.log('   3. Configure VAPI API key in organization settings');
  }
  
  if (!assistants || assistants.length === 0) {
    console.log('   4. Create and configure VAPI assistant');
  }
  
  console.log('   5. Check backend server is running and processing campaigns');
  console.log('   6. Verify webhook endpoints are accessible');
  
  console.log('\\n📈 Next Steps: Run individual tests to verify each component');
}

diagnoseCampaignIssue();