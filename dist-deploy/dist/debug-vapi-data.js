// Debug script to check what VAPI data is being loaded
console.log('🔍 Debugging VAPI data in Campaign Wizard...');

// Get the current auth token
const devRole = localStorage.getItem('dev-auth-role') || 'client_admin';
const token = `test-token-${devRole}`;

async function debugVAPIData() {
  try {
    // Check backend health
    console.log('\n📡 Checking backend...');
    try {
      const healthRes = await fetch('/api/health');
      console.log('Backend status:', healthRes.ok ? '✅ Running' : '❌ Not running');
    } catch (e) {
      console.log('Backend status: ❌ Not accessible');
    }
    
    // Fetch phone numbers
    console.log('\n📱 Fetching phone numbers from backend...');
    const phoneRes = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const phoneData = await phoneRes.json();
    console.log('Phone numbers response:', phoneData);
    
    if (phoneData.phoneNumbers && phoneData.phoneNumbers.length > 0) {
      console.log('\n📋 Phone numbers structure:');
      phoneData.phoneNumbers.forEach((phone, index) => {
        console.log(`Phone ${index + 1}:`, {
          id: phone.id,
          number: phone.number || phone.phoneNumber,
          name: phone.name || phone.friendlyName,
          provider: phone.provider,
          country: phone.country,
          raw: phone
        });
      });
    }
    
    // Fetch assistants
    console.log('\n🤖 Fetching assistants from backend...');
    const assistantRes = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const assistantData = await assistantRes.json();
    console.log('Assistants response:', assistantData);
    
    if (assistantData.assistants && assistantData.assistants.length > 0) {
      console.log('\n📋 Assistants structure:');
      assistantData.assistants.forEach((assistant, index) => {
        console.log(`Assistant ${index + 1}:`, {
          id: assistant.id,
          name: assistant.name,
          model: assistant.model,
          voice: assistant.voice,
          raw: assistant
        });
      });
    }
    
    // Check what the campaign wizard expects
    console.log('\n🎯 Expected data format for campaign wizard:');
    console.log('Phone: { id: string, number: string, name?: string }');
    console.log('Assistant: { id: string, name: string }');
    
    // Check if there's a data format mismatch
    if (phoneData.phoneNumbers && phoneData.phoneNumbers.length > 0) {
      const firstPhone = phoneData.phoneNumbers[0];
      console.log('\n⚠️ Data format check:');
      console.log('Has .number field?', !!firstPhone.number);
      console.log('Has .phoneNumber field?', !!firstPhone.phoneNumber);
      console.log('Has .id field?', !!firstPhone.id);
      
      if (!firstPhone.number && firstPhone.phoneNumber) {
        console.log('❌ MISMATCH: API returns .phoneNumber but wizard expects .number');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Also check React component state
console.log('\n🔍 Checking React state...');
console.log('Look for phoneNumbers state in React DevTools');
console.log('The SimpleCampaignWizard component should have:');
console.log('- phoneNumbers: Array of phone objects');
console.log('- assistants: Array of assistant objects');
console.log('- loadingVapiData: boolean');

debugVAPIData();