// Quick script to make a test call with minimal requirements
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function makeTestCall() {
  console.log('🚀 Attempting to make a test call...\n');
  
  const organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Get organization VAPI credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('vapi_private_key, vapi_public_key, settings')
    .eq('id', organizationId)
    .single();
    
  const vapiApiKey = org?.vapi_private_key || 
                     org?.settings?.vapi?.privateKey || 
                     org?.settings?.vapi?.apiKey;
                     
  if (!vapiApiKey) {
    console.error('❌ No VAPI API key found in organization');
    return;
  }
  
  console.log('✅ VAPI API key found');
  
  // Use campaign "Test 123" which has assistant and phone number configured
  const campaignId = 'dd797a17-0998-4240-b592-f8ef268ae242'; // Test 123
  const assistantId = 'b6c626b2-d159-42f3-a8cd-cad8d0f7536c';
  const phoneNumberId = 'd49a7d01-7caa-4421-b634-e8057494913d';
  
  // Test phone number (you should change this to your number)
  const testPhoneNumber = '+447123456789'; // UK format
  const testName = 'Test Contact';
  
  console.log('\n📞 Making VAPI call with:');
  console.log('   Campaign: Test 123');
  console.log('   Assistant:', assistantId);
  console.log('   Phone Number ID:', phoneNumberId);
  console.log('   Calling:', testPhoneNumber);
  
  try {
    // First, create a simple lead record (without first_name/last_name)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: organizationId,
        campaign_id: campaignId,
        name: testName, // Try using 'name' field instead
        phone: testPhoneNumber,
        status: 'pending',
        call_status: 'pending'
      })
      .select()
      .single();
      
    if (leadError) {
      console.log('⚠️ Could not create lead:', leadError.message);
      console.log('   Continuing without lead record...');
    } else {
      console.log('✅ Lead created:', lead.id);
    }
    
    // Make VAPI call
    const vapiCallData = {
      assistantId: assistantId,
      phoneNumberId: phoneNumberId,
      customer: {
        number: testPhoneNumber,
        name: testName
      }
    };
    
    console.log('\n🔄 Initiating VAPI call...');
    console.log('   Request:', JSON.stringify(vapiCallData, null, 2));
    
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
      console.error('\n❌ VAPI Error:', response.status);
      console.error('Response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.error?.message?.includes('phoneNumberId')) {
        console.log('\n💡 The phone number ID might be invalid.');
        console.log('   You need to:');
        console.log('   1. Go to https://dashboard.vapi.ai');
        console.log('   2. Purchase or verify a phone number');
        console.log('   3. Copy the phone number ID');
        console.log('   4. Update the campaign with the correct ID');
      }
      
      if (responseData.error?.message?.includes('assistantId')) {
        console.log('\n💡 The assistant ID might be invalid.');
        console.log('   You need to:');
        console.log('   1. Go to https://dashboard.vapi.ai');
        console.log('   2. Create or find your assistant');
        console.log('   3. Copy the assistant ID');
        console.log('   4. Update the campaign with the correct ID');
      }
      
      return;
    }
    
    console.log('\n✅ VAPI CALL INITIATED SUCCESSFULLY!');
    console.log('Call ID:', responseData.id);
    console.log('Status:', responseData.status);
    console.log('\n🎉 YOUR PHONE SHOULD BE RINGING NOW!');
    
    // Create call record
    if (lead) {
      const { data: callRecord } = await supabase
        .from('calls')
        .insert({
          organization_id: organizationId,
          campaign_id: campaignId,
          lead_id: lead.id,
          vapi_call_id: responseData.id,
          phone_number: testPhoneNumber,
          direction: 'outbound',
          status: 'initiated',
          started_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (callRecord) {
        console.log('✅ Call record created:', callRecord.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

console.log('=' .repeat(50));
console.log('   APEX PLATFORM - TEST CALL SCRIPT');
console.log('=' .repeat(50));
console.log('\n⚠️  IMPORTANT: Change the testPhoneNumber variable');
console.log('   to your actual phone number before running!\n');

// Uncomment this line and add your phone number to make a call:
// makeTestCall();

console.log('To make a call, edit this script:');
console.log('1. Change testPhoneNumber to your number');
console.log('2. Uncomment the makeTestCall() line');
console.log('3. Run: node make-test-call-now.cjs');