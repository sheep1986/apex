const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkImpact() {
  console.log('🔍 CRM UPDATE IMPACT ANALYSIS');
  console.log('============================');
  
  // Check leads table schema
  const { data: sampleLead } = await supabase.from('leads').select('*').limit(1).single();
  
  console.log('\n📋 LEADS TABLE SCHEMA:');
  if (sampleLead) {
    const columns = Object.keys(sampleLead);
    console.log('Available columns:', columns.join(', '));
    
    const hasCampaignId = columns.includes('campaign_id');
    console.log(`campaign_id column: ${hasCampaignId ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasCampaignId) {
      console.log('\n🚨 CRITICAL ISSUE FOUND:');
      console.log('The campaign_id column is missing from the leads table!');
      console.log('This breaks the connection between campaigns and leads.');
      console.log('\n🔧 REQUIRED FIX:');
      console.log('ALTER TABLE leads ADD COLUMN campaign_id UUID REFERENCES campaigns(id);');
    }
  }
  
  // Check recent calls vs old calls
  console.log('\n📞 CALL ACTIVITY COMPARISON:');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data: oldCalls } = await supabase
    .from('calls')
    .select('*')
    .lt('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);
  
  const { data: newCalls } = await supabase
    .from('calls')
    .select('*')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false });
  
  console.log(`Calls before today: ${oldCalls?.length || 0}`);
  console.log(`Calls today: ${newCalls?.length || 0}`);
  
  if (oldCalls && oldCalls.length > 0) {
    console.log('\nPrevious working calls:');
    oldCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. ${call.phone_number} - Campaign: ${call.campaign_id || 'None'}`);
    });
  }
  
  // Check campaign system
  console.log('\n🎯 CAMPAIGN SYSTEM STATUS:');
  
  const { data: campaigns } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(3);
  
  console.log(`Active campaigns: ${campaigns?.length || 0}`);
  
  if (campaigns && campaigns.length > 0) {
    for (const campaign of campaigns) {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id);
      
      console.log(`  "${campaign.name}": ${leads?.length || 0} leads assigned`);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('The issue is likely that the CRM update broke the campaign-lead relationship.');
  console.log('Campaign automation depends on leads being properly assigned to campaigns.');
  console.log('\nTo fix: Restore the campaign_id column and re-assign leads to campaigns.');
}

checkImpact();