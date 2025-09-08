const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkActiveCampaigns() {
  console.log('Checking active campaigns and their settings...\n');
  
  // Get active campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${campaigns.length} active campaigns:\n`);
  
  for (const campaign of campaigns) {
    console.log(`\n=== Campaign: ${campaign.name} (${campaign.id}) ===`);
    console.log(`Status: ${campaign.status}`);
    console.log(`Type: ${campaign.type}`);
    console.log(`Organization: ${campaign.organization_id}`);
    
    // Check settings column
    if (campaign.settings) {
      const settings = campaign.settings;
      console.log('\nSettings:');
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
          console.log(`\nFirst 3 phone numbers from CSV:`);
          for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
            const line = lines[i].trim();
            if (line) {
              console.log(`  - ${line.split(',')[0]}`);
            }
          }
        } catch (e) {
          console.log('Could not parse CSV data');
        }
      }
    } else {
      console.log('\n⚠️  NO SETTINGS COLUMN - This campaign won\'t work!');
    }
    
    console.log('---');
  }
  
  // Check for campaigns with missing critical data
  console.log('\n=== Checking for issues ===');
  for (const campaign of campaigns) {
    const issues = [];
    const settings = campaign.settings || {};
    
    if (!settings.assistant_id) issues.push('No assistant');
    if (!settings.phone_number_id) issues.push('No phone number');
    if (!settings.csv_data) issues.push('No CSV data');
    if (!settings.working_hours_start) issues.push('No working hours');
    
    if (issues.length > 0) {
      console.log(`\n❌ ${campaign.name}: ${issues.join(', ')}`);
    } else {
      console.log(`\n✅ ${campaign.name}: All required data present`);
    }
  }
}

checkActiveCampaigns();