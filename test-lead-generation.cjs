const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../apps/backend/.env' });

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLeadGeneration() {
  console.log('🔍 Testing lead generation pipeline...\n');

  try {
    // 1. Check recent calls with transcripts
    console.log('📞 Recent calls with transcripts:');
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, campaign_id, organization_id, customer_name, transcript, is_qualified_lead, crm_status, lead_id')
      .not('transcript', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (callsError) {
      console.error('❌ Error fetching calls:', callsError);
      return;
    }

    console.log(`Found ${calls.length} calls with transcripts`);
    calls.forEach(call => {
      console.log(`\n📞 Call ${call.id}:`);
      console.log(`   Customer: ${call.customer_name}`);
      console.log(`   Has transcript: ${call.transcript?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   Is qualified lead: ${call.is_qualified_lead || 'Not processed'}`);
      console.log(`   CRM status: ${call.crm_status || 'Not added'}`);
      console.log(`   Lead ID: ${call.lead_id || 'None'}`);
    });

    // 2. Check leads table
    console.log('\n\n📋 Recent leads:');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, campaign_id, first_name, last_name, phone, source, status, lead_score, call_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }

    console.log(`Found ${leads.length} leads`);
    leads.forEach(lead => {
      console.log(`\n📋 Lead ${lead.id}:`);
      console.log(`   Name: ${lead.first_name} ${lead.last_name}`);
      console.log(`   Phone: ${lead.phone}`);
      console.log(`   Source: ${lead.source}`);
      console.log(`   Status: ${lead.status}`);
      console.log(`   Score: ${lead.lead_score}`);
      console.log(`   Call ID: ${lead.call_id || 'None'}`);
    });

    // 3. Check for qualified calls without leads
    console.log('\n\n⚠️ Qualified calls without leads:');
    const { data: orphanCalls, error: orphanError } = await supabase
      .from('calls')
      .select('id, customer_name, is_qualified_lead, crm_status')
      .eq('is_qualified_lead', true)
      .is('lead_id', null);

    if (orphanError) {
      console.error('❌ Error checking orphan calls:', orphanError);
      return;
    }

    if (orphanCalls.length > 0) {
      console.log(`Found ${orphanCalls.length} qualified calls without leads:`);
      orphanCalls.forEach(call => {
        console.log(`   - ${call.id}: ${call.customer_name} (CRM: ${call.crm_status || 'Not added'})`);
      });
    } else {
      console.log('✅ All qualified calls have associated leads');
    }

    // 4. Check if AI processing is enabled
    console.log('\n\n🤖 AI Processing Configuration:');
    console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLeadGeneration();