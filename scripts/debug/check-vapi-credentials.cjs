// Check if VAPI credentials are properly configured in the database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkVAPICredentials() {
  console.log('🔍 CHECKING VAPI CONFIGURATION STATUS\n');
  console.log('=' .repeat(60));
  
  // 1. Check vapi_credentials table
  console.log('\n📋 VAPI CREDENTIALS TABLE:');
  console.log('-' .repeat(60));
  
  const { data: credentials, error: credError } = await supabase
    .from('vapi_credentials')
    .select('*');
    
  if (credError) {
    console.error('❌ Error fetching vapi_credentials:', credError.message);
  } else if (!credentials || credentials.length === 0) {
    console.log('❌ No VAPI credentials found in database!');
  } else {
    console.log(`✅ Found ${credentials.length} VAPI credential entries:`);
    credentials.forEach(cred => {
      console.log(`\n  Organization: ${cred.organization_id}`);
      console.log(`  API Key: ${cred.api_key ? '***' + cred.api_key.slice(-4) : 'NOT SET'}`);
      console.log(`  Public Key: ${cred.public_key ? '***' + cred.public_key.slice(-4) : 'NOT SET'}`);
      console.log(`  Private Key: ${cred.private_key ? '***' + cred.private_key.slice(-4) : 'NOT SET'}`);
      console.log(`  Active: ${cred.is_active ? 'YES' : 'NO'}`);
      console.log(`  Created: ${cred.created_at}`);
    });
  }
  
  // 2. Check organizations table for vapi_settings
  console.log('\n\n📊 ORGANIZATION VAPI SETTINGS:');
  console.log('-' .repeat(60));
  
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, vapi_api_key, vapi_settings');
    
  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError.message);
  } else if (orgs && orgs.length > 0) {
    orgs.forEach(org => {
      console.log(`\nOrganization: ${org.name} (${org.id})`);
      console.log(`  VAPI API Key: ${org.vapi_api_key ? '***' + org.vapi_api_key.slice(-4) : 'NOT SET'}`);
      console.log(`  VAPI Settings: ${org.vapi_settings ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      
      if (org.vapi_settings) {
        try {
          const settings = typeof org.vapi_settings === 'string' ? 
            JSON.parse(org.vapi_settings) : org.vapi_settings;
          console.log(`    - Assistant ID: ${settings.assistantId || 'NOT SET'}`);
          console.log(`    - Phone Number ID: ${settings.phoneNumberId || 'NOT SET'}`);
        } catch (e) {
          console.log(`    - Settings parse error: ${e.message}`);
        }
      }
    });
  }
  
  // 3. Check vapi_assistants table
  console.log('\n\n🤖 VAPI ASSISTANTS:');
  console.log('-' .repeat(60));
  
  const { data: assistants, error: assistError } = await supabase
    .from('vapi_assistants')
    .select('*');
    
  if (assistError) {
    if (assistError.message.includes('does not exist')) {
      console.log('ℹ️ vapi_assistants table does not exist');
    } else {
      console.error('❌ Error fetching assistants:', assistError.message);
    }
  } else if (!assistants || assistants.length === 0) {
    console.log('❌ No VAPI assistants configured!');
  } else {
    console.log(`✅ Found ${assistants.length} VAPI assistants:`);
    assistants.forEach(assistant => {
      console.log(`\n  Name: ${assistant.name}`);
      console.log(`  VAPI ID: ${assistant.vapi_assistant_id}`);
      console.log(`  Organization: ${assistant.organization_id}`);
      console.log(`  Active: ${assistant.is_active ? 'YES' : 'NO'}`);
    });
  }
  
  // 4. Check phone_numbers table
  console.log('\n\n📞 PHONE NUMBERS:');
  console.log('-' .repeat(60));
  
  const { data: phones, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*');
    
  if (phoneError) {
    console.error('❌ Error fetching phone_numbers:', phoneError.message);
  } else if (!phones || phones.length === 0) {
    console.log('❌ No phone numbers configured!');
  } else {
    console.log(`✅ Found ${phones.length} phone numbers:`);
    phones.forEach(phone => {
      console.log(`\n  Number: ${phone.phone_number}`);
      console.log(`  VAPI ID: ${phone.vapi_phone_id || 'NOT SET'}`);
      console.log(`  Organization: ${phone.organization_id}`);
      console.log(`  Type: ${phone.type}`);
      console.log(`  Active: ${phone.is_active ? 'YES' : 'NO'}`);
    });
  }
  
  // 5. Summary and recommendations
  console.log('\n\n' + '=' .repeat(60));
  console.log('📋 CONFIGURATION SUMMARY:');
  console.log('=' .repeat(60));
  
  const hasCredentials = credentials && credentials.length > 0 && 
    credentials.some(c => c.api_key && c.is_active);
  const hasAssistants = assistants && assistants.length > 0 && 
    assistants.some(a => a.vapi_assistant_id && a.is_active);
  const hasPhones = phones && phones.length > 0 && 
    phones.some(p => p.vapi_phone_id && p.is_active);
  
  if (hasCredentials && hasAssistants && hasPhones) {
    console.log('\n✅ VAPI is FULLY CONFIGURED and ready to make calls!');
  } else {
    console.log('\n⚠️  VAPI is NOT PROPERLY CONFIGURED!');
    console.log('\nMissing components:');
    if (!hasCredentials) console.log('  ❌ No active VAPI API credentials');
    if (!hasAssistants) console.log('  ❌ No VAPI assistants configured');
    if (!hasPhones) console.log('  ❌ No VAPI phone numbers configured');
    
    console.log('\n💡 TO FIX THIS:');
    console.log('1. Go to your VAPI dashboard (https://vapi.ai)');
    console.log('2. Get your API key from Settings');
    console.log('3. Create an Assistant and get its ID');
    console.log('4. Purchase/configure a phone number and get its ID');
    console.log('5. Add these to your database using the platform settings');
    console.log('\nOr run: node setup-vapi-credentials.cjs');
  }
  
  console.log('\n' + '=' .repeat(60));
}

checkVAPICredentials();