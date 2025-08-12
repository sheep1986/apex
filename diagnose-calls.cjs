#!/usr/bin/env node

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'test-token-agency_admin';

async function diagnoseCalls() {
  console.log('🔍 Diagnosing why calls are not being made...\n');

  try {
    // Step 1: Get all campaigns
    console.log('📋 Step 1: Fetching campaigns...');
    const campaignsResponse = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const campaigns = campaignsResponse.data.campaigns;
    console.log(`Found ${campaigns.length} campaigns\n`);

    if (campaigns.length === 0) {
      console.log('❌ No campaigns found!');
      return;
    }

    // Check each campaign
    for (const campaign of campaigns) {
      console.log(`\n🎯 Campaign: ${campaign.name} (${campaign.id})`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Total Leads: ${campaign.totalLeads || 0}`);
      console.log(`   Calls Completed: ${campaign.callsCompleted || 0}`);

      // Step 2: Check campaign details
      try {
        const detailsResponse = await axios.get(
          `${API_BASE_URL}/vapi-outbound/campaigns/${campaign.id}`,
          {
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`
            }
          }
        );

        const details = detailsResponse.data.campaign;
        console.log(`   Has VAPI Credentials: ${details.hasVAPICredentials ? 'Yes' : 'No'}`);
        console.log(`   Assistant ID: ${details.assistantId || 'None'}`);
        console.log(`   Phone Number ID: ${details.phoneNumberId || 'None'}`);

        // Step 3: Check leads in different tables
        console.log('\n   📊 Checking for leads:');
        
        // Check campaign_contacts
        console.log('   - Checking campaign_contacts table...');
        // This would need a direct database query
        
        // Check leads table
        console.log('   - Checking leads table...');
        // This would need a direct database query

        // Step 4: Try to start the campaign if it's not active
        if (campaign.status !== 'active') {
          console.log('\n   ⚠️ Campaign is not active. Attempting to start...');
          
          try {
            const startResponse = await axios.post(
              `${API_BASE_URL}/vapi-outbound/campaigns/${campaign.id}/start`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${AUTH_TOKEN}`
                }
              }
            );
            console.log('   ✅ Campaign start response:', startResponse.data);
          } catch (startError) {
            console.log('   ❌ Error starting campaign:', startError.response?.data?.message || startError.message);
          }
        } else {
          console.log('   ✅ Campaign is active');
          
          // Check why no calls are being made
          console.log('\n   🔍 Checking call execution:');
          
          // Check automation status
          try {
            const automationResponse = await axios.get(
              `${API_BASE_URL}/campaign-automation/${campaign.id}/status`,
              {
                headers: {
                  'Authorization': `Bearer ${AUTH_TOKEN}`
                }
              }
            );
            console.log('   Automation status:', automationResponse.data);
          } catch (e) {
            console.log('   ⚠️ Campaign automation endpoint not available');
          }
        }

      } catch (error) {
        console.log(`   ❌ Error getting campaign details: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 5: Check VAPI configuration
    console.log('\n\n📋 Step 5: Checking VAPI configuration...');
    
    // Check for assistants
    try {
      const assistantsResponse = await axios.get(
        `${API_BASE_URL}/vapi-data/assistants`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      console.log(`✅ Found ${assistantsResponse.data.assistants?.length || 0} VAPI assistants`);
    } catch (error) {
      console.log('❌ Error fetching assistants:', error.response?.data?.message || error.message);
    }

    // Check for phone numbers
    try {
      const phoneResponse = await axios.get(
        `${API_BASE_URL}/vapi-data/phone-numbers`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      console.log(`✅ Found ${phoneResponse.data.phoneNumbers?.length || 0} VAPI phone numbers`);
    } catch (error) {
      console.log('❌ Error fetching phone numbers:', error.response?.data?.message || error.message);
    }

    console.log('\n\n🎯 Summary of issues preventing calls:');
    console.log('1. Check if campaign has leads uploaded');
    console.log('2. Check if VAPI credentials are configured in the organization');
    console.log('3. Check if campaign is in "active" status');
    console.log('4. Check if leads were copied from campaign_contacts to leads table');
    console.log('5. Check if the campaign automation service is running');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

// Run the diagnosis
diagnoseCalls();