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
  
  // First, let's check what columns exist in call_queue
  const { data: testQuery, error: testError } = await supabase
    .from('call_queue')
    .select('*')
    .limit(1);
    
  if (testError) {
    console.log('❌ Error querying call_queue:', testError.message);
    console.log('\n📌 Please ensure the call_queue table has these columns:');
    console.log('  - campaign_id (UUID)');
    console.log('  - phone_number (TEXT)');
    console.log('  - status (TEXT)');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP)');
    console.log('\nOptional columns that would be helpful:');
    console.log('  - contact_id (TEXT)');
    console.log('  - contact_name (TEXT)');
    console.log('  - scheduled_for (TIMESTAMP)');
    return;
  }
  
  const existingColumns = testQuery && testQuery.length > 0 ? Object.keys(testQuery[0]) : [];
  console.log('✅ call_queue columns found:', existingColumns.join(', '));
  
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
  
  console.log(`\nFound ${campaigns.length} active campaigns\n`);
  
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
    
    // Create queue entries with only the columns we know exist
    const queueEntries = contacts.map(contact => {
      const entry = {
        campaign_id: campaign.id,
        phone_number: contact.phone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add optional columns if they exist
      if (existingColumns.includes('contact_id')) {
        entry.contact_id = contact.id;
      }
      if (existingColumns.includes('contact_name')) {
        entry.contact_name = contact.name;
      }
      if (existingColumns.includes('scheduled_for')) {
        entry.scheduled_for = new Date().toISOString();
      }
      if (existingColumns.includes('attempt')) {
        entry.attempt = 1;
      }
      
      return entry;
    });
    
    // Insert the queue entries
    const { error: insertError, data: insertedData } = await supabase
      .from('call_queue')
      .insert(queueEntries)
      .select();
      
    if (insertError) {
      console.log(`  ❌ Error inserting:`, insertError.message);
      
      // If the error is about missing columns, show what we tried to insert
      if (insertError.message.includes('column')) {
        console.log('  Attempted to insert:', JSON.stringify(queueEntries[0], null, 2));
      }
    } else {
      console.log(`  ✅ Inserted ${insertedData?.length || queueEntries.length} queue items`);
    }
  }
  
  console.log('\n✅ Finished processing campaigns');
  
  // Check the final state
  const { count: totalCount } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\n📊 Total items in call_queue: ${totalCount}`);
}

populateCampaignQueues().catch(console.error);