const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function restoreVapiIds() {
  console.log('Restoring real VAPI IDs for campaign 122...\n');
  
  const campaignId = 'a2d863b8-db48-4fc7-bfb0-d22f036921b4';
  
  // Get current campaign
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found campaign:', campaign.name);
  console.log('Current assistant_id in settings:', campaign.settings.assistant_id);
  console.log('Current phone_number_id in settings:', campaign.settings.phone_number_id);
  
  // The campaign originally had these IDs in the settings before our fix:
  // assistant_id: "b6c626b2-d159-42f3-a8cd-cad8d0f7536c"
  // phone_number_id: "d49a7d01-7caa-4421-b634-e8057494913d"
  
  const updatedSettings = {
    ...campaign.settings,
    assistant_id: 'b6c626b2-d159-42f3-a8cd-cad8d0f7536c', // Real VAPI assistant ID
    phone_number_id: 'd49a7d01-7caa-4421-b634-e8057494913d' // Real VAPI phone ID
  };
  
  console.log('\nUpdating with real VAPI IDs...');
  
  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update({ 
      settings: updatedSettings,
      // Also set these at the top level if they exist as columns
      assistant_id: 'b6c626b2-d159-42f3-a8cd-cad8d0f7536c',
      phone_number_id: 'd49a7d01-7caa-4421-b634-e8057494913d'
    })
    .eq('id', campaignId)
    .select()
    .single();
    
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('\n✅ Campaign updated with real VAPI IDs!');
    console.log('Assistant ID:', updatedSettings.assistant_id);
    console.log('Phone Number ID:', updatedSettings.phone_number_id);
    console.log('\nThe campaign should now be able to make real calls through VAPI.');
  }
}

restoreVapiIds();