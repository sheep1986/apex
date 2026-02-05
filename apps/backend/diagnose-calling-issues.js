const { createClient } = require('@supabase/supabase-js');

// Hardcode the values temporarily for diagnosis
const SUPABASE_URL = 'https://twigokrtbvigiqnaybfy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.GVsZM3A7kOGFnRCnVxRRrJIj0vOJAKh7Ga0qPn5VoR0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnoseCallingIssues() {
  console.log('\n🔍 DIAGNOSING VAPI CALLING ISSUES\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check for duplicate phone numbers in leads (simplified query)
    console.log('\n1️⃣ CHECKING FOR DUPLICATE PHONE NUMBERS IN LEADS:');
    const { data: allLeads, error: dupError } = await supabase
      .from('leads')
      .select('phone_number')
      .not('phone_number', 'is', null);

    if (allLeads) {
      const phoneCount = {};
      allLeads.forEach(lead => {
        if (lead.phone_number) {
          phoneCount[lead.phone_number] = (phoneCount[lead.phone_number] || 0) + 1;
        }
      });
      
      const duplicates = Object.entries(phoneCount).filter(([phone, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️  Found duplicate phone numbers:');
        duplicates.forEach(([phone, count]) => {
          console.log(`   - ${phone}: ${count} occurrences`);
        });
      } else {
        console.log('✅ No duplicate phone numbers found in leads');
      }
    }

    // 2. Check active campaigns
    console.log('\n2️⃣ CHECKING ACTIVE CAMPAIGNS:');
    const { data: campaigns, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (campaigns && campaigns.length > 0) {
      console.log(`✅ Found ${campaigns.length} active campaigns:`);
      campaigns.forEach(camp => {
        console.log(`   - ID: ${camp.id}`);
        console.log(`     Name: ${camp.name}`);
        console.log(`     Organization: ${camp.organization_id}`);
        console.log(`     VAPI Assistant: ${camp.vapi_assistant_id || 'NOT SET'}`);
        console.log(`     VAPI Phone: ${camp.vapi_phone_number_id || 'NOT SET'}`);
        console.log(`     Status: ${camp.status}`);
        console.log(`     Created: ${camp.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No active campaigns found!');
    }

    // 3. Check VAPI configuration in organizations
    console.log('\n3️⃣ CHECKING VAPI CONFIGURATION IN ORGANIZATIONS:');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, vapi_api_key, vapi_settings')
      .limit(5);

    if (orgs) {
      orgs.forEach(org => {
        console.log(`   Organization: ${org.name} (${org.id})`);
        console.log(`   - VAPI API Key: ${org.vapi_api_key ? 'SET ✅' : 'NOT SET ❌'}`);
        if (org.vapi_api_key) {
          console.log(`     Key preview: ${org.vapi_api_key.substring(0, 10)}...`);
        }
        
        if (org.vapi_settings) {
          try {
            const settings = typeof org.vapi_settings === 'string' 
              ? JSON.parse(org.vapi_settings) 
              : org.vapi_settings;
            console.log(`   - VAPI Settings: ${JSON.stringify(settings, null, 2)}`);
          } catch (e) {
            console.log(`   - VAPI Settings: Invalid JSON`);
          }
        } else {
          console.log(`   - VAPI Settings: NOT CONFIGURED ❌`);
        }
        console.log('');
      });
    }

    // 4. Check recent calls
    console.log('\n4️⃣ CHECKING RECENT CALL ATTEMPTS:');
    const { data: recentCalls, error: callError } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentCalls && recentCalls.length > 0) {
      console.log(`✅ Found ${recentCalls.length} recent calls:`);
      recentCalls.forEach(call => {
        console.log(`   - Call ID: ${call.id}`);
        console.log(`     VAPI Call ID: ${call.vapi_call_id || 'NOT SET'}`);
        console.log(`     Campaign: ${call.campaign_id}`);
        console.log(`     Lead: ${call.lead_id}`);
        console.log(`     Status: ${call.status}`);
        console.log(`     Created: ${call.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No calls found in the database!');
    }

    // 5. Check for leads without calls
    console.log('\n5️⃣ CHECKING LEADS WITHOUT CALLS:');
    const { data: leadsWithoutCalls, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone_number, campaign_id')
      .limit(5);

    if (leadsWithoutCalls) {
      console.log(`📊 Sample of leads (first 5):`);
      leadsWithoutCalls.forEach(lead => {
        console.log(`   - ${lead.first_name} ${lead.last_name}: ${lead.phone_number}`);
      });
    }

    // 6. Check VAPI webhook logs
    console.log('\n6️⃣ CHECKING VAPI WEBHOOK LOGS:');
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('vapi_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (webhookLogs && webhookLogs.length > 0) {
      console.log(`✅ Found ${webhookLogs.length} recent webhook logs:`);
      webhookLogs.forEach(log => {
        console.log(`   - Event: ${log.event_type}`);
        console.log(`     Timestamp: ${log.created_at}`);
        if (log.payload) {
          console.log(`     Payload: ${JSON.stringify(log.payload).substring(0, 100)}...`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No webhook logs found - webhooks may not be configured!');
    }

    // 7. Check for required VAPI tables
    console.log('\n7️⃣ CHECKING VAPI-RELATED TABLES:');
    const tables = ['vapi_assistants', 'vapi_phone_numbers', 'vapi_webhook_logs'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist!`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎯 DIAGNOSIS SUMMARY:\n');
    console.log('Common issues that prevent calls:');
    console.log('1. Missing VAPI API key in organization settings');
    console.log('2. Missing VAPI assistant ID in campaigns');
    console.log('3. Missing VAPI phone number ID in campaigns');
    console.log('4. Duplicate phone numbers (VAPI may reject duplicates)');
    console.log('5. Webhook not properly configured');
    console.log('6. No valid leads assigned to campaigns');
    console.log('7. Campaign not in "active" status');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseCallingIssues();