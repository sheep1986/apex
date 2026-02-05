const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCRMUpdateImpact() {
  console.log('🔍 CHECKING CRM UPDATE IMPACT ON CAMPAIGNS');
  console.log('==========================================\n');
  
  // 1. Check what was working before vs now
  console.log('📊 TIMELINE ANALYSIS:');
  
  // Check calls made before today (working system)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data: oldCalls } = await supabase
    .from('calls')
    .select('*')
    .lt('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  
  const { data: newCalls } = await supabase
    .from('calls')
    .select('*')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false });
  
  console.log(`   Calls BEFORE today: ${oldCalls?.length || 0}`);
  console.log(`   Calls TODAY (after CRM update): ${newCalls?.length || 0}`);
  
  if (oldCalls && oldCalls.length > 0) {
    console.log('\n   📞 Previous working calls:');
    oldCalls.slice(0, 3).forEach((call, i) => {
      console.log(`     ${i + 1}. ${call.phone_number} - Campaign: ${call.campaign_id || 'None'} (${new Date(call.created_at).toLocaleDateString()})`);
    });
  }
  
  if (newCalls && newCalls.length > 0) {
    console.log('\n   📞 Today\'s calls (test calls):');
    newCalls.forEach((call, i) => {
      console.log(`     ${i + 1}. ${call.phone_number} - Campaign: ${call.campaign_id || 'None'} (${new Date(call.created_at).toLocaleTimeString()})`);
    });
  }
  
  // 2. Check campaign-lead relationships 
  console.log('\n🔗 CAMPAIGN-LEAD RELATIONSHIP ANALYSIS:');
  
  // Check if leads table schema changed
  const { data: sampleLead } = await supabase
    .from('leads')
    .select('*')
    .limit(1)
    .single();
  
  const leadHasCampaignId = sampleLead && 'campaign_id' in sampleLead;
  console.log(`   Leads table has campaign_id: ${leadHasCampaignId ? '✅ YES' : '❌ NO'}`);
  
  if (!leadHasCampaignId) {
    console.log('   🚨 CRITICAL: campaign_id column missing from leads table!');
    console.log('   This would break campaign-lead assignment.');
  }
  
  // Check phone_numbers table
  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('*')
    .limit(1);
  
  if (phoneNumbers && phoneNumbers.length > 0) {
    const phoneHasCampaignId = 'campaign_id' in phoneNumbers[0];
    console.log(`   Phone numbers have campaign_id: ${phoneHasCampaignId ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('   Phone numbers table: ❌ EMPTY or inaccessible');
  }
  
  // 3. Check if CRM trigger is interfering with campaigns
  console.log('\\n🤖 CRM TRIGGER IMPACT ANALYSIS:');
  
  // Check if the lead conversion trigger might be affecting campaign functionality
  const { data: autoConvertedLeads } = await supabase
    .from('leads')
    .select('*')
    .not('call_id', 'is', null)
    .gte('created_at', todayStart.toISOString());
  
  console.log(`   Auto-converted leads today: ${autoConvertedLeads?.length || 0}`);
  
  if (autoConvertedLeads && autoConvertedLeads.length > 0) {
    console.log('   These leads were auto-created from calls, not assigned to campaigns');
    autoConvertedLeads.forEach((lead, i) => {
      console.log(`     ${i + 1}. ${lead.name} - ${lead.phone} (from call ${lead.call_id})`);
    });
  }
  
  // 4. Check original campaign leads (before CRM update)
  console.log('\\n📋 ORIGINAL CAMPAIGN LEADS:');
  
  const { data: originalLeads } = await supabase
    .from('leads')
    .select('*')
    .is('call_id', null)  // These would be manually added leads
    .lt('created_at', todayStart.toISOString());
  
  console.log(`   Manual/Campaign leads: ${originalLeads?.length || 0}`);
  
  if (originalLeads && originalLeads.length > 0) {
    console.log('   Original campaign leads that should work:');
    originalLeads.slice(0, 3).forEach((lead, i) => {
      console.log(`     ${i + 1}. ${lead.name} - ${lead.phone} (${lead.source})`);
    });
  }
  
  // 5. Check current campaign assignments
  console.log('\\n🎯 CURRENT CAMPAIGN ASSIGNMENTS:');
  
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (campaigns && campaigns.length > 0) {
    for (const campaign of campaigns) {
      // Try to find leads assigned to this campaign
      const { data: campaignLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id);
      
      console.log(`   Campaign "${campaign.name}": ${campaignLeads?.length || 0} leads assigned`);
    }
  }
  
  // 6. Identify the specific issue
  console.log('\\n🎯 ROOT CAUSE ANALYSIS:');
  
  const issues = [];
  
  if (!leadHasCampaignId) {
    issues.push('CRITICAL: campaign_id column missing from leads table');
  }
  
  if (oldCalls && oldCalls.length > 0 && (!newCalls || newCalls.length === 0)) {
    issues.push('Campaign automation stopped working after CRM update');
  }
  
  if (originalLeads && originalLeads.length > 0) {
    issues.push('Original campaign leads exist but may not be properly linked');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ No obvious breaking changes detected');
    console.log('   The issue might be in campaign processor configuration');
  } else {
    console.log('   🚨 ISSUES IDENTIFIED:');
    issues.forEach((issue, i) => {
      console.log(`     ${i + 1}. ${issue}`);
    });
  }
  
  // 7. Provide restoration steps
  console.log('\\n🔧 RESTORATION STEPS:');
  
  if (!leadHasCampaignId) {
    console.log('   1. 🚨 URGENT: Add campaign_id column back to leads table');
    console.log('      ALTER TABLE leads ADD COLUMN campaign_id UUID REFERENCES campaigns(id);');
  }
  
  console.log('   2. Re-assign existing leads to campaigns');
  console.log('   3. Verify campaign processor is running');  
  console.log('   4. Test with a simple campaign');
  
  console.log('\\n📋 IMMEDIATE ACTION NEEDED:');
  console.log('   The CRM update likely removed or changed campaign-related columns.');
  console.log('   This broke the relationship between campaigns and leads.');
  console.log('   Need to restore the campaign_id column and re-establish relationships.');
}

checkCRMUpdateImpact();