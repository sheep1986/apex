const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTablesStructure() {
  console.log('🔍 Checking Calls Table Structure...\n');
  
  // Try to get a sample record to see the structure
  const { data: sampleCall, error: callError } = await supabase
    .from('calls')
    .select('*')
    .limit(1);
  
  if (callError) {
    console.error('Error accessing calls table:', callError);
  } else {
    console.log('📞 Calls table structure:');
    if (sampleCall.length > 0) {
      console.log('Available columns:', Object.keys(sampleCall[0]).join(', '));
      console.log('\nSample record:');
      console.log(JSON.stringify(sampleCall[0], null, 2));
    } else {
      console.log('Table exists but no records found. Let me try to insert a minimal record...');
    }
  }
  
  console.log('\n🎯 Checking Leads Table Structure...\n');
  
  const { data: sampleLead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
  
  if (leadError) {
    console.error('Error accessing leads table:', leadError);
  } else {
    console.log('📋 Leads table structure:');
    if (sampleLead.length > 0) {
      console.log('Available columns:', Object.keys(sampleLead[0]).join(', '));
      console.log('\nSample record:');
      console.log(JSON.stringify(sampleLead[0], null, 2));
    } else {
      console.log('Leads table exists but no records found');
    }
  }
  
  console.log('\n📊 Table counts:');
  
  const { count: callCount } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true });
  
  const { count: leadCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Calls: ${callCount || 0}`);
  console.log(`Leads: ${leadCount || 0}`);
}

checkTablesStructure();