import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentCalls() {
  console.log('🔍 Checking recent calls for duration and cost...\n');
  
  try {
    // Get recent calls
    const { data: calls, error } = await supabase
      .from('calls')
      .select('id, vapi_call_id, duration, cost, status, created_at, started_at, ended_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching calls:', error);
      return;
    }
    
    console.log(`Found ${calls.length} recent calls:\n`);
    
    calls.forEach(call => {
      console.log(`📞 Call ${call.id.substring(0, 8)}...`);
      console.log(`   VAPI ID: ${call.vapi_call_id}`);
      console.log(`   Duration: ${call.duration}s`);
      console.log(`   Cost: $${call.cost}`);
      console.log(`   Status: ${call.status}`);
      console.log(`   Created: ${new Date(call.created_at).toLocaleString()}`);
      console.log(`   Started: ${call.started_at ? new Date(call.started_at).toLocaleString() : 'null'}`);
      console.log(`   Ended: ${call.ended_at ? new Date(call.ended_at).toLocaleString() : 'null'}`);
      console.log('');
    });
    
    // Count how many have actual duration/cost
    const withDuration = calls.filter(c => c.duration > 0).length;
    const withCost = calls.filter(c => c.cost > 0).length;
    
    console.log(`Summary:`);
    console.log(`- Calls with duration > 0: ${withDuration}/${calls.length}`);
    console.log(`- Calls with cost > 0: ${withCost}/${calls.length}`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRecentCalls();