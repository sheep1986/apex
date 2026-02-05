// Check which campaigns have calls and their names
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkCampaignNames() {
  console.log('📊 Campaign Call Distribution\n');
  console.log('=' .repeat(50));
  
  // Get all campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status');
    
  // Get all calls
  const { data: calls } = await supabase
    .from('calls')
    .select('id, campaign_id, status, cost, duration');
    
  console.log(`\nTotal campaigns: ${campaigns?.length || 0}`);
  console.log(`Total calls: ${calls?.length || 0}\n`);
  
  // Map campaign IDs to names
  const campaignMap = {};
  campaigns?.forEach(c => {
    campaignMap[c.id] = c.name;
  });
  
  // Count calls per campaign
  const callCounts = {};
  let totalCost = 0;
  
  calls?.forEach(call => {
    const campaignId = call.campaign_id || 'NO_CAMPAIGN';
    callCounts[campaignId] = (callCounts[campaignId] || 0) + 1;
    totalCost += parseFloat(call.cost || 0);
  });
  
  console.log('Calls by Campaign:');
  console.log('-'.repeat(50));
  
  Object.keys(callCounts).forEach(campaignId => {
    const campaignName = campaignId === 'NO_CAMPAIGN' ? 
      '❌ No Campaign Assigned' : 
      campaignMap[campaignId] || '⚠️ Unknown Campaign';
    
    const callsForCampaign = calls.filter(c => 
      (c.campaign_id || 'NO_CAMPAIGN') === campaignId
    );
    
    const campaignCost = callsForCampaign.reduce((sum, c) => 
      sum + parseFloat(c.cost || 0), 0
    );
    
    console.log(`\n${campaignName} (${campaignId})`);
    console.log(`  Calls: ${callCounts[campaignId]}`);
    console.log(`  Cost: $${campaignCost.toFixed(2)}`);
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\nTotal Cost Across All Calls: $${totalCost.toFixed(2)}`);
  
  // List campaigns with NO calls
  console.log('\n⚠️ Campaigns with NO calls:');
  campaigns?.forEach(campaign => {
    if (!callCounts[campaign.id]) {
      console.log(`  - ${campaign.name} (${campaign.id})`);
    }
  });
  
  console.log('\n💡 SOLUTION:');
  console.log('Campaign "877" has no calls. To see data:');
  console.log('1. Navigate to a campaign that has calls (Test 11, Test 123, or Emerald Green)');
  console.log('2. Or create new calls for Campaign 877');
}

checkCampaignNames();