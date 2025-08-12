#!/usr/bin/env node

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'test-token-agency_admin'; // Dev auth token

async function listAllCampaigns() {
  try {
    console.log('🔍 Fetching all campaigns...\n');

    // Get all campaigns
    const response = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const campaigns = response.data.campaigns;
    console.log(`✅ Found ${campaigns.length} campaigns:\n`);
    
    if (campaigns.length === 0) {
      console.log('❌ No campaigns found!');
      console.log('\nThis could mean:');
      console.log('1. Campaigns are being saved to a different organization');
      console.log('2. The campaign creation is failing silently');
      console.log('3. The auth token is associated with a different organization');
    } else {
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}:`);
        console.log(`- ID: ${campaign.id}`);
        console.log(`- Name: ${campaign.name}`);
        console.log(`- Status: ${campaign.status}`);
        console.log(`- Created: ${campaign.createdAt}`);
        console.log(`- Total Leads: ${campaign.totalLeads || 0}`);
        console.log(`- Calls Completed: ${campaign.callsCompleted || 0}`);
        console.log('');
      });
    }

    // Also check with different auth tokens
    console.log('\n🔍 Checking with different auth roles...');
    const roles = ['platform_owner', 'agency_owner', 'client_admin'];
    
    for (const role of roles) {
      try {
        const roleResponse = await axios.get(
          `${API_BASE_URL}/vapi-outbound/campaigns`,
          {
            headers: {
              'Authorization': `Bearer test-token-${role}`
            }
          }
        );
        console.log(`✅ ${role}: Found ${roleResponse.data.campaigns.length} campaigns`);
      } catch (error) {
        console.log(`❌ ${role}: Error - ${error.response?.status || error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the check
listAllCampaigns();