// Test script to check if phone numbers are in the database
async function testPhoneNumbers() {
  console.log('Testing phone numbers from different sources...\n');
  
  const token = localStorage.getItem('clerk-token') || 
               (localStorage.getItem('dev-auth-enabled') === 'true' ? 
                `test-token-${localStorage.getItem('dev-auth-role')}` : '');
  
  // Test 1: Check VAPI API endpoint
  console.log('1. Testing VAPI API endpoint (/api/vapi-data/phone-numbers)...');
  try {
    const response = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('VAPI API Response:', {
      status: response.status,
      phoneNumbers: data.phoneNumbers?.length || 0,
      message: data.message
    });
  } catch (error) {
    console.error('VAPI API Error:', error);
  }
  
  // Test 2: Check if phone numbers might be in campaigns
  console.log('\n2. Checking phone numbers in campaigns...');
  try {
    const response = await fetch('/api/campaigns', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const campaigns = await response.json();
    
    campaigns.forEach(campaign => {
      if (campaign.phoneNumberIds || campaign.phone_number_ids) {
        console.log(`Campaign "${campaign.name}" has phone numbers:`, 
          campaign.phoneNumberIds || campaign.phone_number_ids);
      }
    });
  } catch (error) {
    console.error('Campaigns Error:', error);
  }
  
  // Test 3: Check organization settings
  console.log('\n3. Checking organization settings...');
  try {
    const response = await fetch('/api/organization/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const settings = await response.json();
    console.log('Organization settings:', {
      hasVapiKeys: !!settings.vapi_api_key || !!settings.vapi_private_key,
      vapiPhoneNumberId: settings.vapi_phone_number_id
    });
  } catch (error) {
    console.error('Settings Error:', error);
  }
  
  // Test 4: Direct backend test
  console.log('\n4. Testing backend vapi-outbound/phone-numbers endpoint...');
  try {
    const response = await fetch('/api/vapi-outbound/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Backend phone numbers response:', data);
  } catch (error) {
    console.error('Backend Error:', error);
  }
}

// Run the test
console.log('Copy and paste this entire script into the browser console');
console.log('Make sure you\'re logged in first!\n');

testPhoneNumbers();