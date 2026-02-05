import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCallModal() {
  console.log('🔍 Testing Call Modal Data Retrieval...\n');
  
  // Test call ID (you can change this to any valid call ID)
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  
  console.log('📞 Fetching call details for ID:', callId);
  
  // Fetch call with all related data
  const { data: call, error } = await supabase
    .from('calls')
    .select(`
      *,
      leads!calls_lead_id_fkey(first_name, last_name, email, company, phone),
      campaigns(name, description)
    `)
    .eq('id', callId)
    .single();
    
  if (error) {
    console.error('❌ Error fetching call:', error);
    return;
  }
  
  console.log('\n✅ Call Data Retrieved Successfully!\n');
  console.log('📊 Call Details:');
  console.log('  ID:', call.id);
  console.log('  VAPI Call ID:', call.vapi_call_id);
  console.log('  Status:', call.status);
  console.log('  Duration:', call.duration, 'seconds');
  console.log('  Cost: $', call.cost);
  console.log('  Recording URL:', call.recording_url || 'Not available');
  
  console.log('\n👤 Customer Information:');
  if (call.leads) {
    console.log('  Name:', `${call.leads.first_name} ${call.leads.last_name}`);
    console.log('  Phone:', call.leads.phone);
    console.log('  Email:', call.leads.email);
    console.log('  Company:', call.leads.company);
  } else {
    console.log('  Customer Phone:', call.customer_phone || call.phone_number);
    console.log('  Customer Name:', call.customer_name || 'Unknown');
  }
  
  console.log('\n📋 Campaign Information:');
  if (call.campaigns) {
    console.log('  Campaign Name:', call.campaigns.name);
    console.log('  Campaign Description:', call.campaigns.description);
  }
  
  console.log('\n📝 Transcript & Summary:');
  console.log('  Has Transcript:', !!call.transcript);
  console.log('  Has Summary:', !!call.summary);
  console.log('  Sentiment:', call.sentiment);
  
  if (call.transcript) {
    const lines = call.transcript.split('\n').filter(l => l.trim());
    console.log('  Transcript Lines:', lines.length);
    console.log('  First Line:', lines[0]?.substring(0, 100) + '...');
  }
  
  console.log('\n🎯 Data Transformation for Modal:');
  const transformedData = {
    id: call.id,
    duration: call.duration || 0,
    recording: call.recording_url,
    cost: call.cost || 0,
    customerName: call.leads ? `${call.leads.first_name} ${call.leads.last_name}` : call.customer_name || 'Unknown',
    customerPhone: call.leads?.phone || call.customer_phone || call.phone_number,
    customerEmail: call.leads?.email,
    customerCompany: call.leads?.company,
    status: call.status,
    startedAt: call.started_at,
    endedAt: call.ended_at,
    campaignName: call.campaigns?.name,
    direction: call.direction || 'outbound',
    vapiCallId: call.vapi_call_id,
  };
  
  console.log('\n✨ Transformed Data:', JSON.stringify(transformedData, null, 2));
  
  console.log('\n✅ Test Complete! The modal should display all this information properly.');
  console.log('💡 If any fields show as "Unknown" or missing, check the database columns.');
}

testCallModal();