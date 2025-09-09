const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function fixLatestCampaign() {
  console.log('Fixing the latest campaign with proper settings...\n');
  
  // Get the most recent campaign
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('No campaigns found');
    return;
  }
  
  const campaign = campaigns[0];
  
  console.log('Found campaign:', campaign.name, '(' + campaign.id + ')');
  console.log('Current settings:', JSON.stringify(campaign.settings, null, 2));
  
  // Get the CSV data that's already in settings
  const currentSettings = campaign.settings || {};
  const csvData = currentSettings.csv_data || currentSettings.csvData;
  
  // Fix the settings to include what the backend executor needs
  const fixedSettings = {
    ...currentSettings,
    // Keep existing data
    assistant_id: campaign.assistant_id || currentSettings.assistant_id,
    phone_number_id: campaign.phone_number_id || currentSettings.phone_number_id,
    csv_data: csvData,
    // Add the missing working hours and other settings
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    time_zone: 'America/New_York',
    calls_per_day: 100,
    max_concurrent_calls: 5,
    total_leads: csvData ? csvData.split('\n').filter(line => line.trim()).length - 1 : 1
  };
  
  console.log('\nUpdating with fixed settings:', JSON.stringify(fixedSettings, null, 2));
  
  // Update the campaign
  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update({ 
      settings: fixedSettings,
      status: 'active' // Make sure it's active
    })
    .eq('id', campaign.id)
    .select()
    .single();
    
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('\n✅ Campaign updated successfully!');
    console.log('The campaign should start making calls within 1-2 minutes.');
  }
}

fixLatestCampaign();