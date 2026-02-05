const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

async function checkLatestCampaign() {
  console.log('Checking the most recent campaign...\n');
  
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
  
  console.log('=== Latest Campaign ===');
  console.log('Name:', campaign.name);
  console.log('ID:', campaign.id);
  console.log('Status:', campaign.status);
  console.log('Type:', campaign.type);
  console.log('Created:', campaign.created_at);
  console.log('Organization:', campaign.organization_id);
  
  console.log('\n=== Settings Column ===');
  if (campaign.settings) {
    console.log('Settings exists: YES');
    console.log(JSON.stringify(campaign.settings, null, 2));
  } else {
    console.log('Settings exists: NO - This is the problem!');
  }
  
  // Check if there's a call queue for this campaign
  console.log('\n=== Checking Call Queue ===');
  const { data: callQueue, error: queueError } = await supabase
    .from('call_queue')
    .select('*')
    .eq('campaign_id', campaign.id)
    .limit(5);
    
  if (queueError) {
    console.log('Call queue table might not exist:', queueError.message);
  } else if (callQueue && callQueue.length > 0) {
    console.log(`Found ${callQueue.length} items in call queue`);
    callQueue.forEach(item => {
      console.log(`- ${item.phone_number}: ${item.status}`);
    });
  } else {
    console.log('No items in call queue for this campaign');
  }
  
  // Check for any calls made
  console.log('\n=== Checking Calls ===');
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', campaign.id)
    .limit(5);
    
  if (callsError) {
    console.log('Error checking calls:', callsError.message);
  } else if (calls && calls.length > 0) {
    console.log(`Found ${calls.length} calls for this campaign`);
  } else {
    console.log('No calls made for this campaign yet');
  }
}

checkLatestCampaign();