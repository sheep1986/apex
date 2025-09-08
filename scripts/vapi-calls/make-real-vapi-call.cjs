// Script to make REAL VAPI calls (not simulated)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function makeRealVAPICall() {
  console.log('🚀 Starting REAL VAPI Call Process\n');
  
  const campaignId = 'c2609329-ec4c-47d7-85aa-687856493d0a'; // Campaign "11"
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  try {
    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
      
    if (campaignError) throw campaignError;
    console.log(`📊 Campaign: ${campaign.name}`);
    
    // 2. Get organization VAPI credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('vapi_private_key, vapi_public_key, vapi_api_key, settings')
      .eq('id', organizationId)
      .single();
      
    if (orgError) throw orgError;
    
    // Get VAPI API key (private key for making calls)
    const vapiApiKey = org.vapi_private_key || 
                      org.settings?.vapi?.privateKey || 
                      org.settings?.vapi?.apiKey ||
                      org.vapi_api_key;
                      
    if (!vapiApiKey) {
      console.error('❌ No VAPI API key found for organization');
      console.log('Available keys:', {
        vapi_private_key: !!org.vapi_private_key,
        vapi_api_key: !!org.vapi_api_key,
        settings_vapi: !!org.settings?.vapi
      });
      return;
    }
    
    console.log('✅ Found VAPI API key');
    
    // 3. Get assistant and phone number from campaign settings
    const settings = campaign.settings || {};
    const assistantId = settings.assistant_id || campaign.assistant_id;
    const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;
    
    console.log('Assistant ID:', assistantId);
    console.log('Phone Number ID:', phoneNumberId);
    
    if (!assistantId || !phoneNumberId) {
      console.error('❌ Missing assistant or phone number configuration');
      return;
    }
    
    // 4. Get lead to call
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('call_status', 'pending')
      .limit(1)
      .single();
      
    if (leadError || !lead) {
      console.log('⚠️ No pending leads found. Checking completed leads...');
      
      // Try to get any lead for testing
      const { data: anyLead, error: anyLeadError } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .limit(1)
        .single();
        
      if (anyLeadError || !anyLead) {
        console.error('❌ No leads found for campaign');
        return;
      }
      
      console.log(`Found lead: ${anyLead.first_name} ${anyLead.last_name} - ${anyLead.phone}`);
      console.log('⚠️ WARNING: This lead may have already been called');
      
      // Ask for confirmation
      console.log('\n🤔 Do you want to call this number anyway? (It\'s your number, so it\'s safe for testing)');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      lead = anyLead;
    }
    
    console.log(`\n📞 Preparing to call: ${lead.first_name} ${lead.last_name}`);
    console.log(`   Phone: ${lead.phone}`);
    
    // 5. Make the VAPI API call
    console.log('\n🔄 Initiating VAPI call...');
    
    // Ensure phone number is in E.164 format
    let phoneNumber = lead.phone;
    if (!phoneNumber.startsWith('+')) {
      // Assume UK number if it starts with 44
      if (phoneNumber.startsWith('44')) {
        phoneNumber = '+' + phoneNumber;
      } else {
        phoneNumber = '+44' + phoneNumber.replace(/^0/, ''); // Remove leading 0 and add +44
      }
    }
    
    const vapiCallData = {
      assistantId: assistantId,
      phoneNumberId: phoneNumberId,
      customer: {
        number: phoneNumber,
        name: `${lead.first_name} ${lead.last_name}`,
        externalId: lead.id
      }
    };
    
    console.log('Call payload:', JSON.stringify(vapiCallData, null, 2));
    
    try {
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
        throw new Error(`VAPI API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }
      
      console.log('\n✅ VAPI call initiated successfully!');
      console.log('VAPI Call ID:', responseData.id);
      console.log('Status:', responseData.status);
      
      // 6. Create call record in database
      const { data: callRecord, error: callError } = await supabase
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
        
      if (callError) {
        console.error('⚠️ Error creating call record:', callError);
      } else {
        console.log('✅ Call record created:', callRecord.id);
      }
      
      // 7. Update lead status
      await supabase
        .from('leads')
        .update({
          call_status: 'calling',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
        
      console.log('✅ Lead status updated to "calling"');
      
      console.log('\n🎉 SUCCESS! Real VAPI call has been initiated.');
      console.log('Your phone should ring shortly...');
      console.log('\nThe call status will be updated via webhook when the call completes.');
      
    } catch (apiError) {
      console.error('\n❌ VAPI API Error:', apiError.message);
      
      if (apiError.message.includes('401')) {
        console.log('\n⚠️ Authentication failed. The VAPI API key may be invalid.');
      } else if (apiError.message.includes('400')) {
        console.log('\n⚠️ Bad request. Check assistant and phone number IDs.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
makeRealVAPICall();