import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCampaignCalls() {
  console.log('🔍 Debugging campaign calls...\n');
  
  // Get the specific call from your screenshot
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  
  try {
    // Fetch the specific call
    const { data: call, error } = await supabase
      .from('calls')
      .select(`
        *,
        leads!calls_lead_id_fkey(first_name, last_name, phone, email, company)
      `)
      .eq('id', callId)
      .single();
    
    if (error) {
      console.error('Error fetching call:', error);
      return;
    }
    
    console.log('📞 Call data:');
    console.log('ID:', call.id);
    console.log('VAPI Call ID:', call.vapi_call_id);
    console.log('Status:', call.status);
    console.log('Duration:', call.duration);
    console.log('Cost:', call.cost);
    console.log('Customer Name:', call.customer_name);
    console.log('Customer Phone:', call.customer_phone);
    console.log('Phone Number:', call.phone_number);
    console.log('To Number:', call.to_number);
    console.log('Lead ID:', call.lead_id);
    
    if (call.leads) {
      console.log('\n👤 Lead data:');
      console.log('Name:', `${call.leads.first_name} ${call.leads.last_name}`);
      console.log('Phone:', call.leads.phone);
      console.log('Email:', call.leads.email);
      console.log('Company:', call.leads.company);
    }
    
    // Also check if there's a related lead by phone number
    if (call.customer_phone || call.phone_number || call.to_number) {
      const phoneToSearch = call.customer_phone || call.phone_number || call.to_number;
      console.log('\n🔍 Searching for lead by phone:', phoneToSearch);
      
      const { data: leadByPhone, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phoneToSearch)
        .single();
        
      if (leadByPhone) {
        console.log('✅ Found lead by phone number:');
        console.log('Name:', `${leadByPhone.first_name} ${leadByPhone.last_name}`);
        console.log('Lead ID:', leadByPhone.id);
      } else {
        console.log('❌ No lead found with this phone number');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

debugCampaignCalls();