// Test VAPI endpoints with proper authentication
console.log('🚀 Testing VAPI endpoints with authentication...');

async function testVAPIEndpoints() {
  try {
    // First, get the authentication token
    let token = null;
    let authMethod = 'none';
    
    // Check for dev auth
    if (localStorage.getItem('dev-auth-enabled') === 'true') {
      const role = localStorage.getItem('dev-auth-role') || 'client_admin';
      token = `test-token-${role}`;
      authMethod = 'dev-auth';
      console.log('✅ Using dev auth with role:', role);
    }
    // Check for Clerk auth
    else if (window.Clerk && window.Clerk.session) {
      token = await window.Clerk.session.getToken();
      authMethod = 'clerk';
      console.log('✅ Using Clerk authentication');
    }
    // Check for Supabase auth
    else if (window.supabase) {
      const { createClient } = window.supabase;
      const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
      const supabaseAnonKey = localStorage.getItem('supabase.auth.token');
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          token = session.access_token;
          authMethod = 'supabase';
          console.log('✅ Using Supabase authentication');
        }
      }
    }
    
    if (!token) {
      console.error('❌ No authentication token found!');
      console.log('Please sign in or enable dev auth mode');
      return;
    }
    
    console.log('🔑 Auth method:', authMethod);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    // Test health endpoint first
    console.log('\n1️⃣ Testing backend health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.text();
    console.log('Health check:', healthResponse.ok ? '✅ OK' : '❌ Failed');
    console.log('Health response:', healthData);
    
    // Test VAPI assistants endpoint
    console.log('\n2️⃣ Testing VAPI assistants endpoint...');
    try {
      const assistantsResponse = await fetch('http://localhost:3001/api/vapi-data/assistants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Assistants response status:', assistantsResponse.status);
      const assistantsData = await assistantsResponse.json();
      console.log('Assistants data:', assistantsData);
      
      if (assistantsResponse.ok && assistantsData.assistants) {
        console.log(`✅ Success! Found ${assistantsData.assistants.length} assistants`);
        if (assistantsData.assistants.length > 0) {
          console.log('First assistant:', assistantsData.assistants[0]);
        }
      } else {
        console.log('❌ Failed to fetch assistants');
        if (assistantsData.error) {
          console.log('Error:', assistantsData.error);
        }
        if (assistantsData.requiresConfiguration) {
          console.log('⚠️ VAPI integration requires configuration');
        }
      }
    } catch (err) {
      console.error('❌ Assistants request failed:', err);
    }
    
    // Test VAPI phone numbers endpoint
    console.log('\n3️⃣ Testing VAPI phone numbers endpoint...');
    try {
      const phoneResponse = await fetch('http://localhost:3001/api/vapi-data/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Phone numbers response status:', phoneResponse.status);
      const phoneData = await phoneResponse.json();
      console.log('Phone numbers data:', phoneData);
      
      if (phoneResponse.ok && phoneData.phoneNumbers) {
        console.log(`✅ Success! Found ${phoneData.phoneNumbers.length} phone numbers`);
        if (phoneData.phoneNumbers.length > 0) {
          console.log('First phone number:', phoneData.phoneNumbers[0]);
        }
      } else {
        console.log('❌ Failed to fetch phone numbers');
        if (phoneData.error) {
          console.log('Error:', phoneData.error);
        }
        if (phoneData.requiresConfiguration) {
          console.log('⚠️ VAPI integration requires configuration');
        }
      }
    } catch (err) {
      console.error('❌ Phone numbers request failed:', err);
    }
    
    // Check organization VAPI settings
    console.log('\n4️⃣ Checking organization settings...');
    if (authMethod === 'dev-auth') {
      const roleOrgMap = {
        'platform_owner': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'agency_owner': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'agency_admin': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'client_admin': '0f88ab8a-b760-4c2a-b289-79b54d7201cf',
        'client_user': '0f88ab8a-b760-4c2a-b289-79b54d7201cf'
      };
      const role = localStorage.getItem('dev-auth-role') || 'client_admin';
      const orgId = roleOrgMap[role];
      console.log('Organization ID for', role + ':', orgId);
      
      // You can check VAPI settings for this org in the database
      console.log('\nTo check VAPI settings for this organization, run:');
      console.log(`SELECT vapi_api_key, vapi_private_key, vapi_settings FROM organizations WHERE id = '${orgId}';`);
    }
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Add to window for easy access
window.testVAPIEndpoints = testVAPIEndpoints;

console.log('📌 Run testVAPIEndpoints() to test the VAPI endpoints');
console.log('📌 Or run the following in the console:');
console.log('   await testVAPIEndpoints()');

// Auto-run if called directly
if (typeof module === 'undefined') {
  testVAPIEndpoints();
}