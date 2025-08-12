const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'YOUR_SUPABASE_KEY_HERE' // You'll need to add your key
);

async function checkPhoneNumbers() {
  console.log('🔍 Checking VAPI phone numbers in database...\n');
  
  // Check for any VAPI phone numbers in the database
  const { data: phoneNumbers, error } = await supabase
    .from('vapi_phone_numbers')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (!phoneNumbers || phoneNumbers.length === 0) {
    console.log('❌ No phone numbers found in database');
    console.log('\n💡 You need to:');
    console.log('1. Go to https://dashboard.vapi.ai');
    console.log('2. Purchase a phone number');
    console.log('3. The phone number should then sync to your database');
  } else {
    console.log(`✅ Found ${phoneNumbers.length} phone numbers:`);
    phoneNumbers.forEach(p => {
      console.log(`  - ${p.number} (${p.provider})`);
    });
  }
}

// Note: You'll need to run this with your Supabase key
console.log('Add your SUPABASE_SERVICE_ROLE_KEY to this script and run it');
// checkPhoneNumbers();