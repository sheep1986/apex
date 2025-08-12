import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('🔍 Checking database data...\n');
  
  // 1. Check campaigns
  console.log('1️⃣ Campaigns:');
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, organization_id, status')
    .limit(5);
    
  if (campaigns?.length > 0) {
    campaigns.forEach(c => {
      console.log(`   - ${c.name} (${c.id.substring(0, 8)}...) - Org: ${c.organization_id?.substring(0, 8) || 'none'} - Status: ${c.status}`);
    });
  } else {
    console.log('   No campaigns found');
  }
  
  // 2. Check organizations
  console.log('\n2️⃣ Organizations:');
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);
    
  if (orgs?.length > 0) {
    orgs.forEach(o => {
      console.log(`   - ${o.name} (${o.id.substring(0, 8)}...)`);
    });
  } else {
    console.log('   No organizations found');
  }
  
  // 3. Check calls
  console.log('\n3️⃣ Recent Calls:');
  const { data: calls } = await supabase
    .from('calls')
    .select('id, campaign_id, duration, cost, status')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (calls?.length > 0) {
    calls.forEach(c => {
      console.log(`   - Call ${c.id.substring(0, 8)}... - Duration: ${c.duration}s - Cost: $${c.cost} - Status: ${c.status}`);
    });
  } else {
    console.log('   No calls found');
  }
}

checkData();