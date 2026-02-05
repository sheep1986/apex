const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://twigokrtbvigiqnaybyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupPhoneNumbers() {
  console.log('🔄 Setting up phone numbers for Apex platform...\n');

  try {
    // First, check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('phone_numbers')
      .select('id')
      .limit(1);

    if (!checkError || !checkError.message.includes('does not exist')) {
      console.log('✅ Phone numbers table already exists');
      
      // Check current phone numbers
      const { data: phoneNumbers, error: fetchError } = await supabase
        .from('phone_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (phoneNumbers && phoneNumbers.length > 0) {
        console.log(`\n📞 Found ${phoneNumbers.length} existing phone numbers:`);
        phoneNumbers.forEach(pn => {
          console.log(`  - ${pn.friendly_name || 'Unnamed'}: ${pn.phone_number} (${pn.status})`);
        });
      } else {
        console.log('\n⚠️ No phone numbers found. You need to add phone numbers.');
      }
      
      return;
    }

    console.log('📝 Phone numbers table does not exist.');
    console.log('Please run the following SQL in your Supabase SQL editor:\n');
    console.log('1. Go to https://supabase.com/dashboard/project/twigokrtbvigiqnaybyf/sql');
    console.log('2. Copy the contents of create_phone_numbers_table.sql');
    console.log('3. Paste and run in the SQL editor\n');

    // Try to add sample phone numbers if table exists
    await addSamplePhoneNumbers();

  } catch (error) {
    console.error('❌ Error setting up phone numbers:', error);
  }
}

async function addSamplePhoneNumbers() {
  console.log('\n📞 Adding sample phone numbers...');

  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'; // Emerald Green Energy

  const samplePhoneNumbers = [
    {
      organization_id: organizationId,
      phone_number: '+14155551001',
      friendly_name: 'Sales Line 1',
      country_code: '+1',
      area_code: '415',
      provider: 'vapi',
      provider_id: 'sample_vapi_1',
      status: 'active',
      is_available: true,
      max_calls_per_hour: 60,
      max_calls_per_day: 500,
      monthly_cost: 15.00,
      per_minute_cost: 0.015,
      capabilities: {
        voice: true,
        sms: false,
        recording: true,
        transcription: true
      },
      tags: ['primary', 'sales', 'us-west']
    },
    {
      organization_id: organizationId,
      phone_number: '+14155551002',
      friendly_name: 'Sales Line 2',
      country_code: '+1',
      area_code: '415',
      provider: 'vapi',
      provider_id: 'sample_vapi_2',
      status: 'active',
      is_available: true,
      max_calls_per_hour: 60,
      max_calls_per_day: 500,
      monthly_cost: 15.00,
      per_minute_cost: 0.015,
      capabilities: {
        voice: true,
        sms: false,
        recording: true,
        transcription: true
      },
      tags: ['backup', 'sales', 'us-west']
    },
    {
      organization_id: organizationId,
      phone_number: '+442079460001',
      friendly_name: 'UK Sales Line',
      country_code: '+44',
      area_code: '207',
      provider: 'vapi',
      provider_id: 'sample_vapi_uk_1',
      status: 'active',
      is_available: true,
      max_calls_per_hour: 60,
      max_calls_per_day: 500,
      monthly_cost: 20.00,
      per_minute_cost: 0.020,
      capabilities: {
        voice: true,
        sms: false,
        recording: true,
        transcription: true
      },
      tags: ['primary', 'sales', 'uk']
    }
  ];

  for (const phoneNumber of samplePhoneNumbers) {
    try {
      // Check if phone number already exists
      const { data: existing } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('phone_number', phoneNumber.phone_number)
        .single();

      if (existing) {
        console.log(`  ⏭️ Phone number ${phoneNumber.phone_number} already exists`);
        continue;
      }

      // Insert new phone number
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert([phoneNumber])
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error adding ${phoneNumber.phone_number}:`, error.message);
      } else {
        console.log(`  ✅ Added ${phoneNumber.friendly_name}: ${phoneNumber.phone_number}`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${phoneNumber.phone_number}:`, err.message);
    }
  }
}

// Function to check phone number usage
async function checkPhoneNumberUsage() {
  console.log('\n📊 Checking phone number usage...');

  const { data: phoneNumbers, error } = await supabase
    .from('phone_numbers')
    .select(`
      *,
      campaigns!current_campaign_id (
        name,
        status
      )
    `)
    .order('last_used_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching phone numbers:', error);
    return;
  }

  if (phoneNumbers && phoneNumbers.length > 0) {
    console.log('\nPhone Number Status Report:');
    console.log('═══════════════════════════════════════════');
    
    phoneNumbers.forEach(pn => {
      console.log(`\n📞 ${pn.friendly_name || 'Unnamed'}`);
      console.log(`   Number: ${pn.phone_number}`);
      console.log(`   Status: ${pn.status}`);
      console.log(`   Available: ${pn.is_available ? 'Yes' : 'No'}`);
      console.log(`   Current Campaign: ${pn.campaigns ? pn.campaigns.name : 'None'}`);
      console.log(`   Calls Today: ${pn.current_day_calls}/${pn.max_calls_per_day}`);
      console.log(`   Calls This Hour: ${pn.current_hour_calls}/${pn.max_calls_per_hour}`);
      console.log(`   Last Used: ${pn.last_used_at ? new Date(pn.last_used_at).toLocaleString() : 'Never'}`);
      console.log(`   Monthly Cost: $${pn.monthly_cost}`);
      console.log(`   Per Minute: $${pn.per_minute_cost}`);
    });
  } else {
    console.log('No phone numbers found in the system.');
  }
}

// Main execution
async function main() {
  await setupPhoneNumbers();
  
  // Uncomment to check usage after setup
  // await checkPhoneNumberUsage();
}

main().catch(console.error);