// Browser console script to check campaign status and VAPI configuration
// Copy and paste this into browser console

async function checkCampaignStatus(campaignId) {
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  if (!campaignId) {
    const urlParts = window.location.pathname.split('/');
    const idx = urlParts.indexOf('campaigns');
    campaignId = urlParts[idx + 1];
  }
  
  console.log(`🔍 Checking campaign ${campaignId}...\n`);
  
  try {
    // Get campaign details
    const response = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const data = await response.json();
    const campaign = data.campaign;
    
    console.log('📋 Campaign Status:');
    console.log(`   Name: ${campaign.name}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Total Leads: ${campaign.totalLeads || 0}`);
    console.log(`   Calls Completed: ${campaign.callsCompleted || 0}`);
    console.log(`   Organization ID: ${campaign.organizationId}`);
    console.log(`   Has VAPI Credentials: ${campaign.hasVAPICredentials ? '✅ Yes' : '❌ No'}`);
    console.log(`   Assistant ID: ${campaign.assistantId || '❌ None'}`);
    console.log(`   Phone Number ID: ${campaign.phoneNumberId || '❌ None'}`);
    
    if (!campaign.hasVAPICredentials) {
      console.log('\n❌ PROBLEM: No VAPI credentials configured!');
      console.log('   The organization needs VAPI API keys configured.');
      console.log('   Go to Organization Settings and add VAPI credentials.');
    }
    
    // Check organization VAPI settings
    console.log('\n🔐 Checking organization VAPI configuration...');
    const orgId = campaign.organizationId;
    
    try {
      const orgResponse = await fetch(`${API_BASE_URL}/organizations/current`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        console.log(`   Organization: ${orgData.organization?.name || 'Unknown'}`);
      }
    } catch (e) {
      // Ignore
    }
    
    // Check VAPI data endpoints
    console.log('\n📞 Checking VAPI configuration...');
    
    // Check assistants
    try {
      const assistantsResponse = await fetch(`${API_BASE_URL}/vapi-data/assistants`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      
      if (assistantsResponse.ok) {
        const assistantsData = await assistantsResponse.json();
        console.log(`   VAPI Assistants: ${assistantsData.assistants?.length || 0} found`);
      } else {
        console.log('   ❌ Could not fetch VAPI assistants');
      }
    } catch (e) {
      console.log('   ❌ Error fetching assistants:', e.message);
    }
    
    // Check phone numbers
    try {
      const phonesResponse = await fetch(`${API_BASE_URL}/vapi-data/phone-numbers`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      
      if (phonesResponse.ok) {
        const phonesData = await phonesResponse.json();
        console.log(`   VAPI Phone Numbers: ${phonesData.phoneNumbers?.length || 0} found`);
      } else {
        console.log('   ❌ Could not fetch VAPI phone numbers');
      }
    } catch (e) {
      console.log('   ❌ Error fetching phone numbers:', e.message);
    }
    
    console.log('\n📊 Summary:');
    if (campaign.status !== 'active') {
      console.log('   ❌ Campaign is not active (status: ' + campaign.status + ')');
    } else {
      console.log('   ✅ Campaign is active');
    }
    
    if (!campaign.totalLeads || campaign.totalLeads === 0) {
      console.log('   ❌ No leads in campaign');
    } else {
      console.log('   ✅ Campaign has ' + campaign.totalLeads + ' leads');
    }
    
    if (!campaign.hasVAPICredentials) {
      console.log('   ❌ VAPI credentials not configured');
      console.log('\n🔧 TO FIX:');
      console.log('   1. Go to Organization Settings');
      console.log('   2. Add your VAPI API key (private key)');
      console.log('   3. Save the settings');
      console.log('   4. The campaign executor will then start making calls');
    } else {
      console.log('   ✅ VAPI credentials configured');
      console.log('\n🔍 Calls should be starting soon!');
      console.log('   The campaign executor runs every minute.');
      console.log('   Check the backend server logs for any errors.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Auto-run for current campaign
checkCampaignStatus();