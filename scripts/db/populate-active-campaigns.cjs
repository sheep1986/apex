const { createClient } = require('@supabase/supabase-js');

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
    const contact = { id: `csv_${i}` };
    
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
      } else if (header.includes('company')) {
        contact.company = value;
      } else {
        contact[header] = value;
      }
    });
    
    // Ensure we have at least a phone number
    if (contact.phone) {
      // Build full name if we have parts
      if (!contact.name && (contact.first_name || contact.last_name)) {
        contact.name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      }
      // Default name if none provided
      if (!contact.name) {
        contact.name = 'Contact';
      }
      contacts.push(contact);
    }
  }
  
  return contacts;
}

async function populateActiveCampaigns() {
  console.log('🔍 Checking for active campaigns without call queues...\n');
  
  // Get all active campaigns
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
  
  for (const campaign of campaigns) {
    console.log(`\n📋 Campaign: ${campaign.name} (${campaign.id})`);
    
    // Check if this campaign has any call queue entries
    const { count: queueCount } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
      
    if (queueCount > 0) {
      console.log(`  ✅ Already has ${queueCount} items in queue`);
      continue;
    }
    
    console.log(`  ⚠️ No queue items found - needs population`);
    
    // Parse contacts from CSV data in settings
    if (!campaign.settings?.csv_data) {
      console.log(`  ❌ No CSV data found in campaign settings`);
      continue;
    }
    
    const contacts = parseCSVData(campaign.settings.csv_data);
    console.log(`  📝 Parsed ${contacts.length} contacts from CSV data`);
    
    if (contacts.length === 0) {
      console.log(`  ❌ No valid contacts found`);
      continue;
    }
    
    // Check for duplicate phone numbers and filter them out
    const uniquePhones = new Set();
    const uniqueContacts = [];
    
    for (const contact of contacts) {
      const phone = contact.phone?.replace(/\D/g, ''); // Remove non-digits
      if (phone && !uniquePhones.has(phone)) {
        uniquePhones.add(phone);
        uniqueContacts.push(contact);
      } else if (uniquePhones.has(phone)) {
        console.log(`  ⚠️ Skipping duplicate phone: ${contact.phone}`);
      }
    }
    
    console.log(`  ✅ ${uniqueContacts.length} unique contacts after removing duplicates`);
    
    // Create call queue entries
    const queueEntries = uniqueContacts.map(contact => ({
      campaign_id: campaign.id,
      contact_id: contact.id,
      phone_number: contact.phone,
      contact_name: contact.name || `Contact`,
      attempt: 1,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert in batches of 100 to avoid database limits
    const batchSize = 100;
    for (let i = 0; i < queueEntries.length; i += batchSize) {
      const batch = queueEntries.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('call_queue')
        .insert(batch);
        
      if (insertError) {
        console.error(`  ❌ Error inserting batch ${i/batchSize + 1}:`, insertError);
      } else {
        console.log(`  ✅ Inserted batch ${i/batchSize + 1} (${batch.length} entries)`);
      }
    }
    
    // Update campaign to mark it as properly started
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        started_at: campaign.started_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);
      
    if (updateError) {
      console.error(`  ❌ Error updating campaign:`, updateError);
    } else {
      console.log(`  ✅ Campaign marked as started`);
    }
    
    console.log(`  🎯 Campaign ${campaign.name} is ready to make calls!`);
  }
  
  console.log('\n✅ Finished processing all campaigns');
}

populateActiveCampaigns().catch(console.error);