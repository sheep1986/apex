// Check why campaigns aren't executing calls
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function checkCampaignExecution() {
  console.log('🔍 CHECKING CAMPAIGN EXECUTION STATUS\n');
  console.log('=' .repeat(60));
  
  // 1. Check all campaigns and their status
  console.log('\n📋 CAMPAIGN STATUS CHECK:');
  console.log('-' .repeat(60));
  
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (campError) {
    console.error('Error fetching campaigns:', campError);
    return;
  }
  
  console.log(`Found ${campaigns?.length || 0} campaigns\n`);
  
  campaigns?.forEach(camp => {
    console.log(`Campaign: ${camp.name} (${camp.id})`);
    console.log(`  Status: ${camp.status}`);
    console.log(`  Created: ${camp.created_at}`);
    console.log(`  Assistant ID: ${camp.assistant_id || 'NOT SET'}`);
    console.log(`  Phone Number ID: ${camp.phone_number_id || 'NOT SET'}`);
    console.log('');
  });
  
  // 2. Check for active campaigns
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  console.log(`\n📊 Active Campaigns: ${activeCampaigns.length}`);
  
  if (activeCampaigns.length === 0) {
    console.log('⚠️  NO ACTIVE CAMPAIGNS!');
    console.log('   Campaigns must be set to "active" status to make calls');
  }
  
  // 3. Check campaign_queue table (if exists)
  console.log('\n\n📞 CAMPAIGN QUEUE CHECK:');
  console.log('-' .repeat(60));
  
  const { data: queue, error: queueError } = await supabase
    .from('campaign_queue')
    .select('*')
    .limit(10);
    
  if (queueError) {
    if (queueError.message.includes('does not exist')) {
      console.log('ℹ️  No campaign_queue table (campaigns may use different execution method)');
    } else {
      console.error('Error checking queue:', queueError.message);
    }
  } else {
    console.log(`Queue entries: ${queue?.length || 0}`);
    if (queue && queue.length > 0) {
      console.log('\nQueue items:');
      queue.forEach(item => {
        console.log(`  - Campaign: ${item.campaign_id}`);
        console.log(`    Lead: ${item.lead_id}`);
        console.log(`    Status: ${item.status}`);
        console.log(`    Scheduled: ${item.scheduled_at}`);
      });
    }
  }
  
  // 4. Check call_attempts table (if exists)
  console.log('\n\n📊 CALL ATTEMPTS CHECK:');
  console.log('-' .repeat(60));
  
  const { data: attempts, error: attemptsError } = await supabase
    .from('call_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (attemptsError) {
    if (attemptsError.message.includes('does not exist')) {
      console.log('ℹ️  No call_attempts table');
    } else {
      console.error('Error checking attempts:', attemptsError.message);
    }
  } else {
    console.log(`Recent call attempts: ${attempts?.length || 0}`);
    if (attempts && attempts.length > 0) {
      attempts.forEach(attempt => {
        console.log(`  - ${attempt.created_at}: ${attempt.status}`);
      });
    }
  }
  
  // 5. Check leads for campaigns
  console.log('\n\n👥 CAMPAIGN LEADS CHECK:');
  console.log('-' .repeat(60));
  
  for (const campaign of campaigns || []) {
    const { data: leads, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
      
    console.log(`${campaign.name}: ${count || 0} leads`);
  }
  
  // 6. Check for campaign processor logs
  console.log('\n\n📝 CAMPAIGN PROCESSOR LOGS:');
  console.log('-' .repeat(60));
  
  const { data: logs, error: logsError } = await supabase
    .from('campaign_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (logsError) {
    if (logsError.message.includes('does not exist')) {
      console.log('ℹ️  No campaign_logs table');
    } else {
      console.error('Error checking logs:', logsError.message);
    }
  } else if (logs && logs.length > 0) {
    console.log('Recent campaign activity:');
    logs.forEach(log => {
      console.log(`  - ${log.created_at}: ${log.message}`);
    });
  } else {
    console.log('No campaign processor logs found');
  }
  
  // 7. Summary and diagnosis
  console.log('\n\n' + '=' .repeat(60));
  console.log('📋 DIAGNOSIS:');
  console.log('=' .repeat(60));
  
  const hasActiveCampaigns = activeCampaigns.length > 0;
  const hasLeadsToCall = campaigns?.some(c => c.lead_count > 0);
  const hasRequiredFields = campaigns?.every(c => c.assistant_id && c.phone_number_id);
  
  if (!hasActiveCampaigns) {
    console.log('\n❌ PROBLEM: No campaigns are set to "active" status');
    console.log('   SOLUTION: Campaigns must be started/activated to make calls');
  }
  
  if (!hasRequiredFields) {
    console.log('\n❌ PROBLEM: Some campaigns missing assistant or phone number IDs');
    console.log('   SOLUTION: Each campaign needs both assistant_id and phone_number_id');
  }
  
  console.log('\n\n💡 TO START MAKING CALLS:');
  console.log('=' .repeat(60));
  console.log('\n1. THROUGH THE UI:');
  console.log('   - Go to a campaign');
  console.log('   - Click "Start Campaign" or "Execute" button');
  console.log('   - This should trigger the /api/vapi-outbound/campaigns/:id/start endpoint');
  
  console.log('\n2. MANUALLY (for testing):');
  console.log('   Run: node start-test-campaign.cjs [campaign-id]');
  
  console.log('\n3. CHECK THE BACKEND LOGS:');
  console.log('   - Look for "Starting campaign" messages');
  console.log('   - Look for "Making call to" messages');
  console.log('   - Check for any error messages');
  
  console.log('\n4. VERIFY THE FLOW:');
  console.log('   Campaign Start → Load Leads → For Each Lead → Make VAPI Call');
  
  console.log('\n' + '=' .repeat(60));
}

checkCampaignExecution();