const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkSchemas() {
  console.log('🔍 Checking table schemas...\n');
  
  // Check campaign_contacts
  console.log('📋 campaign_contacts table:');
  const { data: contactsSample, error: contactsError } = await supabase
    .from('campaign_contacts')
    .select('*')
    .limit(1);
    
  if (contactsError) {
    console.log('  ❌ Error:', contactsError.message);
  } else if (contactsSample && contactsSample.length > 0) {
    console.log('  Columns:', Object.keys(contactsSample[0]).join(', '));
  } else {
    // Try to insert a test record to see what columns are required
    const testContact = {
      id: '00000000-0000-0000-0000-000000000001',
      campaign_id: '00000000-0000-0000-0000-000000000000',
      phone: '+1234567890'
    };
    
    const { error: testError } = await supabase
      .from('campaign_contacts')
      .insert(testContact);
      
    if (testError) {
      console.log('  Table exists but empty. Test insert error:', testError.message);
    } else {
      console.log('  Table exists and accepts basic fields');
      // Clean up
      await supabase
        .from('campaign_contacts')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000001');
    }
  }
  
  // Check call_queue
  console.log('\n📋 call_queue table:');
  const { data: queueSample, error: queueError } = await supabase
    .from('call_queue')
    .select('*')
    .limit(1);
    
  if (queueError) {
    console.log('  ❌ Error:', queueError.message);
  } else if (queueSample && queueSample.length > 0) {
    console.log('  Columns:', Object.keys(queueSample[0]).join(', '));
  } else {
    console.log('  Table exists but is empty');
  }
  
  // Check campaigns
  console.log('\n📋 campaigns table:');
  const { data: campaignSample } = await supabase
    .from('campaigns')
    .select('*')
    .limit(1);
    
  if (campaignSample && campaignSample.length > 0) {
    const columns = Object.keys(campaignSample[0]);
    console.log('  Key columns:', columns.filter(c => 
      c.includes('assistant') || 
      c.includes('phone') || 
      c.includes('settings') ||
      c.includes('status')
    ).join(', '));
  }
  
  console.log('\n📌 SQL to add missing columns:');
  console.log('```sql');
  console.log('-- Add name column to campaign_contacts if missing');
  console.log('ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS name TEXT;');
  console.log('ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS email TEXT;');
  console.log('ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS first_name TEXT;');
  console.log('ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_name TEXT;');
  console.log('');
  console.log('-- Ensure call_queue has all needed columns');
  console.log('ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS phone_number TEXT;');
  console.log('ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'pending\';');
  console.log('```');
}

checkSchemas().catch(console.error);