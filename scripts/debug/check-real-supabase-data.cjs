const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealData() {
  try {
    console.log('🔍 Querying real Supabase calls table...\n');
    
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Supabase error:', error);
      return;
    }

    console.log(`📊 Found ${calls.length} calls in database:\n`);
    
    calls.forEach((call, index) => {
      console.log(`Call ${index + 1}:`);
      console.log(`  ID: ${call.id}`);
      console.log(`  Customer Name: ${call.customer_name || 'NULL'}`);
      console.log(`  Phone: ${call.phone_number || 'NULL'}`);
      console.log(`  Duration: ${call.duration || 'NULL'}`);
      console.log(`  Cost: ${call.cost || 'NULL'}`);
      console.log(`  Status: ${call.status || 'NULL'}`);
      console.log(`  Created: ${call.created_at || 'NULL'}`);
      console.log(`  Campaign ID: ${call.campaign_id || 'NULL'}`);
      console.log(`  Outcome: ${call.outcome || 'NULL'}`);
      console.log(`  Sentiment: ${call.sentiment || 'NULL'}`);
      console.log(`  Summary: ${call.summary ? call.summary.substring(0, 100) + '...' : 'NULL'}`);
      console.log('  ---');
    });

    // Compare with what Vercel backend would return
    console.log('\n🔄 What Vercel backend transforms this to:\n');
    
    calls.forEach((call, index) => {
      const transformed = {
        contact: {
          name: call.customer_name || 'Unknown Contact',
          phone: call.phone_number || 'Unknown',
          company: 'Emerald Green Energy' // Hardcoded in Vercel backend
        },
        outcome: call.outcome || 'connected',
        sentiment: call.sentiment || 'positive',
        duration: call.duration || 0,
        cost: call.cost || 0
      };
      
      console.log(`Transformed Call ${index + 1}:`);
      console.log(`  Name: ${transformed.contact.name}`);
      console.log(`  Phone: ${transformed.contact.phone}`);
      console.log(`  Company: ${transformed.contact.company}`);
      console.log(`  Outcome: ${transformed.outcome}`);
      console.log(`  Sentiment: ${transformed.sentiment}`);
      console.log('  ---');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRealData();