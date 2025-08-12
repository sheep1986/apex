// Script to check VAPI keys configuration
async function checkVAPIKeys() {
  console.log('🔍 Checking VAPI Keys Configuration...\n');
  
  const token = localStorage.getItem('clerk-token') || 
               (localStorage.getItem('dev-auth-enabled') === 'true' ? 
                `test-token-${localStorage.getItem('dev-auth-role')}` : '');
  
  // Get organization data
  try {
    const response = await fetch('/api/organization', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch organization');
      return;
    }
    
    const org = await response.json();
    
    console.log('Organization Details:');
    console.log('- ID:', org.id);
    console.log('- Name:', org.name);
    console.log('\nVAPI Configuration:');
    console.log('- Has vapi_api_key (PUBLIC):', !!org.vapi_api_key);
    console.log('- Has vapi_private_key (PRIVATE):', !!org.vapi_private_key);
    
    if (org.vapi_api_key) {
      console.log('- vapi_api_key preview:', org.vapi_api_key.substring(0, 10) + '...');
    }
    if (org.vapi_private_key) {
      console.log('- vapi_private_key preview:', org.vapi_private_key.substring(0, 10) + '...');
    }
    
    console.log('\n⚠️ IMPORTANT:');
    console.log('The backend should be using the PRIVATE key for API calls.');
    console.log('The PUBLIC key is only for frontend/client-side operations.');
    
    // Test which key the backend is actually using
    console.log('\n📡 Testing backend VAPI configuration...');
    const configResponse = await fetch('/api/organization/vapi-config', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (configResponse.ok) {
      const config = await configResponse.json();
      console.log('Backend VAPI config:', config);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('Run checkVAPIKeys() to check your VAPI configuration');
checkVAPIKeys();