// Test if VAPI API is actually working with the configured keys
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function testVAPIConnection() {
  console.log('🔍 TESTING VAPI API CONNECTION\n');
  console.log('=' .repeat(60));
  
  // 1. Get API key from organization
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'; // Emerald Green Energy
  
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, vapi_api_key')
    .eq('id', organizationId)
    .single();
    
  if (orgError || !org || !org.vapi_api_key) {
    console.error('❌ No VAPI API key found for organization');
    return;
  }
  
  console.log(`\nOrganization: ${org.name}`);
  console.log(`API Key: ***${org.vapi_api_key.slice(-4)}`);
  
  // 2. Test VAPI API endpoints
  const apiKey = org.vapi_api_key;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  
  console.log('\n📞 Testing VAPI API Endpoints:');
  console.log('-' .repeat(60));
  
  // Test assistants endpoint
  console.log('\n1. Testing /assistant endpoint...');
  try {
    const assistantsResponse = await axios.get('https://api.vapi.ai/assistant', { headers });
    const assistants = assistantsResponse.data;
    
    if (Array.isArray(assistants)) {
      console.log(`✅ SUCCESS: Found ${assistants.length} assistants`);
      if (assistants.length > 0) {
        console.log('\n   Sample assistants:');
        assistants.slice(0, 3).forEach(a => {
          console.log(`   - ${a.name} (ID: ${a.id})`);
        });
      }
    } else {
      console.log('⚠️  Unexpected response format:', typeof assistants);
    }
  } catch (error) {
    console.error(`❌ FAILED: ${error.response?.status || error.code} - ${error.response?.statusText || error.message}`);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Test phone numbers endpoint
  console.log('\n2. Testing /phone-number endpoint...');
  try {
    const phoneResponse = await axios.get('https://api.vapi.ai/phone-number', { headers });
    const phoneNumbers = phoneResponse.data;
    
    if (Array.isArray(phoneNumbers)) {
      console.log(`✅ SUCCESS: Found ${phoneNumbers.length} phone numbers`);
      if (phoneNumbers.length > 0) {
        console.log('\n   Sample phone numbers:');
        phoneNumbers.slice(0, 3).forEach(p => {
          console.log(`   - ${p.number} (ID: ${p.id})`);
          console.log(`     Provider: ${p.provider}, Country: ${p.country}`);
        });
      }
    } else {
      console.log('⚠️  Unexpected response format:', typeof phoneNumbers);
    }
  } catch (error) {
    console.error(`❌ FAILED: ${error.response?.status || error.code} - ${error.response?.statusText || error.message}`);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Test call creation capability
  console.log('\n3. Testing call creation capability...');
  try {
    const assistantsResp = await axios.get('https://api.vapi.ai/assistant', { headers });
    const phoneResp = await axios.get('https://api.vapi.ai/phone-number', { headers });
    
    if (assistantsResp.data.length > 0 && phoneResp.data.length > 0) {
      console.log('✅ Prerequisites met: Has assistants and phone numbers');
      console.log('   Platform SHOULD be able to make calls!');
      
      // Show what's needed for a call
      const assistant = assistantsResp.data[0];
      const phoneNumber = phoneResp.data[0];
      
      console.log('\n   Example call configuration:');
      console.log(`   - Assistant ID: ${assistant.id}`);
      console.log(`   - Phone Number ID: ${phoneNumber.id}`);
      console.log(`   - Customer number: +1234567890 (example)`);
      
      console.log('\n   To make a call, the platform would POST to:');
      console.log('   https://api.vapi.ai/call');
      console.log('   With body:');
      console.log(JSON.stringify({
        assistantId: assistant.id,
        phoneNumberId: phoneNumber.id,
        customer: {
          number: '+1234567890',
          name: 'Test Customer'
        }
      }, null, 2));
    } else {
      console.log('❌ Missing prerequisites for making calls');
    }
  } catch (error) {
    console.error('❌ Error testing call capability:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY:');
  console.log('=' .repeat(60));
  
  // Final check
  try {
    const finalAssistants = await axios.get('https://api.vapi.ai/assistant', { headers });
    const finalPhones = await axios.get('https://api.vapi.ai/phone-number', { headers });
    
    if (finalAssistants.data.length > 0 && finalPhones.data.length > 0) {
      console.log('\n✅ VAPI API is WORKING and CONFIGURED!');
      console.log('   - API key is valid');
      console.log('   - Assistants are available');
      console.log('   - Phone numbers are available');
      console.log('\n🚨 The issue is likely in the campaign execution logic!');
      console.log('\n💡 Next steps:');
      console.log('1. Check if campaigns are actually being started');
      console.log('2. Check the campaign execution/automation logic');
      console.log('3. Check for errors in the VAPI webhook handling');
      console.log('4. Verify the makeCall function is being triggered');
    } else {
      console.log('\n❌ VAPI API configuration issue detected');
    }
  } catch (error) {
    console.error('❌ Error in final check:', error.message);
  }
}

testVAPIConnection();