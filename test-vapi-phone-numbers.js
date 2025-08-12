// Test VAPI phone numbers endpoint directly
async function testVAPIPhoneNumbers() {
  const token = localStorage.getItem('clerk-token') || localStorage.getItem('dev-auth-enabled') === 'true' ? `test-token-${localStorage.getItem('dev-auth-role')}` : '';
  
  console.log('Testing VAPI phone numbers endpoint...');
  
  try {
    const response = await fetch('/api/vapi-data/phone-numbers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.phoneNumbers && data.phoneNumbers.length > 0) {
      console.log('✅ Phone numbers found:', data.phoneNumbers.length);
      data.phoneNumbers.forEach(phone => {
        console.log(`  - ${phone.number || phone.phoneNumber} (${phone.name || 'No name'})`);
      });
    } else {
      console.log('❌ No phone numbers found');
      if (data.message) {
        console.log('Message:', data.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testVAPIPhoneNumbers();