import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecording() {
  const callId = 'd69543b9-01d3-4279-b81d-2cd621a2024c';
  
  const { data, error } = await supabase
    .from('calls')
    .select('id, vapi_call_id, recording_url, status, transcript, summary')
    .eq('id', callId)
    .single();
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Call data:', {
      id: data.id,
      vapi_call_id: data.vapi_call_id,
      recording_url: data.recording_url,
      hasTranscript: !!data.transcript,
      hasSummary: !!data.summary,
      status: data.status
    });
    
    if (!data.recording_url && data.vapi_call_id) {
      console.log('\n❌ Recording URL is NULL in database');
      console.log('✅ But we have vapi_call_id:', data.vapi_call_id);
      console.log('📝 The recording should be fetched from VAPI API');
    }
  }
}

checkRecording();