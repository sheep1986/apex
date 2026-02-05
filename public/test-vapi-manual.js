// Manual VAPI test - run this in browser console
console.log('🚀 Manual VAPI Test');

// Test directly against backend
async function testBackendDirectly() {
  console.log('\n1️⃣ Testing Backend Directly...');
  
  try {
    // Get fresh Clerk token
    const token = await window.Clerk.session.getToken();
    console.log('✅ Got fresh Clerk token');
    
    // Test backend health
    const healthResponse = await fetch('http://localhost:3001/api/health');
    console.log('🏥 Backend health:', healthResponse.ok ? 'OK' : 'FAILED');
    
    // Test VAPI assistants endpoint
    const assistantsResponse = await fetch('http://localhost:3001/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Assistants response status:', assistantsResponse.status);
    
    if (assistantsResponse.ok) {
      const data = await assistantsResponse.json();
      console.log('✅ Assistants data:', data);
      console.log('✅ Total assistants:', data.assistants?.length || 0);
      return data;
    } else {
      const text = await assistantsResponse.text();
      console.error('❌ Error response:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test through proxy
async function testThroughProxy() {
  console.log('\n2️⃣ Testing Through Proxy...');
  
  try {
    const token = await window.Clerk.session.getToken();
    console.log('✅ Got fresh Clerk token');
    
    // Test through proxy (should use relative URL)
    const response = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Proxy response status:', response.status);
    console.log('📡 Response content-type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('📡 Response preview:', text.substring(0, 200));
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log('✅ Parsed JSON data:', data);
      return data;
    } catch (e) {
      console.error('❌ Not JSON, got HTML instead');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check organization VAPI keys
async function checkOrgVAPIKeys() {
  console.log('\n3️⃣ Checking Organization VAPI Keys...');
  
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('http://localhost:3001/api/organizations/current', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Organization:', data.organization?.name);
      console.log('✅ Has VAPI API Key:', !!data.organization?.vapi_api_key);
      console.log('✅ Has VAPI Private Key:', !!data.organization?.vapi_private_key);
      
      if (!data.organization?.vapi_private_key) {
        console.error('❌ Organization does not have VAPI private key configured!');
        console.log('💡 Add VAPI keys in Organization Settings');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testBackendDirectly();
  await testThroughProxy();
  await checkOrgVAPIKeys();
  
  console.log('\n📊 Summary:');
  console.log('If backend direct works but proxy doesn\'t, restart frontend.');
  console.log('If organization has no VAPI keys, add them in settings.');
}

window.vapiTest = {
  testBackendDirectly,
  testThroughProxy,
  checkOrgVAPIKeys,
  runAllTests
};

console.log('🎯 Run vapiTest.runAllTests() to test everything');