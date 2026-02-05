const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkCallQueueTable() {
  console.log('🔍 Checking call_queue table structure...\n');
  
  // Test if table exists by trying to query it
  const { data: testQuery, error: testError } = await supabase
    .from('call_queue')
    .select('*')
    .limit(1);
    
  if (testError) {
    console.log('❌ Error accessing call_queue table:', testError.message);
    console.log('\nTable might not exist. Let\'s create it...\n');
    
    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS call_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        campaign_id UUID NOT NULL,
        contact_id TEXT,
        phone_number TEXT NOT NULL,
        contact_name TEXT,
        attempt INTEGER DEFAULT 1,
        scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending',
        last_call_id TEXT,
        last_outcome TEXT,
        last_attempt_at TIMESTAMP WITH TIME ZONE,
        next_retry_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_call_queue_campaign_id ON call_queue(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);
      CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled_for ON call_queue(scheduled_for);
    `;
    
    console.log('SQL to create table:\n', createTableSQL);
    console.log('\nPlease execute this SQL in your Supabase dashboard.');
    return;
  }
  
  console.log('✅ call_queue table exists');
  
  // Check how many records
  const { count } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true });
    
  console.log('Total records in call_queue:', count);
  
  // Show some sample records
  const { data: samples } = await supabase
    .from('call_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (samples && samples.length > 0) {
    console.log('\nSample records:');
    samples.forEach(s => {
      console.log(`  ${s.contact_name} (${s.phone_number}) - Status: ${s.status}, Campaign: ${s.campaign_id}`);
    });
  }
  
  // Check if campaign_locks table exists
  const { error: lockError } = await supabase
    .from('campaign_locks')
    .select('*')
    .limit(1);
    
  if (lockError) {
    console.log('\n❌ campaign_locks table does not exist. Creating SQL...');
    
    const createLocksSQL = `
      CREATE TABLE IF NOT EXISTS campaign_locks (
        campaign_id UUID PRIMARY KEY,
        locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
    
    console.log('SQL to create campaign_locks table:\n', createLocksSQL);
  } else {
    console.log('\n✅ campaign_locks table exists');
  }
}

checkCallQueueTable().catch(console.error);