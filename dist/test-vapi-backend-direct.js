// Test script to check VAPI backend directly
async function testVAPIBackend() {
  console.log('Testing VAPI backend directly...\n');
  
  const token = localStorage.getItem('clerk-token') || 
               (localStorage.getItem('dev-auth-enabled') === 'true' ? 
                `test-token-${localStorage.getItem('dev-auth-role')}` : '');
  
  // Get organization info first
  console.log('1. Getting organization info...');
  try {
    const orgResponse = await fetch('/api/organization', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const orgData = await orgResponse.json();
    console.log('Organization:', {
      id: orgData.id,
      name: orgData.name,
      hasVapiKey: !!orgData.vapi_api_key || !!orgData.vapi_private_key
    });
  } catch (error) {
    console.error('Failed to get organization:', error);
  }
  
  // Test VAPI endpoints
  console.log('\n2. Testing VAPI data endpoints...');
  
  // Test assistants
  try {
    const assistantsResponse = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const assistantsData = await assistantsResponse.json();
    console.log('Assistants response:', {
      status: assistantsResponse.status,
      count: assistantsData.assistants?.length || 0,
      message: assistantsData.message,
      requiresConfiguration: assistantsData.requiresConfiguration
    });
  } catch (error) {
    console.error('Assistants error:', error);
  }
  
  // Test phone numbers
  try {
    const phoneResponse = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const phoneData = await phoneResponse.json();
    console.log('Phone numbers response:', {
      status: phoneResponse.status,
      count: phoneData.phoneNumbers?.length || 0,
      message: phoneData.message,
      requiresConfiguration: phoneData.requiresConfiguration
    });
  } catch (error) {
    console.error('Phone numbers error:', error);
  }
  
  // Test VAPI service health
  console.log('\n3. Testing if backend can reach VAPI...');
  try {
    const healthResponse = await fetch('/api/vapi-data/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const healthData = await healthResponse.json();
    console.log('VAPI all data response:', {
      assistantCount: healthData.assistantCount,
      phoneNumberCount: healthData.phoneNumberCount,
      message: healthData.message
    });
  } catch (error) {
    console.error('VAPI health check error:', error);
  }
}

console.log('Run testVAPIBackend() to test the backend VAPI integration');
testVAPIBackend();