// Simple duplicate check API using http module
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const PORT = 3002;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function checkDuplicates(csvData, organizationId) {
  try {
    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { duplicates: [], newLeads: [] };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const phoneIndex = headers.findIndex(h => 
      h.includes('phone') || h.includes('number') || h.includes('mobile')
    );
    
    if (phoneIndex === -1) {
      throw new Error('No phone column found in CSV');
    }
    
    const phones = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[phoneIndex]) {
        phones.push(values[phoneIndex]);
      }
    }
    
    // Check for existing leads
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('phone, campaign_id, first_name, last_name, call_status')
      .eq('organization_id', organizationId)
      .in('phone', phones);
    
    const existingPhoneMap = new Map();
    existingLeads?.forEach(lead => {
      if (!existingPhoneMap.has(lead.phone)) {
        existingPhoneMap.set(lead.phone, []);
      }
      existingPhoneMap.get(lead.phone).push(lead);
    });
    
    // Get campaign names
    const campaignIds = [...new Set(existingLeads?.map(l => l.campaign_id).filter(id => id))];
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds);
    
    const campaignMap = new Map(campaigns?.map(c => [c.id, c.name]));
    
    // Build response
    const duplicates = [];
    const newLeads = [];
    
    phones.forEach(phone => {
      const existing = existingPhoneMap.get(phone);
      if (existing) {
        duplicates.push({
          phone,
          count: existing.length,
          campaigns: existing.map(lead => ({
            campaignName: campaignMap.get(lead.campaign_id) || 'Unknown',
            campaignId: lead.campaign_id,
            leadName: `${lead.first_name} ${lead.last_name}`.trim(),
            callStatus: lead.call_status
          }))
        });
      } else {
        newLeads.push(phone);
      }
    });
    
    return {
      duplicates,
      newLeads,
      totalDuplicates: duplicates.length,
      totalNew: newLeads.length,
      totalLeads: phones.length
    };
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
    throw error;
  }
}

// Handle requests
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
    // Check duplicates endpoint
    if (path === '/api/check-duplicates' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { csvData, organizationId } = JSON.parse(body);
          
          if (!csvData || !organizationId) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          const result = await checkDuplicates(csvData, organizationId);
          res.writeHead(200, corsHeaders);
          res.end(JSON.stringify(result));
          
        } catch (error) {
          console.error('Error:', error);
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    
    // Launch with duplicates endpoint
    if (path === '/api/campaign/launch-with-duplicates' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { campaignId, allowDuplicates } = JSON.parse(body);
          
          // Update campaign settings
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('settings')
            .eq('id', campaignId)
            .single();
          
          const updatedSettings = {
            ...campaign.settings,
            allowDuplicates: allowDuplicates,
            duplicatesBypassedAt: new Date().toISOString()
          };
          
          await supabase
            .from('campaigns')
            .update({ settings: updatedSettings })
            .eq('id', campaignId);
          
          res.writeHead(200, corsHeaders);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Campaign updated with duplicate bypass flag' 
          }));
          
        } catch (error) {
          console.error('Error:', error);
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
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
    DUPLICATE CHECK API RUNNING
============================================
Server running at: http://localhost:${PORT}

Endpoints:
  POST /api/check-duplicates
  POST /api/campaign/launch-with-duplicates

Ready to check for duplicate leads!
============================================
  `);
});