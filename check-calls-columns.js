import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCallsColumns() {
  console.log('🔍 Checking calls table columns...\n');
  
  try {
    // Get a sample call
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching calls:', error);
      return;
    }
    
    if (calls && calls.length > 0) {
      const columns = Object.keys(calls[0]);
      console.log('📊 Calls table columns:', columns);
      
      // Check for duration-related columns
      const durationColumns = columns.filter(col => 
        col.includes('duration') || col.includes('seconds')
      );
      console.log('\n⏱️ Duration-related columns:', durationColumns);
      
      // Check for cost-related columns
      const costColumns = columns.filter(col => 
        col.includes('cost') || col.includes('price')
      );
      console.log('💰 Cost-related columns:', costColumns);
      
      // Show sample data
      console.log('\n📝 Sample call data:');
      console.log('ID:', calls[0].id);
      console.log('Duration:', calls[0].duration);
      console.log('Cost:', calls[0].cost);
      console.log('Status:', calls[0].status);
      console.log('VAPI Call ID:', calls[0].vapi_call_id);
    } else {
      console.log('No calls found in the database');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCallsColumns();