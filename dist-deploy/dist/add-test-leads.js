// Browser console script to add test leads to a campaign
// Copy and paste this into browser console

async function addTestLeads(campaignId) {
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  if (!campaignId) {
    console.error('❌ Please provide a campaign ID');
    console.log('Usage: addTestLeads("your-campaign-id")');
    return;
  }
  
  console.log(`📤 Adding test leads to campaign ${campaignId}...`);
  
  // Create test CSV data
  const csvData = `firstName,lastName,phone,email,company
Sean,Wentz,447526126716,sean@example.com,Test Company
John,Doe,447526126717,john@example.com,Acme Corp
Jane,Smith,447526126718,jane@example.com,Tech Solutions`;
  
  try {
    // Create a Blob from the CSV string
    const blob = new Blob([csvData], { type: 'text/csv' });
    const file = new File([blob], 'test-leads.csv', { type: 'text/csv' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('csvFile', file);
    
    // Upload the leads
    const response = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaignId}/upload-leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to upload leads:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Leads uploaded successfully!', result);
    console.log(`   Total leads uploaded: ${result.totalLeads || 3}`);
    console.log('');
    console.log('📞 Now start the campaign to begin making calls!');
    console.log(`   Run: startCampaignNow("${campaignId}")`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Helper function to add leads and start campaign in one go
async function addLeadsAndStart(campaignId) {
  await addTestLeads(campaignId);
  
  // Wait a moment for leads to be processed
  setTimeout(async () => {
    console.log('\n🚀 Starting campaign...');
    await startCampaignNow(campaignId);
  }, 2000);
}

// Helper to get campaign ID from URL if on campaign details page
const urlParts = window.location.pathname.split('/');
const campaignIndex = urlParts.indexOf('campaigns');
let currentCampaignId = null;
if (campaignIndex !== -1 && urlParts[campaignIndex + 1]) {
  currentCampaignId = urlParts[campaignIndex + 1];
  console.log(`📋 Current campaign ID: ${currentCampaignId}`);
  console.log('');
  console.log('To add test leads to THIS campaign, run:');
  console.log(`   addTestLeads("${currentCampaignId}")`);
  console.log('');
  console.log('To add leads AND start THIS campaign, run:');
  console.log(`   addLeadsAndStart("${currentCampaignId}")`);
} else {
  console.log('📋 To add test leads to a campaign, you need the full UUID');
  console.log('   Example: addTestLeads("ffebea3e-8caa-4b70-bdea-c1ce068787ca")');
  console.log('');
  console.log('You can find the UUID in the URL when viewing a campaign');
}