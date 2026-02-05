// Diagnose why calls/leads aren't showing in the platform
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function diagnoseFetchIssues() {
  console.log('🔍 Diagnosing Data Fetch Issues\n');
  console.log('=' .repeat(50));
  
  const campaignId = 'df2f4fae-53d8-42ce-838a-dfb266589661'; // Campaign 877
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // 1. Check if calls exist in database
  console.log('\n📞 Checking ALL calls in database:');
  const { data: allCalls, error: allCallsError } = await supabase
    .from('calls')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(20);
    
  if (allCallsError) {
    console.error('❌ Error fetching all calls:', allCallsError);
  } else {
    console.log(`✅ Found ${allCalls?.length || 0} total calls in organization`);
    if (allCalls && allCalls.length > 0) {
      console.log('\nSample calls:');
      allCalls.slice(0, 3).forEach(call => {
        console.log(`  - Call ${call.id.substring(0, 8)}...`);
        console.log(`    Campaign: ${call.campaign_id}`);
        console.log(`    Status: ${call.status}`);
        console.log(`    Cost: $${call.cost || 0}`);
        console.log(`    Duration: ${call.duration || 0}s`);
      });
    }
  }
  
  // 2. Check calls for specific campaign
  console.log(`\n📊 Checking calls for Campaign 877 (${campaignId}):`);
  const { data: campaignCalls, error: campaignCallsError } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', campaignId);
    
  if (campaignCallsError) {
    console.error('❌ Error fetching campaign calls:', campaignCallsError);
  } else {
    console.log(`Found ${campaignCalls?.length || 0} calls for this campaign`);
  }
  
  // 3. Check campaign data
  console.log('\n📋 Checking campaign data:');
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
    
  if (campaignError) {
    console.error('❌ Error fetching campaign:', campaignError);
  } else {
    console.log('Campaign details:');
    console.log(`  Name: ${campaign.name}`);
    console.log(`  Status: ${campaign.status}`);
    console.log(`  Organization: ${campaign.organization_id}`);
    console.log(`  Created: ${campaign.created_at}`);
  }
  
  // 4. Check if there's a campaign_calls junction table
  console.log('\n🔗 Checking for campaign_calls junction table:');
  const { data: campaignCallsJunction, error: junctionError } = await supabase
    .from('campaign_calls')
    .select('*')
    .eq('campaign_id', campaignId)
    .limit(5);
    
  if (junctionError) {
    if (junctionError.message.includes('does not exist')) {
      console.log('ℹ️ No campaign_calls junction table (using direct campaign_id on calls)');
    } else {
      console.error('❌ Error:', junctionError.message);
    }
  } else {
    console.log(`Found ${campaignCallsJunction?.length || 0} entries in junction table`);
  }
  
  // 5. Check leads table structure
  console.log('\n👥 Checking leads table:');
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .limit(5);
    
  if (leadsError) {
    console.error('❌ Error fetching leads:', leadsError.message);
    
    // Try alternative query without campaign_id
    console.log('\nTrying to fetch ANY leads:');
    const { data: anyLeads, error: anyLeadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);
      
    if (anyLeadsError) {
      console.error('❌ Cannot fetch any leads:', anyLeadsError.message);
    } else {
      console.log(`Found ${anyLeads?.length || 0} leads total in database`);
    }
  } else {
    console.log(`Found ${leads?.length || 0} leads for this campaign`);
  }
  
  // 6. Check how frontend expects data
  console.log('\n🎯 Data Structure Analysis:');
  console.log('\nThe frontend likely expects:');
  console.log('1. Calls with campaign_id field matching the campaign');
  console.log('2. Leads with campaign_id field (or junction table)');
  console.log('3. Cost calculated from call duration or cost field');
  
  // 7. Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY\n');
  
  if (allCalls && allCalls.length > 0) {
    console.log('✅ Calls exist in database');
    
    // Check if any calls belong to this campaign
    const campaignCallCount = allCalls.filter(c => c.campaign_id === campaignId).length;
    if (campaignCallCount === 0) {
      console.log(`⚠️ BUT no calls are linked to Campaign 877`);
      console.log('\nPossible issues:');
      console.log('1. Calls exist but campaign_id is NULL or different');
      console.log('2. Frontend is filtering by campaign_id incorrectly');
      console.log('3. API endpoint not returning campaign-specific data');
    } else {
      console.log(`✅ ${campaignCallCount} calls linked to Campaign 877`);
      console.log('\nIssue might be:');
      console.log('1. Frontend not fetching campaign-specific calls');
      console.log('2. API endpoint not working properly');
    }
  } else {
    console.log('❌ No calls found in database at all');
  }
  
  // 8. Show actual campaign IDs that have calls
  if (allCalls && allCalls.length > 0) {
    console.log('\n📌 Campaigns that DO have calls:');
    const campaignsWithCalls = [...new Set(allCalls.map(c => c.campaign_id).filter(Boolean))];
    for (const cid of campaignsWithCalls) {
      const count = allCalls.filter(c => c.campaign_id === cid).length;
      console.log(`  - ${cid}: ${count} calls`);
    }
  }
}

diagnoseFetchIssues();