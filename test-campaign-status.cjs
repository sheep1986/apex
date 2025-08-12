#!/usr/bin/env node

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'test-token-agency_admin'; // Dev auth token

// Campaign ID from your screenshot
const CAMPAIGN_ID = '81d04c8a-ad5a-40b1-95e6-9c2499a2da42';

async function checkCampaignStatus() {
  try {
    console.log('🔍 Checking campaign status...\n');

    // Step 1: Get campaign details
    console.log('📋 Step 1: Getting campaign details...');
    const campaignResponse = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns/${CAMPAIGN_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const campaign = campaignResponse.data.campaign;
    console.log('✅ Campaign found:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: campaign.metrics?.totalLeads,
      activeCalls: campaign.metrics?.activeCalls,
      leadsRemaining: campaign.metrics?.leadsRemaining
    });

    // Step 2: Check calls for this campaign
    console.log('\n📋 Step 2: Checking campaign calls...');
    const callsResponse = await axios.get(
      `${API_BASE_URL}/vapi-outbound/campaigns/${CAMPAIGN_ID}/calls`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const calls = callsResponse.data.calls;
    console.log(`✅ Found ${calls.length} calls for this campaign`);
    
    if (calls.length > 0) {
      console.log('\n📞 First few calls:');
      calls.slice(0, 3).forEach(call => {
        console.log(`- Call ID: ${call.id}`);
        console.log(`  Customer: ${call.customerName} (${call.customerPhone})`);
        console.log(`  Status: ${call.status}`);
        console.log(`  Started: ${call.startedAt}`);
        console.log('');
      });
    }

    // Step 3: Check leads table
    console.log('\n📋 Step 3: Checking leads for campaign...');
    const { data: supabase } = await axios.get(
      `${API_BASE_URL}/debug/campaign-leads/${CAMPAIGN_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    ).catch(err => ({ data: null }));

    if (supabase) {
      console.log('✅ Leads data:', supabase);
    } else {
      console.log('⚠️ Could not fetch leads data (endpoint might not exist)');
    }

    // Step 4: Check if campaign is actually running
    console.log('\n📋 Step 4: Checking campaign automation status...');
    try {
      const automationStatus = await axios.get(
        `${API_BASE_URL}/campaign-automation/${CAMPAIGN_ID}/status`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      console.log('✅ Automation status:', automationStatus.data);
    } catch (error) {
      console.log('⚠️ Campaign automation endpoint not available');
    }

    console.log('\n🎯 Summary:');
    console.log(`- Campaign Status: ${campaign.status}`);
    console.log(`- Total Calls Made: ${calls.length}`);
    console.log(`- Campaign Type: ${campaign.hasVAPICredentials ? 'VAPI Enabled' : 'Mock/Development'}`);
    
    if (campaign.status !== 'active') {
      console.log('\n⚠️ Campaign is not active. Try starting it with:');
      console.log(`   POST ${API_BASE_URL}/vapi-outbound/campaigns/${CAMPAIGN_ID}/start`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the check
checkCampaignStatus();