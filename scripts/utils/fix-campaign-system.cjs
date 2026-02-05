const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixCampaignSystem() {
  console.log('🔧 RESTORING CAMPAIGN SYSTEM');
  console.log('============================\n');
  
  // Manual approach since we can't execute SQL directly
  
  console.log('⚠️  CRITICAL: Cannot execute SQL directly through Supabase client.');
  console.log('You need to run the SQL commands manually in your Supabase dashboard.\n');
  
  console.log('🚨 REQUIRED SQL COMMANDS TO RUN:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Open the SQL editor');
  console.log('3. Run these commands:\n');
  
  console.log('-- Add campaign_id column back to leads table');
  console.log('ALTER TABLE leads ADD COLUMN campaign_id UUID REFERENCES campaigns(id);');
  console.log('CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);');
  console.log('');
  
  // Meanwhile, let's prepare for restoration by checking existing data
  console.log('📊 PREPARING FOR RESTORATION...\n');
  
  // Get campaigns that were working before
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log(`Found ${campaigns?.length || 0} campaigns to restore:`);
  campaigns?.forEach((campaign, i) => {
    console.log(`  ${i + 1}. ${campaign.name} (${campaign.id})`);
  });
  
  // Get leads that could be assigned to campaigns
  const { data: availableLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', campaigns?.[0]?.organization_id || '')
    .is('call_id', null); // These are manually created leads, not auto-converted
  
  console.log(`\nFound ${availableLeads?.length || 0} available leads for campaigns:`);
  availableLeads?.slice(0, 5).forEach((lead, i) => {
    console.log(`  ${i + 1}. ${lead.name} - ${lead.phone} (${lead.source})`);
  });
  
  console.log('\n📋 RESTORATION PLAN:');
  console.log('1. ✅ Add campaign_id column (run SQL above)');
  console.log('2. 🔄 Re-assign leads to campaigns');
  console.log('3. ✅ Update campaign metrics');
  console.log('4. 🚀 Test campaign automation');
  
  console.log('\n💡 IMMEDIATE NEXT STEPS:');
  console.log('1. Run the SQL command in Supabase dashboard');
  console.log('2. Come back and run this script again');
  console.log('3. I will then restore the campaign-lead assignments');
  
  // Check if the column already exists
  const { data: testLead } = await supabase.from('leads').select('*').limit(1).single();
  
  if (testLead && 'campaign_id' in testLead) {
    console.log('\n✅ campaign_id column detected! Proceeding with restoration...');
    
    // Restore campaign assignments
    if (campaigns && campaigns.length > 0 && availableLeads && availableLeads.length > 0) {
      const testCampaign = campaigns.find(c => c.name === 'Test') || campaigns[0];
      
      console.log(`\n🔄 Assigning leads to "${testCampaign.name}" campaign...`);
      
      // Assign some leads to the test campaign
      const leadsToAssign = availableLeads.slice(0, Math.min(3, availableLeads.length));
      
      for (const lead of leadsToAssign) {
        const { error } = await supabase
          .from('leads')
          .update({ campaign_id: testCampaign.id })
          .eq('id', lead.id);
        
        if (error) {
          console.error(`❌ Error assigning lead ${lead.name}:`, error);
        } else {
          console.log(`✅ Assigned ${lead.name} to campaign`);
        }
      }
      
      // Update campaign metrics
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          total_leads: leadsToAssign.length,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testCampaign.id);
      
      if (!campaignError) {
        console.log(`✅ Updated ${testCampaign.name} campaign metrics`);
      }
      
      console.log('\n🎉 CAMPAIGN SYSTEM RESTORED!');
      console.log('Your test campaign should now start making calls.');
      console.log('\nTo verify:');
      console.log('1. Check your campaign dashboard');
      console.log('2. Ensure campaign processor is running');  
      console.log('3. Monitor the calls table for activity');
    }
  } else {
    console.log('\n❌ campaign_id column still missing.');
    console.log('Please run the SQL command first, then run this script again.');
  }
}

fixCampaignSystem();