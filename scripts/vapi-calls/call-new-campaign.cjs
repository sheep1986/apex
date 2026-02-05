// Make VAPI call for the new campaign
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function callNewCampaign() {
  console.log('🚀 Processing new campaign "112 Test"\n');
  
  const campaignId = 'fc168882-f178-4be5-a2f0-cf640eb61dba'; // 112 Test campaign
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  try {
    // 1. Get campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
      
    console.log(`📊 Campaign: ${campaign.name}`);
    
    // 2. Parse CSV and create lead if needed
    const csvData = campaign.settings?.csv_data;
    if (csvData) {
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines[1].split(',').map(d => d.trim());
        
        const phoneIndex = headers.indexOf('number');
        const nameIndex = headers.indexOf('name');
        
        const phone = data[phoneIndex];
        const name = data[nameIndex] || 'Contact';
        
        // Check if lead exists for this campaign
        let { data: existingLead } = await supabase
          .from('leads')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('phone', phone)
          .single();
          
        // If not in this campaign, check if exists in org
        if (!existingLead) {
          const { data: orgLead } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('phone', phone)
            .single();
            
          if (orgLead) {
            // Update existing lead to this campaign
            const { data: updatedLead } = await supabase
              .from('leads')
              .update({
                campaign_id: campaignId,
                call_status: 'pending',
                updated_at: new Date().toISOString()
              })
              .eq('id', orgLead.id)
              .select()
              .single();
            existingLead = updatedLead;
          }
        }
          
        let lead;
        if (!existingLead) {
          // Create lead
          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
              organization_id: organizationId,
              campaign_id: campaignId,
              first_name: name,
              last_name: '',
              phone: phone,
              status: 'pending',
              call_status: 'pending'
            })
            .select()
            .single();
            
          if (leadError) {
            console.error('Error creating lead:', leadError);
            return;
          }
          
          lead = newLead;
          console.log('✅ Lead created:', name, phone);
        } else {
          lead = existingLead;
          console.log('✅ Lead exists:', name, phone);
        }
        
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
        
        const assistantId = campaign.settings?.assistant_id;
        const phoneNumberId = campaign.settings?.phone_number_id;
        
        console.log('\n📞 Making VAPI call with:');
        console.log('   Assistant:', assistantId);
        console.log('   Phone Number:', phoneNumberId);
        
        // Format phone for E.164
        let phoneNumber = phone;
        if (!phoneNumber.startsWith('+')) {
          if (phoneNumber.startsWith('44')) {
            phoneNumber = '+' + phoneNumber;
          } else {
            phoneNumber = '+44' + phoneNumber.replace(/^0/, '');
          }
        }
        
        // 4. Make VAPI call
        const vapiCallData = {
          assistantId: assistantId,
          phoneNumberId: phoneNumberId,
          customer: {
            number: phoneNumber,
            name: name,
            externalId: lead.id
          }
        };
        
        console.log('\n🔄 Initiating VAPI call to', phoneNumber);
        
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
            phone_number: phone,
            direction: 'outbound',
            status: 'initiated',
            started_at: new Date().toISOString()
          })
          .select()
          .single();
          
        console.log('✅ Call record created:', callRecord.id);
        
        // 6. Update lead status
        await supabase
          .from('leads')
          .update({
            call_status: 'calling',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);
          
        console.log('✅ Lead status updated to "calling"');
        console.log('\n🎉 YOUR PHONE SHOULD BE RINGING NOW!');
        console.log('This is for campaign "112 Test"');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

callNewCampaign();