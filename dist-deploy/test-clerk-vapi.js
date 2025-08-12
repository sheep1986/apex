// Test VAPI data loading with Clerk authentication
// Run this in the browser console while logged in

console.log('🔍 Testing VAPI Data Loading with Clerk Auth...');
console.log('================================================\n');

// Check Clerk authentication
async function checkClerkAuth() {
  console.log('1️⃣ Checking Clerk Authentication:');
  
  // Check if Clerk is loaded
  if (window.Clerk) {
    console.log('✅ Clerk is loaded');
    
    // Get session
    const session = await window.Clerk.session;
    if (session) {
      console.log('✅ Clerk session exists');
      console.log('   User ID:', session.userId);
      
      // Get session token
      const token = await session.getToken();
      console.log('   Token:', token ? '***EXISTS***' : 'NULL');
      
      return token;
    } else {
      console.log('❌ No Clerk session');
      return null;
    }
  } else {
    console.log('❌ Clerk not loaded');
    return null;
  }
}

// Test API with Clerk token
async function testVAPIWithClerkToken(token) {
  console.log('\n2️⃣ Testing VAPI API with Clerk Token:');
  
  try {
    const response = await fetch('/api/vapi-data/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('   Response:', text);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Data received:');
    console.log('   Assistants:', data.assistants?.length || 0);
    console.log('   Phone Numbers:', data.phoneNumbers?.length || 0);
    
    if (data.assistants?.length > 0) {
      console.log('   First Assistant:', data.assistants[0].name);
    }
    if (data.phoneNumbers?.length > 0) {
      console.log('   First Phone:', data.phoneNumbers[0].number);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Check backend health
async function checkBackendHealth() {
  console.log('\n3️⃣ Checking Backend Health:');
  
  try {
    const response = await fetch('/api/health');
    if (response.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend is not accessible');
  }
}

// Test organization data
async function testOrganizationData(token) {
  console.log('\n4️⃣ Testing Organization Data:');
  
  try {
    const response = await fetch('/api/organizations/current', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Organization data:');
      console.log('   ID:', data.organization?.id);
      console.log('   Name:', data.organization?.name);
      console.log('   Has VAPI Keys:', !!(data.organization?.vapi_api_key || data.organization?.vapi_private_key));
    } else {
      console.log('❌ Failed to get organization data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all tests
async function runTests() {
  // Check backend first
  await checkBackendHealth();
  
  // Get Clerk token
  const token = await checkClerkAuth();
  
  if (token) {
    // Test VAPI data loading
    await testVAPIWithClerkToken(token);
    
    // Test organization data
    await testOrganizationData(token);
  } else {
    console.log('\n❌ Cannot test API without authentication token');
    console.log('Make sure you are logged in with Clerk');
  }
  
  console.log('\n📊 Summary:');
  console.log('If you see "No phone numbers available", check:');
  console.log('1. Organization has VAPI keys configured');
  console.log('2. Backend is running and accessible');
  console.log('3. Clerk authentication is working');
  console.log('4. VAPI API key is valid in your VAPI account');
}

// Export for manual testing
window.testClerkVAPI = {
  checkClerkAuth,
  testVAPIWithClerkToken,
  checkBackendHealth,
  testOrganizationData,
  runTests
};

console.log('\n🎯 Run testClerkVAPI.runTests() to execute all tests');
console.log('Or run individual tests from window.testClerkVAPI');

// Auto-run tests
testClerkVAPI.runTests();