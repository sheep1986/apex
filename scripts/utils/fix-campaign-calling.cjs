const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

function parseCSVData(csvData) {
  if (!csvData) return [];
  
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const contacts = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const contact = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (header.includes('phone') || header.includes('number')) {
        contact.phone = value;
      } else if (header.includes('name')) {
        if (header.includes('first')) {
          contact.first_name = value;
        } else if (header.includes('last')) {
          contact.last_name = value;
        } else {
          contact.name = value;
        }
      } else if (header.includes('email')) {
        contact.email = value;
      }
    });
    
    if (contact.phone) {
      if (!contact.name && (contact.first_name || contact.last_name)) {
        contact.name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      }
      if (!contact.name) {
        contact.name = 'Contact';
      }
      contacts.push(contact);
    }
  }
  
  return contacts;
}

async function fixCampaignCalling() {
  console.log('🔧 Fixing campaign calling system...\n');
  
  // Get active campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching campaigns:', error);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('No active campaigns found');
    return;
  }
  
  console.log(`Found ${campaigns.length} active campaigns\n`);
  
  let successCount = 0;
  
  for (const campaign of campaigns) {
    console.log(`\n📋 Campaign: ${campaign.name} (${campaign.id})`);
    
    // Parse contacts from CSV
    if (!campaign.settings?.csv_data) {
      console.log(`  ❌ No CSV data found`);
      continue;
    }
    
    const contacts = parseCSVData(campaign.settings.csv_data);
    console.log(`  📝 Found ${contacts.length} contacts from CSV`);
    
    if (contacts.length === 0) continue;
    
    // Check if campaign_contacts already exist
    const { data: existingContacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('*')
      .eq('campaign_id', campaign.id);
      
    if (existingContacts && existingContacts.length > 0) {
      console.log(`  ✅ Already has ${existingContacts.length} contacts in campaign_contacts`);
      
      // Check if call_queue has entries
      const { count: queueCount } = await supabase
        .from('call_queue')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);
        
      if (queueCount > 0) {
        console.log(`  ✅ Already has ${queueCount} items in call_queue`);
        continue;
      }
      
      // Create call_queue entries from existing contacts
      const queueEntries = existingContacts.map(contact => ({
        campaign_id: campaign.id,
        contact_id: contact.id,
        phone_number: contact.phone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: queueError, data: queueData } = await supabase
        .from('call_queue')
        .insert(queueEntries)
        .select();
        
      if (queueError) {
        console.log(`  ❌ Error creating call_queue:`, queueError.message);
      } else {
        console.log(`  ✅ Created ${queueData.length} call_queue entries`);
        successCount++;
      }
      
    } else {
      // Create campaign_contacts first
      console.log(`  📦 Creating campaign_contacts...`);
      
      const campaignContacts = contacts.map(contact => ({
        id: crypto.randomUUID(),
        campaign_id: campaign.id,
        phone: contact.phone,
        name: contact.name,
        email: contact.email || null,
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertContactsError, data: insertedContacts } = await supabase
        .from('campaign_contacts')
        .insert(campaignContacts)
        .select();
        
      if (insertContactsError) {
        console.log(`  ❌ Error creating contacts:`, insertContactsError.message);
        continue;
      }
      
      console.log(`  ✅ Created ${insertedContacts.length} contacts`);
      
      // Now create call_queue entries
      const queueEntries = insertedContacts.map(contact => ({
        campaign_id: campaign.id,
        contact_id: contact.id,
        phone_number: contact.phone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: queueError, data: queueData } = await supabase
        .from('call_queue')
        .insert(queueEntries)
        .select();
        
      if (queueError) {
        console.log(`  ❌ Error creating call_queue:`, queueError.message);
      } else {
        console.log(`  ✅ Created ${queueData.length} call_queue entries`);
        successCount++;
      }
    }
  }
  
  console.log(`\n✅ Successfully fixed ${successCount} campaigns`);
  
  // Check the final state
  const { count: totalQueueCount } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
    
  console.log(`\n📊 Total pending items in call_queue: ${totalQueueCount}`);
  
  if (totalQueueCount > 0) {
    console.log('\n🎯 SUCCESS! Campaigns are now ready to make calls!');
    console.log('The campaign executor should pick them up within the next minute.');
    console.log('\nIf calls still aren\'t being made, check:');
    console.log('1. Is the backend server running?');
    console.log('2. Are VAPI credentials configured for the organization?');
    console.log('3. Check backend logs for any errors');
  }
}

fixCampaignCalling().catch(console.error);