const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixTestCampaignCorrect() {
  console.log('🔧 FIXING TEST CAMPAIGN (Corrected)');
  console.log('===================================\n');
  
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
  
  console.log(`📋 Working with campaign: ${campaign.name} (${campaign.id})`);
  
  // Step 1: Add test leads (using correct schema)
  console.log('\\n📋 Step 1: Adding test leads...');
  
  const testLeads = [
    { name: 'John Test', phone: '+1555TEST01', email: 'john@test.com' },
    { name: 'Sarah Test', phone: '+1555TEST02', email: 'sarah@test.com' },
    { name: 'Mike Test', phone: '+1555TEST03', email: 'mike@test.com' }
  ];
  
  for (const lead of testLeads) {
    const { error: leadError } = await supabase
      .from('leads')
      .upsert({
        organization_id: campaign.organization_id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: 'Test Company Inc.',
        source: 'manual_test',
        status: 'new',
        priority: 'medium',
        notes: 'Test lead for campaign validation - created ' + new Date().toLocaleDateString(),
        created_at: new Date().toISOString()
      });
    
    if (leadError) {
      console.error(`❌ Error adding lead ${lead.name}:`, leadError);
    } else {
      console.log(`✅ Added lead: ${lead.name} (${lead.phone})`);
    }
  }
  
  // Step 2: Add phone numbers (using minimal schema)
  console.log('\\n📱 Step 2: Adding phone numbers...');
  
  for (const lead of testLeads) {
    const { error: phoneError } = await supabase
      .from('phone_numbers')
      .upsert({
        phone_number: lead.phone,
        organization_id: campaign.organization_id,
        status: 'active',
        created_at: new Date().toISOString()
      });
    
    if (phoneError) {
      console.error(`❌ Error adding phone ${lead.phone}:`, phoneError);
    } else {
      console.log(`✅ Added phone: ${lead.phone}`);
    }
  }
  
  // Step 3: Check campaign automation readiness
  console.log('\\n🚀 Step 3: Checking campaign automation...');
  
  // Verify we have VAPI credentials
  const { data: orgSettings } = await supabase
    .from('organizations')
    .select('vapi_api_key')
    .eq('id', campaign.organization_id)
    .single();
  
  console.log(`VAPI API Key: ${orgSettings?.vapi_api_key ? '✅ Configured' : '❌ Missing'}`);
  
  if (!orgSettings?.vapi_api_key) {
    console.log('\\n⚠️  CRITICAL: VAPI API Key is missing!');
    console.log('Without this, no calls can be made.');
    console.log('Please configure your VAPI API key in the organization settings.');
  }
  
  // Step 4: Update campaign with lead count
  console.log('\\n📊 Step 4: Updating campaign metrics...');
  
  const { error: campaignUpdateError } = await supabase
    .from('campaigns')
    .update({
      total_leads: testLeads.length,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.id);
  
  if (campaignUpdateError) {
    console.error('❌ Error updating campaign:', campaignUpdateError);
  } else {
    console.log('✅ Campaign updated with test data');
  }
  
  // Step 5: Final verification
  console.log('\\n🎯 Step 5: Final campaign verification...');
  
  const { data: finalLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', campaign.organization_id)
    .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute
  
  const { data: finalPhones } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('organization_id', campaign.organization_id)
    .gte('created_at', new Date(Date.now() - 60000).toISOString());
  
  console.log('\\n📈 CAMPAIGN STATUS:');
  console.log(`   ✅ Campaign: ${campaign.name} (Active)`);
  console.log(`   ✅ Test Leads Added: ${finalLeads?.length || 0}`);
  console.log(`   ✅ Phone Numbers: ${finalPhones?.length || 0}`);
  console.log(`   ${orgSettings?.vapi_api_key ? '✅' : '❌'} VAPI Integration`);
  
  console.log('\\n📱 Test Leads:');
  testLeads.forEach((lead, i) => {
    console.log(`   ${i + 1}. ${lead.name} - ${lead.phone}`);
  });
  
  console.log('\\n🚨 NEXT STEPS TO GET CALLS WORKING:');
  console.log('1. ✅ Campaign is active with test leads');
  console.log('2. ⚠️  Need to configure VAPI Assistant ID');
  console.log('3. ⚠️  Need to configure VAPI Phone Number ID'); 
  console.log('4. 🔧 Check if backend automation server is running');
  console.log('5. 📊 Monitor the calls table for activity');
  
  console.log('\\n💡 TIP: For real testing, replace test numbers with actual phone numbers');
  console.log('that can receive calls, and ensure VAPI is fully configured.');
}

fixTestCampaignCorrect();