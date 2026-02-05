const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkVapiResources() {
  console.log('Checking available VAPI resources...\n');
  
  // Check for assistants
  console.log('=== VAPI Assistants ===');
  const { data: assistants, error: assistantError } = await supabase
    .from('vapi_assistants')
    .select('*')
    .limit(5);
    
  if (assistantError) {
    console.error('Error fetching assistants:', assistantError);
  } else if (assistants && assistants.length > 0) {
    console.log(`Found ${assistants.length} assistants:`);
    assistants.forEach(a => {
      console.log(`- ${a.name || 'Unnamed'} (ID: ${a.id})`);
      console.log(`  Organization: ${a.organization_id}`);
      console.log(`  VAPI Assistant ID: ${a.vapi_assistant_id || 'NOT SET'}`);
    });
  } else {
    console.log('No assistants found');
  }
  
  // Check for phone numbers
  console.log('\n=== VAPI Phone Numbers ===');
  const { data: phoneNumbers, error: phoneError } = await supabase
    .from('vapi_phone_numbers')
    .select('*')
    .limit(5);
    
  if (phoneError) {
    console.error('Error fetching phone numbers:', phoneError);
  } else if (phoneNumbers && phoneNumbers.length > 0) {
    console.log(`Found ${phoneNumbers.length} phone numbers:`);
    phoneNumbers.forEach(p => {
      console.log(`- ${p.number || 'Unknown'} (ID: ${p.id})`);
      console.log(`  Organization: ${p.organization_id}`);
      console.log(`  VAPI Phone ID: ${p.vapi_phone_id || 'NOT SET'}`);
    });
  } else {
    console.log('No phone numbers found');
  }
  
  // Check organizations with VAPI keys
  console.log('\n=== Organizations with VAPI Keys ===');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, vapi_api_key, vapi_public_key')
    .not('vapi_api_key', 'is', null)
    .limit(5);
    
  if (orgError) {
    console.error('Error fetching organizations:', orgError);
  } else if (orgs && orgs.length > 0) {
    console.log(`Found ${orgs.length} organizations with VAPI keys:`);
    orgs.forEach(o => {
      console.log(`- ${o.name} (ID: ${o.id})`);
      console.log(`  Has API Key: ${!!o.vapi_api_key}`);
      console.log(`  Has Public Key: ${!!o.vapi_public_key}`);
    });
  } else {
    console.log('No organizations with VAPI keys found');
  }
  
  // Get sample CSV data for testing
  console.log('\n=== Sample CSV Data for Testing ===');
  console.log('Phone Number,Name,Email');
  console.log('+15551234567,John Doe,john@example.com');
  console.log('+15551234568,Jane Smith,jane@example.com');
  console.log('+15551234569,Bob Johnson,bob@example.com');
}

checkVapiResources();