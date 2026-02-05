const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getVapiKey() {
  // Get organization's VAPI key
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📋 Organization:', org.name);
  console.log('   VAPI Key:', org.vapi_api_key || 'Not set');
  console.log('   VAPI Private Key:', org.vapi_private_key || 'Not set');
  
  // Also check vapi_keys table
  const { data: vapiKeys } = await supabase
    .from('vapi_keys')
    .select('*')
    .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b');
  
  if (vapiKeys && vapiKeys.length > 0) {
    console.log('\n📑 VAPI Keys from vapi_keys table:');
    for (const key of vapiKeys) {
      console.log('   API Key:', key.api_key);
      console.log('   Is Active:', key.is_active);
      console.log('   Created:', key.created_at);
    }
  }
}

getVapiKey().catch(console.error);