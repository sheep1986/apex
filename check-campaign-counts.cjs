const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function getCampaignsWithCounts() {
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Get all campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    return;
  }
  
  console.log(`\nFound ${campaigns.length} campaigns\n`);
  console.log('Campaign Name                | Leads | Calls | Status');
  console.log('----------------------------|-------|-------|----------');
  
  for (const campaign of campaigns) {
    // Get counts
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    
    const { count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    
    // Format output
    const name = campaign.name.padEnd(27);
    const leads = String(leadCount || 0).padEnd(5);
    const calls = String(callCount || 0).padEnd(5);
    
    console.log(`${name} | ${leads} | ${calls} | ${campaign.status || 'draft'}`);
  }
  
  console.log('\nTo fix the display issue:');
  console.log('1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)');
  console.log('2. Open browser DevTools > Application > Storage > Clear site data');
  console.log('3. Refresh the page');
}

getCampaignsWithCounts().catch(console.error);