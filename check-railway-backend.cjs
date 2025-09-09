const https = require('https');

// Test Railway backend health
const testEndpoint = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'apex-backend-august-production.up.railway.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n${path}:`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2).substring(0, 500));
        } catch (e) {
          console.log('Response (text):', data.substring(0, 200));
        }
        
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`Error testing ${path}:`, e.message);
      resolve();
    });
    
    req.end();
  });
};

async function main() {
  console.log('Testing Railway Backend Endpoints...');
  
  // Use a dev token for testing
  const devToken = 'test-token-client_admin';
  
  // Test different endpoints
  await testEndpoint('/api/health', devToken);
  await testEndpoint('/api/campaigns', devToken);
  await testEndpoint('/api/vapi-outbound/campaigns', devToken);
  await testEndpoint('/api/vapi-data/assistants', devToken);
  
  console.log('\nDone!');
}

main();