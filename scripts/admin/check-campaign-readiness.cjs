// Check if campaigns are ready to make calls
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkCampaignReadiness() {
  console.log('🔍 Checking Campaign Readiness for Calls\n');
  console.log('=' .repeat(50));
  
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // 1. Check campaigns
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active');
    
  if (campaignError) {
    console.error('❌ Error fetching campaigns:', campaignError);
    return;
  }
  
  console.log(`\n📊 Found ${campaigns?.length || 0} active campaigns\n`);
  
  // 2. Check each campaign for readiness
  for (const campaign of campaigns || []) {
    console.log(`\n📌 Campaign: ${campaign.name} (${campaign.id})`);
    console.log('-'.repeat(40));
    
    // Check settings
    const settings = campaign.settings || {};
    console.log('  Assistant ID:', settings.assistant_id || '❌ MISSING');
    console.log('  Phone Number ID:', settings.phone_number_id || '❌ MISSING');
    
    // Check for leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, call_status')
      .eq('campaign_id', campaign.id);
      
    if (leadsError) {
      console.log('  ❌ Error fetching leads:', leadsError.message);
    } else {
      console.log(`  Total leads: ${leads?.length || 0}`);
      
      if (leads && leads.length > 0) {
        const pendingLeads = leads.filter(l => l.call_status === 'pending' || !l.call_status);
        const callingLeads = leads.filter(l => l.call_status === 'calling');
        const completedLeads = leads.filter(l => l.call_status === 'completed');
        
        console.log(`    - Pending: ${pendingLeads.length}`);
        console.log(`    - In Progress: ${callingLeads.length}`);
        console.log(`    - Completed: ${completedLeads.length}`);
        
        // Show first few pending leads
        if (pendingLeads.length > 0) {
          console.log('\n  📞 Ready to call:');
          pendingLeads.slice(0, 3).forEach(lead => {
            console.log(`    - ${lead.first_name} ${lead.last_name}: ${lead.phone}`);
          });
        }
      }
    }
    
    // Check if campaign is ready
    const isReady = settings.assistant_id && settings.phone_number_id && leads?.length > 0;
    console.log(`\n  Status: ${isReady ? '✅ READY TO CALL' : '❌ NOT READY'}`);
    
    if (!isReady) {
      console.log('\n  Missing requirements:');
      if (!settings.assistant_id) console.log('    - Need to set Assistant ID');
      if (!settings.phone_number_id) console.log('    - Need to set Phone Number ID');
      if (!leads?.length) console.log('    - Need to add leads');
    }
  }
  
  // 3. Check VAPI credentials
  console.log('\n' + '='.repeat(50));
  console.log('📱 VAPI Configuration Check\n');
  
  const { data: org } = await supabase
    .from('organizations')
    .select('vapi_private_key, vapi_public_key, settings')
    .eq('id', organizationId)
    .single();
    
  const hasVapiKey = org?.vapi_private_key || org?.settings?.vapi?.privateKey;
  console.log(`VAPI API Key: ${hasVapiKey ? '✅ Configured' : '❌ MISSING'}`);
  
  // 4. Check phone numbers
  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active');
    
  console.log(`Phone Numbers: ${phoneNumbers?.length || 0} available`);
  phoneNumbers?.forEach(p => {
    console.log(`  - ${p.phone_number || p.number} (${p.provider || 'vapi'})`);
  });
  
  // 5. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY\n');
  
  const readyCampaigns = campaigns?.filter(c => {
    const hasConfig = c.settings?.assistant_id && c.settings?.phone_number_id;
    return hasConfig;
  }) || [];
  
  if (hasVapiKey && readyCampaigns.length > 0) {
    console.log('✅ System is ready to make calls!');
    console.log(`   ${readyCampaigns.length} campaigns configured`);
    console.log('\n🚀 To start making calls, run:');
    console.log('   node scripts/vapi-calls/call-new-campaign.cjs');
  } else {
    console.log('❌ System not ready for calls');
    if (!hasVapiKey) {
      console.log('\n1. Add VAPI API key to organization settings');
    }
    if (readyCampaigns.length === 0) {
      console.log('\n2. Configure campaigns with:');
      console.log('   - Assistant ID from VAPI dashboard');
      console.log('   - Phone Number ID from VAPI dashboard');
      console.log('   - Add leads with phone numbers');
    }
  }
}

checkCampaignReadiness();