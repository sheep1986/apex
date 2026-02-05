// Reset lead status and make a new VAPI call
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function resetAndCallAgain() {
  console.log('🔄 Resetting lead and making a new call...\n');
  
  const campaignId = 'c2609329-ec4c-47d7-85aa-687856493d0a';
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  try {
    // 1. Reset the lead status
    const { data: lead, error: resetError } = await supabase
      .from('leads')
      .update({
        call_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .select()
      .single();
      
    if (resetError) throw resetError;
    console.log('✅ Lead reset to pending status');
    console.log(`   ${lead.first_name} ${lead.last_name} - ${lead.phone}\n`);
    
    // 2. Get campaign settings
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
      
    // 3. Get VAPI credentials
    const { data: org } = await supabase
      .from('organizations')
      .select('vapi_private_key, vapi_public_key, vapi_api_key, settings')
      .eq('id', organizationId)
      .single();
      
    const vapiApiKey = org.vapi_private_key || 
                      org.settings?.vapi?.privateKey || 
                      org.settings?.vapi?.apiKey ||
                      org.vapi_api_key;
                      
    if (!vapiApiKey) {
      console.error('❌ No VAPI API key found');
      return;
    }
    
    const settings = campaign.settings || {};
    const assistantId = settings.assistant_id || campaign.assistant_id;
    const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;
    
    console.log('📞 Making VAPI call with:');
    console.log('   Assistant:', assistantId);
    console.log('   Phone Number:', phoneNumberId);
    
    // Format phone number
    let phoneNumber = lead.phone;
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.startsWith('44')) {
        phoneNumber = '+' + phoneNumber;
      } else {
        phoneNumber = '+44' + phoneNumber.replace(/^0/, '');
      }
    }
    
    // 4. Make the VAPI call
    const vapiCallData = {
      assistantId: assistantId,
      phoneNumberId: phoneNumberId,
      customer: {
        number: phoneNumber,
        name: `${lead.first_name} ${lead.last_name}`,
        externalId: lead.id
      }
    };
    
    console.log('\n🚀 Initiating VAPI call to', phoneNumber);
    
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vapiCallData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`VAPI error: ${response.status} - ${JSON.stringify(responseData)}`);
    }
    
    console.log('\n✅ VAPI CALL INITIATED!');
    console.log('Call ID:', responseData.id);
    console.log('Status:', responseData.status);
    
    // 5. Create call record
    const { data: callRecord } = await supabase
      .from('calls')
      .insert({
        organization_id: organizationId,
        campaign_id: campaignId,
        lead_id: lead.id,
        vapi_call_id: responseData.id,
        phone_number: lead.phone,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
      
    console.log('✅ Call record created:', callRecord.id);
    
    // 6. Update lead to calling
    await supabase
      .from('leads')
      .update({
        call_status: 'calling',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);
      
    console.log('✅ Lead status updated to "calling"');
    console.log('\n🎉 YOUR PHONE SHOULD BE RINGING NOW!');
    console.log('Call will be tracked via webhook when completed.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

resetAndCallAgain();