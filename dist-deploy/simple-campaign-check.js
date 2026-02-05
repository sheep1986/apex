// Simple campaign status check
// Run in browser console

(async function() {
  const campaignId = 'ffebea3e-8caa-4b70-bdea-c1ce068787ca';
  const API_BASE_URL = 'http://localhost:3001/api';
  const AUTH_TOKEN = 'test-token-agency_admin';
  
  console.log('🔍 Checking campaign status...\n');
  
  try {
    // Check campaign
    const res = await fetch(`${API_BASE_URL}/vapi-outbound/campaigns/${campaignId}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    const data = await res.json();
    const c = data.campaign;
    
    console.log('Campaign:', c.name);
    console.log('Status:', c.status);
    console.log('Leads:', c.totalLeads || 0);
    console.log('Has VAPI:', c.hasVAPICredentials ? '✅' : '❌');
    
    // Check backend health
    const health = await fetch(`${API_BASE_URL}/health`);
    console.log('\nBackend:', health.ok ? '✅ Running' : '❌ Down');
    
    // Check VAPI data
    const vapi = await fetch(`${API_BASE_URL}/vapi-data/assistants`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    if (!vapi.ok) {
      console.log('VAPI Data: ❌ Not configured');
    } else {
      const vapiData = await vapi.json();
      console.log('VAPI Data: ✅', vapiData.assistants?.length || 0, 'assistants');
    }
    
    console.log('\n🔧 Next steps:');
    if (!c.hasVAPICredentials) {
      console.log('1. Configure VAPI credentials in Organization Settings');
      console.log('2. Or set VAPI_API_KEY in backend .env file');
    } else if (c.status !== 'active') {
      console.log('1. Start the campaign');
    } else {
      console.log('✅ Campaign should be making calls!');
      console.log('Check backend logs: pnpm --filter backend dev');
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();