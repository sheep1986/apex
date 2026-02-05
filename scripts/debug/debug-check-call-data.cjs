#!/usr/bin/env node

/**
 * Quick script to check what call data exists in the database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCallData() {
  console.log('🔍 Checking for call-related tables...\n');

  // List of possible call tables to check
  const tablesToCheck = [
    'vapi_webhook_data',
    'calls', 
    'call_logs',
    'vapi_calls',
    'webhook_data',
    'call_data'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`📋 Checking table: ${tableName}`);
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${error.message}`);
    } else {
      console.log(`   ✅ Table exists with ${count || 0} records`);
      
      if (count && count > 0) {
        // Get a sample record to see the structure
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sample && sample[0]) {
          console.log(`   📄 Sample columns:`, Object.keys(sample[0]).slice(0, 10).join(', '));
        }
      }
    }
  }
  
  console.log('\n🔍 Now checking vapi_webhook_data specifically...\n');

  // Check if table exists and get count
  const { data: allData, error: countError, count } = await supabase
    .from('vapi_webhook_data')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error checking vapi_webhook_data table:', countError.message);
    console.log('\n💡 The vapi_webhook_data table needs to be created first.');
    return;
  }

  console.log(`📊 Total records in vapi_webhook_data: ${count || 0}\n`);

  if (count === 0) {
    console.log('💡 No webhook data found. The table is empty.');
    return;
  }

  if (count === 0) {
    console.log('💡 vapi_webhook_data table is empty. Checking calls table instead...\n');
  } else {
    console.log('✅ vapi_webhook_data has records.');
  }

  console.log('\n📈 Checking the `calls` table with actual data:');
  const { data: callsData, error: callsError } = await supabase
    .from('calls')
    .select('*')
    .limit(3);

  if (callsError) {
    console.error('❌ Error fetching calls data:', callsError.message);
    return;
  }

  if (callsData && callsData.length > 0) {
    console.log(`   Found ${callsData.length} records in calls table:`);
    console.log('\n📋 Full structure of first call record:');
    console.log(JSON.stringify(callsData[0], null, 2));
  } else {
    console.log('   No call records found.');
  }
}

checkCallData().catch(console.error);