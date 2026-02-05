// Test VAPI endpoints with updated backend
console.log('🔍 Testing VAPI Endpoints with Updated Backend...');
console.log('='.repeat(60));

async function testVAPIEndpoints() {
  try {
    // Get Clerk token
    const token = await window.Clerk.session.getToken();
    console.log('✅ Got Clerk token');
    
    // Test assistants endpoint
    console.log('\n1️⃣ Testing VAPI assistants endpoint...');
    const assistantsResponse = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Assistants response status:', assistantsResponse.status);
    const assistantsData = await assistantsResponse.json();
    console.log('Assistants data:', assistantsData);
    
    if (assistantsData.assistants && assistantsData.assistants.length > 0) {
      console.log('✅ SUCCESS! Retrieved', assistantsData.assistants.length, 'assistants:');
      assistantsData.assistants.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.name} (${a.id})`);
      });
    }
    
    // Test phone numbers endpoint
    console.log('\n2️⃣ Testing VAPI phone numbers endpoint...');
    const phoneResponse = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Phone numbers response status:', phoneResponse.status);
    const phoneData = await phoneResponse.json();
    console.log('Phone numbers data:', phoneData);
    
    if (phoneData.phoneNumbers && phoneData.phoneNumbers.length > 0) {
      console.log('✅ SUCCESS! Retrieved', phoneData.phoneNumbers.length, 'phone numbers:');
      phoneData.phoneNumbers.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.number} - ${p.name || 'Unnamed'} (${p.id})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testVAPIEndpoints();