const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function diagnoseCampaignCalls() {
  console.log('🔍 Diagnosing Campaign Call Issues...\n');
  
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'; // Emerald Green Energy
  
  // 1. Check active campaigns
  console.log('=== ACTIVE CAMPAIGNS ===');
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(5);
    
  if (campaignError) {
    console.error('Error fetching campaigns:', campaignError);
    return;
  }
  
  console.log(`Found ${campaigns?.length || 0} active campaigns\n`);
  
  for (const campaign of campaigns || []) {
    console.log(`\n📊 Campaign: ${campaign.name} (${campaign.id})`);
    console.log(`Status: ${campaign.status}`);
    
    // Check settings
    const settings = campaign.settings || {};
    console.log('\n✅ Campaign Configuration:');
    console.log(`- Assistant ID: ${settings.assistant_id || campaign.assistant_id || '❌ MISSING'}`);
    console.log(`- Phone Number ID: ${settings.phone_number_id || campaign.phone_number_id || '❌ MISSING'}`);
    console.log(`- Has CSV Data: ${settings.csv_data ? '✅ Yes' : '❌ No'}`);
    
    // 2. Check leads for this campaign
    console.log('\n📋 Leads Status:');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, call_status, phone')
      .eq('campaign_id', campaign.id);
      
    if (leadsError) {
      console.log('❌ Error fetching leads:', leadsError.message);
    } else if (!leads || leads.length === 0) {
      console.log('❌ NO LEADS in leads table for this campaign');
      
      // Check if there are campaign_contacts that need to be copied
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .eq('campaign_id', campaign.id);
        
      if (!contactsError && contacts && contacts.length > 0) {
        console.log(`⚠️  Found ${contacts.length} contacts in campaign_contacts table (need to be copied to leads)`);
      }
    } else {
      console.log(`Total leads: ${leads.length}`);
      
      // Count by status
      const statusCounts = {};
      leads.forEach(lead => {
        statusCounts[lead.call_status || 'null'] = (statusCounts[lead.call_status || 'null'] || 0) + 1;
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
      
      // Show sample phone numbers
      console.log('\nSample phone numbers (first 3):');
      leads.slice(0, 3).forEach(lead => {
        console.log(`  - ${lead.phone}`);
      });
    }
    
    // 3. Check calls made
    console.log('\n📞 Calls Status:');
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, status, created_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (callsError) {
      console.log('❌ Error fetching calls:', callsError.message);
    } else if (!calls || calls.length === 0) {
      console.log('❌ NO CALLS made for this campaign yet');
    } else {
      console.log(`Found ${calls.length} recent calls:`);
      calls.forEach(call => {
        console.log(`  - ${call.id}: ${call.status} (${new Date(call.created_at).toLocaleString()})`);
      });
    }
    
    // 4. Check organization VAPI credentials
    console.log('\n🔑 Organization VAPI Status:');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('vapi_api_key, vapi_public_key')
      .eq('id', organizationId)
      .single();
      
    if (orgError) {
      console.log('❌ Error fetching organization:', orgError.message);
    } else {
      console.log(`- Has VAPI API Key: ${org.vapi_api_key ? '✅ Yes' : '❌ No'}`);
      console.log(`- Has VAPI Public Key: ${org.vapi_public_key ? '✅ Yes' : '❌ No'}`);
    }
    
    // 5. Diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    const issues = [];
    const statusCounts = {};
    
    // Recount status for diagnosis if we have leads
    if (leads && leads.length > 0) {
      leads.forEach(lead => {
        statusCounts[lead.call_status || 'null'] = (statusCounts[lead.call_status || 'null'] || 0) + 1;
      });
    }
    
    if (!settings.assistant_id && !campaign.assistant_id) {
      issues.push('❌ Missing VAPI Assistant ID');
    }
    if (!settings.phone_number_id && !campaign.phone_number_id) {
      issues.push('❌ Missing VAPI Phone Number ID');
    }
    if (!leads || leads.length === 0) {
      issues.push('❌ No leads in the leads table');
    } else if (!statusCounts['pending']) {
      issues.push('❌ No pending leads (all already called or failed)');
    }
    if (!org?.vapi_api_key) {
      issues.push('❌ Organization missing VAPI API key');
    }
    
    if (issues.length === 0) {
      console.log('✅ Campaign appears ready to make calls');
      console.log('ℹ️  If calls still aren\'t being made, check backend logs for VAPI API errors');
    } else {
      console.log('Issues preventing calls:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

diagnoseCampaignCalls();