const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../apps/backend/.env' });

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCampaigns() {
  console.log('🔍 Debugging campaigns issue...\n');

  try {
    // Check all campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return;
    }

    console.log(`📊 Total campaigns in database: ${campaigns.length}\n`);

    // Group by organization
    const byOrg = {};
    campaigns.forEach(camp => {
      if (!byOrg[camp.organization_id]) {
        byOrg[camp.organization_id] = [];
      }
      byOrg[camp.organization_id].push(camp);
    });

    // Show campaigns by organization
    for (const [orgId, orgCampaigns] of Object.entries(byOrg)) {
      console.log(`\n🏢 Organization: ${orgId}`);
      console.log(`   Campaigns: ${orgCampaigns.length}`);
      
      // Get org name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      
      if (org) {
        console.log(`   Name: ${org.name}`);
      }
      
      orgCampaigns.forEach(camp => {
        console.log(`\n   📞 Campaign: ${camp.name}`);
        console.log(`      ID: ${camp.id}`);
        console.log(`      Status: ${camp.status}`);
        console.log(`      Created: ${new Date(camp.created_at).toLocaleString()}`);
      });
    }

    // Check users and their organizations
    console.log('\n\n👥 Checking users and their organizations:');
    const { data: users } = await supabase
      .from('users')
      .select('id, email, organization_id, role')
      .order('created_at', { ascending: false })
      .limit(5);

    users.forEach(user => {
      console.log(`\n   👤 ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Org ID: ${user.organization_id || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCampaigns();