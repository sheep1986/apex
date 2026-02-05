// Test backend directly to bypass proxy issues
console.log('🔍 Testing Backend Direct Access...');

// Get Clerk token
async function testBackendDirect() {
  try {
    // Get Clerk token
    const token = await window.Clerk.session.getToken();
    console.log('✅ Got Clerk token');
    
    // Test backend health
    console.log('\n1️⃣ Testing backend health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    console.log('Health check:', healthResponse.ok ? '✅ OK' : '❌ Failed');
    
    // Test VAPI assistants endpoint directly
    console.log('\n2️⃣ Testing VAPI assistants endpoint...');
    const assistantsResponse = await fetch('http://localhost:3001/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Assistants response status:', assistantsResponse.status);
    const assistantsData = await assistantsResponse.json();
    console.log('Assistants data:', assistantsData);
    
    // Test VAPI phone numbers endpoint directly
    console.log('\n3️⃣ Testing VAPI phone numbers endpoint...');
    const phoneResponse = await fetch('http://localhost:3001/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Phone numbers response status:', phoneResponse.status);
    const phoneData = await phoneResponse.json();
    console.log('Phone numbers data:', phoneData);
    
    // Check organization VAPI settings
    console.log('\n4️⃣ Checking organization settings...');
    const settingsResponse = await fetch('http://localhost:3001/api/organizations/2566d8c5-2245-4a3c-b539-4cea21a07d9b/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('Organization VAPI settings:', settings.settings?.vapi);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testBackendDirect();