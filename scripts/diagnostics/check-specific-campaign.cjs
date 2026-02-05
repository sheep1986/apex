const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkSpecificCampaign() {
  console.log('Checking the fixed campaign (122)...\n');
  
  // Get the campaign by ID
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', 'a2d863b8-db48-4fc7-bfb0-d22f036921b4')
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!campaign) {
    console.log('Campaign not found');
    return;
  }
  
  console.log(`=== Campaign: ${campaign.name} (${campaign.id}) ===`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Type: ${campaign.type}`);
  console.log(`Organization: ${campaign.organization_id}`);
  console.log(`Created: ${campaign.created_at}`);
  console.log(`Updated: ${campaign.updated_at}`);
  
  // Check settings
  if (campaign.settings) {
    const settings = campaign.settings;
    console.log('\nSettings Overview:');
    console.log(`- Assistant ID: ${settings.assistant_id || 'NOT SET'}`);
    console.log(`- Phone Number ID: ${settings.phone_number_id || 'NOT SET'}`);
    console.log(`- CSV Data: ${settings.csv_data ? 'Present (' + settings.csv_data.length + ' chars)' : 'NOT SET'}`);
    console.log(`- Working Hours: ${settings.working_hours_start || 'NOT SET'} - ${settings.working_hours_end || 'NOT SET'}`);
    console.log(`- Time Zone: ${settings.time_zone || 'NOT SET'}`);
    console.log(`- Calls Per Day: ${settings.calls_per_day || 'NOT SET'}`);
    console.log(`- Total Leads: ${settings.total_leads || 0}`);
    console.log(`- Calls Completed: ${settings.calls_completed || 0}`);
    
    // Parse CSV to show phone numbers
    if (settings.csv_data) {
      try {
        const lines = settings.csv_data.split('\n');
        console.log(`\nPhone numbers from CSV (first 5):`);
        for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
          const line = lines[i].trim();
          if (line) {
            const parts = line.split(',');
            console.log(`  - ${parts[0]} (${parts[1] || 'No name'})`);
          }
        }
      } catch (e) {
        console.log('Could not parse CSV data:', e.message);
      }
    }
    
    // Check for issues
    console.log('\n=== Campaign Readiness Check ===');
    const issues = [];
    
    if (!settings.assistant_id) issues.push('Missing assistant ID');
    else if (settings.assistant_id.startsWith('asst_test_')) issues.push('Using test assistant ID (needs real VAPI assistant)');
    
    if (!settings.phone_number_id) issues.push('Missing phone number ID');
    else if (settings.phone_number_id.startsWith('phone_test_')) issues.push('Using test phone ID (needs real VAPI phone)');
    
    if (!settings.csv_data) issues.push('Missing CSV data');
    if (!settings.working_hours_start) issues.push('Missing working hours start');
    if (!settings.working_hours_end) issues.push('Missing working hours end');
    if (!settings.time_zone) issues.push('Missing time zone');
    
    if (issues.length === 0) {
      console.log('✅ All required fields are present');
      console.log('⚠️  Note: Assistant and phone IDs need to be real VAPI resources');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\nFull settings object:');
    console.log(JSON.stringify(settings, null, 2));
  } else {
    console.log('\n⚠️  NO SETTINGS COLUMN - This campaign won\'t work!');
  }
}

checkSpecificCampaign();