import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const CAMPAIGN_ID = 'b2ef5049-6dc5-4e8d-a674-5b1bb487a3bc';

async function testCampaignAPI() {
  console.log('🔍 Testing campaign API endpoints...\n');
  
  // Test with dev token
  const devToken = 'test-token-platform_owner';
  
  try {
    // 1. Test health endpoint (no auth required)
    console.log('1️⃣ Testing health endpoint...');
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthRes.data);
    
    // 2. Test campaign endpoint with dev token
    console.log('\n2️⃣ Testing campaign endpoint with dev token...');
    const campaignRes = await axios.get(`${API_URL}/vapi-outbound/campaigns/${CAMPAIGN_ID}`, {
      headers: {
        'Authorization': `Bearer ${devToken}`
      }
    });
    console.log('✅ Campaign data:', campaignRes.data);
    
    // 3. Test campaign calls endpoint
    console.log('\n3️⃣ Testing campaign calls endpoint...');
    const callsRes = await axios.get(`${API_URL}/vapi-outbound/campaigns/${CAMPAIGN_ID}/calls`, {
      headers: {
        'Authorization': `Bearer ${devToken}`
      }
    });
    console.log('✅ Campaign calls:', {
      totalCalls: callsRes.data.calls?.length || 0,
      firstCall: callsRes.data.calls?.[0]
    });
    
    // 4. Test specific call details
    if (callsRes.data.calls?.length > 0) {
      const callId = callsRes.data.calls[0].id;
      console.log('\n4️⃣ Testing call details endpoint...');
      const callDetailsRes = await axios.get(`${API_URL}/vapi-outbound/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${devToken}`
        }
      });
      console.log('✅ Call details:', {
        id: callDetailsRes.data.call?.id,
        duration: callDetailsRes.data.call?.duration,
        cost: callDetailsRes.data.call?.cost,
        customerName: callDetailsRes.data.call?.customerName
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testCampaignAPI();