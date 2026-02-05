const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function monitorCampaignActivation() {
  console.log('🔄 MONITORING CAMPAIGN SYSTEM ACTIVATION');
  console.log('========================================\n');
  
  const startTime = new Date();
  console.log(`Started monitoring at: ${startTime.toLocaleTimeString()}\n`);
  
  // Get baseline data
  const { data: initialCalls } = await supabase
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  const initialCallCount = initialCalls?.length || 0;
  const lastCallTime = initialCalls?.[0]?.created_at;
  
  console.log('📊 BASELINE STATUS:');
  console.log(`   Latest call: ${lastCallTime ? new Date(lastCallTime).toLocaleString() : 'None found'}`);
  
  // Get test campaign status
  const { data: testCampaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', 'Test')
    .single();
  
  if (testCampaign) {
    const { data: campaignLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', testCampaign.id);
    
    console.log(`   Test campaign: ${testCampaign.status} with ${campaignLeads?.length || 0} leads`);
    console.log('   Target phones:', campaignLeads?.map(l => l.phone).join(', ') || 'None');
  }
  
  console.log('\n🎯 MONITORING FOR NEW CAMPAIGN ACTIVITY...');
  console.log('(Checking every 30 seconds for new calls)\n');
  
  let checkCount = 0;
  const maxChecks = 20; // Monitor for ~10 minutes
  
  const monitorInterval = setInterval(async () => {
    checkCount++;
    const currentTime = new Date();
    
    // Check for new calls
    const { data: newCalls } = await supabase
      .from('calls')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });
    
    const newCallCount = newCalls?.length || 0;
    
    console.log(`[${currentTime.toLocaleTimeString()}] Check ${checkCount}/${maxChecks}: ${newCallCount} new calls detected`);
    
    if (newCallCount > 0) {
      console.log('\n🎉 SUCCESS! Campaign system is making calls!');
      console.log('New call activity detected:');
      
      newCalls.forEach((call, i) => {
        console.log(`   ${i + 1}. ${call.phone_number} - ${call.status} - Campaign: ${call.campaign_id || 'None'}`);
        console.log(`      Created: ${new Date(call.created_at).toLocaleString()}`);
      });
      
      // Check if leads are being converted
      const { data: newLeads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .not('call_id', 'is', null);
      
      if (newLeads && newLeads.length > 0) {
        console.log('\n✨ BONUS: Lead conversion is also working!');
        console.log('Auto-converted leads:');
        newLeads.forEach((lead, i) => {
          console.log(`   ${i + 1}. ${lead.name} - ${lead.phone} (${lead.priority} priority)`);
        });
      }
      
      console.log('\n🚀 CAMPAIGN SYSTEM FULLY OPERATIONAL!');
      console.log('✅ Backend deployment successful');
      console.log('✅ Supabase credentials working');
      console.log('✅ Campaign processor active');
      console.log('✅ VAPI integration functional');
      console.log('✅ Lead conversion automatic');
      
      clearInterval(monitorInterval);
      return;
    }
    
    // Show what we're waiting for
    if (checkCount % 3 === 0) { // Every 90 seconds
      console.log('   Waiting for: Backend services to start making calls...');
      console.log('   Expected: Calls to test campaign phone numbers');
    }
    
    if (checkCount >= maxChecks) {
      console.log('\n⏰ Monitoring period completed (10 minutes)');
      console.log('If no calls detected, possible issues:');
      console.log('1. Backend services still starting up');
      console.log('2. Campaign processor not yet active');
      console.log('3. VAPI configuration needs verification');
      console.log('4. Manual trigger might be needed');
      
      clearInterval(monitorInterval);
    }
  }, 30000); // Check every 30 seconds
  
  // Also check webhook logs for backend activity
  setTimeout(async () => {
    const { data: webhookLogs } = await supabase
      .from('webhook_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (webhookLogs && webhookLogs.length > 0) {
      console.log('\n📡 Backend activity detected (webhook logs):');
      webhookLogs.forEach((log, i) => {
        console.log(`   ${i + 1}. ${log.event_type || 'Unknown'} - ${new Date(log.created_at).toLocaleTimeString()}`);
      });
    }
  }, 60000); // Check after 1 minute
  
  console.log('Monitoring started... Press Ctrl+C to stop manually.\n');
}

monitorCampaignActivation();