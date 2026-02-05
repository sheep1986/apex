const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkRecentCampaigns() {
  console.log('🔍 Checking recent campaigns and their status...\n');
  
  // Get recent campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching campaigns:', error);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('No campaigns found');
    return;
  }
  
  for (const campaign of campaigns) {
    console.log('Campaign:', campaign.name);
    console.log('  ID:', campaign.id);
    console.log('  Status:', campaign.status);
    console.log('  Created:', campaign.created_at);
    console.log('  Assistant ID:', campaign.assistant_id);
    console.log('  Phone Number IDs:', campaign.phone_number_ids);
    
    // Check if settings has the data
    if (campaign.settings) {
      console.log('  Has CSV data:', !!campaign.settings.csv_data);
      console.log('  Assistant in settings:', campaign.settings.assistant_id);
      console.log('  Phone in settings:', campaign.settings.phone_number_id);
    }
    
    // Check call queue
    const { data: queueItems, count } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaign.id)
      .limit(5);
      
    console.log('  Call Queue Items:', count || 0);
    if (queueItems && queueItems.length > 0) {
      console.log('  Sample queue items:', queueItems.map(q => ({
        phone: q.phone_number,
        status: q.status,
        scheduled: q.scheduled_for
      })));
    }
    
    // Check campaign_contacts
    const { data: contacts, count: contactCount } = await supabase
      .from('campaign_contacts')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaign.id)
      .limit(5);
      
    console.log('  Campaign Contacts:', contactCount || 0);
    if (contacts && contacts.length > 0) {
      console.log('  Sample contacts:', contacts.map(c => ({
        phone: c.phone,
        name: c.name
      })));
    }
    
    // Check for calls made
    const { data: calls, count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaign.id)
      .limit(5);
      
    console.log('  Calls Made:', callCount || 0);
    if (calls && calls.length > 0) {
      console.log('  Sample calls:', calls.map(c => ({
        phone: c.customer_phone,
        outcome: c.outcome,
        created: c.created_at
      })));
    }
    
    console.log('---');
  }
  
  // Check if call_queue table exists
  const { data: tables } = await supabase.rpc('get_table_names');
  console.log('\nTables in database:', tables?.filter(t => t.includes('call') || t.includes('campaign')));
  
  // Check campaign_locks
  const { data: locks } = await supabase
    .from('campaign_locks')
    .select('*')
    .order('locked_at', { ascending: false })
    .limit(5);
    
  console.log('\nRecent campaign locks:', locks?.length || 0);
  if (locks) {
    locks.forEach(lock => {
      console.log(`  Campaign ${lock.campaign_id}: locked at ${lock.locked_at}, expires ${lock.expires_at}`);
    });
  }
}

checkRecentCampaigns().catch(console.error);