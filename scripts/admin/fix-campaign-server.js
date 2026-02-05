const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse the URL to get campaign ID
  const urlMatch = req.url.match(/\/api\/vapi-outbound\/campaigns\/([a-f0-9-]+)/);
  
  if (urlMatch) {
    const campaignId = urlMatch[1];
    console.log('Fetching campaign:', campaignId);
    
    try {
      // Get campaign data
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (error) throw error;
      
      // Get counts
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);
      
      const { count: callCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);
      
      // Build response
      const response = {
        campaign: {
          ...campaign,
          totalLeads: leadCount || 0,
          callsCompleted: callCount || 0,
          totalCost: (callCount || 0) * 0.05,
          successRate: leadCount > 0 ? (callCount / leadCount) * 100 : 0,
          settings: {
            ...campaign.settings,
            total_leads: leadCount || 0,
            calls_completed: callCount || 0,
            totalLeads: leadCount || 0,
            callsCompleted: callCount || 0
          }
        }
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Fix server running on http://localhost:${PORT}`);
  console.log('This server provides campaign data with proper totalLeads fields');
  console.log('\nTo use this, temporarily update your frontend to point to:');
  console.log('http://localhost:3002 instead of the Railway URL');
});