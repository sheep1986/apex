// Browser console script to check campaign leads
// Copy and paste this into browser console

async function checkCampaignLeads() {
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  console.log('🔍 Checking campaigns and their leads...\n');
  
  try {
    // Get all campaigns
    const response = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const data = await response.json();
    const campaigns = data.campaigns;
    
    console.log(`Found ${campaigns.length} campaigns:\n`);
    
    for (const campaign of campaigns) {
      console.log(`📋 Campaign: ${campaign.name} (${campaign.id})`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Total Leads: ${campaign.totalLeads || 0}`);
      
      // Get detailed campaign info
      try {
        const detailResponse = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaign.id}`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        });
        
        const details = await detailResponse.json();
        const leads = details.campaign?.leads || [];
        
        console.log(`   Actual leads found: ${leads.length}`);
        if (leads.length > 0) {
          console.log(`   First lead: ${leads[0].firstName} ${leads[0].lastName} - ${leads[0].phone}`);
        }
      } catch (e) {
        console.log('   Could not fetch details');
      }
      
      console.log('');
    }
    
    console.log('\n✅ To upload leads to a campaign:');
    console.log('1. Create a new campaign with the wizard');
    console.log('2. Make sure to upload a CSV file with contacts');
    console.log('3. The CSV should have columns: firstName, lastName, phone, email, company');
    console.log('4. Phone numbers should be in international format (e.g., 447526126716)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkCampaignLeads();