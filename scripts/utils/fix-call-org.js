import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl ? 'present' : 'missing');
  console.log('Service Key:', supabaseServiceKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrgAndCall() {
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  const correctOrgId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Check current state
  console.log('🔍 Checking call:', callId);
  
  const { data: call, error: checkError } = await supabase
    .from('calls')
    .select('id, organization_id, campaign_id')
    .eq('id', callId)
    .single();
    
  if (checkError) {
    console.error('❌ Error checking call:', checkError);
    return;
  }
  
  console.log('📊 Current call data:', call);
  
  if (call.organization_id === correctOrgId) {
    console.log('✅ Call already has correct organization ID');
  } else {
    console.log('❌ Call has wrong organization ID, expected:', correctOrgId);
  }
  
  // Check that the campaign also has the same org
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .select('id, name, organization_id')
    .eq('id', call.campaign_id)
    .single();
    
  if (campError) {
    console.error('❌ Error checking campaign:', campError);
  } else {
    console.log('📊 Campaign data:', campaign);
  }
}

checkOrgAndCall();