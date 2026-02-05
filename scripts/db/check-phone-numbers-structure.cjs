const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://twigokrtbvigiqnaybyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPhoneNumbersTable() {
  console.log('🔍 Checking phone_numbers table structure...\n');

  try {
    // First, try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Table "phone_numbers" does not exist');
        console.log('\n📝 To create the table, run this SQL in Supabase:');
        console.log('   Go to: https://supabase.com/dashboard/project/twigokrtbvigiqnaybyf/sql');
        console.log('   Then run the SQL from: create_phone_numbers_table.sql\n');
        return;
      } else {
        console.log('⚠️ Error querying table:', error.message);
        console.log('\nThis might mean some columns are missing.');
        console.log('Run the SQL from fix_phone_numbers_table.sql to add missing columns.\n');
      }
    } else {
      console.log('✅ Table "phone_numbers" exists\n');
      
      if (data && data.length > 0) {
        console.log('📊 Sample record structure:');
        const sampleRecord = data[0];
        const columns = Object.keys(sampleRecord);
        console.log('Columns found:', columns.join(', '));
        
        console.log('\n📋 Column details:');
        columns.forEach(col => {
          const value = sampleRecord[col];
          const type = value === null ? 'null' : typeof value;
          console.log(`  - ${col}: ${type}`);
        });
      } else {
        console.log('ℹ️ Table exists but is empty');
      }
    }

    // Try to check specific columns
    console.log('\n🔍 Checking for required columns...');
    const requiredColumns = [
      'id',
      'organization_id',
      'phone_number',
      'status',
      'is_available',
      'current_campaign_id',
      'last_used_at',
      'max_calls_per_hour',
      'max_calls_per_day',
      'created_at',
      'updated_at'
    ];

    const { data: testData, error: testError } = await supabase
      .from('phone_numbers')
      .select(requiredColumns.join(','))
      .limit(1);

    if (testError) {
      console.log('\n⚠️ Some required columns are missing:');
      const errorMessage = testError.message;
      requiredColumns.forEach(col => {
        if (errorMessage.includes(`column "${col}" does not exist`)) {
          console.log(`  ❌ ${col} - MISSING`);
        } else {
          console.log(`  ✅ ${col} - exists`);
        }
      });
      
      console.log('\n📝 To fix this, run the SQL from: fix_phone_numbers_table.sql');
    } else {
      console.log('✅ All required columns exist');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Also check if we can query the table with basic filters
async function testPhoneNumberQueries() {
  console.log('\n🧪 Testing phone number queries...\n');

  try {
    // Test 1: Get all active phone numbers
    const { data: activeNumbers, error: activeError } = await supabase
      .from('phone_numbers')
      .select('phone_number, status')
      .eq('status', 'active');

    if (activeError) {
      console.log('❌ Cannot query by status:', activeError.message);
    } else {
      console.log(`✅ Found ${activeNumbers?.length || 0} active phone numbers`);
    }

    // Test 2: Get available phone numbers
    const { data: availableNumbers, error: availableError } = await supabase
      .from('phone_numbers')
      .select('phone_number')
      .eq('is_available', true);

    if (availableError) {
      console.log('❌ Cannot query by is_available:', availableError.message);
      console.log('   This column needs to be added. Run fix_phone_numbers_table.sql');
    } else {
      console.log(`✅ Found ${availableNumbers?.length || 0} available phone numbers`);
    }

    // Test 3: Check organization filter
    const orgId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
    const { data: orgNumbers, error: orgError } = await supabase
      .from('phone_numbers')
      .select('phone_number')
      .eq('organization_id', orgId);

    if (orgError) {
      console.log('❌ Cannot query by organization_id:', orgError.message);
    } else {
      console.log(`✅ Found ${orgNumbers?.length || 0} phone numbers for organization`);
    }

  } catch (err) {
    console.error('❌ Test query error:', err);
  }
}

// Main execution
async function main() {
  await checkPhoneNumbersTable();
  await testPhoneNumberQueries();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('📌 Next Steps:');
  console.log('1. If table is missing: Run create_phone_numbers_table.sql');
  console.log('2. If columns are missing: Run fix_phone_numbers_table.sql');
  console.log('3. After fixing, run: node setup-phone-numbers.js');
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);