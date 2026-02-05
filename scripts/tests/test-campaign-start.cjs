// Test starting a campaign directly via the API
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function testCampaignStart() {
  console.log('🚀 TESTING CAMPAIGN START FUNCTIONALITY\n');
  console.log('=' .repeat(60));
  
  // 1. Find a campaign with assistant_id and phone_number_id
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .not('assistant_id', 'is', null)
    .not('phone_number_id', 'is', null)
    .limit(1);
    
  if (!campaigns || campaigns.length === 0) {
    console.log('❌ No campaigns found with both assistant_id and phone_number_id');
    console.log('\nLet\'s update a campaign to have these IDs...\n');
    
    // Get the first campaign and update it
    const { data: allCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
      
    if (allCampaigns && allCampaigns.length > 0) {
      const campaign = allCampaigns[0];
      console.log(`Updating campaign: ${campaign.name} (${campaign.id})`);
      
      // Use the IDs from our VAPI test
      const assistantId = '78625bd9-37bf-4f27-9c09-fb6b96cae394'; // Jah's Jamaican Cuisine
      const phoneNumberId = '97147f92-cfe3-43ca-a50d-8249614efb88'; // +14056973432
      
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          assistant_id: assistantId,
          phone_number_id: phoneNumberId
        })
        .eq('id', campaign.id);
        
      if (updateError) {
        console.error('Error updating campaign:', updateError);
        return;
      }
      
      console.log('✅ Campaign updated with VAPI IDs');
      
      // Now test with this campaign
      await testStartingCampaign(campaign.id, campaign.name);
    }
  } else {
    const campaign = campaigns[0];
    console.log(`Found configured campaign: ${campaign.name}`);
    await testStartingCampaign(campaign.id, campaign.name);
  }
}

async function testStartingCampaign(campaignId, campaignName) {
  console.log('\n' + '=' .repeat(60));
  console.log(`📞 TESTING CAMPAIGN START: ${campaignName}`);
  console.log('=' .repeat(60));
  
  // Check if campaign has leads
  const { data: leads, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId);
    
  console.log(`\nCampaign has ${count || 0} leads`);
  
  if (!count || count === 0) {
    console.log('\n⚠️  Campaign has no leads! Adding a test lead...');
    
    // Add a test lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        campaign_id: campaignId,
        organization_id: '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
        first_name: 'Test',
        last_name: 'Lead',
        phone: '+14155551234', // Test number
        email: 'test@example.com',
        status: 'new'
      })
      .select()
      .single();
      
    if (leadError) {
      console.error('Error creating lead:', leadError);
    } else {
      console.log('✅ Test lead created');
    }
  }
  
  // Now try to start the campaign via API
  console.log('\n📡 Calling campaign start endpoint...');
  console.log('URL: /api/vapi-outbound/campaigns/' + campaignId + '/start');
  
  try {
    // First, we need to get a valid auth token
    // For testing, we'll call the backend directly
    const backendUrl = 'https://apex-backend-vercel-alh0xjd6q-seans-projects-aabd20b2.vercel.app';
    
    console.log('\nTrying direct backend call...');
    const response = await axios.post(
      `${backendUrl}/api/vapi-outbound/campaigns/${campaignId}/start`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          // We need a valid Clerk token here
          // For now, let's check what happens without auth
        }
      }
    );
    
    console.log('✅ Campaign start response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.statusText);
      console.error('Response:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n⚠️  Authentication required. The endpoint needs a valid user token.');
        console.log('\n💡 This is why campaigns aren\'t starting from the UI!');
        console.log('   The UI might not be sending the auth token correctly.');
      }
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  // Let's also check what the startCampaign function would do
  console.log('\n\n📋 CAMPAIGN START FLOW:');
  console.log('-' .repeat(60));
  console.log('When a campaign starts, it should:');
  console.log('1. Update campaign status to "active"');
  console.log('2. Get all leads for the campaign');
  console.log('3. For each lead with status "new" or "pending":');
  console.log('   - Call makeCall() with lead data');
  console.log('   - makeCall() sends request to VAPI API');
  console.log('   - VAPI initiates the phone call');
  console.log('4. Update lead status to "called"');
  console.log('5. Wait for webhook callbacks from VAPI');
  
  console.log('\n🔍 Let\'s check the browser console for errors:');
  console.log('-' .repeat(60));
  console.log('1. Open the campaign page');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Click "Start Campaign"');
  console.log('5. Look for the /api/vapi-outbound/campaigns/*/start request');
  console.log('6. Check if it\'s returning 200 OK or an error');
  console.log('7. Check the Console tab for any JavaScript errors');
  
  console.log('\n' + '=' .repeat(60));
}

testCampaignStart();