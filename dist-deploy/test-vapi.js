// Test VAPI data fetching directly
// Run this in the browser console

async function testVAPIFetch() {
  console.log('🧪 Testing VAPI data fetch...');
  
  try {
    // Test 1: Direct fetch with dev token
    const response = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': 'Bearer test-token-client_admin',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    const data = await response.json();
    console.log('✅ Data received:', data);
    console.log('✅ Assistants count:', data.assistants?.length);
    console.log('✅ First assistant:', data.assistants?.[0]);
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Run the test
testVAPIFetch();