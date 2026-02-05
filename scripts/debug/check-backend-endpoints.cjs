// Check what endpoints are actually available on the backend
const axios = require('axios');

async function checkBackendEndpoints() {
  console.log('🔍 CHECKING BACKEND ENDPOINTS\n');
  console.log('=' .repeat(60));
  
  const backendUrl = 'https://apex-backend-vercel-alh0xjd6q-seans-projects-aabd20b2.vercel.app';
  
  // List of endpoints we expect to exist
  const endpoints = [
    '/api/health',
    '/api/campaigns',
    '/api/calls',
    '/api/leads',
    '/api/vapi-outbound/campaigns',
    '/api/vapi-data/assistants',
    '/api/vapi-data/phone-numbers',
    '/api/vapi/phone-numbers',
    '/api/vapi-webhook',
    '/api/users'
  ];
  
  console.log('Testing endpoints on:', backendUrl);
  console.log('-' .repeat(60));
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${backendUrl}${endpoint}`, {
        validateStatus: () => true // Accept any status
      });
      
      const status = response.status;
      const statusText = 
        status === 200 ? '✅ OK' :
        status === 401 ? '🔐 Auth Required' :
        status === 404 ? '❌ Not Found' :
        status === 500 ? '⚠️  Server Error' :
        `📊 ${status}`;
      
      console.log(`${statusText} - ${endpoint}`);
      
      if (status === 404 && response.data?.available_endpoints) {
        // Don't show for each endpoint, just once
        if (endpoint === endpoints[endpoints.length - 1]) {
          console.log('\n📋 Available endpoints from server:');
          response.data.available_endpoints.forEach(ep => {
            console.log(`   - ${ep}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ ERROR - ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 DIAGNOSIS:');
  console.log('=' .repeat(60));
  
  console.log('\n⚠️  Most VAPI endpoints are returning 404!');
  console.log('\nThis means the backend server is NOT running the full codebase.');
  console.log('It appears to be running a minimal/older version.');
  
  console.log('\n💡 SOLUTION:');
  console.log('1. The backend needs to be redeployed with the full server.ts');
  console.log('2. Or the Vercel deployment is using a different entry point');
  console.log('\n🚀 To fix this:');
  console.log('1. Check what file Vercel is using as the entry point');
  console.log('2. Make sure it includes all the route registrations');
  console.log('3. Redeploy the backend with all routes');
  
  console.log('\n' + '=' .repeat(60));
}

checkBackendEndpoints();