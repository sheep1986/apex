// Minimal API Server for Campaigns
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const PORT = 3001;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Simple router
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  console.log(`${req.method} ${path}`);
  
  try {
    // Health check
    if (path === '/api/health') {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }
    
    // Get campaigns
    if (path === '/api/campaigns' && req.method === 'GET') {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Add metrics for each campaign
      const campaignsWithMetrics = await Promise.all(campaigns.map(async (campaign) => {
        const { data: calls } = await supabase
          .from('calls')
          .select('*')
          .eq('campaign_id', campaign.id);
          
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .eq('campaign_id', campaign.id);
          
        const completedCalls = calls?.filter(c => c.status === 'completed') || [];
        const interestedCalls = completedCalls.filter(c => c.outcome === 'interested');
        
        return {
          ...campaign,
          leads_count: { count: leads?.length || 0 },
          calls_count: { count: calls?.length || 0 },
          completed_calls_count: completedCalls.length,
          conversion_rate: calls?.length > 0 ? 
            ((interestedCalls.length / calls.length) * 100).toFixed(1) : 0,
          spent: completedCalls.reduce((sum, call) => sum + (parseFloat(call.cost) || 0), 0)
        };
      }));
      
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({
        campaigns: campaignsWithMetrics,
        pagination: {
          page: 1,
          limit: 100,
          total: campaigns.length,
          totalPages: 1
        }
      }));
      return;
    }
    
    // Get single campaign
    if (path.startsWith('/api/campaigns/') && req.method === 'GET') {
      const campaignId = path.split('/')[3];
      
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (error) throw error;
      
      // Get related data
      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .eq('campaign_id', campaignId);
        
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId);
        
      const response = {
        ...campaign,
        calls: calls || [],
        leads: leads || [],
        metrics: {
          total_calls: calls?.length || 0,
          completed_calls: calls?.filter(c => c.status === 'completed').length || 0,
          interested_calls: calls?.filter(c => c.outcome === 'interested').length || 0,
          total_leads: leads?.length || 0
        }
      };
      
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ campaign: response }));
      return;
    }
    
    // Get calls for a campaign
    if (path.includes('/calls') && req.method === 'GET') {
      const campaignId = url.searchParams.get('campaign_id');
      
      let query = supabase.from('calls').select('*');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data: calls, error } = await query.order('started_at', { ascending: false });
      
      if (error) throw error;
      
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ calls: calls || [] }));
      return;
    }
    
    // Default 404
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
============================================
    MINIMAL API SERVER RUNNING
============================================
Server running at: http://localhost:${PORT}
Netlify proxy: https://aquamarine-klepon-bcb066.netlify.app/api

Endpoints:
  GET /api/health - Health check
  GET /api/campaigns - List all campaigns
  GET /api/campaigns/:id - Get single campaign
  GET /api/calls?campaign_id=xxx - Get calls

Press Ctrl+C to stop.
============================================
  `);
});