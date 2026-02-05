const { createClient } = require('@supabase/supabase-js');

// Use service role key for DDL operations
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNTI2OSwiZXhwIjoyMDY2NzExMjY5fQ.MqOJi_ID8sOwh-DtzT9A7G4mYmSiFLJhUdA5xAgE8kM'
);

async function checkAndFixSchemas() {
  console.log('🔍 Checking and fixing table schemas...\n');
  
  // First, check what columns exist in call_queue
  console.log('📋 Checking call_queue columns...');
  const { data: callQueueColumns, error: cqError } = await supabase.rpc('get_table_columns', {
    table_name: 'call_queue'
  }).catch(() => ({ data: null, error: 'RPC function not found' }));
  
  // If RPC doesn't work, try a different approach
  if (cqError || !callQueueColumns) {
    console.log('⚠️ Could not get columns via RPC, trying direct query...');
    
    // Try to select from the table to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('call_queue')
      .select('*')
      .limit(1);
      
    if (!sampleError && sampleData) {
      const existingColumns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
      console.log('Existing columns in call_queue:', existingColumns);
    }
  }
  
  // Add missing columns to call_queue
  console.log('\n📝 Adding missing columns to call_queue...');
  
  const callQueueAlters = [
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS attempt INTEGER DEFAULT 1`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS contact_id TEXT`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS contact_name TEXT`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_call_id TEXT`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_outcome TEXT`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE`
  ];
  
  for (const sql of callQueueAlters) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: 'Cannot execute DDL via RPC' }));
    if (error) {
      console.log(`⚠️ Could not execute: ${sql.substring(0, 50)}...`);
      console.log('  Please run this SQL manually in Supabase dashboard');
    } else {
      console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
    }
  }
  
  // Add missing columns to campaigns
  console.log('\n📝 Adding missing columns to campaigns...');
  
  const campaignAlters = [
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE`
  ];
  
  for (const sql of campaignAlters) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: 'Cannot execute DDL via RPC' }));
    if (error) {
      console.log(`⚠️ Could not execute: ${sql.substring(0, 50)}...`);
      console.log('  Please run this SQL manually in Supabase dashboard');
    } else {
      console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
    }
  }
  
  // Create indices
  console.log('\n📝 Creating indices...');
  
  const indexSqls = [
    `CREATE INDEX IF NOT EXISTS idx_call_queue_campaign_id ON call_queue(campaign_id)`,
    `CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status)`,
    `CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled_for ON call_queue(scheduled_for)`
  ];
  
  for (const sql of indexSqls) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: 'Cannot execute DDL via RPC' }));
    if (error) {
      console.log(`⚠️ Could not execute: ${sql.substring(0, 50)}...`);
    } else {
      console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
    }
  }
  
  console.log('\n📌 IMPORTANT: If you see warnings above, please run the following SQL in your Supabase dashboard:\n');
  console.log('```sql');
  console.log(callQueueAlters.join(';\n') + ';');
  console.log(campaignAlters.join(';\n') + ';');
  console.log(indexSqls.join(';\n') + ';');
  console.log('```');
  
  // Now test if we can insert into call_queue with the new schema
  console.log('\n🧪 Testing call_queue insertion with new schema...');
  
  const testEntry = {
    campaign_id: '00000000-0000-0000-0000-000000000000', // Test UUID
    phone_number: '+1234567890',
    contact_name: 'Test Contact',
    contact_id: 'test_1',
    attempt: 1,
    scheduled_for: new Date().toISOString(),
    status: 'test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error: insertError } = await supabase
    .from('call_queue')
    .insert(testEntry);
    
  if (insertError) {
    console.log('❌ Test insertion failed:', insertError.message);
    console.log('  The schema needs to be updated manually');
  } else {
    console.log('✅ Test insertion successful!');
    
    // Clean up test entry
    await supabase
      .from('call_queue')
      .delete()
      .eq('status', 'test');
  }
}

checkAndFixSchemas().catch(console.error);