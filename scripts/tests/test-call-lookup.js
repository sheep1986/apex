import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCallLookup() {
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  
  console.log('🔍 Looking for call:', callId);
  
  // First, check if the call exists at all
  const { data: callExists, error: checkError } = await supabase
    .from('calls')
    .select('id, organization_id, campaign_id, vapi_call_id, status')
    .eq('id', callId)
    .single();
    
  if (checkError) {
    console.error('❌ Error checking call:', checkError);
  } else {
    console.log('✅ Call found:', callExists);
  }
  
  // Now check with organization filter
  const orgId = 'f083e7d5-36c5-4c09-931b-5c37a17c5d6c'; // From your test user
  
  const { data: callWithOrg, error: orgError } = await supabase
    .from('calls')
    .select('*')
    .eq('id', callId)
    .eq('organization_id', orgId)
    .single();
    
  if (orgError) {
    console.error('❌ Error with org filter:', orgError);
  } else {
    console.log('✅ Call with org filter:', callWithOrg);
  }
}

testCallLookup();