// Complete test of VAPI data flow
// Run this in the browser console

console.log('🚀 Testing Complete VAPI Data Flow...');
console.log('=====================================\n');

// Step 1: Check environment
console.log('1️⃣ Checking Environment Variables:');
console.log('   VITE_USE_DEV_AUTH:', import.meta.env.VITE_USE_DEV_AUTH);
console.log('   API URL:', import.meta.env.VITE_API_URL || 'default (proxy)');

// Step 2: Direct API test
console.log('\n2️⃣ Testing Direct API Call:');
async function testDirectAPI() {
  try {
    const response = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': 'Bearer test-token-client_admin',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Assistants found:', data.assistants?.length || 0);
    console.log('   First assistant:', data.assistants?.[0]?.name || 'None');
    return data;
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
}

// Step 3: Test through service
console.log('\n3️⃣ Testing through VapiOutboundService:');
async function testService() {
  try {
    // Import the service dynamically
    const module = await import('/src/services/vapi-outbound.service.ts');
    const service = module.default || module.vapiOutboundService;
    
    console.log('   Service loaded:', !!service);
    const assistants = await service.getAssistants();
    console.log('   Assistants returned:', assistants?.length || 0);
    return assistants;
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
}

// Step 4: Check API client configuration
console.log('\n4️⃣ Checking API Client:');
async function testApiClient() {
  try {
    const module = await import('/src/lib/api-client.ts');
    const apiClient = module.apiClient;
    
    console.log('   API Client loaded:', !!apiClient);
    
    // Test a simple request
    const response = await apiClient.get('/api/health');
    console.log('   Health check:', response.status === 200 ? '✅ OK' : '❌ Failed');
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testDirectAPI();
  await testService();
  await testApiClient();
  
  console.log('\n📊 Summary:');
  console.log('If direct API works but service doesn\'t, the issue is in the API client auth.');
  console.log('Run the individual test functions to debug further.');
}

// Export functions for manual testing
window.testDirectAPI = testDirectAPI;
window.testService = testService;
window.testApiClient = testApiClient;
window.runAllTests = runAllTests;

console.log('\n🎯 Run runAllTests() to execute all tests');
console.log('Or run individual tests: testDirectAPI(), testService(), testApiClient()');