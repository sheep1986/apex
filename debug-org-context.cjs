#!/usr/bin/env node

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

async function debugOrgContext() {
  console.log('🔍 Debugging organization context...\n');

  // Test with different auth tokens
  const tokens = {
    'agency_admin': 'test-token-agency_admin',
    'platform_owner': 'test-token-platform_owner',
    'client_admin': 'test-token-client_admin'
  };

  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n📋 Testing with ${role}:`);
    
    try {
      // Get campaigns
      const response = await axios.get(
        `${API_BASE_URL}/vapi-outbound/campaigns`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log(`✅ ${role}: Found ${response.data.campaigns.length} campaigns`);
      
      // Show first campaign if any
      if (response.data.campaigns.length > 0) {
        const firstCampaign = response.data.campaigns[0];
        console.log(`   First campaign: ${firstCampaign.name} (${firstCampaign.id})`);
      }

      // Try to get organization info
      try {
        const orgResponse = await axios.get(
          `${API_BASE_URL}/organizations/current`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log(`   Organization: ${orgResponse.data.organization?.name || 'Unknown'}`);
      } catch (e) {
        // Organization endpoint might not exist
      }

    } catch (error) {
      console.log(`❌ ${role}: Error - ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`   Details: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  // Show organization IDs from the auth middleware
  console.log('\n📋 Organization IDs from auth middleware:');
  console.log('- platform_owner: 47a8e3ea-cd34-4746-a786-dd31e8f8105e');
  console.log('- agency_admin: 47a8e3ea-cd34-4746-a786-dd31e8f8105e');
  console.log('- client_admin: 0f88ab8a-b760-4c2a-b289-79b54d7201cf');
}

// Run the debug
debugOrgContext();