const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function fixCampaignLeads() {
  const campaignId = 'c2609329-ec4c-47d7-85aa-687856493d0a';
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  console.log('🔧 Fixing Campaign Leads for Campaign 11\n');
  
  // 1. Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
    
  if (campaignError || !campaign) {
    console.error('Error fetching campaign:', campaignError);
    return;
  }
  
  console.log(`Campaign: ${campaign.name}`);
  console.log(`Status: ${campaign.status}`);
  
  // 2. Check if CSV data exists in settings
  const settings = campaign.settings || {};
  if (!settings.csv_data) {
    console.log('❌ No CSV data found in campaign settings');
    
    // Try to add a test lead manually
    console.log('\n📝 Adding a test lead manually...');
    
    const testLead = {
      organization_id: organizationId,
      campaign_id: campaignId,
      first_name: 'Test',
      last_name: 'Lead',
      phone: '+15551234567', // Test phone number
      email: 'test@example.com',
      status: 'pending',
      call_status: 'pending',
      call_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();
      
    if (insertError) {
      console.error('Error inserting test lead:', insertError);
    } else {
      console.log('✅ Test lead added successfully!');
      console.log(`Lead ID: ${insertedLead.id}`);
    }
    return;
  }
  
  // 3. Parse CSV data
  console.log('\n📋 Parsing CSV data from campaign settings...');
  const csvData = settings.csv_data;
  const lines = csvData.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log('❌ CSV data is empty');
    return;
  }
  
  // Get headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log('CSV Headers:', headers);
  
  // Find column indices
  const phoneIndex = headers.findIndex(h => 
    h.includes('phone') || h.includes('number') || h.includes('mobile') || h.includes('tel')
  );
  const nameIndex = headers.findIndex(h => 
    h.includes('name') && !h.includes('last')
  );
  const firstNameIndex = headers.findIndex(h => 
    h.includes('first') || h === 'firstname'
  );
  const lastNameIndex = headers.findIndex(h => 
    h.includes('last') || h === 'lastname'
  );
  const emailIndex = headers.findIndex(h => 
    h.includes('email') || h.includes('mail')
  );
  const companyIndex = headers.findIndex(h => 
    h.includes('company') || h.includes('organization')
  );
  
  console.log('\nColumn mapping:');
  console.log(`Phone: column ${phoneIndex} ${phoneIndex >= 0 ? '✅' : '❌'}`);
  console.log(`Name: column ${nameIndex}`);
  console.log(`First Name: column ${firstNameIndex}`);
  console.log(`Last Name: column ${lastNameIndex}`);
  console.log(`Email: column ${emailIndex}`);
  console.log(`Company: column ${companyIndex}`);
  
  if (phoneIndex < 0) {
    console.log('❌ Could not find phone number column in CSV');
    return;
  }
  
  // 4. Process data rows
  const leads = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (!values[phoneIndex]) continue; // Skip if no phone number
    
    // Extract name
    let firstName = '';
    let lastName = '';
    
    if (firstNameIndex >= 0) {
      firstName = values[firstNameIndex] || '';
    }
    if (lastNameIndex >= 0) {
      lastName = values[lastNameIndex] || '';
    }
    
    // If no separate first/last name, try to split the name field
    if (!firstName && !lastName && nameIndex >= 0 && values[nameIndex]) {
      const nameParts = values[nameIndex].split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const lead = {
      organization_id: organizationId,
      campaign_id: campaignId,
      first_name: firstName || 'Contact',
      last_name: lastName || (i).toString(),
      phone: values[phoneIndex],
      email: emailIndex >= 0 ? values[emailIndex] : null,
      company: companyIndex >= 0 ? values[companyIndex] : null,
      status: 'pending',
      call_status: 'pending',
      call_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    leads.push(lead);
  }
  
  console.log(`\n📊 Prepared ${leads.length} leads for insertion`);
  
  if (leads.length === 0) {
    console.log('❌ No valid leads found in CSV data');
    return;
  }
  
  // Show sample leads
  console.log('\nSample leads (first 3):');
  leads.slice(0, 3).forEach((lead, i) => {
    console.log(`  ${i + 1}. ${lead.first_name} ${lead.last_name} - ${lead.phone}`);
  });
  
  // 5. Insert leads into database
  console.log('\n💾 Inserting leads into database...');
  
  const { data: insertedLeads, error: insertError } = await supabase
    .from('leads')
    .insert(leads)
    .select();
    
  if (insertError) {
    console.error('Error inserting leads:', insertError);
    
    // Try inserting one by one to identify issues
    console.log('\n🔄 Trying to insert leads one by one...');
    let successCount = 0;
    
    for (const lead of leads) {
      const { error: singleError } = await supabase
        .from('leads')
        .insert(lead);
        
      if (!singleError) {
        successCount++;
      } else {
        console.log(`Failed to insert ${lead.phone}: ${singleError.message}`);
      }
    }
    
    console.log(`\n✅ Successfully inserted ${successCount}/${leads.length} leads`);
  } else {
    console.log(`✅ Successfully inserted ${insertedLeads.length} leads!`);
  }
  
  // 6. Update campaign status
  console.log('\n🔄 Ensuring campaign is active...');
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);
    
  if (updateError) {
    console.error('Error updating campaign:', updateError);
  } else {
    console.log('✅ Campaign status set to active');
  }
  
  // 7. Final check
  console.log('\n=== FINAL STATUS ===');
  const { data: finalLeads, error: finalError } = await supabase
    .from('leads')
    .select('id, call_status')
    .eq('campaign_id', campaignId);
    
  if (!finalError && finalLeads) {
    const pendingCount = finalLeads.filter(l => l.call_status === 'pending').length;
    console.log(`Total leads in campaign: ${finalLeads.length}`);
    console.log(`Pending leads ready to call: ${pendingCount}`);
    
    if (pendingCount > 0) {
      console.log('\n✅ Campaign is now ready to make calls!');
      console.log('📞 Calls should start within 1-2 minutes if the backend is running.');
    }
  }
}

fixCampaignLeads();