import axios from 'axios';

async function testBackendCall() {
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  
  try {
    // Test with different tokens
    const tokens = [
      'test-token-client_admin',
      'dev-token-client_admin',
      'test-token-platform_owner',
    ];
    
    for (const token of tokens) {
      console.log(`\n🔍 Testing with token: ${token}`);
      
      try {
        const response = await axios.get(
          `http://localhost:3001/api/vapi-outbound/calls/${callId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('✅ Success:', response.data);
      } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

testBackendCall();