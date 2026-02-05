import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function traceCallData() {
  console.log('🔍 Tracing call data flow...\n');
  
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  const vapiCallId = '8ea2bbfc-8bd3-4764-adf8-c71a11640881';
  
  try {
    // 1. Check the calls table
    console.log('1️⃣ Checking calls table:');
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();
      
    if (call) {
      console.log('   Duration:', call.duration);
      console.log('   Cost:', call.cost);
      console.log('   Status:', call.status);
      console.log('   Started at:', call.started_at);
      console.log('   Ended at:', call.ended_at);
      console.log('   Customer name:', call.customer_name);
      console.log('   Customer phone:', call.customer_phone);
    }
    
    // 2. Check if there's a call queue entry
    console.log('\n2️⃣ Checking call_queue table:');
    const { data: queueEntry, error: queueError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('last_call_id', vapiCallId)
      .single();
      
    if (queueEntry) {
      console.log('   Found queue entry:', queueEntry.id);
      console.log('   Status:', queueEntry.status);
      console.log('   Last outcome:', queueEntry.last_outcome);
    } else {
      console.log('   No queue entry found');
    }
    
    // 3. Check campaign automation logs
    console.log('\n3️⃣ Checking campaign_automation_logs:');
    const { data: logs, error: logsError } = await supabase
      .from('campaign_automation_logs')
      .select('*')
      .eq('details->vapiCallId', vapiCallId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        console.log(`   ${log.action} at ${log.created_at}`);
        if (log.details) {
          console.log('   Details:', JSON.stringify(log.details, null, 2));
        }
      });
    } else {
      console.log('   No automation logs found');
    }
    
    // 4. Let's also check what the actual campaign ID is
    console.log('\n4️⃣ Campaign info:');
    if (call && call.campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name, status')
        .eq('id', call.campaign_id)
        .single();
        
      if (campaign) {
        console.log('   Campaign:', campaign.name);
        console.log('   Status:', campaign.status);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

traceCallData();