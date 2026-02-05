// Browser console script to debug campaign executor
// Copy and paste this into browser console

async function debugCampaignExecutor() {
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  console.log('🔍 Debugging Campaign Executor...\n');
  
  try {
    // Get all campaigns
    const response = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const data = await response.json();
    const campaigns = data.campaigns;
    
    console.log(`📋 Found ${campaigns.length} campaigns:\n`);
    
    for (const campaign of campaigns) {
      console.log(`Campaign: ${campaign.name} (${campaign.id})`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Total Leads: ${campaign.totalLeads || 0}`);
      console.log(`   Organization ID: ${campaign.organizationId}`);
      
      // Check why campaign might not be running
      const issues = [];
      
      if (campaign.status !== 'active') {
        issues.push(`Status is "${campaign.status}" (needs to be "active")`);
      }
      
      if (!campaign.totalLeads || campaign.totalLeads === 0) {
        issues.push('No leads uploaded');
      }
      
      if (!campaign.assistantId) {
        issues.push('No VAPI assistant configured');
      }
      
      if (!campaign.phoneNumberId) {
        issues.push('No phone number configured');
      }
      
      if (issues.length > 0) {
        console.log('   ❌ Issues preventing calls:');
        issues.forEach(issue => console.log(`      - ${issue}`));
      } else {
        console.log('   ✅ Campaign should be making calls!');
        console.log('   🔍 Check backend logs for campaign executor activity');
      }
      
      console.log('');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Make sure campaign status is "active"');
    console.log('2. Ensure leads are uploaded (CSV with contacts)');
    console.log('3. Configure VAPI credentials in Organization Settings');
    console.log('4. Check backend server logs for errors');
    console.log('5. The campaign executor runs every minute automatically');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug
debugCampaignExecutor();