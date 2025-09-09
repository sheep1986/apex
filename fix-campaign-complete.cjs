const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function fixCampaignComplete() {
  console.log('Fixing campaign with complete settings...\n');
  
  // Target organization - Emerald Green Energy Ltd
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Get the first active campaign for this org
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('Error fetching campaigns:', error);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('No active campaigns found for organization');
    return;
  }
  
  const campaign = campaigns[0];
  console.log('Found campaign:', campaign.name, '(' + campaign.id + ')');
  console.log('Current status:', campaign.status);
  console.log('Current settings:', JSON.stringify(campaign.settings, null, 2));
  
  // Sample CSV data with test phone numbers
  const csvData = `Phone Number,Name,Email,Company
+15551234567,John Doe,john@example.com,Tech Corp
+15551234568,Jane Smith,jane@example.com,Design Studio
+15551234569,Bob Johnson,bob@example.com,Marketing Inc`;
  
  // Create comprehensive settings
  const fixedSettings = {
    // VAPI Integration (using placeholder IDs that would need to be created in VAPI)
    assistant_id: 'asst_test_' + Date.now(), // This would need to be a real VAPI assistant ID
    phone_number_id: 'phone_test_' + Date.now(), // This would need to be a real VAPI phone ID
    
    // CSV Data
    csv_data: csvData,
    
    // Campaign Configuration
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    time_zone: 'America/New_York',
    calls_per_day: 50,
    max_concurrent_calls: 3,
    
    // Lead Management
    total_leads: 3,
    calls_completed: 0,
    calls_in_progress: 0,
    
    // Call Settings
    call_delay_seconds: 5,
    retry_attempts: 2,
    retry_delay_minutes: 30,
    
    // Script/Assistant Configuration
    greeting_message: "Hello, this is a test call from Emerald Green Energy.",
    voice_id: "jennifer",
    language: "en-US",
    
    // Campaign Rules
    skip_weekends: true,
    skip_holidays: true,
    max_call_duration_seconds: 300,
    
    // Webhook Configuration (if needed)
    webhook_url: null,
    
    // Additional metadata
    created_by: 'system_fix',
    updated_at: new Date().toISOString()
  };
  
  console.log('\n=== Updating campaign with fixed settings ===');
  console.log('New settings:', JSON.stringify(fixedSettings, null, 2));
  
  // Update the campaign
  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update({ 
      settings: fixedSettings,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.id)
    .select()
    .single();
    
  if (updateError) {
    console.error('Update error:', updateError);
    return;
  }
  
  console.log('\n✅ Campaign updated successfully!');
  console.log('Campaign ID:', updated.id);
  console.log('Campaign Name:', updated.name);
  console.log('Status:', updated.status);
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. The assistant_id and phone_number_id are placeholders');
  console.log('2. You need to create real VAPI assistant and phone number');
  console.log('3. The phone numbers in CSV are test numbers (555 prefix)');
  console.log('4. For production, you need:');
  console.log('   - Real VAPI assistant configured with your script');
  console.log('   - Real VAPI phone number for outbound calls');
  console.log('   - Valid phone numbers in the CSV');
  
  // Check if we need to create the leads table entries
  console.log('\n=== Creating lead records ===');
  const csvLines = csvData.split('\n').slice(1); // Skip header
  
  for (const line of csvLines) {
    const [phone, name, email, company] = line.split(',');
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        campaign_id: campaign.id,
        organization_id: organizationId,
        phone_number: phone.trim(),
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (leadError) {
      console.log(`Error creating lead for ${phone}:`, leadError.message);
    } else {
      console.log(`Created lead: ${name} (${phone})`);
    }
  }
  
  console.log('\n✅ Campaign fix complete!');
  console.log('The campaign now has all required settings.');
  console.log('However, you still need to set up real VAPI resources.');
}

fixCampaignComplete();