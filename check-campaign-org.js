import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaignOrg() {
  const campaignId = '3e5852ce-1821-4518-b983-0abbcc679844';
  
  console.log('🔍 Checking campaign:', campaignId);
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, organization_id')
    .eq('id', campaignId)
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Campaign:', campaign);
  }
  
  // Check what org the dev user has
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, organization_id, role')
    .in('email', ['sean@apex.com', 'client.admin@apex.com']);
    
  if (userError) {
    console.error('❌ User error:', userError);
  } else {
    console.log('👤 Users:', users);
  }
}

checkCampaignOrg();