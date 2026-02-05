const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkVAPIConfig() {
  console.log('🔍 Checking VAPI configuration...\n');
  
  // Check organization VAPI keys
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, vapi_api_key, vapi_private_key')
    .eq('id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
    .single();
    
  if (orgError) {
    console.error('❌ Error fetching organization:', orgError);
    return;
  }
  
  console.log('📋 Organization:', org.name);
  console.log('🔑 VAPI API Key (public):', org.vapi_api_key ? '✅ Configured' : '❌ Not configured');
  console.log('🔐 VAPI Private Key:', org.vapi_private_key ? '✅ Configured' : '❌ Not configured');
  
  // Check for any VAPI assistants
  const { data: assistants, error: assistError } = await supabase
    .from('vapi_assistants')
    .select('*')
    .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
    .limit(5);
    
  console.log('\n📞 VAPI Assistants:', assistants?.length || 0);
  if (assistants?.length > 0) {
    assistants.forEach(a => {
      console.log(`  - ${a.name} (${a.vapi_assistant_id})`);
    });
  }
  
  // Check for any VAPI phone numbers
  const { data: phoneNumbers, error: phoneError } = await supabase
    .from('vapi_phone_numbers')
    .select('*')
    .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
    .limit(5);
    
  console.log('\n☎️ VAPI Phone Numbers:', phoneNumbers?.length || 0);
  if (phoneNumbers?.length > 0) {
    phoneNumbers.forEach(p => {
      console.log(`  - ${p.number} (${p.vapi_phone_id})`);
    });
  }
  
  console.log('\n💡 To fix this issue:');
  console.log('1. Add VAPI API keys to the organization');
  console.log('2. Or add mock VAPI assistants and phone numbers to the database');
  console.log('3. Or update the API to return development/mock data when no VAPI keys are present');
}

checkVAPIConfig();