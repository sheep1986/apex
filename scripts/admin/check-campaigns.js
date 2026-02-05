const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkCampaigns() {
  console.log('Checking all campaigns in database...\n');
  
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, name, type, status, organization_id, created_at')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${campaigns.length} campaigns:\n`);
  campaigns.forEach(c => {
    console.log(`- ${c.name}`);
    console.log(`  ID: ${c.id}`);
    console.log(`  Type: ${c.type || 'NOT SET'}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Org: ${c.organization_id}`);
    console.log(`  Created: ${c.created_at}\n`);
  });
  
  // Check specifically for outbound campaigns
  const outbound = campaigns.filter(c => c.type === 'outbound');
  console.log(`\nOutbound campaigns: ${outbound.length}`);
  
  // Check your organization
  const yourOrg = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  const yourCampaigns = campaigns.filter(c => c.organization_id === yourOrg);
  console.log(`\nYour organization's campaigns: ${yourCampaigns.length}`);
}

checkCampaigns();