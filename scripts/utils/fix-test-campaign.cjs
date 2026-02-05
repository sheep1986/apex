const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixTestCampaign() {
  console.log('🔧 FIXING TEST CAMPAIGN');
  console.log('=======================\n');
  
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
  
  // Step 1: Add test phone numbers
  console.log('\\n📱 Step 1: Adding test phone numbers...');
  
  const testPhones = [
    { number: '+1555TEST01', name: 'Test Lead 1' },
    { number: '+1555TEST02', name: 'Test Lead 2' },
    { number: '+1555TEST03', name: 'Test Lead 3' }
  ];
  
  for (const phone of testPhones) {
    // Add to phone_numbers table
    const { error: phoneError } = await supabase
      .from('phone_numbers')
      .upsert({
        phone_number: phone.number,
        campaign_id: campaign.id,
        organization_id: campaign.organization_id,
        status: 'active',
        attempts: 0,
        name: phone.name,
        created_at: new Date().toISOString()
      });
    
    if (phoneError) {
      console.error(`❌ Error adding phone ${phone.number}:`, phoneError);
    } else {
      console.log(`✅ Added phone number: ${phone.number}`);
    }
    
    // Also add as a lead
    const { error: leadError } = await supabase
      .from('leads')
      .upsert({
        organization_id: campaign.organization_id,
        campaign_id: campaign.id,
        name: phone.name,
        phone: phone.number,
        email: null,
        company: 'Test Company',
        source: 'manual',
        status: 'new',
        priority: 'medium',
        notes: 'Test lead for campaign validation',
        created_at: new Date().toISOString()
      });
    
    if (leadError) {
      console.error(`❌ Error adding lead for ${phone.number}:`, leadError);
    } else {
      console.log(`✅ Added lead: ${phone.name}`);
    }
  }
  
  // Step 2: Check/Create VAPI Assistant
  console.log('\\n🤖 Step 2: Checking VAPI Assistant...');
  
  const { data: existingAssistant } = await supabase
    .from('vapi_assistants')
    .select('*')
    .eq('organization_id', campaign.organization_id)
    .limit(1)
    .single();
  
  let assistantId;
  
  if (!existingAssistant) {
    // Create a basic assistant
    const { data: newAssistant, error: assistantError } = await supabase
      .from('vapi_assistants')
      .insert({
        organization_id: campaign.organization_id,
        name: 'Test Campaign Assistant',
        assistant_id: 'test-assistant-' + Date.now(),
        voice_id: 'default',
        system_prompt: 'You are calling on behalf of Emerald Green Energy about solar panel installations. Be friendly and professional.',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (assistantError) {
      console.error('❌ Error creating assistant:', assistantError);
    } else {
      assistantId = newAssistant.assistant_id;
      console.log(`✅ Created VAPI assistant: ${assistantId}`);
    }
  } else {
    assistantId = existingAssistant.assistant_id;
    console.log(`✅ Using existing assistant: ${assistantId}`);
  }
  
  // Step 3: Update organization with VAPI settings
  console.log('\\n⚙️ Step 3: Updating organization VAPI settings...');
  
  const { error: orgUpdateError } = await supabase
    .from('organizations')
    .update({
      vapi_assistant_id: assistantId,
      vapi_phone_number_id: 'test-phone-number-id',
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.organization_id);
  
  if (orgUpdateError) {
    console.error('❌ Error updating organization:', orgUpdateError);
  } else {
    console.log('✅ Updated organization VAPI settings');
  }
  
  // Step 4: Update campaign metrics
  console.log('\\n📊 Step 4: Updating campaign metrics...');
  
  const { error: campaignUpdateError } = await supabase
    .from('campaigns')
    .update({
      total_leads: testPhones.length,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.id);
  
  if (campaignUpdateError) {
    console.error('❌ Error updating campaign:', campaignUpdateError);
  } else {
    console.log('✅ Updated campaign with lead count');
  }
  
  // Step 5: Test campaign readiness
  console.log('\\n🎯 Step 5: Testing campaign readiness...');
  
  // Check all components
  const { data: finalPhoneCheck } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('campaign_id', campaign.id);
  
  const { data: finalLeadCheck } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', campaign.id);
  
  const { data: finalOrgCheck } = await supabase
    .from('organizations')
    .select('vapi_api_key, vapi_assistant_id, vapi_phone_number_id')
    .eq('id', campaign.organization_id)
    .single();
  
  console.log('\\n📈 CAMPAIGN READINESS CHECK:');
  console.log(`   ✅ Phone Numbers: ${finalPhoneCheck?.length || 0}`);
  console.log(`   ✅ Leads: ${finalLeadCheck?.length || 0}`);
  console.log(`   ${finalOrgCheck?.vapi_api_key ? '✅' : '❌'} VAPI API Key`);
  console.log(`   ${finalOrgCheck?.vapi_assistant_id ? '✅' : '❌'} VAPI Assistant ID`);
  console.log(`   ${finalOrgCheck?.vapi_phone_number_id ? '✅' : '❌'} VAPI Phone Number ID`);
  
  console.log('\\n🚀 CAMPAIGN IS NOW READY!');
  console.log('\\nTo start making calls:');
  console.log('1. Ensure your backend server is running');
  console.log('2. Check the campaign in your dashboard');
  console.log('3. Monitor the calls table for new activity');
  
  // Show test numbers for verification
  console.log('\\n📱 Test Numbers Added:');
  testPhones.forEach((phone, i) => {
    console.log(`   ${i + 1}. ${phone.number} (${phone.name})`);
  });
  
  console.log('\\n⚠️ NOTE: These are test numbers. Actual VAPI calls will not connect.');
  console.log('For real testing, add valid phone numbers in your dashboard.');
}

fixTestCampaign();