// Quick test to see if backend is accessible and VAPI data can be loaded
console.log('🧪 Testing VAPI endpoints...');

async function testVAPI() {
  // Get current auth token
  const devRole = localStorage.getItem('dev-auth-role') || 'client_admin';
  const token = `test-token-${devRole}`;
  
  console.log('🔑 Using token:', token);
  
  try {
    // Test health endpoint
    console.log('\n📡 Testing backend health...');
    const healthRes = await fetch('/api/health');
    console.log('Health check:', healthRes.ok ? '✅ Backend is running' : '❌ Backend is not running');
    
    if (!healthRes.ok) {
      console.error('❌ Backend server is not running!');
      console.log('\n📝 To start the backend:');
      console.log('1. Open a new terminal');
      console.log('2. Navigate to: apps/backend');
      console.log('3. Run: npm run dev');
      return;
    }
    
    // Test VAPI assistants
    console.log('\n📡 Fetching VAPI assistants...');
    const assistantsRes = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const assistantsData = await assistantsRes.json();
    console.log('Assistants response:', assistantsRes.status);
    console.log('Assistants data:', assistantsData);
    
    // Test VAPI phone numbers
    console.log('\n📡 Fetching VAPI phone numbers...');
    const phoneRes = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const phoneData = await phoneRes.json();
    console.log('Phone numbers response:', phoneRes.status);
    console.log('Phone numbers data:', phoneData);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('- Backend:', healthRes.ok ? '✅ Running' : '❌ Not running');
    console.log('- Assistants:', assistantsData.assistants?.length || 0);
    console.log('- Phone Numbers:', phoneData.phoneNumbers?.length || 0);
    
    if (assistantsData.requiresConfiguration || phoneData.requiresConfiguration) {
      console.log('\n⚠️ VAPI requires configuration!');
      console.log('The organization needs VAPI API keys configured.');
      console.log('Organization ID:', devRole === 'client_admin' ? '0f88ab8a-b760-4c2a-b289-79b54d7201cf' : '47a8e3ea-cd34-4746-a786-dd31e8f8105e');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testVAPI();