const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkSpecificCampaignIssue() {
  const campaignId = 'c2609329-ec4c-47d7-85aa-687856493d0a';
  
  console.log('🔍 Checking Campaign: c2609329-ec4c-47d7-85aa-687856493d0a\n');
  
  // 1. Get campaign details
  console.log('=== CAMPAIGN DETAILS ===');
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
    
  if (campaignError) {
    console.error('Error fetching campaign:', campaignError);
    return;
  }
  
  if (!campaign) {
    console.log('❌ Campaign not found!');
    return;
  }
  
  console.log(`Name: ${campaign.name}`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Type: ${campaign.type}`);
  console.log(`Created: ${new Date(campaign.created_at).toLocaleString()}`);
  console.log(`Organization: ${campaign.organization_id}`);
  
  // Check settings
  console.log('\n=== CAMPAIGN SETTINGS ===');
  const settings = campaign.settings || {};
  console.log(`Assistant ID: ${settings.assistant_id || campaign.assistant_id || '❌ MISSING'}`);
  console.log(`Phone Number ID: ${settings.phone_number_id || campaign.phone_number_id || '❌ MISSING'}`);
  console.log(`CSV Data: ${settings.csv_data ? 'Present' : 'Not present'}`);
  console.log(`Working Hours: ${settings.working_hours_start || 'Not set'} - ${settings.working_hours_end || 'Not set'}`);
  console.log(`Time Zone: ${settings.time_zone || 'Not set'}`);
  console.log(`Calls Per Day: ${settings.calls_per_day || 'Not set'}`);
  
  // 2. Check leads
  console.log('\n=== LEADS IN DATABASE ===');
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', campaignId);
    
  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
  } else if (!leads || leads.length === 0) {
    console.log('❌ NO LEADS found in leads table');
    
    // Check campaign_contacts table
    const { data: contacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('*')
      .eq('campaign_id', campaignId);
      
    if (!contactsError && contacts && contacts.length > 0) {
      console.log(`\n⚠️ Found ${contacts.length} contacts in campaign_contacts table:`);
      contacts.forEach((contact, i) => {
        console.log(`  ${i + 1}. ${contact.first_name} ${contact.last_name} - ${contact.phone} (Status: ${contact.status || 'N/A'})`);
      });
      console.log('\n📝 These contacts need to be copied to the leads table to make calls!');
    }
  } else {
    console.log(`Found ${leads.length} lead(s):`);
    leads.forEach((lead, i) => {
      console.log(`\n  Lead ${i + 1}:`);
      console.log(`    ID: ${lead.id}`);
      console.log(`    Name: ${lead.first_name} ${lead.last_name}`);
      console.log(`    Phone: ${lead.phone}`);
      console.log(`    Call Status: ${lead.call_status || 'null'} ${lead.call_status === 'pending' ? '✅' : '❌ Not pending!'}`);
      console.log(`    Status: ${lead.status || 'null'}`);
      console.log(`    Call Attempts: ${lead.call_attempts || 0}`);
      console.log(`    Created: ${new Date(lead.created_at).toLocaleString()}`);
    });
  }
  
  // 3. Check calls
  console.log('\n=== CALLS MADE ===');
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (callsError) {
    console.error('Error fetching calls:', callsError);
  } else if (!calls || calls.length === 0) {
    console.log('❌ NO CALLS have been made for this campaign');
  } else {
    console.log(`Found ${calls.length} recent call(s):`);
    calls.forEach((call, i) => {
      console.log(`\n  Call ${i + 1}:`);
      console.log(`    ID: ${call.id}`);
      console.log(`    Status: ${call.status}`);
      console.log(`    Lead ID: ${call.lead_id}`);
      console.log(`    Started: ${new Date(call.started_at).toLocaleString()}`);
      console.log(`    Duration: ${call.duration || 0} seconds`);
    });
  }
  
  // 4. Check call queue
  console.log('\n=== CALL QUEUE ===');
  const { data: queueItems, error: queueError } = await supabase
    .from('call_queue')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');
    
  if (queueError) {
    console.log('Note: call_queue table might not exist');
  } else if (!queueItems || queueItems.length === 0) {
    console.log('No pending items in call queue');
  } else {
    console.log(`Found ${queueItems.length} pending queue items`);
  }
  
  // 5. Diagnosis
  console.log('\n=== 🔍 DIAGNOSIS ===');
  const issues = [];
  
  const assistantId = settings.assistant_id || campaign.assistant_id;
  const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;
  
  if (!assistantId) {
    issues.push('❌ Missing VAPI Assistant ID');
  }
  if (!phoneNumberId) {
    issues.push('❌ Missing VAPI Phone Number ID');
  }
  if (!leads || leads.length === 0) {
    issues.push('❌ No leads in the leads table');
  } else {
    const pendingLeads = leads.filter(l => l.call_status === 'pending');
    if (pendingLeads.length === 0) {
      issues.push('❌ No leads with "pending" status - all leads have been called or are in progress');
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ Campaign appears to be properly configured');
    console.log('ℹ️  If calls still aren\'t being made, check:');
    console.log('   1. Backend server is running');
    console.log('   2. VAPI API credentials are valid');
    console.log('   3. Backend logs for VAPI API errors');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    
    console.log('\n📝 RECOMMENDED FIX:');
    if (leads && leads.length > 0) {
      const nonPendingLeads = leads.filter(l => l.call_status !== 'pending');
      if (nonPendingLeads.length > 0) {
        console.log('Reset lead statuses to "pending" to allow calls to be made again.');
      }
    } else {
      console.log('Add leads to the campaign or copy contacts from campaign_contacts to leads table.');
    }
  }
}

checkSpecificCampaignIssue();