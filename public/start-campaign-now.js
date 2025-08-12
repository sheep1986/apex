// Browser console script to manually start a campaign
// Copy and paste this into browser console

async function startCampaignNow(campaignId) {
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  if (!campaignId) {
    console.error('❌ Please provide a campaign ID');
    console.log('Usage: startCampaignNow("your-campaign-id")');
    return;
  }
  
  console.log(`🚀 Starting campaign ${campaignId}...`);
  
  try {
    // First, check if the campaign has leads
    const detailResponse = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const details = await detailResponse.json();
    const campaign = details.campaign;
    
    console.log('📋 Campaign details:');
    console.log(`   Name: ${campaign.name}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Total Leads: ${campaign.totalLeads || 0}`);
    console.log(`   Has VAPI Credentials: ${campaign.hasVAPICredentials ? 'Yes' : 'No'}`);
    
    if (!campaign.totalLeads || campaign.totalLeads === 0) {
      console.error('❌ Campaign has no leads! Please upload CSV contacts first.');
      return;
    }
    
    if (!campaign.hasVAPICredentials) {
      console.error('❌ No VAPI credentials configured for this organization!');
      console.log('Please configure VAPI API keys in Organization Settings.');
      return;
    }
    
    // Start the campaign
    const startResponse = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaignId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!startResponse.ok) {
      const error = await startResponse.json();
      console.error('❌ Failed to start campaign:', error);
      return;
    }
    
    const result = await startResponse.json();
    console.log('✅ Campaign started successfully!', result);
    console.log('');
    console.log('📞 Calls should begin within 1 minute...');
    console.log('Check the campaign details page for live updates.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get the campaign ID from the URL if on campaign details page
const urlParts = window.location.pathname.split('/');
const campaignIndex = urlParts.indexOf('campaigns');
if (campaignIndex !== -1 && urlParts[campaignIndex + 1]) {
  const campaignId = urlParts[campaignIndex + 1];
  console.log(`Found campaign ID in URL: ${campaignId}`);
  console.log('To start this campaign, run:');
  console.log(`startCampaignNow("${campaignId}")`);
} else {
  console.log('To start a campaign, run:');
  console.log('startCampaignNow("your-campaign-id")');
}