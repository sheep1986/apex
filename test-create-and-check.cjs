#!/usr/bin/env node

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'test-token-agency_admin'; // Dev auth token

async function testCreateAndCheck() {
  try {
    console.log('🚀 Creating a test campaign...\n');

    // Step 1: Create campaign
    const testCampaign = {
      name: 'Test Campaign ' + new Date().toISOString(),
      description: 'Testing campaign creation',
      assistantId: 'test-assistant-1',
      phoneNumberId: 'test-phone-1',
      phoneNumber: '+447526126716',
      sendTiming: 'later', // Don't auto-start
      csvData: 'firstName,lastName,phone,email,company\nTest,User,447526126716,test@example.com,Test Corp'
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/vapi-outbound/campaigns`,
      testCampaign,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const campaign = createResponse.data.campaign;
    console.log('✅ Campaign created:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      organizationId: campaign.organizationId
    });

    // Step 2: Try to fetch it back
    console.log('\n📋 Fetching campaign back...');
    try {
      const fetchResponse = await axios.get(
        `${API_BASE_URL}/vapi-outbound/campaigns/${campaign.id}`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      console.log('✅ Campaign fetched successfully!');
    } catch (error) {
      console.log('❌ Could not fetch campaign:', error.response?.data || error.message);
    }

    // Step 3: Check in campaigns list
    console.log('\n📋 Checking campaigns list...');
    const listResponse = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const found = listResponse.data.campaigns.find(c => c.id === campaign.id);
    if (found) {
      console.log('✅ Campaign found in list!');
    } else {
      console.log('❌ Campaign NOT found in list!');
      console.log('Total campaigns in list:', listResponse.data.campaigns.length);
    }

    // Step 4: Check organization ID mismatch
    console.log('\n🔍 Debugging organization context...');
    console.log('Campaign organization ID:', campaign.organizationId);
    
    // Get user info from auth
    const userInfo = {
      role: 'agency_admin',
      organizationId: '47a8e3ea-cd34-4746-a786-dd31e8f8105e' // From clerk-auth.ts
    };
    console.log('Auth token organization ID:', userInfo.organizationId);
    
    if (campaign.organizationId !== userInfo.organizationId) {
      console.log('\n⚠️ ORGANIZATION MISMATCH!');
      console.log('Campaign was saved to a different organization than the auth token expects.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testCreateAndCheck();