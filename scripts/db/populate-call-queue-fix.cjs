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

async function populateCampaignQueues() {
  console.log('🔍 Populating call queues for active campaigns...\n');
  
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
    console.log(`📋 Campaign: ${campaign.name} (${campaign.id})`);
    
    // Check if queue already has items
    const { count: queueCount } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
      
    if (queueCount > 0) {
      console.log(`  ✅ Already has ${queueCount} items in queue`);
      continue;
    }
    
    // Parse contacts from CSV
    if (!campaign.settings?.csv_data) {
      console.log(`  ❌ No CSV data found`);
      continue;
    }
    
    const contacts = parseCSVData(campaign.settings.csv_data);
    console.log(`  📝 Found ${contacts.length} contacts`);
    
    if (contacts.length === 0) continue;
    
    // Create queue entries with contact_id (required)
    const queueEntries = contacts.map((contact, index) => ({
      campaign_id: campaign.id,
      contact_id: contact.id || `csv_${campaign.id}_${index + 1}`, // Ensure contact_id is always set
      phone_number: contact.phone,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert the queue entries
    const { error: insertError, data: insertedData } = await supabase
      .from('call_queue')
      .insert(queueEntries)
      .select();
      
    if (insertError) {
      console.log(`  ❌ Error inserting:`, insertError.message);
    } else {
      console.log(`  ✅ Inserted ${insertedData?.length || queueEntries.length} queue items`);
      successCount++;
    }
  }
  
  console.log(`\n✅ Successfully populated ${successCount} campaigns`);
  
  // Check the final state
  const { count: totalCount } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true });
    
  console.log(`📊 Total items in call_queue: ${totalCount}`);
  
  if (totalCount > 0) {
    console.log('\n🎯 Campaigns are now ready to make calls!');
    console.log('The campaign executor should pick them up in the next minute.');
  }
}

populateCampaignQueues().catch(console.error);