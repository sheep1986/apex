const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Test both API and Supabase directly
async function testCampaignEndpoints() {
  console.log('Testing Campaign Endpoints...\n');
  
  // 1. Test Supabase directly
  console.log('1. Testing Supabase directly...');
  const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get campaigns for the organization
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, name, status, organization_id, created_at')
    .eq('organization_id', '2566d8c5-2245-4a3c-b539-4cea21a07d9b')
    .limit(5);
  
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log(`Found ${campaigns.length} campaigns in Supabase`);
    if (campaigns.length > 0) {
      console.log('First campaign:', campaigns[0]);
    }
  }
  
  console.log('\n2. Testing Railway API /campaigns endpoint...');
  
  // This is a test with a sample token - won't work without valid Clerk token
  const testApiCall = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'apex-backend-august-production.up.railway.app',
        port: 443,
        path: '/api/campaigns',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('API Response Status:', res.statusCode);
          if (res.statusCode === 401) {
            console.log('Expected: 401 Unauthorized (needs valid Clerk token)');
          } else {
            try {
              const json = JSON.parse(data);
              console.log('Response:', JSON.stringify(json, null, 2).substring(0, 200));
            } catch (e) {
              console.log('Response:', data.substring(0, 200));
            }
          }
          resolve();
        });
      });
      
      req.on('error', (e) => {
        console.error('Error:', e.message);
        resolve();
      });
      
      req.end();
    });
  };
  
  await testApiCall();
  
  console.log('\n3. Testing if Railway has deployed the latest code...');
  
  // Check server health
  const checkHealth = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'apex-backend-august-production.up.railway.app',
        port: 443,
        path: '/api/health',
        method: 'GET'
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            console.log('Server version:', json.version);
            console.log('Server status:', json.status);
            console.log('Timestamp:', json.timestamp);
          } catch (e) {
            console.log('Health check failed');
          }
          resolve();
        });
      });
      
      req.on('error', (e) => {
        console.error('Error:', e.message);
        resolve();
      });
      
      req.end();
    });
  };
  
  await checkHealth();
  
  console.log('\nDone!');
}

testCampaignEndpoints().catch(console.error);