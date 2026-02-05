import axios from 'axios';

async function testAuth() {
  try {
    // First test what user info we get
    const response = await axios.get(
      'http://localhost:3001/api/vapi-outbound/campaigns',
      {
        headers: {
          'Authorization': 'Bearer test-token-client_admin'
        }
      }
    );
    
    console.log('✅ Campaigns endpoint works');
    console.log('Campaigns:', response.data.campaigns?.map(c => ({ id: c.id, name: c.name, org: c.organization_id })));
    
    // Now test a specific campaign
    const campaignId = '3e5852ce-1821-4518-b983-0abbcc679844';
    const campResponse = await axios.get(
      `http://localhost:3001/api/vapi-outbound/campaigns/${campaignId}`,
      {
        headers: {
          'Authorization': 'Bearer test-token-client_admin'
        }
      }
    );
    
    console.log('\n✅ Campaign details work');
    console.log('Campaign org:', campResponse.data.campaign?.organization_id);
    
    // Now test calls for that campaign
    const callsResponse = await axios.get(
      `http://localhost:3001/api/vapi-outbound/campaigns/${campaignId}/calls`,
      {
        headers: {
          'Authorization': 'Bearer test-token-client_admin'
        }
      }
    );
    
    console.log('\n✅ Campaign calls work');
    console.log('Calls:', callsResponse.data.calls?.map(c => ({ id: c.id, status: c.status })));
    
    // Now test individual call
    if (callsResponse.data.calls?.length > 0) {
      const callId = callsResponse.data.calls[0].id;
      console.log('\n🔍 Testing call:', callId);
      
      try {
        const callResponse = await axios.get(
          `http://localhost:3001/api/vapi-outbound/calls/${callId}`,
          {
            headers: {
              'Authorization': 'Bearer test-token-client_admin'
            }
          }
        );
        console.log('✅ Call details work!');
        console.log('Call:', callResponse.data.call);
      } catch (error) {
        console.log('❌ Call details failed:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth();