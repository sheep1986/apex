#!/usr/bin/env node

// Test script to check campaign creation and starting flow
const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'test-token-agency_admin'; // Dev auth token

// Test data
const testCampaign = {
  name: 'Test Campaign ' + new Date().toISOString(),
  description: 'Testing campaign creation and call flow',
  assistantId: 'test-assistant-1',
  phoneNumberId: 'test-phone-1',
  phoneNumber: '+447526126716',
  sendTiming: 'now',
  csvData: 'firstName,lastName,phone,email,company\nSean,Test,447526126716,sean@test.com,Test Company'
};

async function testCampaignCreation() {
  try {
    console.log('🚀 Starting campaign creation test...\n');

    // Step 1: Create campaign
    console.log('📋 Step 1: Creating campaign...');
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
      apexId: campaign.apex_id
    });

    // Step 2: Check if campaign is in the list
    console.log('\n📋 Step 2: Checking campaigns list...');
    const listResponse = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const campaigns = listResponse.data.campaigns;
    const foundCampaign = campaigns.find(c => c.id === campaign.id);
    
    if (foundCampaign) {
      console.log('✅ Campaign found in list:', {
        id: foundCampaign.id,
        name: foundCampaign.name,
        totalLeads: foundCampaign.totalLeads,
        status: foundCampaign.status
      });
    } else {
      console.log('❌ Campaign NOT found in campaigns list!');
    }

    // Step 3: Start the campaign
    console.log('\n📋 Step 3: Starting campaign...');
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
      console.log('✅ Campaign start response:', startResponse.data);
    } catch (error) {
      console.error('❌ Error starting campaign:', error.response?.data || error.message);
    }

    // Step 4: Check campaign status
    console.log('\n📋 Step 4: Checking campaign dashboard...');
    try {
      const dashboardResponse = await axios.get(
        `${API_BASE_URL}/vapi-outbound/campaigns/${campaign.id}`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      const dashboard = dashboardResponse.data.campaign;
      console.log('✅ Campaign dashboard:', {
        status: dashboard.status,
        totalLeads: dashboard.metrics?.totalLeads,
        leadsRemaining: dashboard.metrics?.leadsRemaining,
        activeCalls: dashboard.metrics?.activeCalls
      });
    } catch (error) {
      console.error('❌ Error getting campaign dashboard:', error.response?.data || error.message);
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testCampaignCreation();